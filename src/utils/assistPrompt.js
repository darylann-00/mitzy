export function buildAssistPrompt(task, profile) {
  const loc  = profile.zip       ? `near zip code ${profile.zip}` : "in my area";
  const ins  = profile.insurance ? `Insurance: ${profile.insurance}. ` : "";
  const carStr = task.vehicle
    ? task.vehicle
    : profile.cars?.length ? profile.cars.join(", ") : profile.car;
  const car  = carStr ? `Vehicle: ${carStr}. ` : "";
  const kids = profile.kids?.length
    ? `Kids: ${profile.kids.map(k => `${k.name} age ${k.age}`).join(", ")}. `
    : "";
  const pets = profile.pets?.length
    ? `Pets: ${profile.pets.map(p => `${p.name} (${p.type}, age ${p.age})`).join(", ")}. `
    : "";

  const ctx  = `${ins}${car}${kids}${pets}Location: ${loc}.`;
  const base = `Task: "${task.label}". Note: ${task.note}. ${ctx} Only reference the above context if it's directly relevant to this task — do not mention it otherwise.`;

  switch (task.assistType) {
    case "script":
      return `${base}\n\nWrite a short ready-to-send message to schedule this. ${ins ? `Mention ${profile.insurance}.` : ""}Include subject line if email. Then 2-3 bullet points on what to ask. Under 150 words.`;

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
