import { useState, useEffect, useRef } from "react";
import { MonthCalendar } from "./MonthCalendar";
import { DateField } from "./DateField";
import { getCalendarToken } from "../lib/googleCalendar";
import { useCalendarContext } from "../contexts/CalendarContext";
import { useTaskContext } from "../contexts/TaskContext";

const CalSVG = ({ color = '#1A5C3A', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3.5" width="14" height="12" rx="2.5" stroke={color} strokeWidth="1.6" />
    <line x1="2" y1="7.5" x2="16" y2="7.5" stroke={color} strokeWidth="1.6" />
    <line x1="6" y1="2" x2="6" y2="5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const GCal = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect width="20" height="20" rx="4" fill="#fff" stroke="#DADCE0" />
    <rect x="4" y="4" width="12" height="12" rx="1.5" stroke="#4285F4" strokeWidth="1.4" />
    <line x1="4" y1="8" x2="16" y2="8" stroke="#4285F4" strokeWidth="1.4" />
    <line x1="8" y1="4" x2="8" y2="7.5" stroke="#EA4335" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="12" y1="4" x2="12" y2="7.5" stroke="#EA4335" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="10" cy="12" r="1.2" fill="#34A853" />
  </svg>
);

const Back = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <polyline points="9,3 5,7 9,11" stroke="#4A6256" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Chev = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <polyline points="4,2 9,6 4,10" stroke="#C0B9AE" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const surf = { background: '#fff', borderRadius: 14, border: '1px solid #EAE4DA', overflow: 'hidden', marginBottom: 8 };
const subHdr = { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px 10px', borderBottom: '1px solid #EAE4DA' };
const formBody = { padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 };
const fldGrp = { display: 'flex', flexDirection: 'column', gap: 4 };
const fldLbl = { fontSize: 11, color: '#4A6256', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' };
const inp = { border: '1.5px solid #EAE4DA', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'DM Sans, sans-serif', color: '#1C2B22', background: '#FDFAF2', outline: 'none' };
const confBtn = (active, bg = '#1A5C3A') => ({ padding: '12px', borderRadius: 12, border: 'none', background: active ? bg : '#C8C2B6', color: '#E8F5EE', fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', cursor: active ? 'pointer' : 'default', marginTop: 2 });
const iconBox = (bg, w = 32) => ({ width: w, height: w, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 });

const fmtDate = iso => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const fmtMatchDate = iso => {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const hasTime = iso.includes('T') && !iso.endsWith('T00:00:00Z') && !iso.endsWith('T00:00:00');
  if (!hasTime) return dateStr;
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
};

const matchToIsoDate = m => m.eventDate.slice(0, 10);


function parseTime(value) {
  if (!value) return { h12: '', m: '', period: 'AM' };
  const [hh, mm] = value.split(':').map(s => parseInt(s, 10));
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return { h12: String(h12), m: String(mm).padStart(2, '0'), period };
}

function TimeFieldNative({ value, onChange }) {
  return (
    <input
      type="time"
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      style={{ ...inp, width: '100%' }}
    />
  );
}

function TimeFieldDesktop({ value, onChange }) {
  const initial = parseTime(value);
  const [h12, setH12] = useState(initial.h12);
  const [m, setM] = useState(initial.m);
  const [period, setPeriod] = useState(initial.period);

  useEffect(() => {
    if (!value) { setH12(''); setM(''); setPeriod('AM'); }
  }, [value]);

  useEffect(() => {
    const hNum = parseInt(h12, 10);
    const mNum = parseInt(m, 10);
    if (!h12 || m === '' || isNaN(hNum) || isNaN(mNum) || hNum < 1 || hNum > 12 || mNum < 0 || mNum > 59) {
      onChange(null);
      return;
    }
    const h24 = (hNum % 12) + (period === 'PM' ? 12 : 0);
    onChange(`${String(h24).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`);
  }, [h12, m, period]);

  const numCell = {
    width: 38, padding: '10px 4px', fontSize: 15, fontFamily: 'DM Sans, sans-serif',
    color: '#1C2B22', textAlign: 'center', border: 'none', background: 'transparent', outline: 'none',
  };
  const periodBtn = active => ({
    padding: '8px 14px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
    border: 'none', cursor: 'pointer',
    background: active ? '#1A5C3A' : 'transparent',
    color: active ? '#E8F5EE' : '#4A6256',
  });
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #EAE4DA', borderRadius: 10, background: '#FDFAF2', padding: '0 6px' }}>
        <input type="text" inputMode="numeric" maxLength={2} placeholder="hh" value={h12}
          onChange={e => setH12(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => { const n = parseInt(h12, 10); if (n >= 1 && n <= 12) setH12(String(n)); }}
          style={numCell}
        />
        <span style={{ color: '#4A6256', fontWeight: 700, fontSize: 16 }}>:</span>
        <input type="text" inputMode="numeric" maxLength={2} placeholder="mm" value={m}
          onChange={e => setM(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => { const n = parseInt(m, 10); if (n >= 0 && n <= 59) setM(String(n).padStart(2, '0')); }}
          style={numCell}
        />
      </div>
      <div style={{ display: 'flex', borderRadius: 10, background: '#FDFAF2', border: '1.5px solid #EAE4DA', overflow: 'hidden' }}>
        <button type="button" onClick={() => setPeriod('AM')} style={periodBtn(period === 'AM')}>AM</button>
        <button type="button" onClick={() => setPeriod('PM')} style={periodBtn(period === 'PM')}>PM</button>
      </div>
    </div>
  );
}

function TimeField({ value, onChange }) {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia?.('(pointer: coarse)').matches ?? false);
  }, []);
  return isTouch
    ? <TimeFieldNative value={value} onChange={onChange} />
    : <TimeFieldDesktop value={value} onChange={onChange} />;
}

export function ScheduleSurface({ task }) {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const { pendingCalendarMatches, dismissMatch, accessToken, setAccessToken, calGranted, connectCalendar } = useCalendarContext();
  const { markScheduled, taskState } = useTaskContext();

  const [mode, setMode] = useState('idle');
  const [date, setDate] = useState('');
  const [time, setTime] = useState(null);
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState(null);

  const matchesForTask = pendingCalendarMatches.filter(m => m.taskId === task.id);
  const scheduledDate = taskState[task.id]?.scheduledDate;

  useEffect(() => {
    if (scheduledDate) {
      setMode('confirmed');
    } else {
      setMode('idle');
    }
  }, [scheduledDate]);

  const reset = () => {
    setMode('idle');
    setDate('');
    setTitle('');
    setProvider('');
    setTime(null);
  };

  const handleSilentSchedule = async () => {
    if (!date) return;
    setStatus('loading');
    try {
      let token = accessToken;
      if (!token) {
        try {
          token = await getCalendarToken({ silent: true });
        } catch {
          token = await getCalendarToken({ silent: false });
        }
        setAccessToken(token);
      }

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskLabel: title.trim() || task.label,
          taskNote: provider || task.note || null,
          date,
          ...(time ? { time, timeZone } : {}),
          accessToken: token,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setStatus('success');
      await markScheduled(task.id, date);
      dismissMatch(task.id);
    } catch {
      setStatus('error');
    }
  };

  if (mode === 'confirmed' && scheduledDate) {
    return (
      <div style={surf}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px' }}>
          <div style={iconBox('#E8F5EE')}>
            <CalSVG color="#1A5C3A" size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1C2B22' }}>{fmtDate(scheduledDate)}</div>
            <div style={{ fontSize: 12, color: '#4A6256', marginTop: 2 }}>Saved to your calendar</div>
          </div>
          <button
            onClick={() => setMode('manual')}
            style={{ fontSize: 12, color: '#1A5C3A', fontWeight: 600, background: '#E8F5EE', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'idle') {
    const top = matchesForTask[0];
    const hasMatches = matchesForTask.length > 0;

    if (!hasMatches) {
      return (
        <div style={surf}>
          <div style={{ padding: '13px 14px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={iconBox('#F0EDE4')}>
              <CalSVG color="#4A6256" size={17} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1C2B22' }}>Schedule this</div>
              <div style={{ fontSize: 12, color: '#4A6256', marginTop: 1 }}>
                {calGranted ? 'No matching events found on your calendar' : 'Connect Google Calendar to detect existing appointments'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '8px 14px 13px' }}>
            <button
              onClick={() => { setMode('gcal'); setTitle(task.label); }}
              style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: '1px solid #EAE4DA', background: '#F0F4FF', fontSize: 12, fontWeight: 500, color: '#1C2B22', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <GCal />
              <span>Create event</span>
            </button>
            {calGranted ? (
              <button
                onClick={() => setMode('more')}
                style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: '1px solid #EAE4DA', background: '#F8F5EE', fontSize: 12, fontWeight: 500, color: '#1C2B22', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              >
                <CalSVG color="#4A6256" size={20} />
                <span>Browse cal</span>
              </button>
            ) : (
              <button
                onClick={connectCalendar}
                style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: '1px solid #C5D5F5', background: '#EEF2FF', fontSize: 12, fontWeight: 500, color: '#4285F4', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              >
                <GCal />
                <span>Connect</span>
              </button>
            )}
            <button
              onClick={() => setMode('manual')}
              style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: '1px solid #EAE4DA', background: '#F8F5EE', fontSize: 12, fontWeight: 500, color: '#1C2B22', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M12 3l3 3L6 15H3v-3L12 3z" stroke="#4A6256" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Manual date</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={surf}>
        <div style={{ padding: '11px 14px 0' }}>
          <div style={{ fontSize: 11, color: '#4A6256', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GCal />
            <span>Found on your calendar</span>
          </div>
          <button
            onClick={async () => {
              await markScheduled(task.id, matchToIsoDate(top));
              dismissMatch(task.id);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: '#F0F7F4', border: '1.5px solid #C8E0D4', borderRadius: 12, padding: '11px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginBottom: 7 }}
          >
            <div style={iconBox('#E8F5EE', 30)}>
              <CalSVG color="#1A5C3A" size={15} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1C2B22' }}>{top.eventTitle}</div>
              <div style={{ fontSize: 12, color: '#4A6256', marginTop: 1 }}>{fmtMatchDate(top.eventDate)}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1A5C3A', background: '#E8F5EE', borderRadius: 8, padding: '4px 9px', whiteSpace: 'nowrap' }}>This is it</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', marginBottom: 7 }}>
          <div style={{ flex: 1, height: 1, background: '#EAE4DA' }} />
          <span style={{ fontSize: 11, color: '#8BB9A2' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#EAE4DA' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 14px 13px' }}>
          <button
            onClick={() => setMode('more')}
            style={{ flex: 1, padding: '9px 10px', borderRadius: 10, border: '1px solid #EAE4DA', background: '#fff', fontSize: 12, fontWeight: 500, color: '#1C2B22', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
          >
            Other events
          </button>
          <button
            onClick={() => { setMode('gcal'); setDate(''); setTitle(task.label); setProvider(''); setTime(null); }}
            style={{ flex: 1, padding: '9px 10px', borderRadius: 10, border: '1px solid #EAE4DA', background: '#fff', fontSize: 12, fontWeight: 500, color: '#1C2B22', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
          >
            Create new
          </button>
          <button
            onClick={() => { setMode('manual'); setDate(''); setProvider(''); setTime(null); }}
            style={{ flex: 1, padding: '9px 10px', borderRadius: 10, border: '1px solid #EAE4DA', background: '#fff', fontSize: 12, fontWeight: 500, color: '#1C2B22', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
          >
            Manual date
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'more') {
    return (
      <div style={surf}>
        <div style={subHdr}>
          <button
            onClick={() => setMode('idle')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px 6px 2px 0' }}
          >
            <Back />
          </button>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1C2B22' }}>Your calendar events</span>
          <button
            onClick={reset}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#4A6256', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {matchesForTask.map(s => (
            <button
              key={s.eventId}
              onClick={async () => {
                await markScheduled(task.id, matchToIsoDate(s));
                dismissMatch(task.id);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F8F5EE', borderRadius: 10, border: '1px solid #EAE4DA', width: '100%', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >
              <div style={iconBox('#E8F5EE', 28)}>
                <CalSVG color="#1A5C3A" size={14} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1C2B22' }}>{s.eventTitle}</div>
                <div style={{ fontSize: 11, color: '#4A6256', marginTop: 2 }}>{fmtMatchDate(s.eventDate)} · Calendar</div>
              </div>
              <Chev />
            </button>
          ))}
          <button
            onClick={() => setMode('manual')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', border: '1.5px dashed #C8C2B6', borderRadius: 10, background: 'transparent', fontSize: 13, color: '#4A6256', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}
          >
            + Set a different date manually
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'gcal') {
    return (
      <div style={surf}>
        <div style={subHdr}>
          <button
            onClick={() => { setMode('idle'); setDate(''); setTitle(''); setProvider(''); setTime(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px 6px 2px 0' }}
          >
            <Back />
          </button>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1C2B22' }}>Create calendar event</span>
          <button
            onClick={reset}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#4A6256', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div style={formBody}>
          <div style={fldGrp}>
            <label style={fldLbl}>Title</label>
            <input
              type="text"
              style={inp}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div style={fldGrp}>
            <label style={fldLbl}>Date</label>
            <DateField value={date} onChange={setDate} min={todayIso} />
          </div>
          <div style={fldGrp}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={fldLbl}>Time (optional)</label>
              {time && (
                <button
                  onClick={() => setTime(null)}
                  style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#4A6256', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>
            <TimeField value={time} onChange={setTime} />
          </div>
          <div style={fldGrp}>
            <label style={fldLbl}>Provider / notes</label>
            <input
              type="text"
              style={inp}
              placeholder="e.g. City Dental, Dr. Chen"
              value={provider}
              onChange={e => setProvider(e.target.value)}
            />
          </div>
          <button
            style={confBtn(!!date, '#4285F4')}
            disabled={!date || status === 'loading'}
            onClick={handleSilentSchedule}
          >
            {status === 'loading' ? 'Adding to calendar…' : 'Add to Google Calendar →'}
          </button>
          {status === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#E8F5EE', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#1A5C3A' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <polyline points="3,8 7,12 13,4" stroke="#1A5C3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Done! Check your calendar.
            </div>
          )}
          {status === 'error' && (
            <div style={{ background: '#FDE8E8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#D62828' }}>
              Couldn't connect to Google Calendar. Try again.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'manual') {
    return (
      <div style={surf}>
        <div style={subHdr}>
          <button
            onClick={() => { setMode('idle'); setDate(''); setProvider(''); setTime(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px 6px 2px 0' }}
          >
            <Back />
          </button>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1C2B22' }}>Set a date</span>
          <button
            onClick={reset}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#4A6256', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div style={formBody}>
          <div style={fldGrp}>
            <label style={fldLbl}>Date</label>
            <DateField value={date} onChange={setDate} min={todayIso} />
          </div>
          <button
            style={confBtn(!!date)}
            disabled={!date}
            onClick={async () => {
              await markScheduled(task.id, date);
              dismissMatch(task.id);
            }}
          >
            Save in Mitzy
          </button>
          <div style={{ display: 'flex', gap: 9, padding: '10px 12px', background: '#FFF8E1', border: '1px solid #F4C430', borderRadius: 10, fontSize: 12, color: '#1C2B22', lineHeight: 1.45, fontFamily: 'DM Sans, sans-serif' }}>
            <span style={{ flexShrink: 0, fontSize: 14, lineHeight: 1.2 }}>📍</span>
            <span>This only saves a date in Mitzy — it won't add anything to your Google Calendar.</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
