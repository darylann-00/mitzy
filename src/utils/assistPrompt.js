const THIS_YEAR = new Date().getFullYear();
const getAge = (birthYear) => birthYear ? THIS_YEAR - parseInt(birthYear, 10) : null;

// Strip control chars and newlines to prevent prompt injection from profile fields
const sanitize = (str) =>
  str ? String(str).replace(/[\r\n\t]/g, ' ').replace(/[^\x20-\x7E]/g, '').trim() : str;
const sanitizeZip = (zip) =>
  zip ? String(zip).replace(/\D/g, '').slice(0, 10) : zip;

export function buildAssistPrompt(task, profile) {
  const zip  = sanitizeZip(profile.zip);
  const loc  = zip                   ? `near zip code ${zip}` : "in my area";
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
  if ((task.assistType === "guidance" || !task.assistType) && task.guidance) {
    return `Task: "${task.label}".

The user is already looking at these standard how-to steps on screen:
${task.guidance}

The user's household: ${ctx}

Add ONLY what is specific to this user's situation. Do not repeat, rephrase, or summarize the steps above — they can already read them. Consider: timing keyed to their region's climate, age- or model-specific notes for their home, car, kids, or pets, what their insurance may cover, and red flags specific to their setup. Include a bullet only if a different household would get materially different advice — never pad. If you mention a cost, give a rough range and mark it as approximate. If you have nothing meaningful to add beyond the steps, say so in one sentence.

Under 150 words. Markdown bullets, each starting with a **bold** lead-in.`;
  }

  const noteOrGuidance = task.guidance || task.note || '';
  const base = `Task: "${task.label}".${noteOrGuidance ? ` Context: ${noteOrGuidance}.` : ''} ${ctx} Only reference the above context if it's directly relevant to this task — do not mention it otherwise.`;

  switch (task.assistType) {
    case "script":
      return `${base}\n\nWrite a short ready-to-send message to schedule this. ${ins ? `Mention ${insuranceProvider}.` : ""}Include subject line if email. Then 2-3 bullet points on what to ask. Under 150 words.`;

    case "deadline":
      return `${base}\n\nFind specific deadlines, key dates, official links, and phone numbers ${loc}. Include direct links to official sources.`;

    case "guidance_companies":
      return `${base}\n\nReturn a JSON object (no markdown wrapper, no code fences) with exactly two fields:
1. "guidance": practical advice in markdown. Use prose where it reads naturally, bullets where there are distinct items, and ## headers to separate sections. Under 200 words.
2. "companies": array of exactly 3 actual companies or services for this task — not comparison sites, aggregators, or brokers. Pick well-known, reputable names the user would recognize. For each: {"name":"","blurb":"1–2 sentences with **bold** key phrases on why it stands out","website":"https://..."}.

Return ONLY valid JSON. No text outside the JSON object.`;

    default:
      return `${base}\n\nGive practical guidance: what to look for, what to ask, red flags, the single most important thing to know. Under 200 words.`;
  }
}
