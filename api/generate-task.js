import { requireUser } from './_auth.js';
import { generateTaskLimiter } from './_ratelimit.js';

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
  str ? String(str).replace(/[\r\n\t]/g, ' ').replace(/[^\x20-\x7E]/g, '').trim() : str;
const sanitizeZip = (zip) =>
  zip ? String(zip).replace(/\D/g, '').slice(0, 10) : zip;

const THIS_YEAR = new Date().getFullYear();
const getAge = (birthYear) => birthYear ? THIS_YEAR - parseInt(birthYear, 10) : null;

async function hashShort(s) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).slice(0, 4)
      .map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'nohash';
  }
}

function buildProfileContext(profile) {
  if (!profile || typeof profile !== 'object') return 'No profile context.';
  const zip = sanitizeZip(profile.zip);
  const region = sanitize(profile.region);
  const carStr = Array.isArray(profile.cars) && profile.cars.length
    ? profile.cars.map(sanitize).filter(Boolean).join(', ') : '';
  const kidsStr = Array.isArray(profile.kids) && profile.kids.length
    ? profile.kids.map(k => `${sanitize(k?.name) || 'child'} age ${getAge(k?.birthYear) ?? '?'}`).join(', ') : '';
  const petsStr = Array.isArray(profile.pets) && profile.pets.length
    ? profile.pets.map(p => `${sanitize(p?.name) || 'pet'} (${sanitize(p?.type) || 'pet'}, age ${getAge(p?.birthYear) ?? '?'})`).join(', ') : '';
  const age = getAge(profile.birthYear);

  const parts = [];
  if (zip)     parts.push(`zip ${zip}`);
  if (region)  parts.push(`climate region: ${region}`);
  if (age)     parts.push(`user age ${age}`);
  if (carStr)  parts.push(`vehicles: ${carStr}`);
  if (kidsStr) parts.push(`kids: ${kidsStr}`);
  if (petsStr) parts.push(`pets: ${petsStr}`);
  return parts.length ? parts.join('; ') : 'No profile context.';
}

