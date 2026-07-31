import { requireUser } from './_auth.js';
import { assistLimiter } from './_ratelimit.js';

export const config = { runtime: "edge" };

// Assist types whose answer depends on live, jurisdiction-specific facts the
// model cannot know from memory — filing fees, response deadlines, which office
// actually handles a thing. Only these get a real web lookup; every other type
// keeps the original no-tools cost and latency profile.
const SEARCH_ASSIST_TYPES = new Set(['jurisdiction', 'deadline']);

// Web search needs a model that supports the current `web_search_20260209` tool,
// which filters results before they reach the context window. Haiku 4.5 only
// supports the older basic variant, so search requests route to Sonnet 5 while
// everything else stays on Haiku.
const SEARCH_MODEL  = "claude-sonnet-5";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// Search count and effort are the two latency levers. A tap on "Want Mitzy to
// help?" shouldn't sit on a loader for a minute, and vercel.json caps this
// route at 60s — past that the platform kills the function and the fallback
// below never gets to run.
const MAX_SEARCHES      = 3;  // caps per-request search spend and latency
const MAX_CONTINUATIONS = 3;  // pause_turn resumes before giving up
const MAX_PROMPT_CHARS  = 8000;

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

function anthropic(apiKey, body) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// A tool-using response interleaves server_tool_use and web_search_tool_result
// blocks with the prose, so the answer is never just content[0].
function extractText(content) {
  return (content ?? [])
    .filter(b => b?.type === 'text')
    .map(b => b.text ?? '')
    .join('')
    .trim();
}

// Runs the prompt with web search enabled. Throws on anything unexpected so the
// caller can fall back to the no-tools path.
async function runWithSearch(apiKey, prompt) {
  const messages = [{ role: "user", content: prompt }];
  // Blocks produced so far across resumed turns. Kept as ONE assistant message
  // rather than appending a new one per resume, so the sequence stays a clean
  // user→assistant alternation however many times the tool loop pauses.
  const assistantBlocks = [];

  for (let attempt = 0; attempt <= MAX_CONTINUATIONS; attempt++) {
    const res = await anthropic(apiKey, {
      model: SEARCH_MODEL,
      // max_tokens caps thinking + prose together, so this is well above what a
      // 250-word answer needs — a tight budget would truncate mid-sentence, and
      // truncated text is non-empty, so it would never reach the fallback.
      max_tokens: 8000,
      // Sonnet 5 runs adaptive thinking by default and is markedly less willing
      // to reach for tools with thinking off — which would defeat the point
      // here. Left on deliberately; `effort` is what bounds the spend.
      thinking: { type: "adaptive" },
      // Low, not medium: this is a scoped "find the county page and summarise
      // it" task, not one that needs deep reasoning, and effort is the main
      // lever on how long the user waits.
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES }],
      messages,
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${await res.text()}`);
    }

    const data = await res.json();

    // The server-side tool loop hit its iteration cap. Re-send the turn with
    // what it produced so far — the API resumes from the trailing
    // server_tool_use block. Adding a "continue" user message would break that.
    if (data.stop_reason === "pause_turn") {
      assistantBlocks.push(...(data.content ?? []));
      messages[1] = { role: "assistant", content: assistantBlocks };
      continue;
    }

    if (data.stop_reason === "refusal") {
      throw new Error(`refused: ${data.stop_details?.category ?? 'unknown'}`);
    }

    // Prose can be split across the paused turns, so read every block, not just
    // the final response's.
    return extractText([...assistantBlocks, ...(data.content ?? [])]);
  }

  throw new Error(`still paused after ${MAX_CONTINUATIONS} continuations`);
}

async function runPlain(apiKey, prompt) {
  const res = await anthropic(apiKey, {
    model: DEFAULT_MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return extractText(data.content);
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
      headers: corsHeaders(req)
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

  let prompt, fallbackPrompt, assistType;
  try {
    ({ prompt, fallbackPrompt, assistType } = await req.json());
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  if (typeof prompt !== 'string') {
    return new Response("Invalid prompt", { status: 400 });
  }

  if (fallbackPrompt != null && typeof fallbackPrompt !== 'string') {
    return new Response("Invalid fallbackPrompt", { status: 400 });
  }

  if (prompt.length > MAX_PROMPT_CHARS || (fallbackPrompt?.length ?? 0) > MAX_PROMPT_CHARS) {
    return new Response("Prompt too large", { status: 413 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500 });
  }

  const useSearch = typeof assistType === 'string' && SEARCH_ASSIST_TYPES.has(assistType);

  let text = '';
  if (useSearch) {
    try {
      text = await runWithSearch(apiKey, prompt);
    } catch (err) {
      // Search is best-effort. A failure, a rate limit, or an empty answer
      // degrades to the no-tools path rather than surfacing an error.
      console.error(`Assist web search failed (${assistType}), falling back: ${err}`);
      text = '';
    }
  }

  if (!text) {
    // The search prompt asks the model to cite what it looked up, so the
    // fallback deliberately re-asks with the caller's no-search wording — which
    // forbids stating fees, deadlines, and phone numbers it can't verify.
    try {
      text = await runPlain(apiKey, fallbackPrompt || prompt);
    } catch (err) {
      console.error(`Anthropic error: ${err}`);
      return new Response("Service error", { status: 502 });
    }
  }

  return new Response(JSON.stringify({ text }), {
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}
