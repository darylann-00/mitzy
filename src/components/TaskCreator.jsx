import { useState, useEffect, useRef } from "react";
import { C, CAT_META } from "../data/constants";
import { useProfileContext } from "../contexts/ProfileContext";
import { useTaskContext } from "../contexts/TaskContext";
import { supabase } from "../lib/supabase";
import { TaskConfirmCard } from "./TaskConfirmCard";
import { BrainDumpReview } from "./BrainDumpReview";

const PLACEHOLDERS = [
  "e.g. fix iPad screen",
  "e.g. fertilize my orchid",
  "e.g. clean the gutters",
  "e.g. schedule a vet visit for the dog",
  "e.g. change HVAC filter, schedule dentist, get car inspected",
];

const FREQ_OPTIONS = [
  { label: "Monthly",      days: 30  },
  { label: "Every 3 mo",   days: 90  },
  { label: "Every 6 mo",   days: 180 },
  { label: "Yearly",       days: 365 },
  { label: "Every 2 years", days: 730 },
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

function genTaskId() {
  const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 4)
    : Math.random().toString(36).slice(2, 6);
  return `custom-${Date.now()}-${rand}`;
}

export function TaskCreator({ onClose }) {
  const { profile, taskLibrary, addCustomTask, addCustomTasksBulk } = useProfileContext();
  const { markNeeded, setDueDate } = useTaskContext();

  const [mode, setMode] = useState('ai');
  const [stage, setStage] = useState('input');
  const [prompt, setPrompt] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [multiTasks, setMultiTasks] = useState(null);
  const [refusal, setRefusal] = useState(null);
  const [manual, setManual] = useState(null);
  const [errorKind, setErrorKind] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Manual mode state
  const [manualLabel, setManualLabel] = useState('');
  const [manualCat, setManualCat] = useState('home');
  const [manualFreq, setManualFreq] = useState(90);
  const [manualStakes, setManualStakes] = useState('medium');
  const [manualErr, setManualErr] = useState('');

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
      body: JSON.stringify({ prompt: promptText, profile: profileForServer, existingTaskLabels, regenerate: regenerate || null }),
    });
    if (!res.ok) throw new Error(String(res.status));
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
          if (err.name !== 'AbortError') setRegenError("Couldn't update — try a different option");
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
      const { includeInFocus: _ignored, dueDate, ...task } = taskToSave;
      await addCustomTask(task);
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
      const tasksWithoutDates = selectedTasks.map(({ dueDate, ...rest }) => rest);
      await addCustomTasksBulk(tasksWithoutDates);
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
    setSaving(true);
    setSaveError(null);
    try {
      const task = {
        id: genTaskId(),
        cat: manualCat,
        label: manualLabel.trim(),
        intervalDays: manualFreq,
        windowDays: Math.round(manualFreq * 0.2),
        stakes: manualStakes,
        activeMonths: null,
        requires: [],
        assistType: 'guidance',
        note: 'Custom task.',
        isCustom: true,
        isAIGenerated: false,
      };
      await addCustomTask(task);
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

  const STAKES_COLORS = { low: C.mint, medium: C.yellow, high: C.coral };

  const subtitleText = (() => {
    if (mode === 'manual') return 'Add a quick reminder';
    if (stage === 'input')        return 'Tell Mitzy what you need to get done';
    if (stage === 'loading')      return 'Mitzy is working on it…';
    if (stage === 'confirm')      return 'Review and tweak before saving';
    if (stage === 'multi-review') return 'Uncheck any you don\'t need';
    if (stage === 'refusal')      return 'Resources for this';
    if (stage === 'manual')       return 'Add it as a basic reminder';
    return '';
  })();

  const headerTitle = stage === 'multi-review' && multiTasks
    ? `${multiTasks.length} tasks found`
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

      {/* Mode switcher */}
      {stage === 'input' && (
        <div style={{ display: 'flex', gap: 0, background: '#0F3D27', borderRadius: 10, padding: 3, margin: '0 18px', flexShrink: 0, marginTop: -4 }}>
          <button
            onClick={() => setMode('ai')}
            style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 5, transition: 'all 0.15s',
              background: mode === 'ai' ? '#E8F5EE' : 'transparent',
              color: mode === 'ai' ? '#1A5C3A' : '#7DD8B0',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill="currentColor" />
            </svg>
            Mitzy magic
          </button>
          <button
            onClick={() => setMode('manual')}
            style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 5, transition: 'all 0.15s',
              background: mode === 'manual' ? '#E8F5EE' : 'transparent',
              color: mode === 'manual' ? '#1A5C3A' : '#7DD8B0',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            Do it myself
          </button>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#FDFAF2' }}>
        <div style={{ padding: '16px 18px 32px', maxWidth: 640, margin: '0 auto' }}>

          {/* AI input */}
          {stage === 'input' && mode === 'ai' && (
            <div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
                One task or a whole list — Mitzy will figure it out.
              </div>
              <textarea
                autoFocus
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={PLACEHOLDERS[phIdx]}
                rows={5}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 15,
                  fontFamily: 'DM Sans, sans-serif', border: '1.5px solid #EAE4DA',
                  borderRadius: 14, background: '#fff', color: C.ink,
                  resize: 'vertical', minHeight: 110, boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>Task name</div>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Clean washing machine"
                  value={manualLabel}
                  onChange={e => setManualLabel(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 15,
                    fontFamily: 'DM Sans, sans-serif', border: '1.5px solid #EAE4DA',
                    borderRadius: 10, background: '#fff', color: C.ink, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>Category</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(CAT_META).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setManualCat(k)}
                      style={{
                        padding: '7px 12px', borderRadius: 10, border: 'none',
                        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                        background: manualCat === k ? v.color : C.light,
                        color: manualCat === k ? C.white : C.ink,
                      }}
                    >
                      {v.emoji} {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>How often?</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {FREQ_OPTIONS.map(o => (
                    <button
                      key={o.days}
                      onClick={() => setManualFreq(o.days)}
                      style={{
                        padding: '7px 12px', borderRadius: 10,
                        border: `1.5px solid ${manualFreq === o.days ? C.brand : '#EAE4DA'}`,
                        background: manualFreq === o.days ? C.brand : '#fff',
                        fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer',
                        color: manualFreq === o.days ? '#E8F5EE' : C.ink,
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>How important?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {["low", "medium", "high"].map(s => (
                    <button
                      key={s}
                      onClick={() => setManualStakes(s)}
                      style={{
                        flex: 1, padding: '10px', fontSize: 14,
                        background: manualStakes === s ? STAKES_COLORS[s] : C.light,
                        color: manualStakes === s ? C.white : C.ink,
                        border: 'none', borderRadius: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {manualErr && <div style={{ fontSize: 13, color: C.coral, fontFamily: 'DM Sans, sans-serif' }}>{manualErr}</div>}
              {saveError && <div style={{ fontSize: 13, color: C.coral, fontFamily: 'DM Sans, sans-serif' }}>{saveError}</div>}
              <button
                onClick={handleManualAdd}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px', fontSize: 16,
                  background: saving ? '#7A9B8E' : C.coral, color: C.white,
                  border: 'none', borderRadius: 14, fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(255,92,92,0.3)',
                  cursor: saving ? 'default' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {saving ? 'Saving…' : 'add to my list →'}
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

      <style>{`
        @keyframes mitzyPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