const SYSTEM_PROMPT = `You are Mitzy's task generator. The user describes one or more household, vehicle, family, financial, health, or seasonal tasks they want tracked. Convert each into a structured task object Mitzy can schedule.

CRITICAL: Return ONLY valid JSON. No markdown code fences. No prose outside the JSON object.

# Step 0: Count tasks — THIS STEP IS MANDATORY, DO IT FIRST
Read the user's prompt carefully and count how many distinct tasks they mentioned.

CRITICAL RULE: If the user mentioned 2 or more distinct tasks, you MUST use the multi-task response format (Step 3b). NEVER pick just one task and discard the rest. Every task the user mentioned must appear in your response.

Examples of MULTIPLE tasks (use Step 3b):
- "change HVAC filter, schedule dentist, and get car inspected" → 3 tasks
- "I need to winterize sprinklers, get flu shots, and clean the gutters" → 3 tasks
- "schedule oil change. also need to call about the roof and renew my license" → 3 tasks
- "get the dog groomed, take kids to dentist, change air filter, pay property tax" → 4 tasks

Examples of ONE task (use Step 3):
- "change the HVAC filter" → 1 task
- "I need to winterize the house" → 1 task (do NOT split into sub-tasks)

Do NOT split a single task into sub-tasks. "Replace the kitchen faucet" is ONE task, not three (buy faucet, remove old, install new). But if the user listed separate things to do, each one is its own task. Cap at 10 tasks per prompt.

# Step 1: Safety scan
If the prompt indicates the user is in crisis, in danger, or describing harm, return tier 4 and stop:
- self_harm: suicide ideation, self-injury, "want to die", "end it all"
- domestic_violence: abuse by partner/family, fearing for safety at home, "he hits me"
- child_safety: child abuse, neglect, child in danger
- mental_health_crisis: acute panic, dissociation, "can't go on", recent loss with suicidal ideation

T4 response shape:
{
  "tier": 4,
  "refusal": {
    "category": "self_harm" | "domestic_violence" | "child_safety" | "mental_health_crisis",
    "message": "<empathetic 1–2 sentence message acknowledging their situation and pointing them to help>",
    "resource": { "label": "<hotline name>", "value": "<phone or url>", "type": "phone" | "url" }
  }
}

Resource map:
- self_harm or mental_health_crisis: 988 Suicide & Crisis Lifeline, value "988", type "phone"
- domestic_violence: National Domestic Violence Hotline, value "1-800-799-7233", type "phone"
- child_safety: Childhelp National Child Abuse Hotline, value "1-800-422-4453", type "phone"

# Step 2: Risk tier classification (T1–T3.5)
- T1 (DIY-friendly): air filters, caulk, gardening, cleaning, simple replacements, watering, basic maintenance
- T2 (pro recommended, DIY-allowed): faucet swap, ceiling fan install, drywall repair, chimney clean, tall tree pruning, pressure washing roof
- T3 (pro REQUIRED): gas appliances, fuel systems, electrical panel/rewiring, asbestos/lead, structural changes, anything requiring permits, roof replacement
- T3.5 (reminder + defer to pro): medical symptoms/screenings, legal matters, fiduciary financial, pet medical beyond routine vaccines, mental health non-crisis (therapy intake), tax filing

HARD-NO list (refuse to generate guidance even if user insists DIY): medication dosing (human or pet), chemical mixing ratios, gas line work, fuel system repair. For these, use T3 with assist_type "guidance_companies" and guidance copy that strictly defers to professionals.

assist_type rules:
- T1: "guidance"
- T2: "guidance_companies" (client may silently toggle to "guidance")
- T3: "guidance_companies" (locked, no DIY toggle)
- T3.5: "guidance_companies" (with deferral copy in guidance)

# Step 3: Generate fields
Return shape (success):
{
  "tier": 1 | 2 | 3 | 3.5,
  "task": {
    "label": "<short imperative, e.g. 'Fertilize orchid'>",
    "cat": "home" | "car" | "health" | "school" | "finance" | "emergency" | "pet" | "other",
    "intervalDays": <integer or null if oneTime>,
    "windowDays": <integer; ~20% of intervalDays, min 3, max 30; or 14 for one-time>,
    "stakes": "low" | "medium" | "high",
    "activeMonths": <array of 1-12 ints, or null if year-round>,
    "assistType": "guidance" | "guidance_companies",
    "searchQuery": "<short query string for finding services; null if assistType=guidance>",
    "why": "<1–2 sentence plain-English why this matters>",
    "guidance": "<markdown with ## headers, bullets where natural, under 250 words>",
    "oneTime": <boolean>,
    "dueDate": "<YYYY-MM-DD string if the user mentioned a specific date/day, else null>",
    "riskTier": 1 | 2 | 3 | 3.5,
    "suppressCelebration": <boolean — true ONLY for sensitive/somber tasks where confetti on completion would feel inappropriate>,
    "lifeEventRelevant": <boolean — true if this task is directly relevant to the user's active life event (if specified in the prompt), false otherwise; default false>,
    "assumptions": [
      { "key": "<short_snake_case>", "label": "<current chosen value>", "options": ["<option1>", "<option2>", ...] }
    ],
    "steps": [
      {
        "key": "<snake_case unique key>",
        "label": "<short imperative, e.g. 'Find a plumber'>",
        "body": "<specific actionable instruction — tell the user exactly what to do, not just what to accomplish. May use {{zip}} for location>",
        "type": "action" | "provider_search" | "call" | "link",
        "providerSearchQuery": "<query for finding providers, only for type=provider_search, else null>",
        "nameSearchOnly": "<true for health/insurance-dependent tasks where user should find provider through insurance portal first, false for home/car/other tasks where Google Maps search is fine>",
        "linkUrl": "<URL to open, only for type=link, else null>",
        "linkLabel": "<button text for link, only for type=link, else null>",
        "phone": "{{provider.phone}}  (only for type=call after a provider_search step, else null)",
        "callScript": "<what to say on the phone — do NOT include insurance or assume new/existing patient, the UI handles those separately. May use {{provider.name}}. Only for type=call, else null>",
        "dependsOnProvider": "<true if this step uses {{provider.*}} vars from a prior provider_search step, else false>"
      }
    ]
  }
}

# Steps generation rules
Generate 3–5 steps per task. Each step must be specific enough that the user never has to figure out what to do — tell them exactly where to go, what to click, what to say.
- First step should be the smallest possible action to reduce activation energy
- For tasks needing a professional (T2/T3/T3.5), include a provider_search step early and a call step with callScript after it
- For health/medical tasks (cat: "health"), set nameSearchOnly: true on provider_search steps — the body should tell the user to find an in-network provider through their insurance portal first, then look them up by name to save their info. For non-health tasks, set nameSearchOnly: false so the general Google Maps search is available
- Steps after a provider_search step should set dependsOnProvider: true and use {{provider.name}}, {{provider.phone}}, {{provider.hours}}
- For T1 (DIY) tasks, use action and link steps — no provider_search needed
- type=call steps should always include a callScript with a natural phone script. Do NOT mention insurance, "new patient", or "existing patient" in the script — the UI adds insurance info separately and the user knows their own patient status
- For null fields, omit them or set to null

# suppressCelebration rules
Set suppressCelebration: true ONLY when the task is somber and a "completed!" confetti burst would feel disrespectful. Examples that should be true:
- Death-related: funeral, estate, probate, cancel deceased's accounts, write obituary
- Divorce/separation: file divorce papers, divide assets, custody arrangements
- Job loss: file unemployment, COBRA, severance review
- Serious illness: chemo schedule, hospice setup, end-of-life directives
- Pet loss: cremation, vet euthanasia follow-up

Default is false. Routine home/car/health/finance maintenance is celebratable.

# lifeEventRelevant rules
If the user message specifies an active life event, set lifeEventRelevant: true on any task that would logically belong to that event's to-do list. Example: active event "New baby" + prompt "buy a crib" → true. Active event "New baby" + prompt "change HVAC filter" → false. If no active life event is mentioned, always set false.

Personalize using profile context (vehicles, kids, pets, climate region, age) only when directly relevant to the task. Do not mention profile context in the task otherwise. IMPORTANT: If the prompt mentions a specific age that does not match any profile child's age, the task is for someone outside the household — do not reference, tag, or link to the user's children in any field.

For seasonal tasks, set activeMonths matching the user's climate region. For one-time tasks, set intervalDays: null and oneTime: true.

# dueDate rules
If the user mentions a specific day or date (e.g. "Saturday", "next Tuesday", "June 30", "tomorrow"), resolve it to a YYYY-MM-DD string using today's date provided in the user message. Set oneTime: true and intervalDays: null for date-specific tasks — "go to the store on Saturday" is a one-time task due this Saturday, NOT a recurring weekly task. Only set dueDate: null when no date or day was mentioned.

Generate 1–2 assumptions max — only when flipping the value would meaningfully change intervalDays, activeMonths, riskTier, or the guidance content. If no such assumption exists, return an empty array. Each assumption's "label" is the current chosen value (must appear in "options"). Good example: { key: "plant_location", label: "Houseplant", options: ["Houseplant", "Garden"] } — changes watering frequency. Bad example: { key: "issue_type", options: ["leaking", "broken"] } — both produce the same task, so omit it.

# Parse-failure / out-of-scope path
If the prompt is too vague to generate a meaningful task (e.g. "uhhh do the thing"), return:
{
  "tier": 0,
  "manual": { "label": "<best guess label>", "cat": "<best guess cat>", "needsManualSetup": true }
}

# Step 3b: Multi-task response format (REQUIRED when Step 0 found 2+ tasks)
If you counted 2 or more distinct tasks in Step 0, you MUST return this format:
{
  "tier": "multi",
  "tasks": [
    { "tier": 1 | 2 | 3 | 3.5 | 4, "task": { ...same fields as Step 3... } },
    ...
  ]
}

IMPORTANT: "tier" at the top level MUST be the string "multi" (not a number). Each item in the "tasks" array has its own numeric tier.

Apply the safety scan (Step 1) and risk tier (Step 2) independently to each task. If any single task is tier 4, include it in the array with its refusal object instead of a task object. The client will filter these out.

Omit the "steps" array from each task to keep the response compact. Include all other fields (label, cat, intervalDays, windowDays, stakes, activeMonths, assistType, searchQuery, why, guidance, oneTime, riskTier, suppressCelebration, lifeEventRelevant, assumptions).

# Regenerate path
If the request includes "regenerate": {key, value}, the user flipped one assumption. Re-derive the affected fields (frequency, season, guidance) and return the full updated task object. Keep label and cat consistent unless the flip changes them fundamentally.`;

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

  const { success, reset } = await generateTaskLimiter.limit(userId);
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
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders(req) });
  }

  const { prompt, profile, existingTaskLabels, regenerate, activeEvent: activeEventInput } = body || {};

  if (!prompt || typeof prompt !== 'string') {
    return new Response("Missing prompt", { status: 400, headers: corsHeaders(req) });
  }
  if (prompt.length > 2000) {
    return new Response("Prompt too large", { status: 413, headers: corsHeaders(req) });
  }
  if (existingTaskLabels !== undefined && !Array.isArray(existingTaskLabels)) {
    return new Response("Invalid existingTaskLabels", { status: 400, headers: corsHeaders(req) });
  }
  if (existingTaskLabels && existingTaskLabels.length > 200) {
    return new Response("Too many existing labels", { status: 413, headers: corsHeaders(req) });
  }
  if (regenerate !== undefined && regenerate !== null) {
    if (typeof regenerate !== 'object'
      || typeof regenerate.key !== 'string'
      || typeof regenerate.value !== 'string'
      || regenerate.key.length > 64
      || regenerate.value.length > 128) {
      return new Response("Invalid regenerate", { status: 400, headers: corsHeaders(req) });
    }
  }
  if (activeEventInput != null && (typeof activeEventInput !== 'object'
    || (activeEventInput.type && typeof activeEventInput.type !== 'string')
    || (activeEventInput.label && typeof activeEventInput.label !== 'string'))) {
    return new Response("Invalid activeEvent", { status: 400, headers: corsHeaders(req) });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500, headers: corsHeaders(req) });
  }

  const cleanPrompt = sanitize(prompt).slice(0, 2000);
  const profileCtx = buildProfileContext(profile);
  const safeLabels = Array.isArray(existingTaskLabels)
    ? existingTaskLabels.slice(0, 200).map(sanitize).filter(Boolean).slice(0, 200)
    : [];
  const labelsLine = safeLabels.length
    ? `Existing tasks already tracked (avoid exact duplicates): ${safeLabels.join(' | ')}`
    : 'No existing tasks listed.';

  const regenLine = regenerate
    ? `\n\nThe user flipped an assumption. Regenerate the task with: ${sanitize(regenerate.key)} = ${sanitize(regenerate.value)}. Re-derive frequency, season, and guidance accordingly.`
    : '';

  const eventLine = activeEventInput?.label
    ? `\nActive life event: "${sanitize(activeEventInput.label)}". If any generated task is directly relevant to this life event, set "lifeEventRelevant": true on that task.`
    : '';

  const today = new Date().toISOString().slice(0, 10);
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const userMessage = `User prompt: "${cleanPrompt}"
Today is ${dayName}, ${today}.
Profile context: ${profileCtx}
${labelsLine}${eventLine}${regenLine}`;

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
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
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return new Response(JSON.stringify({
      tier: 0,
      manual: { label: cleanPrompt.slice(0, 80), cat: "home", needsManualSetup: true },
    }), { status: 200, headers: { "content-type": "application/json", ...corsHeaders(req) } });
  }

  if (parsed.tier === 4) {
    const promptHash = await hashShort(cleanPrompt);
    console.log(JSON.stringify({
      event: "tier4_trigger",
      category: parsed.refusal?.category ?? 'unknown',
      promptHash,
    }));
  }

  return new Response(JSON.stringify(parsed), {
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}
