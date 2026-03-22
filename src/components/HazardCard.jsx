import { C } from "../data/constants";

const HAZARD_LABELS = {
  earthquake: "🌍 Earthquake",
  wildfire:   "🔥 Wildfire",
  hurricane:  "🌀 Hurricane",
  tornado:    "🌪 Tornado",
  winter:     "❄️ Winter Storm",
  flood:      "🌊 Flooding",
};

export function HazardCard({ hazards, onAccept, onDismiss }) {
  return (
    <div style={{ background: C.white, borderRadius: 20, padding: "16px 18px", marginBottom: 12, border: `1.5px solid ${C.coral}`, boxShadow: `0 4px 16px ${C.coral}30` }}>
      <div className="mf" style={{ background: C.coral, color: C.white, padding: "3px 10px", borderRadius: 20, fontSize: 12, marginBottom: 10, display: "inline-block" }}>
        mitzy checked your area ⚡
      </div>
      <div style={{ fontSize: 15, color: C.ink, fontWeight: 600, marginBottom: 10 }}>Your zip shows risk for:</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {hazards.map(h => (
          <div key={h} style={{ fontSize: 13, color: C.coral, background: `${C.coral}15`, padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>
            {HAZARD_LABELS[h] || h}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>
        I've put together prep tasks for each. Want me to add them to your list?
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="pb" onClick={onAccept}  style={{ flex: 2, padding: "11px", fontSize: 14, background: C.coral, color: C.white, border: "none", borderRadius: 12, fontWeight: 700 }}>yes, add prep tasks</button>
        <button className="pb" onClick={onDismiss} style={{ flex: 1, padding: "11px", fontSize: 14, background: C.light, color: C.muted, border: "none", borderRadius: 12 }}>not now</button>
      </div>
    </div>
  );
}
