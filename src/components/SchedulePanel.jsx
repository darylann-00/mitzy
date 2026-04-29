import { useState, useRef } from "react";
import { C } from "../data/constants";
import { Sheet } from "./Sheet";
import { MonthCalendar } from "./MonthCalendar";

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
  const today = new Date().toISOString().split('T')[0];
  const [date,   setDate]   = useState(today);
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
      setTimeout(() => { onSchedule(date); onClose(); }, 1200);
    } catch {
      setStatus("error");
    }
  };

  return (
    <Sheet onClose={onClose} title="Schedule it 📅">
      <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ fontSize: 14, color: C.ink, fontWeight: 600, marginBottom: 4 }}>
          {task.label}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
          Mitzy adds this to your Google Calendar with a reminder.
        </div>

        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8 }}>
          Pick a date
        </div>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <MonthCalendar
            value={date}
            onChange={setDate}
            min={today}
          />
        </div>

        {status === "loading" && (
          <div style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 12 }}>
            Adding to calendar…
          </div>
        )}
        {status === "success" && (
          <div style={{ fontSize: 14, color: C.green, textAlign: 'center', fontWeight: 600, marginBottom: 12 }}>
            Done! Check your calendar ✓
          </div>
        )}
        {status === "error" && (
          <div style={{ fontSize: 13, color: C.red, textAlign: 'center', marginBottom: 12 }}>
            Calendar connection issue — try again
          </div>
        )}

        {!status && (
          <button
            onClick={handleSchedule}
            disabled={!date}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              background: date ? C.brand : C.surface,
              color: date ? C.brandLight : C.muted,
              border: 'none',
              borderRadius: 14,
              cursor: date ? 'pointer' : 'default',
              boxShadow: date ? '0 4px 12px rgba(26,92,58,0.25)' : 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            add to calendar →
          </button>
        )}
      </div>
    </Sheet>
  );
}
