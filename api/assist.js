import { requireUser } from './_auth.js';
import { assistLimiter } from './_ratelimit.js';

export const config = { runtime: "edge" };

// Assist types whose answer depends on live, jurisdiction-specific facts the
// model cannot know from memory — filing fees, response deadlines, which office
// actually handles a thing. Only these get a real web lookup; every other type
// keeps the original no-tools cost and latency profile.
const SEARCH_ASSIST_TYPES = new Set(['jurisdiction', 'deadline']);

// Web search needs a model that supports the current `web_search_20260209`
// tool. Haiku 4.5 only supports the older basic variant, so search requests
// route to Sonnet 5 while everything else stays on Haiku. (That tool's headline
// feature, dynamic filtering, is deliberately turned OFF at the call site — see
// `allowed_callers` there.)
const SEARCH_MODEL  = "claude-sonnet-5";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// Search count and effort are the two latency levers. A tap on "Want Mitzy to
// help?" shouldn't sit on a loader for a minute, and vercel.json caps this
// route at 60s — past that the platform kills the function and the fallback
// below never gets to run.
const MAX_SEARCHES      = 3;  // caps per-request search spend and latency
const MAX_CONTINUATIONS = 1;  // pause_turn resumes; each is a full extra round trip

// Hard ceiling on the whole search attempt, resumes included. This must stay
// comfortably below the route's maxDuration in vercel.json (60s), because a
// platform timeout kills the function outright — the fallback below never runs
// and the user gets a 504 instead of an answer. Owning the deadline ourselves is
// what makes graceful degradation actually reachable.
const SEARCH_BUDGET_MS = 35000;
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

function anthropic(apiKey, body, signal) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
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

// Reads an Anthropic SSE body line by line. Only `data:` lines carry payloads;
// the `event:` line duplicates the `type` field inside the JSON, so it's
// ignored. Events can straddle chunk boundaries, hence the buffer.
async function readSSE(res, onEvent) {
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        let ev;
        try { ev = JSON.parse(payload); } catch { continue; }
        onEvent(ev);
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

// Runs one streaming turn and rebuilds the assistant's content blocks from the
// deltas, because a paused turn has to be re-sent with its blocks intact —
// web_search_tool_result carries `encrypted_content` the API decrypts on the
// next turn, and thinking blocks carry a signature. Dropping or reshaping
// either one gets the resume rejected with a 400.
//
// Only text is forwarded to the caller as it arrives; everything else is
// accumulated silently.
async function streamTurn(apiKey, body, { onText, onSearch, onResults, signal } = {}) {
  const res = await anthropic(apiKey, { ...body, stream: true }, signal);
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }

  const blocks  = [];   // reconstructed content blocks, indexed as the API indexes them
  const partial = [];   // input_json_delta buffers, same indexing
  let stopReason  = null;
  let stopDetails = null;

  await readSSE(res, (ev) => {
    switch (ev.type) {
      case 'content_block_start': {
        const block = ev.content_block ?? {};
        blocks[ev.index]  = { ...block };
        partial[ev.index] = '';
        if (block.type === 'server_tool_use') onSearch?.();
        // Results arrive whole, no deltas. This is the moment the wait stops
        // being blind, so it's worth a second progress signal — the dead air
        // before the first word is where a slow lookup actually hurts. Only the
        // fact that results landed crosses to the client, never their content:
        // search results are untrusted text and have no business in the UI
        // except through the model's own answer.
        if (block.type === 'web_search_tool_result' && Array.isArray(block.content) && block.content.length) {
          onResults?.();
        }
        break;
      }

      case 'content_block_delta': {
        const b = blocks[ev.index];
        const d = ev.delta ?? {};
        if (!b) break;
        if (d.type === 'text_delta') {
          b.text = (b.text ?? '') + (d.text ?? '');
          if (d.text) onText?.(d.text);
        } else if (d.type === 'thinking_delta') {
          b.thinking = (b.thinking ?? '') + (d.thinking ?? '');
        } else if (d.type === 'signature_delta') {
          b.signature = d.signature;
        } else if (d.type === 'input_json_delta') {
          partial[ev.index] += d.partial_json ?? '';
        } else if (d.type === 'citations_delta' && d.citation) {
          (b.citations ??= []).push(d.citation);
        }
        break;
      }

      case 'content_block_stop': {
        // tool input arrives as partial JSON strings; the block wants an object.
        const b   = blocks[ev.index];
        const raw = partial[ev.index];
        if (b && raw) {
          try { b.input = JSON.parse(raw); } catch {}
        }
        break;
      }

      case 'message_delta':
        if (ev.delta?.stop_reason) stopReason = ev.delta.stop_reason;
        // Only populated on a refusal, and not documented as riding this event
        // — read it if it's there, don't depend on it.
        if (ev.delta?.stop_details) stopDetails = ev.delta.stop_details;
        break;

      // The API can report an error mid-stream (overloaded, for one) after
      // already returning a 200.
      case 'error':
        throw new Error(`stream error: ${ev.error?.type ?? 'unknown'}`);

      // message_start, message_stop, ping, and anything added later.
      default:
        break;
    }
  });

  return { blocks: blocks.filter(Boolean), stopReason, stopDetails };
}

