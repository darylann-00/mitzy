import { useState } from "react";
import { SnoozeIcon, SNOOZE_BLUE } from "./SnoozeIcon";
import { DateField } from "./DateField";

function getNextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getFirstOfNextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toISOString().slice(0, 10);
}

function getThreeMonthsOut() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: 'Next week', getDate: getNextMonday },
  { label: 'Next month', getDate: getFirstOfNextMonth },
  { label: 'In 3 months', getDate: getThreeMonthsOut },
];

export function SnoozePicker({ task, onSnooze, onClose }) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePreset = (getDate) => {
    onSnooze(task.id, getDate());
    onClose();
  };

  const handleCustomDate = (iso) => {
    if (iso) {
      onSnooze(task.id, iso);
      onClose();
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,30,20,0.55)',
        zIndex: 500,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="sUp"
        style={{
          background: '#FDFAF2',
          width: '100%',
          maxWidth: 640,
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: '#E0D8D0', borderRadius: 2, margin: '14px auto 0' }} />

        {/* Header */}
        <div style={{
          padding: '16px 20px 0',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <SnoozeIcon size={24} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 16, fontWeight: 700, color: '#1C2B22',
              fontFamily: "'Righteous', cursive",
            }}>
              Snooze this task
            </div>
            <div style={{
              fontSize: 12, color: '#4A6256',
              fontFamily: 'DM Sans, sans-serif',
              marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {task.label}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F0EDE4', border: 'none', borderRadius: 10,
              padding: '6px 12px', fontSize: 14, color: '#4A6256', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Presets */}
        <div style={{ padding: '18px 20px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PRESETS.map(({ label, getDate }) => {
            const dateStr = getDate();
            const display = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <button
                key={label}
                onClick={() => handlePreset(getDate)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px',
                  background: '#fff',
                  border: '1.5px solid #EAE4DA',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1C2B22' }}>{label}</span>
                <span style={{ fontSize: 12, color: '#4A6256' }}>{display}</span>
              </button>
            );
          })}

          {/* Pick a date toggle */}
          <button
            onClick={() => setShowDatePicker(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px',
              background: showDatePicker ? 'rgba(107,141,214,0.08)' : '#fff',
              border: `1.5px solid ${showDatePicker ? SNOOZE_BLUE : '#EAE4DA'}`,
              borderRadius: 12,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1C2B22' }}>Pick a date</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ transform: showDatePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
            >
              <polyline points="2,4 6,8 10,4" stroke="#4A6256" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showDatePicker && (
            <div style={{ padding: '4px 0 0' }}>
              <DateField
                value=""
                onChange={handleCustomDate}
                min={minDate}
              />
            </div>
          )}
        </div>

        {/* Bottom padding for safe area */}
        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}
