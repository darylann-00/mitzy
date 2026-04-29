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

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { error } = await requireUser(req);
  if (error) {
    return new Response(error.statusText || 'Unauthorized', {
      status: error.status,
      headers: corsHeaders(req),
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response("Invalid JSON", { status: 400, headers: corsHeaders(req) }); }

  const { accessToken } = body || {};
  if (!accessToken || typeof accessToken !== 'string') {
    return new Response("Missing accessToken", { status: 400, headers: corsHeaders(req) });
  }

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', now.toISOString());
  url.searchParams.set('timeMax', in30.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const calRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!calRes.ok) {
    return new Response(`Google Calendar error`, { status: 502, headers: corsHeaders(req) });
  }

  const data = await calRes.json();
  const events = (data.items || []).map(item => ({
    id: item.id,
    summary: item.summary || '',
    start: item.start?.dateTime || item.start?.date || null,
    description: item.description || '',
  })).filter(e => e.start && e.summary);

  return new Response(JSON.stringify({ events }), {
    headers: { 'content-type': 'application/json', ...corsHeaders(req) },
  });
}
