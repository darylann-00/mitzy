import { useState, useEffect } from "react";
import { C } from "../data/constants";
import { Sheet } from "./Sheet";
import { saveS, ASSIST_CACHE_PREFIX, ASSIST_CACHE_TTL } from "../utils/storage";
import { buildAssistPrompt } from "../utils/assistPrompt";

const ASSIST_LABELS = {
  providers: "I found these for you ✦",
  script:    "Ready to send ✦",
  deadline:  "Dates + links ✦",
  guidance:  "How to handle this ✦",
};

function parseProviders(text) {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return null;
}

export function AssistPanel({ task, profile, providerHistory, onSaveProvider, onClose }) {
  const [status, setStatus] = useState("idle");
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
    try {
      const prompt = buildAssistPrompt(task, profile);
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const { text } = await res.json();
      saveCache(text);
      setResult(text);
      setStatus("done");
      setCached({ data: text, ts: Date.now() });
    } catch {
      setStatus("error");
    }
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

      {status === "error" && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>Something went wrong. Try again?</div>
          <button className="pb" onClick={() => fetchResult(true)} style={{ fontSize: 13, background: C.coral, color: C.white, border: "none", borderRadius: 10, padding: "8px 20px", fontWeight: 600 }}>retry</button>
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
