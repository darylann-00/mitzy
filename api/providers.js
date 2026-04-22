export const config = { runtime: "edge" };

// ALLOWED_ORIGIN: set to your production domain in Vercel env vars (e.g. "https://mitzy.app").
// Empty = no cross-origin access (safe default; same-origin requests don't need CORS headers).
function corsHeaders(req) {
  const allowed = process.env.ALLOWED_ORIGIN || '';
  const origin  = req.headers.get('origin') || '';
  const match   = allowed && origin === allowed ? origin : null;
  return {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    ...(match ? { 'Access-Control-Allow-Origin': match } : {}),
  };
}

// What Claude should look for when synthesizing blurbs per task category
function getRelevantSignals(taskCat) {
  const signals = {
    car:       "appointment availability, wait time, specializations, certifications, loaner vehicles, warranty on work",
    health:    "new patient availability, wait times, kid-friendly, telehealth options, bedside manner, languages spoken",
    pet:       "new patient availability, wait times, experience with dogs/cats, fear-free or low-stress handling, pricing transparency",
    home:      "licensed and insured, response time, warranty on work, local vs. chain, scheduling ease",
    finance:   "fee structure, free consultations, local vs. national firm, specializations",
    emergency: "24/7 availability, response time, local service area",
    seasonal:  "scheduling lead time, pricing transparency, local vs. chain",
  };
  return signals[taskCat] || "quality, pricing, wait time, customer service";
}

function priceLevelToString(level) {
  const map = {
    PRICE_LEVEL_FREE:          "Free",
    PRICE_LEVEL_INEXPENSIVE:   "$",
    PRICE_LEVEL_MODERATE:      "$$",
    PRICE_LEVEL_EXPENSIVE:     "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE:"$$$$",
  };
  return map[level] || "";
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let taskLabel, taskCat, taskNote, zip, searchQuery;
  try {
    ({ taskLabel, taskCat, taskNote, zip, searchQuery } = await req.json());
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!taskLabel || !zip) {
    return new Response("Missing taskLabel or zip", { status: 400 });
  }

  const placesQuery = searchQuery || taskLabel;

  const placesKey   = process.env.GOOGLE_PLACES_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!placesKey || !anthropicKey) {
    return new Response("API keys not configured", { status: 500 });
  }

  // ── 1. Google Places Text Search (New API) ──────────────────────────────────
  const placesRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": placesKey,
      "X-Goog-FieldMask": [
        "places.displayName",
        "places.rating",
        "places.userRatingCount",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.priceLevel",
        "places.reviews",
        "places.regularOpeningHours",
        "places.businessStatus",
        "places.formattedAddress",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: `${placesQuery} near ${zip}`,
      maxResultCount: 6,
      languageCode: "en",
    }),
  });

  if (!placesRes.ok) {
    const err = await placesRes.text();
    return new Response(`Places API error: ${err}`, { status: 502 });
  }

  const placesData = await placesRes.json();
  const places = placesData.places || [];

  if (!places.length) {
    return new Response(JSON.stringify({ text: "[]" }), {
      headers: { "content-type": "application/json", ...corsHeaders(req) },
    });
  }

  // ── 2. Shape Places data for Claude ────────────────────────────────────────
  // For pet tasks, strip emergency/specialty-only clinics — they rank high on
  // review count but are wrong for routine wellness visits.
  const filteredPlaces = taskCat === "pet"
    ? places.filter(p => {
        const name = (p.displayName?.text || "").toLowerCase();
        return !/(emergency|urgent care|\bpet er\b|\bvet er\b|specialist|specialty center|specialty hospital)/i.test(name);
      })
    : places;

  const usePlaces = filteredPlaces.length > 0 ? filteredPlaces : places;

  const placesSummary = usePlaces.map(p => ({
    name:          p.displayName?.text,
    rating:        p.rating,
    reviewCount:   p.userRatingCount,
    phone:         p.nationalPhoneNumber,
    website:       p.websiteUri,
    priceRange:    priceLevelToString(p.priceLevel),
    address:       p.formattedAddress,
    weekdayHours:  p.regularOpeningHours?.weekdayDescriptions ?? null,
    topReviews:    (p.reviews || []).slice(0, 3).map(r => r.text?.text).filter(Boolean),
  }));

  // ── 3. Claude synthesis ─────────────────────────────────────────────────────
  const signals = getRelevantSignals(taskCat);
  const suitableField = taskCat === "pet"
    ? `,"suitable":true`
    : "";
  const suitableInstruction = taskCat === "pet"
    ? ` Set "suitable": false for any emergency-only, specialty-only, urgent care, or wrong-species facility; true for general practice clinics that offer routine wellness visits.`
    : "";
  const prompt = `You are helping a household manager find the best local provider for: "${taskLabel}".${taskNote ? ` Context: ${taskNote}.` : ""}

Here are real Google Places results near zip code ${zip}:
${JSON.stringify(placesSummary, null, 2)}

For each place, write a 1–2 sentence blurb that highlights what matters most for this specific task. Focus on: ${signals}. Ground everything in the actual reviews and data — do not invent details. Bold 2–3 key phrases per blurb by wrapping them in **double asterisks**.${suitableInstruction}

For the "hours" field: condense the weekdayHours array into a compact schedule string. Group consecutive days with the same hours using abbreviations (M, T, W, Th, F, Sat, Sun). Use lowercase am/pm and a dash between times. Examples: "M–F 8am–5pm · Sat 9am–2pm · Sun closed" or "M–Sat 8am–6pm · Sun closed". If weekdayHours is null, use "".

Return ONLY a JSON array (no markdown, no explanation), one object per place, in the same order:
[{"name":"","rating":0,"reviewCount":0,"phone":"","website":"","priceRange":"","hours":"","address":"","blurb":""${suitableField}}]`;

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return new Response(`Anthropic error: ${err}`, { status: 502 });
  }

  const anthropicData = await anthropicRes.json();
  let text = anthropicData.content?.[0]?.text ?? "[]";

  // For pet tasks, strip any provider Claude marked suitable: false.
  if (taskCat === "pet") {
    try {
      const parsed = JSON.parse(text);
      const filtered = parsed.filter(p => p.suitable !== false);
      text = JSON.stringify(filtered);
    } catch { /* leave text as-is if parse fails */ }
  }

  return new Response(JSON.stringify({ text }), {
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}
