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

async function fetchCustomerId(supabaseUrl, serviceKey, userId) {
  const url = `${supabaseUrl}/rest/v1/subscriptions`
    + `?user_id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0]?.stripe_customer_id ?? null;
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { userId, error } = await requireUser(req);
  if (error) {
    return new Response(error.statusText || 'Unauthorized', {
      status: error.status,
      headers: corsHeaders(req),
    });
  }

  const stripeKey   = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeKey || !supabaseUrl || !serviceKey) {
    return new Response("Server misconfigured", { status: 500, headers: corsHeaders(req) });
  }

  const customerId = await fetchCustomerId(supabaseUrl, serviceKey, userId);
  if (!customerId) {
    // No checkout has ever run for this user — nothing to manage yet.
    return new Response("No billing account found", { status: 404, headers: corsHeaders(req) });
  }

  const origin = new URL(req.url).origin;
  const body = new URLSearchParams({
    customer: customerId,
    return_url: `${origin}/app`,
  });

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${stripeKey}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    console.error(`Stripe billing portal error: ${await res.text()}`);
    return new Response("Service error", { status: 502, headers: corsHeaders(req) });
  }

  const data = await res.json();
  return new Response(JSON.stringify({ url: data.url }), {
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}
