import { useState, useRef, useEffect } from "react";
import { C, CAT_META } from "../data/constants";
import { CategoryTile } from "./CategoryIcons";
import { Sheet } from "./Sheet";

function CatSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = CAT_META[value];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", background: C.light, border: "none",
          borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 500,
          color: C.ink,
        }}
      >
        <CategoryTile cat={value} size={26} />
        <span style={{ flex: 1, textAlign: "left" }}>{selected.label}</span>
        <span style={{ color: C.muted, fontSize: 12 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          zIndex: 100, overflow: "hidden",
        }}>
          {Object.entries(CAT_META).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => { onChange(k); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", background: k === value ? C.light : "transparent",
                border: "none", cursor: "pointer", fontSize: 15, fontWeight: 500,
                color: C.ink, textAlign: "left",
              }}
            >
              <CategoryTile cat={k} size={26} />
              <span>{v.label}</span>
              {k === value && <span style={{ marginLeft: "auto", color: C.mint }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
          <CatSelect value={cat} onChange={setCat} />
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
