import { requireUser } from './_auth.js';
import { assistLimiter } from './_ratelimit.js';

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

const sanitize = (str) =>
  str ? String(str).replace(/[\r\n\t]/g, ' ').replace(/[^\x20-\x7E]/g, '').trim() : '';

const SYSTEM_PROMPT = `You match Google Calendar events to a user's household maintenance tasks.

You receive a JSON object with:
- "events": [{ id, summary, start, description }]
- "tasks":  [{ id, label, category }]

Return ONLY valid JSON in this shape — no markdown, no prose:
{ "matches": [{ "taskId": string, "eventId": string, "eventTitle": string, "eventDate": string, "confidence": number }] }

Rules:
- Only emit matches with confidence >= 0.7. When in doubt, omit.
- An event matches a task when the event's purpose is the same real-world action as the task. Examples:
  • Event "Oil change at Jiffy Lube" ↔ task "Oil change"  (high)
  • Event "Annual physical" ↔ task "Annual physical"  (high)
  • Event "HVAC tune-up" ↔ task "HVAC service"  (high)
  • Event "Lunch with Mom" ↔ any task  (NO MATCH)
  • Event "Dentist" ↔ task "Annual physical"  (NO MATCH — different specialist)
- One event maps to at most one task. One task may match multiple events; emit each.
- "eventDate" is the event's start string passed to you, verbatim.
- If no high-confidence matches, return { "matches": [] }.`;

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

  const { success, reset } = await assistLimiter.limit(userId);
  if (!success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        ...corsHeaders(req),
      },
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response("Invalid JSON", { status: 400, headers: corsHeaders(req) }); }

  const { events, tasks } = body || {};
  if (!Array.isArray(events) || !Array.isArray(tasks)) {
    return new Response("Missing events or tasks", { status: 400, headers: corsHeaders(req) });
  }
  if (events.length === 0 || tasks.length === 0) {
    return new Response(JSON.stringify({ matches: [] }), {
      headers: { 'content-type': 'application/json', ...corsHeaders(req) },
    });
  }

  const safeEvents = events.slice(0, 50).map(e => ({
    id: sanitize(e?.id).slice(0, 200),
    summary: sanitize(e?.summary).slice(0, 200),
    start: sanitize(e?.start).slice(0, 40),
    description: sanitize(e?.description).slice(0, 300),
  })).filter(e => e.id && e.summary && e.start);

  const safeTasks = tasks.slice(0, 200).map(t => ({
    id: sanitize(t?.id).slice(0, 200),
    label: sanitize(t?.label).slice(0, 200),
    category: sanitize(t?.category).slice(0, 40),
  })).filter(t => t.id && t.label);

  if (safeEvents.length === 0 || safeTasks.length === 0) {
    return new Response(JSON.stringify({ matches: [] }), {
      headers: { 'content-type': 'application/json', ...corsHeaders(req) },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500, headers: corsHeaders(req) });
  }

  const userMessage = JSON.stringify({ events: safeEvents, tasks: safeTasks });

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    console.error(`Anthropic error: ${err}`);
    return new Response("Service error", { status: 502, headers: corsHeaders(req) });
  }

  const data = await anthropicRes.json();
  const text = data.content?.[0]?.text ?? "";

  let parsed = null;
  try { parsed = JSON.parse(text); }
  catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
  }

  const taskIds = new Set(safeTasks.map(t => t.id));
  const eventIds = new Set(safeEvents.map(e => e.id));
  const matches = Array.isArray(parsed?.matches)
    ? parsed.matches.filter(m =>
        m && typeof m.taskId === 'string' && taskIds.has(m.taskId)
        && typeof m.eventId === 'string' && eventIds.has(m.eventId)
        && typeof m.confidence === 'number' && m.confidence >= 0.7
      ).slice(0, 50)
    : [];

  return new Response(JSON.stringify({ matches }), {
    headers: { 'content-type': 'application/json', ...corsHeaders(req) },
  });
}
