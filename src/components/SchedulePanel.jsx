import { useState, useRef } from "react";
import { C } from "../data/constants";
import { Sheet } from "./Sheet";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGIS() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export function SchedulePanel({ task, onSchedule, onClose }) {
  const [date,   setDate]   = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const tokenClientRef = useRef(null);

  const handleSchedule = async () => {
    if (!date) return;
    setStatus("loading");
    try {
      await loadGIS();

      const accessToken = await new Promise((resolve, reject) => {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar.events',
          callback: (resp) => {
            if (resp.error) { reject(new Error(resp.error)); return; }
            resolve(resp.access_token);
          },
        });
        // prompt: '' = silent if already consented, consent dialog if not
        tokenClientRef.current.requestAccessToken({ prompt: '' });
      });

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskLabel: task.label,
          taskNote:  task.note || null,
          date,
          accessToken,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

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
