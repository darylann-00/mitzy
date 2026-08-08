import { useState, useEffect, useRef } from "react";
import { C, CAT_META } from "../data/constants";
import { useProfileContext } from "../contexts/ProfileContext";
import { useTaskContext } from "../contexts/TaskContext";
import { supabase } from "../lib/supabase";
import { TaskConfirmCard } from "./TaskConfirmCard";
import { BrainDumpReview } from "./BrainDumpReview";
import { UpgradeSheet } from "./UpgradeSheet";
import { CategoryTile, LIFE_EVENT_ICON_CONFIG } from "./CategoryIcons";
import { LIFE_EVENT_DEFS } from "../data/lifeEvents";

const PLACEHOLDERS = [
  "e.g. fix iPad screen",
  "e.g. fertilize my orchid",
  "e.g. clean the gutters",
  "e.g. schedule a vet visit for the dog",
  "e.g. change HVAC filter, schedule dentist, get car inspected",
];

const FREQ_UNIT_DAYS = { days: 1, weeks: 7, months: 30, years: 365 };

const EXAMPLE_PROMPTS = [
  "change HVAC filter",
  "book the dog's vet visit",
  "clean the gutters",
];

const MICRO_LABEL = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#4A6256', fontFamily: "'Righteous', cursive",
};

const CARD = {
  background: '#fff', borderRadius: 14, border: '1px solid #EAE4DA', padding: '13px 15px',
};

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

function genTaskId() {
  const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 4)
    : Math.random().toString(36).slice(2, 6);
  return `custom-${Date.now()}-${rand}`;
}

