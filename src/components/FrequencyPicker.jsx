import { useState, useRef } from "react";

export function formatIntervalDays(days) {
  if (!days) return null;
  if (days < 14) return `every ${days} day${days !== 1 ? 's' : ''}`;
  if (days < 60) return `every ${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`;
  if (days < 365) return `every ${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`;
  const years = Math.round(days / 365);
  return `every ${years} year${years !== 1 ? 's' : ''}`;
}

const FREQ_CANDIDATES = [3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365, 548, 730, 1095, 1460, 1825, 2555, 3650];

function getFrequencyPresets(defaultDays) {
  if (!defaultDays) return [7, 30, 90, 365];
  const below = FREQ_CANDIDATES.filter(d => d < defaultDays).slice(-4);
  return [...new Set([...below, defaultDays])];
}

export function FrequencyPicker({ value, defaultDays, onChange, oneTime, onToggleOneTime, presets }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customNum, setCustomNum] = useState('');
  const [customUnit, setCustomUnit] = useState('months');
  const customNumRef = useRef(null);

  const baseChips = presets || getFrequencyPresets(defaultDays);
  const chips = value && !baseChips.includes(value)
    ? [...baseChips, value].sort((a, b) => a - b)
    : baseChips;

  return (
    <div>
      {onToggleOneTime && (
        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
          <button
            onClick={() => onToggleOneTime(false)}
            style={chipStyle(!oneTime)}
          >Recurring</button>
          <button
            onClick={() => onToggleOneTime(true)}
            style={chipStyle(oneTime)}
          >One time</button>
        </div>
      )}

      {!oneTime && (
        <>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
            {chips.map(days => {
              const isCurrent = days === value && !showCustom;
              const isDefault = days === defaultDays;
              return (
                <button
                  key={days}
                  onClick={() => { setShowCustom(false); onChange(days); }}
                  style={chipStyle(isCurrent)}
                >
                  {formatIntervalDays(days)}{isDefault ? ' ✓' : ''}
                </button>
              );
            })}
            <button
              onClick={() => {
                setShowCustom(v => !v);
                setTimeout(() => customNumRef.current?.focus(), 50);
              }}
              style={chipStyle(showCustom)}
            >Custom</button>
          </div>

          {showCustom && (
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>Every</span>
              <input
                ref={customNumRef}
                type="number"
                min="1"
                value={customNum}
                onChange={e => setCustomNum(e.target.value)}
                placeholder="3"
                style={{
                  width:64, padding:'6px 8px', fontSize:13, fontFamily:'DM Sans, sans-serif',
                  border:'1.5px solid #1A5C3A', borderRadius:8, background:'#fff',
                  color:'#1C2B22', textAlign:'center',
                }}
              />
              <select
                value={customUnit}
                onChange={e => setCustomUnit(e.target.value)}
                style={{
                  padding:'6px 8px', fontSize:13, fontFamily:'DM Sans, sans-serif',
                  border:'1.5px solid #EAE4DA', borderRadius:8, background:'#fff',
                  color:'#1C2B22',
                }}
              >
                <option value="days">days</option>
                <option value="months">months</option>
                <option value="years">years</option>
              </select>
              <button
                disabled={!customNum || parseInt(customNum, 10) < 1}
                onClick={() => {
                  const n = parseInt(customNum, 10);
                  if (!n || n < 1) return;
                  const mult = { days: 1, months: 30, years: 365 }[customUnit];
                  onChange(n * mult);
                  setShowCustom(false);
                  setCustomNum('');
                }}
                style={{
                  padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:700,
                  fontFamily:'DM Sans, sans-serif', border:'none',
                  background: (!customNum || parseInt(customNum, 10) < 1) ? '#C8D9D1' : '#1A5C3A',
                  color: (!customNum || parseInt(customNum, 10) < 1) ? '#7A9B8E' : '#E8F5EE',
                  cursor: (!customNum || parseInt(customNum, 10) < 1) ? 'default' : 'pointer',
                }}
              >Set</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function chipStyle(active) {
  return {
    padding:'5px 11px', borderRadius:20, fontSize:11, fontWeight:700,
    fontFamily:'DM Sans, sans-serif', cursor:'pointer', border:'1.5px solid',
    borderColor: active ? '#1A5C3A' : '#EAE4DA',
    background:  active ? '#1A5C3A' : '#fff',
    color:       active ? '#E8F5EE' : '#1C2B22',
  };
}
