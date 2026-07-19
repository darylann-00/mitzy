import { useState, useEffect, useRef } from "react";
import { C, CAT_META } from "../data/constants";
import { useTaskContext } from "../contexts/TaskContext";
import { useProfileContext } from "../contexts/ProfileContext";
import { FrequencyPicker, formatIntervalDays } from "./FrequencyPicker";
import { formatDueDate } from "./TaskCard";
import { DateField } from "./DateField";
import { CategoryTile } from "./CategoryIcons";
import { supabase } from "../lib/supabase";
import { toLocalISO } from "../hooks/useWeeklyPlan";

const LOADING_MESSAGES = [
  "Reading your week…",
  "Matching tasks…",
  "Filling in the gaps…",
];

function PulseLoader({ messages }) {
  const [idx, setIdx] = useState(0);
  const dots = ['#D62828', '#F77F00', '#06A77D', '#F4C430'];
  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % messages.length), 2500);
    return () => clearInterval(id);
  }, [messages.length]);
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
        {dots.map((color, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%', background: color,
            animation: `mitzyPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>{messages[idx]}</div>
    </div>
  );
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getTimeEstimate(task, taskState) {
  const entry = taskState[task.id];
  if (task.steps?.length && entry?.stepProgress) {
    const nextStep = task.steps.find(s => !entry.stepProgress[s.key]);
    if (nextStep) {
      return { text: task.timeToComplete, nextStep: nextStep.label };
    }
  }
  return task.timeToComplete ? { text: task.timeToComplete } : null;
}

function DueLabel({ task, scheduledDate, taskState, getDays }) {
  if (scheduledDate) {
    return (
      <div style={{ fontSize: 12, color: C.yellow, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
        {dayLabel(scheduledDate)}
      </div>
    );
  }
  const days = getDays(task);
  if (days === null || days === undefined) return null;
  const text = formatDueDate(days, taskState[task.id]?.lastDone);
  if (!text) return null;
  return (
    <div style={{ fontSize: 12, color: days <= 0 ? C.red : C.muted, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
      {text}
    </div>
  );
}

function computeDueISO(task, taskState) {
  const entry = taskState[task.id];
  const isOneTime = entry?.oneTime !== undefined ? entry.oneTime : task.oneTime;
  if (isOneTime) return entry?.dueDate ? entry.dueDate.slice(0, 10) : null;
  if (!entry?.lastDone) return null;
  const intervalDays = entry?.intervalDays ?? task.intervalDays;
  const due = new Date(new Date(entry.lastDone).getTime() + intervalDays * 86400000);
  return toLocalISO(due);
}

function EditableDueDate({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={e => e.stopPropagation()} style={{ marginTop: 3 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 12, fontWeight: 600, color: value ? C.yellow : C.muted,
          fontFamily: 'DM Sans, sans-serif', textDecoration: 'underline',
        }}
      >
        {value ? dayLabel(value) : 'Set a date'}
      </button>
      {open && (
        <div style={{ marginTop: 6, maxWidth: 220 }}>
          <DateField value={value || ''} onChange={(v) => { onChange(v); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

function TimeChip({ estimate }) {
  if (!estimate) return null;
  return (
    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 3 }}>
      <span style={{ opacity: 0.8 }}>~{estimate.text}</span>
      {estimate.nextStep && (
        <span style={{ fontStyle: 'italic' }}> · next: {estimate.nextStep}</span>
      )}
    </div>
  );
}

function genTaskId() {
  const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 4)
    : Math.random().toString(36).slice(2, 6);
  return `custom-${Date.now()}-${rand}`;
}

function ToggleCard({ selected, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: selected ? C.card : C.surface, borderRadius: 10,
        border: `1px solid ${selected ? C.brand : C.cardBorder}`,
        marginBottom: 6, cursor: 'pointer',
        opacity: selected ? 1 : 0.7,
        transition: 'all 0.15s',
      }}
    >
      {children}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        background: selected ? C.brand : 'transparent',
        border: `2px solid ${selected ? C.brand : C.cardBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

const CAT_OPTIONS = Object.entries(CAT_META).map(([key, v]) => ({ key, label: v.label, color: v.color }));

function BrainDumpTaskCard({ task, onUpdate, dueDate, onDueDateChange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: C.card, borderRadius: 10, border: `1px solid ${C.brand}`,
      marginBottom: 6, overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(prev => !prev)}
      >
        <CategoryTile cat={task.cat} size={22} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
            {task.label}
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
            {task.oneTime ? 'One time' : formatIntervalDays(task.intervalDays)} · {CAT_META[task.cat]?.label || 'Home'}
            <span style={{ marginLeft: 6, color: C.brand, fontWeight: 600 }}>
              {expanded ? '▾ less' : '▸ edit'}
            </span>
          </div>
          <EditableDueDate task={task} value={dueDate} onChange={onDueDateChange} />
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke={C.green} strokeWidth="1.5" />
          <polyline points="4.5,8 7,10.5 11.5,5.5" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.cardBorder}` }}>
          {/* Category */}
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
              Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CAT_OPTIONS.map(c => (
                <button
                  key={c.key}
                  onClick={(e) => { e.stopPropagation(); onUpdate({ cat: c.key }); }}
                  style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', border: '1.5px solid',
                    borderColor: task.cat === c.key ? C.brand : C.cardBorder,
                    background: task.cat === c.key ? C.brand : '#fff',
                    color: task.cat === c.key ? C.brandLight : C.ink,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
              Frequency
            </div>
            <FrequencyPicker
              value={task.intervalDays}
              defaultDays={30}
              onChange={(days) => onUpdate({ intervalDays: days, windowDays: Math.max(3, Math.round(days * 0.2)), oneTime: false })}
              oneTime={task.oneTime}
              onToggleOneTime={(val) => {
                if (val) onUpdate({ oneTime: true, intervalDays: null, windowDays: 14 });
                else onUpdate({ oneTime: false, intervalDays: 30, windowDays: 7 });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklyCheckIn({ onClose }) {
  const {
    activeTasks, scoredDue, taskState, getStatus, getDays,
    confirmPlan, weekStart, activePlan,
  } = useTaskContext();
  const { profile, customTasks, addCustomTasksBulk } = useProfileContext();

  const [step, setStep] = useState('input');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorKind, setErrorKind] = useState(null);

  // When re-opened mid-week ("Adjust plan"), the already-confirmed plan seeds
  // the review screen so adjusting never starts from a blank slate.
  const [existingPlan] = useState(() => {
    if (!activePlan?.confirmedAt) return { ids: [], dates: {} };
    return { ids: activePlan.taskIds || [], dates: activePlan.scheduledDates || {} };
  });

  // Custom tasks coming up this week
  const [customDueTasks] = useState(() => {
    const customIds = new Set(customTasks.map(t => t.id));
    return scoredDue.filter(t => {
      if (!customIds.has(t.id)) return false;
      const s = getStatus(t);
      return s === 'due' || s === 'coming-up' || s === 'needed' || s === 'confirm';
    });
  });

  // Structured/built-in priority tasks (exclude unknown/trickle tasks)
  const [suggestedTasks] = useState(() => {
    const customIds = new Set(customTasks.map(t => t.id));
    return scoredDue.filter(t => {
      if (customIds.has(t.id)) return false;
      const s = getStatus(t);
      return s === 'due' || s === 'coming-up' || s === 'needed' || s === 'confirm';
    }).slice(0, 5);
  });

  // Review screen state — unified plan items
  const [planItems, setPlanItems] = useState(new Set());
  const [scheduledDates, setScheduledDates] = useState({});

  // API response state
  const [matches, setMatches] = useState([]);
  const [gapFill, setGapFill] = useState([]);
  const [dismissedMatches, setDismissedMatches] = useState(new Set());

  // Brain dump tasks that have been auto-created
  const [brainDumpTasks, setBrainDumpTasks] = useState([]);

  const abortRef = useRef(null);

  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const taskMap = new Map(activeTasks.map(t => [t.id, t]));

  // Brain-dump tasks are only built locally here — they're persisted in one
  // batch on "Lock in my week", so backing out of the check-in (or unchecking
  // one) never leaves stray tasks in the library.
  const buildBrainDumpTasks = (suggestions) => {
    return suggestions.map(s => {
      const intervalDays = s.intervalDays || null;
      return {
        id: genTaskId(),
        cat: 'home',
        label: s.label,
        oneTime: !intervalDays,
        intervalDays,
        windowDays: intervalDays ? Math.max(3, Math.round(intervalDays * 0.2)) : 14,
        isCustom: true,
        isAIGenerated: false,
        requires: [],
        _reason: s.reason,
        _startDate: s.startDate || null,
      };
    });
  };

  // Both entry points to the review screen seed the plan the same way: any
  // already-confirmed plan for this week first, then this week's due custom tasks.
  const buildBasePlan = () => {
    const initialPlan = new Set(existingPlan.ids);
    const dates = { ...existingPlan.dates };
    for (const t of customDueTasks) {
      initialPlan.add(t.id);
      if (!dates[t.id] && taskState[t.id]?.scheduledDate) dates[t.id] = taskState[t.id].scheduledDate;
    }
    return { initialPlan, dates };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorKind(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setErrorKind('auth'); setLoading(false); return; }

      // Filter out unknown (trickle) tasks from the backlog
      const backlogTasks = scoredDue
        .filter(t => {
          const s = getStatus(t);
          return s !== 'unknown';
        })
        .slice(0, 30)
        .map(t => ({ id: t.id, label: t.label, category: t.cat }));

      const res = await fetch('/api/weekly-checkin', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userInput: userInput.trim(),
          tasks: activeTasks.slice(0, 200).map(t => ({ id: t.id, label: t.label, category: t.cat })),
          autoDueTasks: customDueTasks.map(t => ({ id: t.id, label: t.label })),
          capacity: profile?.capacity || 'normal',
          weekStart,
          today: toLocalISO(new Date()),
          backlogTasks,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 429) setErrorKind('rate_limit');
        else setErrorKind('general');
        setLoading(false);
        return;
      }

      const data = await res.json();

      const apiMatches = data.matches || [];
      const apiGapFill = data.gapFill || [];
      const apiNewSuggestions = data.newTaskSuggestions || [];
      setMatches(apiMatches);
      setGapFill(apiGapFill);

      const builtTasks = buildBrainDumpTasks(apiNewSuggestions);
      setBrainDumpTasks(builtTasks);

      // Build initial plan: existing plan + custom tasks + matched tasks + brain dump tasks
      const { initialPlan, dates } = buildBasePlan();
      for (const m of apiMatches) {
        initialPlan.add(m.taskId);
        if (m.scheduledDate) dates[m.taskId] = m.scheduledDate;
      }
      for (const t of builtTasks) {
        initialPlan.add(t.id);
        if (t._startDate) dates[t.id] = t._startDate;
      }

      setPlanItems(initialPlan);
      setScheduledDates(dates);
      setStep('review');
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (!navigator.onLine) setErrorKind('offline');
      else setErrorKind('general');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToReview = () => {
    setErrorKind(null);
    const { initialPlan, dates } = buildBasePlan();
    setPlanItems(initialPlan);
    setScheduledDates(dates);
    setStep('review');
  };

  const dismissMatch = (match) => {
    setDismissedMatches(prev => new Set(prev).add(match.taskId));
    setPlanItems(prev => {
      const next = new Set(prev);
      next.delete(match.taskId);
      return next;
    });
    // Queue a custom task for what they actually said — persisted on lock-in.
    // Reuse what the matching API already extracted: the cleaned-up task title
    // and the parsed date, so the new task isn't the raw brain-dump snippet.
    const taskId = genTaskId();
    const task = {
      id: taskId,
      cat: 'home',
      label: match.mentionLabel || match.mentionText || 'Custom task',
      oneTime: true,
      intervalDays: null,
      windowDays: 14,
      isCustom: true,
      isAIGenerated: false,
      requires: [],
    };
    setBrainDumpTasks(prev => [...prev, task]);
    setPlanItems(prev => new Set(prev).add(taskId));
    if (match.scheduledDate) {
      setScheduledDates(prev => ({ ...prev, [taskId]: match.scheduledDate }));
    }
  };

  const updateBrainDumpTask = (taskId, updates) => {
    setBrainDumpTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ));
  };

  const togglePlanItem = (id) => {
    setPlanItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    setSaving(true);
    setErrorKind(null);

    // Persist the brain-dump tasks that made the cut, in one batch, with their
    // final category/frequency edits. Internal underscore fields stay local.
    const newTasks = brainDumpTasks
      .filter(t => planItems.has(t.id))
      .map(({ _reason, _startDate, ...t }) => t); // eslint-disable-line no-unused-vars

    try {
      if (newTasks.length > 0) await addCustomTasksBulk(newTasks);
    } catch {
      setErrorKind('save');
      setSaving(false);
      return;
    }

    const { error } = await confirmPlan([...planItems], scheduledDates, userInput);
    if (error) {
      setErrorKind('save');
      setSaving(false);
      return;
    }
    onClose();
  };

  const ERROR_MESSAGES = {
    offline: "You're offline — try again when you have a connection.",
    rate_limit: "Too many requests. Give it a few minutes.",
    auth: "Session expired. Close and try again.",
    general: "Something went wrong. Try again?",
    save: "Couldn't save your plan — check your connection and try again.",
  };

  // ─── Screen 1: What's on your plate + brain dump ─────────────────────────
  if (step === 'input') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: C.bg, overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: C.brand, padding: '22px 22px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: "'Righteous', cursive", fontSize: 22, color: C.brandLight,
              marginBottom: 4,
            }}>
              {existingPlan.ids.length > 0 ? 'Adjust your week' : 'Weekly check-in'}
            </div>
            <div style={{ fontSize: 13, color: '#B8DCC8', fontFamily: 'DM Sans, sans-serif' }}>
              {existingPlan.ids.length > 0 ? "Change what's on your plate" : "Let's see what your week looks like"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 28, color: C.brandLight, lineHeight: 1, padding: 4,
          }}>
            ×
          </button>
        </div>

        <div style={{ padding: '20px 20px 160px' }}>
          {/* Custom tasks — read-only context */}
          {customDueTasks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader>Already on your plate</SectionHeader>
              {customDueTasks.map(t => {
                const estimate = getTimeEstimate(t, taskState);
                const date = taskState[t.id]?.scheduledDate;
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: C.card, borderRadius: 10, border: `1px solid ${C.cardBorder}`,
                    marginBottom: 6,
                  }}>
                    <CategoryTile cat={t.cat} size={22} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                        {t.label}
                      </span>
                      <DueLabel task={t} scheduledDate={date} taskState={taskState} getDays={getDays} />
                      <TimeChip estimate={estimate} />
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke={C.green} strokeWidth="1.5" />
                      <polyline points="4.5,8 7,10.5 11.5,5.5" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}

          {/* Brain dump */}
          <div style={{ marginBottom: 24 }}>
            <SectionHeader>What else is happening this week?</SectionHeader>
            <div style={{
              fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 12, lineHeight: 1.5,
            }}>
              Brain dump anything — appointments, errands, things on your mind
            </div>
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="e.g. Taking Max to the vet Thursday, PCP appointment Wednesday, need to change the air filter…"
              maxLength={2000}
              style={{
                width: '100%', minHeight: 100, padding: 14, fontSize: 14,
                fontFamily: 'DM Sans, sans-serif', color: C.ink,
                background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12,
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {loading && <PulseLoader messages={LOADING_MESSAGES} />}

          {errorKind && (
            <div style={{
              background: '#FEF0F0', border: '1px solid #F5C6C6', borderRadius: 10,
              padding: '12px 16px', fontSize: 13, color: '#8B2020',
              fontFamily: 'DM Sans, sans-serif', marginBottom: 16,
            }}>
              {ERROR_MESSAGES[errorKind]}
            </div>
          )}

          {!loading && (
            <button
              onClick={userInput.trim() ? handleSubmit : handleSkipToReview}
              style={{
                width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
                background: C.brand, color: C.brandLight, border: 'none', borderRadius: 12,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {userInput.trim() ? 'Plan my week' : customDueTasks.length > 0 ? 'Next' : 'Skip to suggestions'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Screen 2: Unified plan review ───────────────────────────────────────
  if (step === 'review') {
    const activeMatches = matches.filter(m => {
      if (dismissedMatches.has(m.taskId)) return false;
      const isCustom = customDueTasks.some(ct => ct.id === m.taskId);
      return !isCustom && taskMap.has(m.taskId);
    });

    // Merge suggestedTasks + gapFill into one deduplicated list
    const allSuggestionIds = new Set();
    const mergedSuggestions = [];
    for (const g of gapFill) {
      if (!allSuggestionIds.has(g.taskId)) {
        allSuggestionIds.add(g.taskId);
        mergedSuggestions.push({ taskId: g.taskId, reason: g.reason });
      }
    }
    for (const t of suggestedTasks) {
      if (!allSuggestionIds.has(t.id)) {
        allSuggestionIds.add(t.id);
        mergedSuggestions.push({ taskId: t.id, reason: null });
      }
    }

    // Tasks carried over from an already-confirmed plan that no other section
    // renders. Ones completed this week stay in planItems (so progress holds)
    // but don't render as toggleable rows.
    const coveredIds = new Set([
      ...customDueTasks.map(t => t.id),
      ...activeMatches.map(m => m.taskId),
      ...brainDumpTasks.map(t => t.id),
      ...mergedSuggestions.map(s => s.taskId),
    ]);
    const existingPlanTasks = existingPlan.ids
      .filter(id => !coveredIds.has(id))
      .map(id => taskMap.get(id))
      .filter(Boolean)
      .filter(t => {
        const entry = taskState[t.id];
        return !(entry?.lastDone && entry.lastDone >= weekStart);
      });

    const hasAddedSuggestions = mergedSuggestions.some(s => planItems.has(s.taskId));
    const hasPlanItems = customDueTasks.length > 0 || activeMatches.length > 0 || brainDumpTasks.length > 0 || existingPlanTasks.length > 0 || hasAddedSuggestions;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: C.bg, overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: C.brand, padding: '22px 22px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: "'Righteous', cursive", fontSize: 22, color: C.brandLight,
              marginBottom: 4,
            }}>
              Your week
            </div>
            <div style={{ fontSize: 13, color: '#B8DCC8', fontFamily: 'DM Sans, sans-serif' }}>
              {planItems.size} task{planItems.size !== 1 ? 's' : ''} planned
            </div>
          </div>
          <button onClick={() => { setErrorKind(null); setStep('input'); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: C.brandLight, fontFamily: 'DM Sans, sans-serif',
            textDecoration: 'underline',
          }}>
            Back
          </button>
        </div>

        <div style={{ padding: '20px 20px 160px' }}>
          {/* Unified plan list */}
          {hasPlanItems && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader>This week's plan</SectionHeader>

              {/* Unified plan list, sorted chronologically by due date (undated tasks last) */}
              {(() => {
                const rows = [];

                for (const t of customDueTasks) {
                  rows.push({ type: 'custom', key: t.id, date: scheduledDates[t.id] ?? computeDueISO(t, taskState), task: t });
                }

                // Carried-over plan tasks render like custom rows: toggleable, editable date
                for (const t of existingPlanTasks) {
                  rows.push({ type: 'custom', key: t.id, date: scheduledDates[t.id] ?? computeDueISO(t, taskState), task: t });
                }

                for (const m of activeMatches) {
                  const task = taskMap.get(m.taskId);
                  if (!task) continue;
                  rows.push({ type: 'match', key: m.taskId, date: scheduledDates[m.taskId] ?? computeDueISO(task, taskState), match: m, task });
                }

                for (const t of brainDumpTasks.filter(t => planItems.has(t.id))) {
                  rows.push({ type: 'brainDumpInPlan', key: t.id, date: scheduledDates[t.id] ?? computeDueISO(t, taskState), task: t });
                }

                for (const s of mergedSuggestions.filter(s => planItems.has(s.taskId))) {
                  const task = taskMap.get(s.taskId);
                  if (!task) continue;
                  rows.push({ type: 'suggestion', key: s.taskId, date: scheduledDates[s.taskId] ?? computeDueISO(task, taskState), suggestion: s, task });
                }

                for (const t of brainDumpTasks.filter(t => !planItems.has(t.id))) {
                  rows.push({ type: 'brainDumpRemoved', key: t.id, date: null, task: t });
                }

                rows.sort((a, b) => {
                  if (!a.date && !b.date) return 0;
                  if (!a.date) return 1;
                  if (!b.date) return -1;
                  return a.date.localeCompare(b.date);
                });

                return rows.map(row => {
                  if (row.type === 'custom') {
                    const t = row.task;
                    const estimate = getTimeEstimate(t, taskState);
                    const selected = planItems.has(t.id);
                    return (
                      <ToggleCard key={row.key} selected={selected} onClick={() => togglePlanItem(t.id)}>
                        <CategoryTile cat={t.cat} size={22} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                            {t.label}
                          </span>
                          {selected ? (
                            <EditableDueDate
                              task={t}
                              value={row.date}
                              onChange={(v) => setScheduledDates(prev => ({ ...prev, [t.id]: v }))}
                            />
                          ) : (
                            <DueLabel task={t} scheduledDate={scheduledDates[t.id]} taskState={taskState} getDays={getDays} />
                          )}
                          <TimeChip estimate={estimate} />
                        </div>
                      </ToggleCard>
                    );
                  }

                  if (row.type === 'match') {
                    const { match: m, task } = row;
                    const inPlan = planItems.has(m.taskId);
                    const estimate = getTimeEstimate(task, taskState);
                    return (
                      <div key={row.key} style={{ marginBottom: 6 }}>
                        <ToggleCard selected={inPlan} onClick={() => togglePlanItem(m.taskId)}>
                          <CategoryTile cat={task.cat} size={22} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                              {task.label}
                            </div>
                            {inPlan ? (
                              <EditableDueDate
                                task={task}
                                value={row.date}
                                onChange={(v) => setScheduledDates(prev => ({ ...prev, [m.taskId]: v }))}
                              />
                            ) : (
                              <DueLabel task={task} scheduledDate={scheduledDates[m.taskId]} taskState={taskState} getDays={getDays} />
                            )}
                            {m.mentionText && (
                              <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic', marginTop: 2 }}>
                                from: &ldquo;{m.mentionText}&rdquo;
                              </div>
                            )}
                            <TimeChip estimate={estimate} />
                          </div>
                        </ToggleCard>
                        {m.mentionText && (
                          <button
                            onClick={() => dismissMatch(m)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif',
                              textDecoration: 'underline', padding: '0 14px 4px',
                            }}
                          >
                            Not what I meant — add as a separate task
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (row.type === 'brainDumpInPlan') {
                    const t = row.task;
                    return (
                      <BrainDumpTaskCard
                        key={row.key}
                        task={t}
                        onUpdate={(updates) => updateBrainDumpTask(t.id, updates)}
                        dueDate={row.date}
                        onDueDateChange={(v) => setScheduledDates(prev => ({ ...prev, [t.id]: v }))}
                      />
                    );
                  }

                  if (row.type === 'suggestion') {
                    const { suggestion: s, task } = row;
                    const estimate = getTimeEstimate(task, taskState);
                    return (
                      <ToggleCard key={row.key} selected={true} onClick={() => togglePlanItem(s.taskId)}>
                        <CategoryTile cat={task.cat} size={22} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                            {task.label}
                          </span>
                          <EditableDueDate
                            task={task}
                            value={row.date}
                            onChange={(v) => setScheduledDates(prev => ({ ...prev, [s.taskId]: v }))}
                          />
                          <TimeChip estimate={estimate} />
                        </div>
                      </ToggleCard>
                    );
                  }

                  const t = row.task;
                  return (
                    <ToggleCard key={row.key} selected={false} onClick={() => togglePlanItem(t.id)}>
                      <CategoryTile cat={t.cat} size={22} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                          {t.label}
                        </span>
                      </div>
                    </ToggleCard>
                  );
                });
              })()}
            </div>
          )}

          {/* Mitzy suggestions — single merged section */}
          {mergedSuggestions.filter(s => !planItems.has(s.taskId)).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader>Mitzy suggestions</SectionHeader>
              <div style={{
                fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 12, lineHeight: 1.5,
              }}>
                {planItems.size >= 3
                  ? "You've got plenty going on — no pressure, but these are coming up if you have bandwidth"
                  : 'These are coming up soon — tap to add any to your plan'}
              </div>
              {mergedSuggestions.filter(s => !planItems.has(s.taskId)).map(s => {
                    const task = taskMap.get(s.taskId);
                    if (!task) return null;
                    const estimate = getTimeEstimate(task, taskState);
                    return (
                      <div
                        key={s.taskId}
                        onClick={() => togglePlanItem(s.taskId)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          background: C.surface, borderRadius: 10,
                          border: `1px solid ${C.cardBorder}`,
                          marginBottom: 6, cursor: 'pointer',
                          opacity: 0.7,
                          transition: 'all 0.15s',
                        }}
                      >
                        <CategoryTile cat={task.cat} size={22} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                            {task.label}
                          </span>
                          {s.reason && (
                            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                              {s.reason}
                            </div>
                          )}
                          <DueLabel task={task} taskState={taskState} getDays={getDays} />
                          <TimeChip estimate={estimate} />
                        </div>
                        <div style={{
                          background: C.surface, color: C.muted,
                          border: 'none', borderRadius: 8, padding: '4px 10px',
                          fontSize: 12, fontWeight: 600,
                          fontFamily: 'DM Sans, sans-serif',
                        }}>
                          + Add
                        </div>
                      </div>
                    );
                  })}
            </div>
          )}

          {errorKind && (
            <div style={{
              background: '#FEF0F0', border: '1px solid #F5C6C6', borderRadius: 10,
              padding: '12px 16px', fontSize: 13, color: '#8B2020',
              fontFamily: 'DM Sans, sans-serif', marginBottom: 16,
            }}>
              {ERROR_MESSAGES[errorKind]}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={planItems.size === 0 || saving}
            style={{
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
              background: planItems.size > 0 && !saving ? C.brand : C.surface,
              color: planItems.size > 0 && !saving ? C.brandLight : C.muted,
              border: 'none', borderRadius: 12,
              cursor: planItems.size > 0 && !saving ? 'pointer' : 'default',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {saving ? 'Saving…' : 'Lock in my week'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
