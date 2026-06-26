import { requireUser } from './_auth.js';
import { assistLimiter } from './_ratelimit.js';
import { corsHeaders, sanitize } from './_helpers.js';

export const config = { runtime: "edge" };

const SYSTEM_PROMPT = `You help a user plan their household week by matching their free-text input against their task list.

You receive a JSON object with:
- "userInput": free-text from the user about what's happening this week
- "tasks": [{ id, label, category }] — their active household tasks
- "autoDueTasks": [{ id, label }] — tasks already due or coming up this week (pre-included)
- "capacity": "low" | "normal" | "high" — how many tasks they want
- "weekStart": "YYYY-MM-DD" — the Monday of this week
- "backlogTasks": [{ id, label, category }] — scored backlog tasks for gap-filling

Return ONLY valid JSON in this shape — no markdown, no prose:
{
  "matches": [{ "taskId": string, "scheduledDate": string, "confidence": number, "mentionText": string }],
  "newTaskSuggestions": [{ "label": string, "reason": string }],
  "gapFill": [{ "taskId": string, "reason": string }]
}

Rules:
- Parse the user's input for mentions of tasks, appointments, or household activities.
- Match mentions against the "tasks" list. Only emit matches with confidence >= 0.7.
- When the user mentions a day of the week (e.g., "Thursday"), convert it to an ISO date using the weekStart. Monday = weekStart, Tuesday = weekStart + 1, etc. If the day has already passed this week, use the same week's date anyway.
- "mentionText" is the relevant snippet from the user's input that triggered the match.
- If a mention doesn't match any task, add it to "newTaskSuggestions" with a short reason.
- For "gapFill": pick the most important tasks from "backlogTasks" (by their list position, which reflects priority). Fill remaining capacity:
  - capacity "low" = 1 total tasks for the week
  - capacity "normal" = 5 total tasks for the week
  - capacity "high" = 8 total tasks for the week
  - Subtract autoDueTasks count and matches count from the capacity to determine how many gap-fill slots remain. If zero or negative, return empty gapFill.
  - Do NOT include any task that's already in autoDueTasks.
- Keep "reason" strings short — one sentence max, in a friendly tone.
- If the user input is empty or has no task-related content, return empty matches and newTaskSuggestions, but still fill gapFill.`;

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

  const { userInput, tasks, autoDueTasks, capacity, weekStart, backlogTasks } = body || {};

  if (!Array.isArray(tasks) || !weekStart) {
    return new Response("Missing tasks or weekStart", { status: 400, headers: corsHeaders(req) });
  }

  const safeInput = sanitize(userInput || '').slice(0, 2000);

  const safeTasks = tasks.slice(0, 200).map(t => ({
    id: sanitize(t?.id).slice(0, 200),
    label: sanitize(t?.label).slice(0, 200),
    category: sanitize(t?.category).slice(0, 40),
  })).filter(t => t.id && t.label);

  const safeAutoDue = (autoDueTasks || []).slice(0, 50).map(t => ({
    id: sanitize(t?.id).slice(0, 200),
    label: sanitize(t?.label).slice(0, 200),
  })).filter(t => t.id && t.label);

  const safeBacklog = (backlogTasks || []).slice(0, 50).map(t => ({
    id: sanitize(t?.id).slice(0, 200),
    label: sanitize(t?.label).slice(0, 200),
    category: sanitize(t?.category).slice(0, 40),
  })).filter(t => t.id && t.label);

  const safeCapacity = ['low', 'normal', 'high'].includes(capacity) ? capacity : 'normal';
  const safeWeekStart = sanitize(weekStart).slice(0, 10);

  const emptyResponse = { matches: [], newTaskSuggestions: [], gapFill: [] };

  if (safeTasks.length === 0) {
    return new Response(JSON.stringify(emptyResponse), {
      headers: { 'content-type': 'application/json', ...corsHeaders(req) },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500, headers: corsHeaders(req) });
  }

  const userMessage = JSON.stringify({
    userInput: safeInput,
    tasks: safeTasks,
    autoDueTasks: safeAutoDue,
    capacity: safeCapacity,
    weekStart: safeWeekStart,
    backlogTasks: safeBacklog,
  });

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

  if (!parsed) {
    return new Response(JSON.stringify(emptyResponse), {
      headers: { 'content-type': 'application/json', ...corsHeaders(req) },
    });
  }

  const taskIds = new Set(safeTasks.map(t => t.id));
  const backlogIds = new Set(safeBacklog.map(t => t.id));

  const matches = Array.isArray(parsed.matches)
    ? parsed.matches.filter(m =>
        m && typeof m.taskId === 'string' && taskIds.has(m.taskId)
        && typeof m.confidence === 'number' && m.confidence >= 0.7
        && typeof m.scheduledDate === 'string'
      ).slice(0, 20)
    : [];

  const newTaskSuggestions = Array.isArray(parsed.newTaskSuggestions)
    ? parsed.newTaskSuggestions.filter(s =>
        s && typeof s.label === 'string' && s.label.length > 0
      ).slice(0, 10)
    : [];

  const gapFill = Array.isArray(parsed.gapFill)
    ? parsed.gapFill.filter(g =>
        g && typeof g.taskId === 'string' && backlogIds.has(g.taskId)
      ).slice(0, 10)
    : [];

  return new Response(JSON.stringify({ matches, newTaskSuggestions, gapFill }), {
    headers: { 'content-type': 'application/json', ...corsHeaders(req) },
  });
}
