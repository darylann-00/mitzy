import { useState, useEffect, useRef } from "react";
import { MonthCalendar } from "./MonthCalendar";

const CalSVG = ({ color = '#1A5C3A', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3.5" width="14" height="12" rx="2.5" stroke={color} strokeWidth="1.6" />
    <line x1="2" y1="7.5" x2="16" y2="7.5" stroke={color} strokeWidth="1.6" />
    <line x1="6" y1="2" x2="6" y2="5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export function DateField({ value, onChange, min, max }) {
  const [showCal, setShowCal] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!showCal) return;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowCal(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showCal]);

  return (
    <div ref={wrapRef}>
      <style>{`.mitzy-date-no-picker::-webkit-calendar-picker-indicator{opacity:0;width:0;padding:0;margin:0}`}</style>
      <div style={{
        display: 'flex', alignItems: 'stretch',
        border: '1.5px solid #EAE4DA', borderRadius: 10,
        background: '#FDFAF2', overflow: 'hidden',
      }}>
        <input
          type="date"
          className="mitzy-date-no-picker"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          min={min}
          max={max}
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            padding: '10px 12px', fontSize: 14,
            fontFamily: 'DM Sans, sans-serif',
            color: value ? '#1C2B22' : '#9E9689',
          }}
        />
        <button
          type="button"
          data-testid="date-field-toggle"
          onClick={() => setShowCal(s => !s)}
          style={{
            padding: '0 12px', background: 'none', border: 'none',
            borderLeft: '1.5px solid #EAE4DA', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <CalSVG color={showCal ? '#1A5C3A' : '#4A6256'} size={16} />
        </button>
      </div>
      {showCal && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 2px' }}>
          <MonthCalendar
            value={value || ''}
            onChange={v => { onChange(v); setShowCal(false); }}
            min={min}
            max={max}
          />
        </div>
      )}
    </div>
  );
}
