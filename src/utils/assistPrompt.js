import { resolveLocation } from './geo.js';

const THIS_YEAR = new Date().getFullYear();
const getAge = (birthYear) => birthYear ? THIS_YEAR - parseInt(birthYear, 10) : null;

// Strip control chars and newlines to prevent prompt injection from profile fields
const sanitize = (str) =>
  str ? String(str).replace(/[\r\n\t]/g, ' ').replace(/[^\x20-\x7E]/g, '').trim() : str;
const sanitizeZip = (zip) =>
  zip ? String(zip).replace(/\D/g, '').slice(0, 10) : zip;

// Assist types that /api/assist runs with Anthropic's web search tool. Their
// prompts have two variants: `search: true` requires the model to cite what it
// looked up, and the default forbids stating anything it can't verify. The
// server falls back to the default wording whenever a search doesn't land.
const SEARCH_ASSIST_TYPES = new Set(['jurisdiction', 'deadline']);

export const isSearchAssistType = (assistType) => SEARCH_ASSIST_TYPES.has(assistType);

export async function buildAssistPrompt(task, profile, { search = false } = {}) {
  const zip  = sanitizeZip(profile.zip);

  // Resolve location with geo.js, fallback to zip code or generic area
  let loc;
  if (zip) {
    const resolved = await resolveLocation(zip);
    if (resolved) {
      loc = `in ${resolved.county}, ${resolved.state} (zip ${zip})`;
    } else {
      loc = `near zip code ${zip}`;
    }
  } else {
    loc = "in my area";
  }
  const insuranceProvider = task.insurance || profile.insurance;
  const ins  = insuranceProvider      ? `Insurance: ${sanitize(insuranceProvider)}. ` : "";
  const carStr = task.vehicle
    ? task.vehicle
    : profile.cars?.length ? profile.cars.join(", ") : profile.car;
  const car  = carStr ? `Vehicle: ${sanitize(carStr)}. ` : "";
  const kids = profile.kids?.length
    ? `Kids: ${profile.kids.map(k => `${sanitize(k.name)} age ${getAge(k.birthYear)}`).join(", ")}. `
    : "";
  const pets = profile.pets?.length
    ? `Pets: ${profile.pets.map(p => `${sanitize(p.name)} (${sanitize(p.type)}, age ${getAge(p.birthYear)})`).join(", ")}. `
    : "";

  const ctx  = `${ins}${car}${kids}${pets}Location: ${loc}.`;

  // Guidance tasks with static steps: the steps already render in TaskDetailView's
  // "What to expect" card, so ask only for the user-specific delta — never a
  // paraphrase of what's on screen.
  // Jurisdiction tasks fall through to their own case below, even though most of
  // them also carry static guidance steps.
  if ((task.assistType === "guidance" || !task.assistType) && task.guidance) {
    return `Task: "${task.label}".

The user is already looking at these standard how-to steps on screen:
${task.guidance}

The user's household: ${ctx}

Add ONLY what is specific to this user's situation. Do not repeat, rephrase, or summarize the steps above — they can already read them. Consider: timing keyed to their region's climate, age- or model-specific notes for their home, car, kids, or pets, what their insurance may cover, and red flags specific to their setup. Include a bullet only if a different household would get materially different advice — never pad. If you mention a cost, give a rough range and mark it as approximate. If you have nothing meaningful to add beyond the steps, say so in one sentence.

Under 150 words. Markdown bullets, each starting with a **bold** lead-in.`;
  }

  // For jurisdiction tasks, use only task.note (not guidance, which has static steps).
  // For all other tasks, include guidance if present.
  const noteOrGuidance = (task.assistType === "jurisdiction" ? task.note : (task.guidance || task.note)) || '';
  const base = `Task: "${task.label}".${noteOrGuidance ? ` Context: ${noteOrGuidance}.` : ''} ${ctx} Only reference the above context if it's directly relevant to this task — do not mention it otherwise.`;

  switch (task.assistType) {
    case "script":
      return `${base}\n\nWrite a short ready-to-send message to schedule this. ${ins ? `Mention ${insuranceProvider}.` : ""}Include subject line if email. Then 2-3 bullet points on what to ask. Under 150 words.`;

    case "deadline":
      if (search) {
        return `${base}

Search for the deadlines and key dates that apply to the user ${loc}, and for the office or agency that administers them.

Prefer the responsible agency's own site over blogs, aggregators, or marketing pages. Cite your source as a markdown link for every date, dollar amount, and phone number you state. If a date depends on their county or their individual circumstances, say so and name the office that confirms it rather than presenting one date as universal. If your search did not surface a reliable official source for something, say so instead of guessing it.

Close with one short line noting that these dates can change year to year.

Under 250 words. Markdown with **bold** lead-ins.`;
      }
      return `${base}

Explain what deadlines and key dates apply here and which office or agency administers them ${loc}.

Do NOT state a specific date, dollar amount, phone number, or web address as fact — these vary by jurisdiction and change year to year, and you cannot verify them. Name the exact office the user should contact to confirm. If you are not confident about the rule where they live, say so plainly rather than guessing.

Under 200 words. Markdown with **bold** lead-ins.`;

    case "guidance_companies":
      return `${base}\n\nReturn a JSON object (no markdown wrapper, no code fences) with exactly two fields:
1. "guidance": practical advice in markdown. Use prose where it reads naturally, bullets where there are distinct items, and ## headers to separate sections. Under 200 words.
2. "companies": array of exactly 3 actual companies or services for this task — not comparison sites, aggregators, or brokers. Pick well-known, reputable names the user would recognize. For each: {"name":"","blurb":"1–2 sentences with **bold** key phrases on why it stands out","website":"https://..."}.

Return ONLY valid JSON. No text outside the JSON object.`;

    case "jurisdiction":
      if (search) {
        return `${base}

This task is governed by state and local law, and the user is ${loc}. Search for the rules that actually apply to them.

Prefer the responsible office's own site — the state court, county clerk, DMV, vital records, or equivalent agency — over law-firm marketing pages, blogs, or aggregator sites.

Cover: which specific office handles this, the state and county rules that apply, any residency or waiting-period requirement, the current filing fee or cost, any deadline the user is on the hook for, and what they need to bring or prepare.

Cite your source as a markdown link for every fee, dollar amount, deadline, and phone number you state. If your search did not surface a reliable official source for one of those details, do NOT guess it — say it varies and name the exact office to call. If the rule differs between their state and their county, say which one you found.

Close with one short line noting that fees and deadlines are set locally and change, so the office confirms current amounts.

Under 250 words. Markdown with **bold** lead-ins.`;
      }
      return `${base}

This task is governed by state and local law, and the user is ${loc}.

Explain how this works in their state: which specific office handles it, what the state-level rules are, any residency or waiting-period requirements, and what they need to bring or prepare.

Do NOT state a specific filing fee, dollar amount, phone number, or web address, and do NOT state a local deadline as fact — these are set locally and you cannot verify them. Instead, name the exact office they should contact to confirm those details. If you are not confident about this particular state's rule, say so plainly rather than guessing.

Under 200 words. Markdown with **bold** lead-ins.`;

    default:
      return `${base}\n\nGive practical guidance: what to look for, what to ask, red flags, the single most important thing to know. Under 200 words.`;
  }
}
