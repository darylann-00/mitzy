import { useState, useEffect } from "react";
import { C } from "../data/constants";
import { Sheet } from "./Sheet";
import { saveS, ASSIST_CACHE_PREFIX, ASSIST_CACHE_TTL } from "../utils/storage";

// NOTE: Real AI calls must go through a Vercel Edge Function proxy (/api/assist).
// Never call the Anthropic API directly from the frontend.
// buildAssistPrompt() is already wired — just needs the proxy endpoint.

const ASSIST_LABELS = {
  providers: "I found these for you ✦",
  script:    "Ready to send ✦",
  deadline:  "Dates + links ✦",
  guidance:  "How to handle this ✦",
};

const MOCK_RESULTS = {
  providers: JSON.stringify([
    { name: "Sunrise Home Services",    rating: "4.8", phone: "(503) 555-0142", website: "https://example.com", bookingUrl: "https://example.com/book",     hasOnlineBooking: true,  priceRange: "$80-120", insuranceNote: "", blurb: "Highly responsive, books online in minutes." },
    { name: "Pacific Northwest Pros",   rating: "4.7", phone: "(503) 555-0198", website: "https://example.com", bookingUrl: null,                            hasOnlineBooking: false, priceRange: "$70-110", insuranceNote: "", blurb: "15 years in business, fully licensed and bonded." },
    { name: "QuickFix Home Care",       rating: "4.5", phone: "(971) 555-0231", website: "https://example.com", bookingUrl: "https://example.com/schedule", hasOnlineBooking: true,  priceRange: "$60-95",  insuranceNote: "", blurb: "Best price in area. Good reviews for punctuality." },
  ]),
  script: (task) =>
    `SUBJECT: Scheduling — ${task.label}\n\nHi there,\n\nI'd like to schedule ${task.label.toLowerCase()} at your earliest convenience. I'm generally available weekdays and Saturday mornings.\n\nCould you let me know your next available slots?\n\nThanks!\n\nWHAT TO ASK:\n• How long does the appointment take?\n• What should I prepare beforehand?\n• What's your cancellation policy?`,
  deadline:
    `KEY DATES + LINKS\n\nCheck your renewal notice — dates vary by state and provider.\n\nWHAT TO DO FIRST:\nLocate your most recent notice — expiration date is printed there.\n\nOFFICIAL RESOURCES:\n• Your state's relevant agency website\n• Your provider's member portal\n\n[Live results pull real dates for your zip when deployed]`,
  guidance:
    `HOW TO HANDLE THIS\n\nMOST IMPORTANT:\nDon't wait until you're in a pinch — a few weeks of lead time gives you options.\n\nWHAT TO LOOK FOR:\n4.7+ stars with 50+ reviews. Check for mentions of reliability.\n\nWHAT TO ASK:\n• Are you licensed and insured?\n• What's included in the base price?\n• How long will it take?\n\nRED FLAGS:\nCash-only, no written estimate, pressure to decide on the spot.\n\n[Live results tailored to your location when deployed]`,
};

function getMockResult(task) {
  if (task.assistType === "script") return MOCK_RESULTS.script(task);
  return MOCK_RESULTS[task.assistType] || MOCK_RESULTS.guidance;
}

function parseProviders(text) {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return null;
}

export function AssistPanel({ task, profile, providerHistory, onSaveProvider, onClose }) {
  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const [cached, setCached] = useState(null);

  const cacheKey = `${ASSIST_CACHE_PREFIX}-${task.id}`;

  const loadCache = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.ts < ASSIST_CACHE_TTL) return parsed;
      }
    } catch {}
    return null;
  };

  const saveCache = (data) => {
    try { saveS(cacheKey, { data, ts: Date.now() }); } catch {}
  };

  const fetchResult = async (force = false) => {
    if (!force) {
      const hit = loadCache();
      if (hit) { setCached(hit); setResult(hit.data); setStatus("done"); return; }
    }
    setStatus("loading");
    // Simulated delay — replace with: const res = await fetch("/api/assist", { method: "POST", body: JSON.stringify({ task, profile }) })
    await new Promise(r => setTimeout(r, 900));
    const mock = getMockResult(task);
    saveCache(mock);
    setResult(mock);
    setStatus("done");
    setCached({ data: mock, ts: Date.now() });
  };

  useEffect(() => { fetchResult(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cacheAgeHours = cached ? Math.floor((Date.now() - cached.ts) / (1000 * 60 * 60)) : null;
  const savedProvider = providerHistory[task.id];

  return (
    <Sheet onClose={onClose} title={ASSIST_LABELS[task.assistType] || "Help ✦"}>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>{task.label}</div>

      {cacheAgeHours !== null && status === "done" && (
        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1.5px solid #F0E8E0", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.muted }}>{cacheAgeHours < 1 ? "just fetched" : `fetched ${cacheAgeHours}h ago`}</div>
          <button className="pb" onClick={() => fetchResult(true)} style={{ fontSize: 12, background: C.light, color: C.ink, border: "none", borderRadius: 8, padding: "4px 10px", fontWeight: 600 }}>refresh</button>
        </div>
      )}

      {status === "loading" && (
        <div>
          <div className="mf" style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>Mitzy is looking this up...</div>
          {[80, 64, 80].map((h, i) => <div key={i} className="sh" style={{ height: h, borderRadius: 12, marginBottom: 10 }} />)}
        </div>
      )}

      {status === "done" && (() => {
        if (task.assistType === "providers" && result) {
          const providers = parseProviders(result);
          if (providers?.length > 0) {
            return (
              <>
                {savedProvider && (
                  <div style={{ background: `${C.mint}20`, border: `1.5px solid ${C.mint}`, borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
                    <div className="mf" style={{ fontSize: 13, color: C.mint, marginBottom: 4 }}>last time you used</div>
                    <div style={{ fontWeight: 600, color: C.ink }}>{savedProvider.name}</div>
                    {savedProvider.notes && <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontStyle: "italic" }}>{savedProvider.notes}</div>}
                  </div>
                )}
                {providers.map((p, i) => (
                  <div key={i} style={{ background: C.white, border: "1.5px solid #F0E8E0", borderRadius: 16, padding: "14px 16px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: C.orange, fontWeight: 600 }}>★ {p.rating}</div>
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>{p.blurb}</div>
                    {p.priceRange && <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>💰 {p.priceRange}</div>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href={`tel:${p.phone}`} style={{ padding: "7px 14px", background: C.coral, color: C.white, borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>📞 call</a>
                      {p.hasOnlineBooking && <a href={p.bookingUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", background: C.sky, color: C.white, borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>book online</a>}
                      <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", background: C.light, color: C.ink, borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>website</a>
                      <button className="pb" onClick={() => onSaveProvider(task.id, p)} style={{ padding: "7px 14px", background: `${C.mint}20`, color: C.mint, border: `1.5px solid ${C.mint}`, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>save this one</button>
                    </div>
                  </div>
                ))}
              </>
            );
          }
        }
        return <div style={{ fontSize: 14, lineHeight: 1.8, color: C.ink, whiteSpace: "pre-wrap" }}>{result}</div>;
      })()}
    </Sheet>
  );
}
