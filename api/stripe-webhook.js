import { invalidateEntitlement } from './_entitlement.js';

export const config = { runtime: "edge" };

const DEFAULT_TOLERANCE_SECONDS = 300; // 5 min — blocks replay of an old signed payload.

// Stripe's Stripe-Signature header looks like: "t=1690000000,v1=abcd...,v1=efgh..."
// (multiple v1 entries happen during signing-secret rotation). Anything else —
// missing, empty, no t=, no v1= — is malformed and must fail verification.
export function parseSignatureHeader(header) {
  if (!header || typeof header !== 'string') return { timestamp: null, signatures: [] };
  let timestamp = null;
  const signatures = [];
  for (const part of header.split(',')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === 't') timestamp = value;
    else if (key === 'v1') signatures.push(value);
  }
  return { timestamp, signatures };
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || a.length === 0) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verifies the raw request body against Stripe's signature scheme:
// HMAC-SHA256(secret, `${timestamp}.${rawBody}`), constant-time compared
// against each v1 signature, with a tolerance window against replay.
// `rawBody` MUST be the untouched request text — parsing it first (even to
// re-stringify) can change byte-for-byte content and break verification.
export async function verifyStripeSignature(rawBody, header, secret, opts = {}) {
  const toleranceSeconds = opts.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const now = opts.now ?? Date.now();

  const { timestamp, signatures } = parseSignatureHeader(header);
  if (!timestamp || signatures.length === 0) return false;

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs)) return false;
  if (Math.abs(now - timestampMs) > toleranceSeconds * 1000) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signatures.some(sig => timingSafeEqualHex(sig, expected));
}

// active/trialing → pro. Everything else (canceled, incomplete,
// incomplete_expired, unpaid, past_due) → free. past_due deliberately does
// NOT map to pro: Stripe already retries the failed payment per the
// account's dunning settings and emails the customer directly, so we'd
// rather a lapsed card lose access immediately than keep serving a paid
// feature nobody's currently paying for. Access returns the moment a retry
// succeeds and this webhook fires again with 'active'.
function planForStatus(status) {
  return status === 'active' || status === 'trialing' ? 'pro' : 'free';
}

async function upsertSubscriptionRow(supabaseUrl, serviceKey, row) {
  const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Subscription upsert failed: ${await res.text()}`);
}

// Subscription lifecycle events carry the subscription's own metadata (set
// via subscription_data[metadata][user_id] at checkout), so this is the
// primary path. The customer-id lookup is the fallback the migration's
// `subscriptions_stripe_customer_idx` index exists for — belt and suspenders
// for a row that was written by an older code path or a retried event.
async function resolveUserId(supabaseUrl, serviceKey, sub) {
  if (sub.metadata?.user_id) return sub.metadata.user_id;
  const url = `${supabaseUrl}/rest/v1/subscriptions`
    + `?stripe_customer_id=eq.${encodeURIComponent(sub.customer)}&select=user_id&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0]?.user_id ?? null;
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Read the raw body FIRST, before any parsing — signature verification is
  // over the exact bytes Stripe sent, and req.json() (or anything that
  // re-serializes) would break it.
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const valid = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  try {
    switch (event.type) {
      // Fires once, right after a successful Checkout. The session only
      // tells us payment succeeded, not the subscription's authoritative
      // status — write optimistically here so the plan flips immediately,
      // then let the customer.subscription.updated event (which fires
      // moments later) reconcile the real status.
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const customerId = session.customer;
        if (userId && customerId) {
          await upsertSubscriptionRow(supabaseUrl, serviceKey, {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: session.subscription ?? null,
            status: 'active',
            plan: 'pro',
            updated_at: new Date().toISOString(),
          });
          await invalidateEntitlement(userId);
        } else {
          console.error('checkout.session.completed missing user_id or customer metadata');
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = await resolveUserId(supabaseUrl, serviceKey, sub);
        if (userId) {
          const status = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status;
          await upsertSubscriptionRow(supabaseUrl, serviceKey, {
            user_id: userId,
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            status,
            plan: planForStatus(status),
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          });
          await invalidateEntitlement(userId);
        } else {
          console.error(`${event.type}: could not resolve user_id for customer ${sub.customer}`);
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged, not errors — Stripe
        // otherwise retries them forever.
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handling failed for ${event.type}: ${err}`);
    // 5xx tells Stripe to retry — the upsert is idempotent (keyed on
    // user_id), so a retry is safe.
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "content-type": "application/json" },
  });
}
