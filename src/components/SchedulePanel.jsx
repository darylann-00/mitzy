import { useState } from "react";
import { C } from "../data/constants";
import { Sheet } from "./Sheet";

// NOTE: The Anthropic API must never be called directly from the frontend.
// This component currently mocks the calendar integration.
// Wire real calls through a Vercel Edge Function proxy (/api/schedule).

export function SchedulePanel({ task, onSchedule, onClose }) {
  const [date,   setDate]   = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"

  const handleSchedule = async () => {
    if (!date) return;
    setStatus("loading");
    try {
      // TODO: replace with POST /api/schedule once Edge Function is deployed
      await new Promise(r => setTimeout(r, 600));
      setStatus("success");
      setTimeout(() => { onSchedule(date); onClose(); }, 1000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <Sheet onClose={onClose} title="Schedule it 📅">
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>{task.label}</div>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ marginBottom: 14 }} />
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
        Mitzy adds this to your Google Calendar with a reminder.
      </div>
      {status === "loading" && <div className="mf" style={{ fontSize: 14, color: C.muted }}>Adding to calendar...</div>}
      {status === "success" && <div className="mf" style={{ fontSize: 14, color: C.mint }}>Done! Check your calendar ✓</div>}
      {status === "error"   && <div className="mf" style={{ fontSize: 14, color: C.coral }}>Calendar connection issue</div>}
      {!status && (
        <button
          className="pb"
          onClick={handleSchedule}
          disabled={!date}
          style={{ width: "100%", padding: "14px", fontSize: 16, background: date ? C.coral : "#E0D8D0", color: C.white, border: "none", borderRadius: 14, fontWeight: 700, boxShadow: date ? "0 4px 12px rgba(255,92,92,0.3)" : "none" }}
        >
          add to calendar →
        </button>
      )}
    </Sheet>
  );
}
