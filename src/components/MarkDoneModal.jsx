import { useState } from "react";
import { C } from "../data/constants";

export function MarkDoneModal({ task, onDone, onClose }) {
  const [dateStr, setDateStr] = useState("");

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pIn" style={{ background: C.white, maxWidth: 380, width: "100%", borderRadius: 24, padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div className="mf" style={{ fontSize: 24, color: C.mint, marginBottom: 6 }}>Nice work! ✓</div>
        <div style={{ fontSize: 15, color: C.ink, marginBottom: 20, lineHeight: 1.5 }}>{task.label}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, fontWeight: 600 }}>
          When? <span style={{ fontWeight: 400 }}>(optional)</span>
        </div>
        <input
          type="date"
          max={new Date().toISOString().split("T")[0]}
          value={dateStr}
          onChange={e => setDateStr(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button className="pb" onClick={onClose} style={{ flex: 1, padding: "12px", background: C.light, color: C.muted, border: "none", borderRadius: 12, fontWeight: 600, fontSize: 15 }}>
            cancel
          </button>
          <button
            className="pb"
            onClick={() => onDone(task.id, dateStr || null)}
            style={{ flex: 2, padding: "12px", background: C.mint, color: C.white, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, boxShadow: "0 4px 12px rgba(107,203,119,0.35)" }}
          >
            {dateStr ? "save date" : "done today!"}
          </button>
        </div>
      </div>
    </div>
  );
}