export function TaskCreator({ onClose, lifeEventId }) {
  const { profile, taskLibrary, addCustomTask, addCustomTasksBulk, lifeEvents } = useProfileContext();
  const { markNeeded, setDueDate } = useTaskContext();
  const activeEvent = lifeEvents?.activeEvent;
  const activeEventDef = activeEvent ? LIFE_EVENT_DEFS[activeEvent.type] : null;
  const ActiveEventIcon = activeEvent ? LIFE_EVENT_ICON_CONFIG[activeEvent.type] : null;

  const [mode, setMode] = useState('ai');
  const [stage, setStage] = useState('input');
  const [prompt, setPrompt] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [multiTasks, setMultiTasks] = useState(null);
  const [refusal, setRefusal] = useState(null);
  const [upgrade, setUpgrade] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [manual, setManual] = useState(null);
  const [errorKind, setErrorKind] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Manual mode state
  const [manualLabel, setManualLabel] = useState('');
  const [manualCat, setManualCat] = useState(lifeEventId ? 'life-event' : 'home');
  const [manualFreqNum, setManualFreqNum] = useState('3');
  const [manualFreqUnit, setManualFreqUnit] = useState('months');
  const [manualOneTime, setManualOneTime] = useState(!!lifeEventId);
  const [manualStakes, setManualStakes] = useState('medium');
  const [manualErr, setManualErr] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  const abortRef = useRef(null);
  const regenTimerRef = useRef(null);

  useEffect(() => {
    if (stage !== 'input' || mode !== 'ai') return;
    const id = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, [stage, mode]);

  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
    if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
  }, []);

  const callGenerate = async ({ promptText, regenerate }) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('not_auth');

    const profileForServer = {
      zip: profile?.zip,
      birthYear: profile?.birthYear,
      cars: Array.isArray(profile?.cars) ? profile.cars : [],
      kids: Array.isArray(profile?.kids) ? profile.kids : [],
      pets: Array.isArray(profile?.pets) ? profile.pets : [],
    };
    const existingTaskLabels = (taskLibrary || []).map(t => t.label).filter(Boolean).slice(0, 200);

    const res = await fetch('/api/generate-task', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${token}` },
      body: JSON.stringify({
        prompt: promptText, profile: profileForServer, existingTaskLabels, regenerate: regenerate || null,
        activeEvent: activeEvent ? { type: activeEvent.type, label: activeEventDef?.label } : null,
      }),
    });
    if (!res.ok) {
      const err = new Error(String(res.status));
      // A 402 explains itself in the body — allowance spent vs. Mitzy Pro only.
      // The .catch() keeps a non-JSON body from surfacing as a parse error.
      if (res.status === 402) err.payload = await res.json().catch(() => null);
      throw err;
    }
    return res.json();
  };

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setStage('loading');
    setErrorKind(null);
    try {
      const data = await callGenerate({ promptText: trimmed });

      if (data.tier === 4) {
        setRefusal(data.refusal);
        setStage('refusal');
        return;
      }

      if (data.tier === 'multi' && Array.isArray(data.tasks)) {
        const tasksWithMeta = data.tasks
          .filter(item => item.tier !== 4 && item.task)
          .map(item => ({
            ...item.task,
            id: genTaskId(),
            isCustom: true,
            isAIGenerated: true,
            riskTier: item.task.riskTier ?? item.tier ?? 1,
            promptText: trimmed,
            requires: [],
          }));
        if (tasksWithMeta.length === 0) {
          setManual({ label: trimmed.slice(0, 80), cat: 'home' });
          setStage('manual');
          return;
        }
        if (tasksWithMeta.length === 1) {
          setGenerated(tasksWithMeta[0]);
          setStage('confirm');
          return;
        }
        setMultiTasks(tasksWithMeta);
        setStage('multi-review');
        return;
      }

      if (data.tier === 0) {
        setManual({ label: data.manual?.label || trimmed.slice(0, 80), cat: data.manual?.cat || 'home' });
        setStage('manual');
        return;
      }

      if (!data.task) throw new Error('bad_response');
      const taskWithMeta = {
        ...data.task,
        id: genTaskId(),
        isCustom: true,
        isAIGenerated: true,
        riskTier: data.task.riskTier ?? data.tier ?? 1,
        promptText: trimmed,
        requires: [],
      };
      setGenerated(taskWithMeta);
      setStage('confirm');
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err?.message ?? '';
      // Early return: the fall-through below puts the user back on the input
      // screen, which is the wrong place for a paywall.
      if (msg === '402') {
        setUpgrade(err.payload || { reason: 'quota_exhausted' });
        setStage('upgrade');
        return;
      }
      let kind = 'general';
      if (typeof navigator !== 'undefined' && !navigator.onLine) kind = 'offline';
      else if (msg === '429') kind = 'rate_limit';
      else if (msg === '413') kind = 'too_long';
      else if (msg === '504' || msg === '408' || msg === '524') kind = 'timeout';
      setErrorKind(kind);
      setStage('input');
    }
  };

  const handleConfirmChange = (delta) => {
    if (delta.patch) {
      setGenerated(prev => ({ ...prev, ...delta.patch }));
      return;
    }
    if (delta.regenerate) {
      const { key, value } = delta.regenerate;
      setGenerated(prev => ({
        ...prev,
        assumptions: (prev.assumptions || []).map(a => a.key === key ? { ...a, label: value } : a),
      }));
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
      regenTimerRef.current = setTimeout(async () => {
        setRegenerating(true);
        setRegenError(null);
        try {
          const data = await callGenerate({ promptText: generated?.promptText || prompt, regenerate: { key, value } });
          if (data.task) {
            setGenerated(prev => ({
              ...data.task,
              id: prev.id,
              isCustom: true,
              isAIGenerated: true,
              riskTier: data.task.riskTier ?? data.tier ?? prev.riskTier,
              promptText: prev.promptText,
              requires: [],
            }));
          }
        } catch (err) {
          if (err.name === 'AbortError') return;
          // Don't blow the whole screen away on a 402 here — the task is
          // already generated and still saveable; only the re-roll is blocked.
          setRegenError(err?.message === '402'
            ? "That's your last free assist for this month — the task above is still yours to save."
            : "Couldn't update — try a different option");
        } finally {
          setRegenerating(false);
        }
      }, 400);
    }
  };

  const handleSave = async (taskToSave) => {
    setSaving(true);
    setSaveError(null);
    try {
      const { includeInFocus: _ignored, dueDate, lifeEventRelevant, ...task } = taskToSave;
      if (lifeEventId || (lifeEventRelevant && activeEvent)) {
        await lifeEvents.addTaskToEvent(task);
      } else {
        await addCustomTask(task);
      }
      try { await markNeeded(task.id); } catch {}
      if (dueDate) { try { await setDueDate(task.id, dueDate); } catch {} }
      onClose();
    } catch {
      setSaveError("Couldn't save — try again");
      setSaving(false);
    }
  };

  const handleMultiSave = async (selectedTasks) => {
    setSaving(true);
    setSaveError(null);
    try {
      const regular = [];
      const eventLinked = [];
      for (const { dueDate, lifeEventRelevant, ...rest } of selectedTasks) {
        if (lifeEventId || (lifeEventRelevant && activeEvent)) eventLinked.push(rest);
        else regular.push(rest);
      }
      if (regular.length) await addCustomTasksBulk(regular);
      for (const t of eventLinked) await lifeEvents.addTaskToEvent(t);
      for (const task of selectedTasks) {
        try { await markNeeded(task.id); } catch {}
        if (task.dueDate) { try { await setDueDate(task.id, task.dueDate); } catch {} }
      }
      onClose();
    } catch {
      setSaveError("Couldn't save — try again");
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!manual?.label?.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const task = {
        id: genTaskId(),
        cat: manual.cat || 'home',
        label: manual.label.trim(),
        intervalDays: manual.intervalDays || 30,
        windowDays: Math.max(3, Math.round((manual.intervalDays || 30) * 0.2)),
        stakes: 'medium',
        activeMonths: null,
        requires: [],
        assistType: 'guidance',
        isCustom: true,
        isAIGenerated: false,
        promptText: prompt,
      };
      await addCustomTask(task);
      try { await markNeeded(task.id); } catch {}
      onClose();
    } catch {
      setSaveError("Couldn't save — try again");
      setSaving(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualLabel.trim()) { setManualErr("Give it a name first"); return; }
    const isEventTask = manualCat === 'life-event';
    const freqN = parseInt(manualFreqNum, 10);
    if (!isEventTask && !manualOneTime && (!freqN || freqN < 1)) { setManualErr("Pick how often it repeats"); return; }
    const manualFreq = freqN * FREQ_UNIT_DAYS[manualFreqUnit];
    setSaving(true);
    setSaveError(null);
    try {
      const task = {
        id: genTaskId(),
        cat: isEventTask ? 'other' : manualCat,
        label: manualLabel.trim(),
        intervalDays: (isEventTask || manualOneTime) ? null : manualFreq,
        windowDays: (isEventTask || manualOneTime) ? 14 : Math.max(3, Math.round(manualFreq * 0.2)),
        oneTime: isEventTask || manualOneTime,
        stakes: manualStakes,
        activeMonths: null,
        requires: [],
        assistType: 'guidance',
        isCustom: true,
        isAIGenerated: false,
      };
      if (isEventTask && activeEvent) {
        await lifeEvents.addTaskToEvent(task);
      } else {
        await addCustomTask(task);
      }
      try { await markNeeded(task.id); } catch {}
      onClose();
    } catch {
      setSaveError("Couldn't save — try again");
      setSaving(false);
    }
  };

  const errorMessage = (() => {
    if (errorKind === 'offline')    return 'No internet connection. Check your connection and try again.';
    if (errorKind === 'rate_limit') return 'Too many requests right now. Wait a moment and try again.';
    if (errorKind === 'too_long')   return 'That prompt is too long — try shortening it.';
    if (errorKind === 'timeout')    return 'The server took too long. Try again in a moment.';
    if (errorKind === 'general')    return "Something went wrong. Try again?";
    return null;
  })();

  const STAKES_COLORS = { low: C.green, medium: C.yellow, high: C.red };

  const subtitleText = (() => {
    if (mode === 'manual') return 'Set it up exactly how you want';
    if (stage === 'input')        return 'Tell Mitzy what you need to get done';
    if (stage === 'loading')      return 'Mitzy is working on it…';
    if (stage === 'confirm')      return 'Review and tweak before saving';
    if (stage === 'multi-review') return 'Uncheck any you don\'t need';
    if (stage === 'refusal')      return 'Resources for this';
    if (stage === 'upgrade')      return 'Brain dump is a Mitzy Pro feature';
    if (stage === 'manual')       return 'Add it as a basic reminder';
    return '';
  })();

  const headerTitle = stage === 'multi-review' && multiTasks
    ? `${multiTasks.length} tasks found`
    : lifeEventId
      ? 'add to event'
      : 'add a task';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,20,0.75)', zIndex: 500, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#1A5C3A', padding: '18px 18px 16px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', width: 50, height: 50, borderRadius: '50%', background: '#0F3D27', top: -14, right: -12 }} />
        <div style={{ position: 'absolute', width: 22, height: 22, borderRadius: '50%', background: '#06A77D', top: 8, right: 22 }} />
        <div style={{ position: 'absolute', width: 10, height: 10, background: '#F77F00', transform: 'rotate(45deg)', bottom: 8, right: 16 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill="#E8F5EE" />
            </svg>
            <span style={{ fontFamily: "'Righteous', cursive", fontSize: 20, color: '#E8F5EE' }}>{headerTitle}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: 8, background: '#0F3D27', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="3" y1="3" x2="11" y2="11" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" />
              <line x1="11" y1="3" x2="3" y2="11" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#7DD8B0', marginTop: 6, fontFamily: 'DM Sans, sans-serif', position: 'relative' }}>
          {subtitleText}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#FDFAF2' }}>
        <div style={{ padding: '16px 18px 32px', maxWidth: 640, margin: '0 auto' }}>

          {/* Mode switcher */}
          {stage === 'input' && (
            <div style={{ display: 'flex', background: C.surface, borderRadius: 999, padding: 4, marginBottom: 16 }}>
              {[
                { key: 'ai', label: 'Mitzy magic', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill="currentColor" />
                  </svg>
                ) },
                { key: 'manual', label: 'Do it myself', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                ) },
              ].map(({ key, label, icon }) => {
                const active = mode === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    style={{
                      flex: 1, padding: '9px 0', border: 'none', borderRadius: 999,
                      fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6, transition: 'all 0.15s',
                      background: active ? '#fff' : 'transparent',
                      color: active ? C.brand : C.muted,
                      boxShadow: active ? '0 1px 4px rgba(28,43,34,0.12)' : 'none',
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* AI input */}
          {stage === 'input' && mode === 'ai' && (
            <div>
              <div style={{
                background: '#fff', borderRadius: 16,
                border: `1.5px solid ${inputFocused ? C.brand : '#EAE4DA'}`,
                boxShadow: '0 2px 12px rgba(28,43,34,0.05)',
                transition: 'border-color 0.15s', overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 15px 0' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill={C.brand} />
                  </svg>
                  <span style={MICRO_LABEL}>Brain dump</span>
                </div>
                <textarea
                  autoFocus
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={PLACEHOLDERS[phIdx]}
                  rows={5}
                  style={{
                    width: '100%', padding: '10px 15px 4px', fontSize: 15,
                    fontFamily: 'DM Sans, sans-serif', border: 'none', outline: 'none',
                    background: 'transparent', color: C.ink,
                    resize: 'none', minHeight: 110, boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
                <div style={{ padding: '0 15px 13px', fontSize: 12, color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>
                  One task or a whole list — Mitzy will figure it out.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>Try:</span>
                {EXAMPLE_PROMPTS.map(text => (
                  <button
                    key={text}
                    onClick={() => setPrompt(p => p.trim() ? `${p.trimEnd()}\n${text}` : text)}
                    style={{
                      padding: '6px 11px', borderRadius: 20, border: '1.5px solid #EAE4DA',
                      background: '#fff', fontSize: 12, fontWeight: 600, color: C.ink,
                      cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
              {errorMessage && (
                <div style={{ marginTop: 10, fontSize: 13, color: C.red, fontFamily: 'DM Sans, sans-serif' }}>{errorMessage}</div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                style={{
                  width: '100%', marginTop: 14, padding: '14px',
                  background: prompt.trim() ? C.brand : '#C8D9D1',
                  color: '#E8F5EE', border: 'none', borderRadius: 14,
                  fontSize: 15, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                  cursor: prompt.trim() ? 'pointer' : 'default',
                }}
              >
                Let's do it
              </button>
            </div>
          )}

          {/* Manual mode */}
          {stage === 'input' && mode === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={CARD}>
                <div style={{ ...MICRO_LABEL, marginBottom: 8 }}>Task</div>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Clean washing machine"
                  value={manualLabel}
                  onChange={e => { setManualLabel(e.target.value); if (manualErr) setManualErr(''); }}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 15,
                    fontFamily: 'DM Sans, sans-serif', border: '1.5px solid #EAE4DA',
                    borderRadius: 10, background: '#fff', color: C.ink, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={CARD}>
                <div style={{ ...MICRO_LABEL, marginBottom: 8 }}>Category</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {activeEvent && activeEventDef && (() => {
                    const active = manualCat === 'life-event';
                    return (
                      <button
                        key="life-event"
                        onClick={() => setManualCat('life-event')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '6px 12px 6px 7px', borderRadius: 10, cursor: 'pointer',
                          border: `1.5px solid ${active ? '#F4C430' : '#EAE4DA'}`,
                          background: active ? '#FFFBEE' : '#fff',
                          fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: C.ink,
                        }}
                      >
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#FFFBEE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {ActiveEventIcon && <ActiveEventIcon size={16} />}
                        </div>
                        {activeEventDef.label}
                      </button>
                    );
                  })()}
                  {Object.entries(CAT_META).map(([k, v]) => {
                    const active = manualCat === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setManualCat(k)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '6px 12px 6px 7px', borderRadius: 10, cursor: 'pointer',
                          border: `1.5px solid ${active ? C.brand : '#EAE4DA'}`,
                          background: active ? C.brandLight : '#fff',
                          fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: C.ink,
                        }}
                      >
                        <CategoryTile cat={k} size={24} />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {manualCat !== 'life-event' && <div style={CARD}>
                <div style={{ ...MICRO_LABEL, marginBottom: 8 }}>How often</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: manualOneTime ? 0 : 12 }}>
                  {[
                    { key: false, label: 'Recurring' },
                    { key: true,  label: 'One time' },
                  ].map(({ key, label }) => {
                    const active = manualOneTime === key;
                    return (
                      <button
                        key={label}
                        onClick={() => setManualOneTime(key)}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                          fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', border: '1.5px solid',
                          borderColor: active ? C.brand : '#EAE4DA',
                          background: active ? C.brand : '#fff',
                          color: active ? '#E8F5EE' : C.ink,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {!manualOneTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: 'DM Sans, sans-serif' }}>Every</span>
                    <input
                      type="number"
                      min="1"
                      value={manualFreqNum}
                      onChange={e => { setManualFreqNum(e.target.value); if (manualErr) setManualErr(''); }}
                      style={{
                        width: 64, padding: '9px 8px', fontSize: 14, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif', border: '1.5px solid #EAE4DA',
                        borderRadius: 10, background: '#fff', color: C.ink, textAlign: 'center',
                      }}
                    />
                    <select
                      value={manualFreqUnit}
                      onChange={e => setManualFreqUnit(e.target.value)}
                      style={{
                        padding: '9px 10px', fontSize: 14, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif', border: '1.5px solid #EAE4DA',
                        borderRadius: 10, background: '#fff', color: C.ink,
                      }}
                    >
                      <option value="days">days</option>
                      <option value="weeks">weeks</option>
                      <option value="months">months</option>
                      <option value="years">years</option>
                    </select>
                  </div>
                )}
              </div>}
              <div style={CARD}>
                <div style={{ ...MICRO_LABEL, marginBottom: 8 }}>How important</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {["low", "medium", "high"].map(s => {
                    const active = manualStakes === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setManualStakes(s)}
                        style={{
                          flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700,
                          textTransform: 'capitalize',
                          background: active ? STAKES_COLORS[s] : '#fff',
                          color: active ? (s === 'medium' ? C.ink : '#fff') : C.ink,
                          border: `1.5px solid ${active ? STAKES_COLORS[s] : '#EAE4DA'}`,
                          borderRadius: 12,
                          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              {manualErr && <div style={{ fontSize: 13, color: C.red, fontFamily: 'DM Sans, sans-serif' }}>{manualErr}</div>}
              {saveError && <div style={{ fontSize: 13, color: C.red, fontFamily: 'DM Sans, sans-serif' }}>{saveError}</div>}
              <button
                onClick={handleManualAdd}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px', fontSize: 15, marginTop: 4,
                  background: saving ? '#7A9B8E' : C.brand, color: '#E8F5EE',
                  border: 'none', borderRadius: 14, fontWeight: 700,
                  cursor: saving ? 'default' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {saving ? 'Saving…' : (manualCat === 'life-event' && activeEventDef) ? `Add to ${activeEventDef.label}` : 'Add to my tasks'}
              </button>
            </div>
          )}

          {/* Loading */}
          {stage === 'loading' && (
            <PulseLoader messages={[
              'Thinking about your tasks...',
              'Picking the right schedules...',
              'Personalizing for your home...',
            ]} />
          )}

          {/* Single task confirm */}
          {stage === 'confirm' && generated && (
            <TaskConfirmCard
              task={generated}
              onChange={handleConfirmChange}
              onSave={handleSave}
              onCancel={onClose}
              regenerating={regenerating}
              regenError={regenError}
            />
          )}

          {/* Multi-task review */}
          {stage === 'multi-review' && multiTasks && (
            <BrainDumpReview
              tasks={multiTasks}
              onSave={handleMultiSave}
              onCancel={onClose}
              saving={saving}
              saveError={saveError}
            />
          )}

          {/* Refusal */}
          {stage === 'refusal' && refusal && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EAE4DA', padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif', marginBottom: 18 }}>
                {refusal.message || "Mitzy isn't the right place for this — but help is available."}
              </div>
              {refusal.resource && (
                <a
                  href={refusal.resource.type === 'phone' ? `tel:${refusal.resource.value}` : refusal.resource.value}
                  target={refusal.resource.type === 'url' ? '_blank' : undefined}
                  rel={refusal.resource.type === 'url' ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'inline-block', padding: '12px 20px', background: C.brand,
                    color: '#E8F5EE', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    fontFamily: 'DM Sans, sans-serif', textDecoration: 'none', marginBottom: 14,
                  }}
                >
                  {refusal.resource.label}
                </a>
              )}
              <div>
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 20px', background: 'transparent', color: C.muted,
                    border: '1.5px solid #EAE4DA', borderRadius: 10,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Needs Mitzy Pro — always offers the manual route out, since that
              path needs no API call and gets the task written down either way */}
          {stage === 'upgrade' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EAE4DA', padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif', marginBottom: 18 }}>
                {upgrade?.reason === 'pro_only'
                  ? 'Turning a brain dump into tasks is a Mitzy Pro feature.'
                  : "You've used your free AI assists for this month."}
              </div>
              <button
                onClick={() => setUpgradeOpen(true)}
                style={{
                  display: 'inline-block', padding: '12px 20px', background: C.brand,
                  color: '#E8F5EE', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', marginBottom: 14,
                }}
              >
                See Mitzy Pro
              </button>
              <div>
                <button
                  onClick={() => {
                    setManual({ label: prompt.trim().slice(0, 80), cat: 'home' });
                    setStage('manual');
                  }}
                  style={{
                    padding: '10px 20px', background: 'transparent', color: C.muted,
                    border: '1.5px solid #EAE4DA', borderRadius: 10,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Add it myself instead
                </button>
              </div>
            </div>
          )}

          {/* Manual fallback (tier 0) */}
          {stage === 'manual' && manual && (
            <div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
                Mitzy couldn't tell exactly what to set up. Want to add it as a basic reminder?
              </div>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EAE4DA', padding: '14px', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>Task name</div>
                <input
                  value={manual.label}
                  onChange={e => setManual(m => ({ ...m, label: e.target.value }))}
                  placeholder="e.g. Buy birthday gift"
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 14,
                    fontFamily: 'DM Sans, sans-serif', border: '1.5px solid #EAE4DA',
                    borderRadius: 10, background: '#fff', color: C.ink, boxSizing: 'border-box',
                  }}
                />
              </div>
              {saveError && (
                <div style={{ fontSize: 12, color: C.red, marginBottom: 10, fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>{saveError}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '14px 18px', background: '#fff', color: C.muted,
                    border: '1.5px solid #EAE4DA', borderRadius: 14,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualSave}
                  disabled={saving || !manual.label.trim()}
                  style={{
                    flex: 1, padding: '14px',
                    background: (saving || !manual.label.trim()) ? '#7A9B8E' : C.brand,
                    color: '#E8F5EE', border: 'none', borderRadius: 14,
                    fontSize: 15, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                    cursor: (saving || !manual.label.trim()) ? 'default' : 'pointer',
                  }}
                >
                  {saving ? 'Saving…' : 'Add as reminder'}
                </button>
              </div>
            </div>
          )}

          {saveError && stage === 'confirm' && (
            <div style={{ fontSize: 12, color: C.red, marginTop: 8, fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}>{saveError}</div>
          )}

        </div>
      </div>

      {upgradeOpen && (
        <UpgradeSheet {...(upgrade || {})} onClose={() => setUpgradeOpen(false)} />
      )}

      <style>{`
        @keyframes mitzyPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
