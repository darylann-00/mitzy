import { useState } from "react";

export const CHIPS_GENERAL = [
  { key: 'recently',   label: 'Recently',         days: 30  },
  { key: 'few-months', label: 'A few months ago',  days: 90  },
  { key: 'over-year',  label: 'Over a year ago',   days: 400 },
  { key: 'never',      label: 'Never / not sure',  needed: true },
];

export const CHIPS_HEALTH = [
  { key: 'this-year',  label: 'This year',         days: 180 },
  { key: 'last-year',  label: 'Last year',          days: 400 },
  { key: 'two-plus',   label: '2+ years ago',       days: 800 },
  { key: 'never',      label: 'Never / not sure',   needed: true },
];

// Shared answer UI for both recurring and one-time tasks.
//
// Props:
//   task           — task object (needs .oneTime, .cat)
//   onDone(iso)    — user confirmed done; iso is an ISO date string
//   onNeeded()     — one-time task: user confirmed "not yet"
//   onSkip()       — optional; renders "Doesn't apply to me" link for recurring tasks
//   showDatePicker — show the exact date picker (default false)
//   labelStyle     — style overrides for the question label
//   chipStyle      — style overrides for each chip button
//   chipGridStyle  — style overrides for the chip container
//   dateInputStyle — style overrides for the date input
export function TaskAnswerChips({
  task,
  onDone,
  onNeeded,
  onSkip,
  onNotSure,
  showDatePicker = false,
  labelStyle,
  chipStyle,
  chipGridStyle,
  dateInputStyle,
}) {
  const [exactDate, setExactDate] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const chips = task.cat === 'health' ? CHIPS_HEALTH : CHIPS_GENERAL;

  const baseLabel = {
    fontSize: 12, fontWeight: 700, color: '#4A6256',
    marginBottom: 8, fontFamily: 'DM Sans, sans-serif',
  };
  const baseChip = {
    padding: '8px 10px', fontSize: 12, fontWeight: 700, textAlign: 'left',
    borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    border: '1.5px solid #EAE4DA', background: '#fff', color: '#1C2B22',
  };
  const baseGrid = { display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 };

  if (task.oneTime) {
    return (
      <>
        <div style={{ ...baseLabel, ...labelStyle }}>Have you done this?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...baseChip, ...chipStyle }} onClick={() => onDone(today)}>Yes</button>
          <button style={{ ...baseChip, ...chipStyle }} onClick={onNeeded}>Not yet</button>
          {onNotSure && (
            <button style={{ ...baseChip, ...chipStyle }} onClick={onNotSure}>Not sure</button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ ...baseLabel, ...labelStyle }}>When did you last do this?</div>
      <div style={{ ...baseGrid, ...chipGridStyle }}>
        {chips.map(chip => (
          <button
            key={chip.key}
            style={{ ...baseChip, ...chipStyle }}
            onClick={() => chip.needed
              ? (onNeeded && onNeeded())
              : onDone(new Date(Date.now() - chip.days * 86400000).toISOString())
            }
          >
            {chip.label}
          </button>
        ))}
      </div>
      {showDatePicker && (
        <>
          <div style={{ fontSize: 11, color: '#4A6256', marginBottom: 5, fontFamily: 'DM Sans, sans-serif' }}>
            Or pick an exact date:
          </div>
          <input
            type="date"
            max={today}
            value={exactDate}
            onChange={e => {
              setExactDate(e.target.value);
              if (e.target.value) { onDone(e.target.value); setExactDate(''); }
            }}
            style={dateInputStyle}
          />
        </>
      )}
      {onSkip && (
        <button
          onClick={onSkip}
          style={{
            background: 'none', border: 'none', fontSize: 11, color: '#B08A10',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            padding: 0, marginTop: 6, textDecoration: 'underline', opacity: 0.7,
          }}
        >
          Doesn't apply to me
        </button>
      )}
    </>
  );
}
