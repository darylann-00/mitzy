export function buildAssistPrompt(task, profile) {
  const loc  = profile.zip       ? `near zip code ${profile.zip}` : "in my area";
  const ins  = profile.insurance ? `Insurance: ${profile.insurance}. ` : "";
  const car  = profile.car       ? `Vehicle: ${profile.car}. ` : "";
  const kids = profile.kids?.length
    ? `Kids: ${profile.kids.map(k => `${k.name} age ${k.age}`).join(", ")}. `
    : "";
  const pets = profile.pets?.length
    ? `Pets: ${profile.pets.map(p => `${p.name} (${p.type}, age ${p.age})`).join(", ")}. `
    : "";

  const ctx  = `${ins}${car}${kids}${pets}Location: ${loc}.`;
  const base = `Task: "${task.label}". Note: ${task.note}. ${ctx}`;

  switch (task.assistType) {
    case "providers":
      return `${base}\n\nFind 3-4 real highly-rated local providers for this ${loc}. Return ONLY a JSON array:\n[{"name":"","rating":"","phone":"","website":"","bookingUrl":"","hasOnlineBooking":true,"priceRange":"","insuranceNote":"","blurb":""}]\nReturn ONLY the JSON array.`;

    case "script":
      return `${base}\n\nWrite a short ready-to-send message to schedule this. ${ins ? `Mention ${profile.insurance}.` : ""}Include subject line if email. Then 2-3 bullet points on what to ask. Under 150 words.`;

    case "deadline":
      return `${base}\n\nFind specific deadlines, key dates, official links, and phone numbers ${loc}. Include direct links to official sources.`;

    default:
      return `${base}\n\nGive practical guidance: what to look for, what to ask, red flags, the single most important thing to know. Under 200 words.`;
  }
}
