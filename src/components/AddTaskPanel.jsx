import { useState } from "react";
import { C, CAT_META } from "../data/constants";
import { Sheet } from "./Sheet";

export function AddTaskPanel({ onAdd, onClose }) {
  const [label,  setLabel]  = useState("");
  const [cat,    setCat]    = useState("home");
  const [freq,   setFreq]   = useState(90);
  const [stakes, setStakes] = useState("medium");
  const [err,    setErr]    = useState("");

  const FREQ_OPTIONS = [
    { label: "Every month",    days: 30  },
    { label: "Every 3 months", days: 90  },
    { label: "Every 6 months", days: 180 },
    { label: "Every year",     days: 365 },
    { label: "Every 2 years",  days: 730 },
  ];

  const STAKES_COLORS = { low: C.mint, medium: C.yellow, high: C.coral };

  const handleAdd = () => {
    if (!label.trim()) { setErr("Give it a name first"); return; }
    onAdd({
      id:           `custom-${Date.now()}`,
      cat,
      label:        label.trim(),
      intervalDays: freq,
      windowDays:   Math.round(freq * 0.2),
      stakes,
      activeMonths: null,
      requires:     [],
      assistType:   "guidance",
      note:         "Custom task.",
      isCustom:     true,
    });
    onClose();
  };

  return (
    <Sheet onClose={onClose} title="Add a task ✦">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Task name</div>
          <input type="text" placeholder="e.g. Clean washing machine" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Category</div>
          <select value={cat} onChange={e => setCat(e.target.value)}>
            {Object.entries(CAT_META).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 6 }}>How often?</div>
          <select value={freq} onChange={e => setFreq(parseInt(e.target.value))}>
            {FREQ_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8 }}>How important?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["low", "medium", "high"].map(s => (
              <button
                key={s}
                className="pb"
                onClick={() => setStakes(s)}
                style={{ flex: 1, padding: "10px", fontSize: 14, background: stakes === s ? STAKES_COLORS[s] : C.light, color: stakes === s ? C.white : C.ink, border: "none", borderRadius: 12, fontWeight: 600 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {err && <div style={{ fontSize: 13, color: C.coral }}>{err}</div>}
        <button
          className="pb"
          onClick={handleAdd}
          style={{ width: "100%", padding: "14px", fontSize: 16, background: C.coral, color: C.white, border: "none", borderRadius: 14, fontWeight: 700, boxShadow: "0 4px 12px rgba(255,92,92,0.3)" }}
        >
          add to my list →
        </button>
      </div>
    </Sheet>
  );
}