// Runs the prompt with web search enabled, forwarding prose as it's generated.
// Throws on anything unexpected — an abort, a blown budget, a bad status, a
// refusal — so the caller can fall back to the no-tools path and the user still
// gets an answer. Returns the full text so the caller can tell "answered" from
// "produced only tool calls and no prose".
async function runWithSearch(apiKey, prompt, handlers) {
  const messages = [{ role: "user", content: prompt }];
  // Blocks produced so far across resumed turns. Kept as ONE assistant message
  // rather than appending a new one per resume, so the sequence stays a clean
  // user→assistant alternation however many times the tool loop pauses.
  const assistantBlocks = [];
  const deadline = Date.now() + SEARCH_BUDGET_MS;

  for (let attempt = 0; attempt <= MAX_CONTINUATIONS; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('search budget exhausted');

    // Abort instead of running into the platform's own timeout: that kills the
    // whole function, so the fallback never runs and the user sees a 504.
    // Streaming does NOT relax this — bytes already on the wire don't stop the
    // platform's clock, so the budget is still what makes the fallback
    // reachable. It just means a blown budget costs the user a retracted
    // partial answer rather than the entire request.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), remaining);

    let blocks, stopReason, stopDetails;
    try {
      ({ blocks, stopReason, stopDetails } = await streamTurn(apiKey, {
        model: SEARCH_MODEL,
        // max_tokens caps thinking + prose together, so this is well above what
        // a 250-word answer needs — a tight budget would truncate mid-sentence,
        // and truncated text is non-empty, so it would never reach the fallback.
        max_tokens: 8000,
        // Sonnet 5 runs adaptive thinking by default and is markedly less
        // willing to reach for tools with thinking off — which would defeat the
        // point here. Left on deliberately; `effort` is what bounds the spend.
        thinking: { type: "adaptive" },
        // Low, not medium: this is a scoped "find the county page and summarise
        // it" task, not one that needs deep reasoning, and effort is the main
        // lever on how long the user waits.
        output_config: { effort: "low" },
        tools: [{
          type: "web_search_20260209",
          name: "web_search",
          max_uses: MAX_SEARCHES,
          // `web_search_20260209` defaults to running every search from inside
          // code execution ("dynamic filtering"), which means provisioning a
          // sandbox and having the model write filtering code before a single
          // result comes back. That exists to cut TOKEN use on search-heavy
          // requests — it is not a speed feature, and it is a large part of why
          // this route was blowing past 60s. We do at most 3 searches and read a
          // 250-word answer, so tokens were never the constraint; latency is.
          // Calling direct skips the sandbox entirely.
          allowed_callers: ["direct"],
        }],
        messages,
      }, {
        ...handlers,
        // Two independent reasons to give up: the budget ran out, or the client
        // hung up (panel closed). Either one aborts the upstream request.
        signal: handlers?.signal
          ? AbortSignal.any([ac.signal, handlers.signal])
          : ac.signal,
      }));
    } finally {
      clearTimeout(timer);
    }

    // The server-side tool loop hit its iteration cap. Re-send the turn with
    // what it produced so far — the API resumes from the trailing
    // server_tool_use block. Adding a "continue" user message would break that.
    if (stopReason === "pause_turn") {
      assistantBlocks.push(...blocks);
      messages[1] = { role: "assistant", content: assistantBlocks };
      continue;
    }

    if (stopReason === "refusal") {
      throw new Error(`refused: ${stopDetails?.category ?? 'unknown'}`);
    }

    // Prose can be split across the paused turns, so read every block, not just
    // the final response's.
    return extractText([...assistantBlocks, ...blocks]);
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

  let prompt, fallbackPrompt, assistType, search;
  try {
    ({ prompt, fallbackPrompt, assistType, search } = await req.json());
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

  // `search` lets a single task opt into the lookup without changing its
  // assistType (see `shouldUseSearch`). It's client-supplied, but so is
  // assistType — a caller could already ask for the expensive path by sending
  // `assistType: 'jurisdiction'`, so this adds no reach. The per-user rate
  // limiter above is what bounds the spend either way.
  const useSearch =
    (typeof assistType === 'string' && SEARCH_ASSIST_TYPES.has(assistType)) ||
    search === true;

  // Every other assist type keeps the original one-shot JSON response. Only the
  // search-backed types stream, so guidance/script/guidance_companies are
  // untouched by any of this.
  if (!useSearch) {
    let text;
    try {
      text = await runPlain(apiKey, fallbackPrompt || prompt);
    } catch (err) {
      console.error(`Anthropic error: ${err}`);
      return new Response("Service error", { status: 502 });
    }
    return new Response(JSON.stringify({ text }), {
      headers: { "content-type": "application/json", ...corsHeaders(req) },
    });
  }

  // ─── Streamed (search-backed) path ──────────────────────────────────────────
  // A search request spends a long time looking things up before it writes a
  // word — long enough that this shipped timing out twice, which is why
  // SEARCH_BUDGET_MS exists. Streaming doesn't speed that up; it means the
  // response starts at once, the user watches real progress instead of a
  // loader, and a blown budget costs them a retracted partial answer rather
  // than the whole request.
  //
  // Line-delimited JSON, one event per line:
  //   {"type":"status","phase":"search"|"reading"|"fallback"}
  //   {"type":"text","delta":"..."}
  //   {"type":"reset"}   discard everything streamed so far
  //   {"type":"done"}    complete — safe to cache
  //   {"type":"error"}   gave up; whatever arrived is incomplete
  //
  // Errors are in-band because the status line is long gone by the time most of
  // them happen. Auth and rate limiting are checked above, so those still come
  // back as real HTTP statuses.
  const upstream = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let open  = true;
      // enqueue throws once the consumer has gone away (panel closed, tab
      // backgrounded out). That's not an error worth surfacing — the abort in
      // cancel() already stops the upstream work.
      const send = (obj) => {
        if (!open) return;
        try { controller.enqueue(enc.encode(JSON.stringify(obj) + '\n')); }
        catch { open = false; }
      };
      const finish = () => {
        if (!open) return;
        open = false;
        try { controller.close(); } catch {}
      };

      // Set once the search path has put prose on the wire. Decides whether a
      // later failure can fall back silently or has to retract first.
      let emitted = false;

      // Timed on both paths: this latency is the thing that decides whether the
      // feature is usable, and it can only be measured in a real deployment.
      // Streaming makes a slow lookup less painful, not faster — keep reading
      // these numbers rather than assuming the problem is handled.
      const startedAt = Date.now();
      let text = '';
      try {
        text = await runWithSearch(apiKey, prompt, {
          signal:    upstream.signal,
          onSearch:  () => send({ type: 'status', phase: 'search' }),
          onResults: () => send({ type: 'status', phase: 'reading' }),
          onText:    (delta) => { emitted = true; send({ type: 'text', delta }); },
        });
        console.log(
          `Assist web search ok (${assistType}) in ${Date.now() - startedAt}ms, ` +
          `first byte streamed: ${emitted}`
        );
      } catch (err) {
        // Search is best-effort. A failure, a rate limit, a refusal, a blown
        // budget, or an answer with no prose in it degrades to the no-tools
        // path.
        console.error(
          `Assist web search failed (${assistType}) after ${Date.now() - startedAt}ms, ` +
          `falling back (retracting ${emitted ? 'partial text' : 'nothing'}): ${err}`
        );
        text = '';
      }

      if (!text) {
        // A half-written search answer is worse than none — it's the part the
        // model hadn't finished sourcing yet. Tell the client to drop it, then
        // re-ask with the caller's no-search wording, which forbids stating
        // fees, deadlines, and phone numbers it can't verify.
        if (emitted) send({ type: 'reset' });
        send({ type: 'status', phase: 'fallback' });

        try {
          const { blocks } = await streamTurn(apiKey, {
            model: DEFAULT_MODEL,
            max_tokens: 2000,
            messages: [{ role: 'user', content: fallbackPrompt || prompt }],
          }, {
            signal: upstream.signal,
            onText: (delta) => send({ type: 'text', delta }),
          });
          if (!extractText(blocks)) throw new Error('empty response');
        } catch (err) {
          console.error(`Anthropic error: ${err}`);
          send({ type: 'error' });
          finish();
          return;
        }
      }

      send({ type: 'done' });
      finish();
    },

    // Panel closed or connection dropped — stop paying for a lookup nobody
    // will read.
    cancel() {
      upstream.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(req),
    },
  });
}
