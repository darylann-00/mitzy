import { useState } from "react";
import { C } from "../data/constants";
import { MonthCalendar } from "./MonthCalendar";
import { getCalendarToken } from "../lib/googleCalendar";
import { useCalendarContext } from "../contexts/CalendarContext";

// ── Calendar icon tile ────────────────────────────────────────────────────────
function CalendarTile() {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: C.brand,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="14" rx="3"
          fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
        <line x1="2"    y1="8"  x2="18"   y2="8"  stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
        <line x1="6.5"  y1="3"  x2="6.5"  y2="8"  stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
        <line x1="13.5" y1="3"  x2="13.5" y2="8"  stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
        <rect x="5.5" y="11" width="3" height="3" rx="1" fill="rgba(255,255,255,0.9)"/>
        <rect x="11"  y="11" width="3" height="3" rx="1" fill="rgba(255,255,255,0.5)"/>
      </svg>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SchedulePanel({ task, onSchedule, onClose }) {
  const today = new Date();
  const pad   = (n) => String(n).padStart(2, '0');
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const { accessToken, setAccessToken } = useCalendarContext();
  const [date,   setDate]   = useState(todayIso);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"

  const handleSchedule = async () => {
    if (!date) return;
    setStatus("loading");
    try {
      // Reuse the session-wide token from startup if we have it. Otherwise try
      // silent first (returns instantly if user already consented this session
      // on another device), then fall back to the consent popup.
      let token = accessToken;
      if (!token) {
        try { token = await getCalendarToken({ silent: true }); }
        catch { token = await getCalendarToken({ silent: false }); }
        setAccessToken(token);
      }

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskLabel: task.label,
          taskNote:  task.note || null,
          date,
          accessToken: token,
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
    /* ── Backdrop ── */
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,26,46,0.6)',
        zIndex: 500,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Sheet ── */}
      <div
        className="sUp"
        style={{
          background: C.bg,
          width: '100%', maxWidth: 360,
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 32, height: 4, borderRadius: 999, background: C.cardBorder }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.cardBorder}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarTile />
            <div>
              <div style={{
                fontFamily: "'Righteous', 'Trebuchet MS', cursive",
                fontSize: 19, color: C.ink, lineHeight: 1.1,
              }}>
                Schedule it
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
                {task.label}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: C.cardBorder, border: 'none', borderRadius: 8,
              width: 28, height: 28, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="11" y1="1" x2="1" y2="11" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '18px 20px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          {/* Calendar */}
          <MonthCalendar
            value={date}
            onChange={setDate}
            min={todayIso}
          />

          {/* Hint */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: C.muted, lineHeight: 1.5,
            alignSelf: 'stretch',
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="6.5" cy="6.5" r="5.5" stroke={C.muted} strokeWidth="1.2"/>
              <line x1="6.5" y1="4.5" x2="6.5" y2="7.5" stroke={C.muted} strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="6.5" cy="9" r="0.65" fill={C.muted}/>
            </svg>
            A 60-min reminder will be added automatically.
          </div>

          {/* Status messages */}
          {status === 'loading' && (
            <div style={{ fontFamily: "'Righteous', cursive", fontSize: 14, color: C.muted, alignSelf: 'stretch' }}>
              Adding to calendar…
            </div>
          )}
          {status === 'success' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: C.brandLight, borderRadius: 10, padding: '10px 14px',
              fontSize: 14, fontWeight: 600, color: C.brand, alignSelf: 'stretch',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <polyline points="3,8 7,12 13,4" stroke={C.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Done! Check your calendar.
            </div>
          )}
          {status === 'error' && (
            <div style={{
              background: '#FDE8E8', borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: C.red, alignSelf: 'stretch',
            }}>
              Couldn't connect to Google Calendar. Try again.
            </div>
          )}

          {/* CTA */}
          {!status && (
            <button
              className="pb"
              onClick={handleSchedule}
              disabled={!date}
              style={{
                width: '100%', padding: 14,
                borderRadius: 13, border: 'none',
                background: date ? C.brand : C.cardBorder,
                color: date ? C.brandLight : C.muted,
                fontSize: 14, fontWeight: 700,
                fontFamily: 'DM Sans, sans-serif',
                cursor: date ? 'pointer' : 'default',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              Add to calendar →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
