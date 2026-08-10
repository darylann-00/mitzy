import { requireUser } from './_auth.js';

export const config = { runtime: "edge" };

function corsHeaders(req) {
  const allowed = process.env.ALLOWED_ORIGIN || '';
  const origin  = req.headers.get('origin') || '';
  const match   = allowed && origin === allowed ? origin : null;
  return {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Vary': 'Origin',
    ...(match ? { 'Access-Control-Allow-Origin': match } : {}),
  };
}

// Reads any customer id we already stored for this user, so re-checking out
// (e.g. after a cancel) reuses the same Stripe customer instead of minting a
// new one every time.
async function fetchExistingCustomerId(supabaseUrl, serviceKey, userId) {
  const url = `${supabaseUrl}/rest/v1/subscriptions`
    + `?user_id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0]?.stripe_customer_id ?? null;
}

async function createStripeCustomer(stripeKey, userId, email) {
  const body = new URLSearchParams({ 'metadata[user_id]': userId });
  if (email) body.set('email', email);
  const res = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${stripeKey}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) throw new Error(`Stripe customer create failed: ${await res.text()}`);
  const data = await res.json();
  return data.id;
}

// Writes the row before the Checkout Session is created, so only the plan
// flip races the webhook later — the row's existence never does. Upsert only
// touches the columns given here; `plan` and any prior status are untouched.
async function upsertPendingRow(supabaseUrl, serviceKey, userId, customerId) {
  const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      stripe_customer_id: customerId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }),
  });
  return res.ok;
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { userId, email, error } = await requireUser(req);
  if (error) {
    return new Response(error.statusText || 'Unauthorized', {
      status: error.status,
      headers: corsHeaders(req),
    });
  }

  const stripeKey   = process.env.STRIPE_SECRET_KEY;
  const priceId     = process.env.STRIPE_PRICE_ID;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeKey || !priceId || !supabaseUrl || !serviceKey) {
    return new Response("Server misconfigured", { status: 500, headers: corsHeaders(req) });
  }

  let customerId;
  try {
    customerId = await fetchExistingCustomerId(supabaseUrl, serviceKey, userId);
    if (!customerId) customerId = await createStripeCustomer(stripeKey, userId, email);
  } catch (err) {
    console.error(`Checkout customer setup failed: ${err}`);
    return new Response("Service error", { status: 502, headers: corsHeaders(req) });
  }

  const wrote = await upsertPendingRow(supabaseUrl, serviceKey, userId, customerId);
  if (!wrote) {
    console.error('Checkout: failed to upsert pending subscription row');
    return new Response("Service error", { status: 502, headers: corsHeaders(req) });
  }

  // Same-origin function behind the app's own rewrites — the request's own
  // origin is where Stripe should send the user back.
  const origin = new URL(req.url).origin;

  const body = new URLSearchParams({
    mode: 'subscription',
    customer: customerId,
    success_url: `${origin}/app?checkout=success`,
    cancel_url: `${origin}/app?checkout=cancelled`,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    // Set in two places deliberately: the session's own metadata (read by
    // checkout.session.completed) and subscription_data's metadata, which is
    // what actually lands on the Stripe Subscription object. Later lifecycle
    // events (updated/deleted) carry the *subscription's* metadata, not the
    // session's — without this second copy, a cancellation event has no
    // user_id to look up and silently can't find the row.
    'metadata[user_id]': userId,
    'subscription_data[metadata][user_id]': userId,
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${stripeKey}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    console.error(`Stripe checkout session error: ${await res.text()}`);
    return new Response("Service error", { status: 502, headers: corsHeaders(req) });
  }

  const data = await res.json();
  return new Response(JSON.stringify({ url: data.url }), {
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}
