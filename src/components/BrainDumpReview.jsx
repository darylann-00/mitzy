import { useState } from "react";
import { C, CAT_META } from "../data/constants";
import { TaskConfirmCard } from "./TaskConfirmCard";
import { formatIntervalDays } from "./FrequencyPicker";

export function BrainDumpReview({ tasks: initialTasks, onSave, onCancel, saving, saveError }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [checked, setChecked] = useState(() => initialTasks.map(() => true));
  const [editingIdx, setEditingIdx] = useState(null);

  const checkedCount = checked.filter(Boolean).length;

  const toggleCheck = (idx) => {
    setChecked(prev => prev.map((v, i) => i === idx ? !v : v));
  };

  const handleTaskChange = (idx, delta) => {
    if (delta.patch) {
      setTasks(prev => prev.map((t, i) => i === idx ? { ...t, ...delta.patch } : t));
    }
  };

  const handleDetailSave = (task) => {
    setTasks(prev => prev.map((t, i) => i === editingIdx ? task : t));
    setEditingIdx(null);
  };

  const handleSaveAll = () => {
    const selected = tasks.filter((_, i) => checked[i]);
    onSave(selected);
  };

  if (editingIdx !== null) {
    const task = tasks[editingIdx];
    return (
      <div>
        <button
          onClick={() => setEditingIdx(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: C.brand,
            fontFamily: 'DM Sans, sans-serif', marginBottom: 12, padding: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke={C.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to list
        </button>
        <TaskConfirmCard
          task={task}
          onChange={(delta) => handleTaskChange(editingIdx, delta)}
          onSave={handleDetailSave}
          onCancel={() => setEditingIdx(null)}
          regenerating={false}
          regenError={null}
          saveLabel="Save changes"
          cancelLabel="Back"
        />
      </div>
    );
  }

  return (
    <div>
      {tasks.map((task, idx) => {
        const meta = CAT_META[task.cat] || CAT_META.home;
        const isChecked = checked[idx];
        const freqText = task.oneTime
          ? 'One time'
          : (formatIntervalDays(task.intervalDays) || 'Not set');

        return (
          <div
            key={task.id || idx}
            style={{
              background: '#fff', borderRadius: 13,
              border: '1px solid #EAE4DA', padding: '12px 14px',
              marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10,
              opacity: isChecked ? 1 : 0.5, transition: 'opacity 0.15s',
            }}
          >
            <button
              onClick={() => toggleCheck(idx)}
              aria-label={isChecked ? 'Uncheck task' : 'Check task'}
              style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                border: `1.5px solid ${isChecked ? C.brand : '#EAE4DA'}`,
                background: isChecked ? C.brand : '#fff',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            >
              {isChecked && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="#E8F5EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setEditingIdx(idx)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, textAlign: 'left',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `${meta.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0,
              }}>
                {meta.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: C.ink,
                  fontFamily: 'DM Sans, sans-serif',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {task.label}
                </div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>
                  {freqText} · {meta.label}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 3L11 8L6 13" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        );
      })}

      {saveError && (
        <div style={{ fontSize: 12, color: C.red, marginTop: 8, fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>
          {saveError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={onCancel}
          style={{
            padding: '14px 18px', background: '#fff', color: C.muted,
            border: '1.5px solid #EAE4DA', borderRadius: 14,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving || checkedCount === 0}
          style={{
            flex: 1, padding: '14px',
            background: (saving || checkedCount === 0) ? '#7A9B8E' : C.brand,
            color: '#E8F5EE', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            cursor: (saving || checkedCount === 0) ? 'default' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {saving ? 'Saving…' : `Add ${checkedCount} task${checkedCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
