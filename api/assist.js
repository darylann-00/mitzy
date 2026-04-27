import { requireUser } from './_auth.js';

export const config = { runtime: "edge" };

// ALLOWED_ORIGIN: set to your production domain in Vercel env vars (e.g. "https://mitzy.app").
// Empty = no cross-origin access (safe default; same-origin requests don't need CORS headers).
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
      headers: corsHeaders(req)
    });
  }

  let prompt;
  try {
    ({ prompt } = await req.json());
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  if (typeof prompt !== 'string') {
    return new Response("Invalid prompt", { status: 400 });
  }

  if (prompt.length > 8000) {
    return new Response("Prompt too large", { status: 413 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500 });
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    console.error(`Anthropic error: ${err}`);
    return new Response("Service error", { status: 502 });
  }

  const data = await anthropicRes.json();
  const text = data.content?.[0]?.text ?? "";

  return new Response(JSON.stringify({ text }), {
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}
