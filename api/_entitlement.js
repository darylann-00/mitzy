import { redis } from './_ratelimit.js';
import { consume } from './_quota.js';

export const config = { runtime: "edge" };

const CACHE_TTL_SECONDS = 300; // 5 min. The Stripe webhook busts this on change.
const cacheKey = (userId) => `plan:${userId}`;

// Escape hatch: comma-separated Supabase user ids that always resolve to pro.
// Lets us grant access before Stripe exists, and gives support a lever after.
function allowlisted(userId) {
  const raw = process.env.MITZY_PRO_ALLOWLIST || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean).includes(userId);
}

// Reads the `subscriptions` row with the service-role key. That table grants
// SELECT only to `authenticated`, so the client can read its own plan for UI
// purposes but can never write it — this lookup is the only source of truth.
async function fetchPlan(userId) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  const url = `${supabaseUrl}/rest/v1/subscriptions`
    + `?user_id=eq.${encodeURIComponent(userId)}&select=plan,status&limit=1`;

  const res = await fetch(url, {
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) return null;

  const rows = await res.json();
  return rows?.[0]?.plan === 'pro' ? 'pro' : 'free';
}

// Resolves a user's plan. Returns 'free' | 'pro'.
//
// Fails closed to 'free': if we cannot confirm someone is paying, we do not
// hand out the expensive path. The cache softens the cost of that choice for
// real subscribers — a confirmed 'pro' stays cached for CACHE_TTL_SECONDS, so a
// brief Supabase blip doesn't bounce a paying user into the paywall.
export async function getEntitlement(userId) {
  if (allowlisted(userId)) return 'pro';

  try {
    const cached = await redis.get(cacheKey(userId));
    if (cached === 'pro' || cached === 'free') return cached;
  } catch {
    // Cache is an optimisation; fall through to the real lookup.
  }

  let plan;
  try {
    plan = await fetchPlan(userId);
  } catch (err) {
    console.error(`Entitlement lookup failed: ${err}`);
    plan = null;
  }
  if (plan == null) return 'free';

  try {
    await redis.set(cacheKey(userId), plan, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Non-fatal.
  }
  return plan;
}

// The gate every paid feature runs before doing billable work.
//
// `requirePro: true` means the feature is Mitzy Pro only and the free monthly
// allowance does not apply — used for the web-search assist path, which costs
// roughly an order of magnitude more per call than the Haiku one.
//
// On success with `consumed: true` the caller owns a refund if the work then
// fails. Returns a plain object; each handler builds its own Response so it can
// attach its own CORS headers.
export async function checkAccess({ userId, feature, requirePro = false }) {
  // Kill switch. Until Stripe is live there is no way to actually buy Mitzy
  // Pro, so enforcing the gate would wall users off with no way through. This
  // lets the whole thing ship dormant and turn on with one env var — and gives
  // us a one-flip rollback if the gate misbehaves in production.
  if (process.env.PAYWALL_ENABLED !== 'true') return { ok: true, plan: 'pro' };

  const plan = await getEntitlement(userId);
  if (plan === 'pro') return { ok: true, plan };

  if (requirePro) {
    return { ok: false, plan, reason: 'pro_only', feature };
  }

  const { allowed, used, limit, resetAt } = await consume(feature, userId);
  if (!allowed) {
    return { ok: false, plan, reason: 'quota_exhausted', feature, used, limit, resetAt };
  }
  return { ok: true, plan, consumed: true, used, limit, resetAt };
}

// 402 Payment Required — distinct from 401 (not signed in) and 429 (too fast),
// so the client can tell "you need to upgrade" from "try again later".
export function upgradeResponse(result, headers = {}) {
  const { reason, feature, used, limit, resetAt } = result;
  return new Response(
    JSON.stringify({ error: 'upgrade_required', reason, feature, used, limit, resetAt }),
    { status: 402, headers: { 'content-type': 'application/json', ...headers } },
  );
}

// Called by the Stripe webhook so an upgrade takes effect immediately rather
// than after the TTL.
export async function invalidateEntitlement(userId) {
  try {
    await redis.del(cacheKey(userId));
  } catch (err) {
    console.error(`Entitlement cache invalidation failed: ${err}`);
  }
}
