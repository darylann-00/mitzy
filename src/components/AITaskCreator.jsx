import { useState, useEffect, useRef } from "react";
import { C } from "../data/constants";
import { useProfileContext } from "../contexts/ProfileContext";
import { useTaskContext } from "../contexts/TaskContext";
import { supabase } from "../lib/supabase";
import { TaskConfirmCard } from "./TaskConfirmCard";

const PLACEHOLDERS = [
  "e.g. fix iPad screen",
  "e.g. fertilize my orchid",
  "e.g. clean the gutters",
  "e.g. schedule a vet visit for the dog",
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
    <div style={{ textAlign:'center', padding:'48px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:18 }}>
        {dots.map((color, i) => (
          <div key={i} style={{
            width:14, height:14, borderRadius:'50%', background:color,
            animation: `mitzyPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <div style={{ fontSize:13, color:C.muted, fontFamily:'DM Sans, sans-serif' }}>{messages[idx]}</div>
    </div>
  );
}

function genTaskId() {
  const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 4)
    : Math.random().toString(36).slice(2, 6);
  return `custom-${Date.now()}-${rand}`;
}

export function AITaskCreator({ onClose }) {
  const { profile, taskLibrary, addCustomTask } = useProfileContext();
  const { markNeeded } = useTaskContext();

  const [stage, setStage] = useState('input');
  const [prompt, setPrompt] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [refusal, setRefusal] = useState(null);
  const [manual, setManual] = useState(null);
  const [errorKind, setErrorKind] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const abortRef = useRef(null);
  const regenTimerRef = useRef(null);

  useEffect(() => {
    if (stage !== 'input') return;
    const id = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, [stage]);

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
      const { includeInFocus: _ignored, ...task } = taskToSave;
      await addCustomTask(task);
      try { await markNeeded(task.id); } catch {}
      onClose();
    } catch (err) {
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
        assistType: null,
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

  const errorMessage = (() => {
    if (errorKind === 'offline')    return 'No internet connection. Check your connection and try again.';
    if (errorKind === 'rate_limit') return 'Too many requests right now. Wait a moment and try again.';
    if (errorKind === 'too_long')   return 'That prompt is too long — try shortening it.';
    if (errorKind === 'timeout')    return 'The server took too long. Try again in a moment.';
    if (errorKind === 'general')    return "Something went wrong. Try again?";
    return null;
  })();

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,30,20,0.75)', zIndex:500, display:'flex', flexDirection:'column' }}>
      {/* Green header */}
      <div style={{ background:'#1A5C3A', padding:'18px 18px 16px', position:'relative', overflow:'hidden', flexShrink:0 }}>
        <div style={{ position:'absolute', width:50, height:50, borderRadius:'50%', background:'#0F3D27', top:-14, right:-12 }} />
        <div style={{ position:'absolute', width:22, height:22, borderRadius:'50%', background:'#06A77D', top:8, right:22 }} />
        <div style={{ position:'absolute', width:10, height:10, background:'#F77F00', transform:'rotate(45deg)', bottom:8, right:16 }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill="#E8F5EE" />
            </svg>
            <span style={{ fontFamily:"'Righteous', cursive", fontSize:20, color:'#E8F5EE' }}>add a task</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width:32, height:32, borderRadius:8, background:'#0F3D27', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="3" y1="3" x2="11" y2="11" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" />
              <line x1="11" y1="3" x2="3" y2="11" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize:12, color:'#7DD8B0', marginTop:6, fontFamily:'DM Sans, sans-serif', position:'relative' }}>
          {stage === 'input'    && 'Describe a task in your own words'}
          {stage === 'loading'  && 'Mitzy is working on it…'}
          {stage === 'confirm'  && 'Review and tweak before saving'}
          {stage === 'refusal'  && 'Resources for this'}
          {stage === 'manual'   && 'Add it as a basic reminder'}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', background:'#FDFAF2' }}>
        <div style={{ padding:'16px 18px 32px', maxWidth:640, margin:'0 auto' }}>

          {stage === 'input' && (
            <div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>
                Tell Mitzy what you want to track and we'll set it up.
              </div>
              <textarea
                autoFocus
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={PLACEHOLDERS[phIdx]}
                rows={4}
                style={{
                  width:'100%', padding:'12px 14px', fontSize:15,
                  fontFamily:'DM Sans, sans-serif', border:'1.5px solid #EAE4DA',
                  borderRadius:14, background:'#fff', color:C.ink,
                  resize:'vertical', minHeight:96, boxSizing:'border-box',
                  lineHeight:1.5,
                }}
              />
              {errorMessage && (
                <div style={{ marginTop:10, fontSize:13, color:C.red, fontFamily:'DM Sans, sans-serif' }}>{errorMessage}</div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                style={{
                  width:'100%', marginTop:14, padding:'14px',
                  background: prompt.trim() ? C.brand : '#C8D9D1',
                  color:'#E8F5EE', border:'none', borderRadius:14,
                  fontSize:15, fontWeight:700, fontFamily:'DM Sans, sans-serif',
                  cursor: prompt.trim() ? 'pointer' : 'default',
                }}
              >
                Let's do it
              </button>
            </div>
          )}

          {stage === 'loading' && (
            <PulseLoader messages={[
              'Thinking about your task...',
              'Picking the right schedule...',
              'Personalizing for your home...',
            ]} />
          )}

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

          {stage === 'refusal' && refusal && (
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', padding:'18px 16px', textAlign:'center' }}>
              <div style={{ fontSize:14, color:C.ink, lineHeight:1.6, fontFamily:'DM Sans, sans-serif', marginBottom:18 }}>
                {refusal.message || "Mitzy isn't the right place for this — but help is available."}
              </div>
              {refusal.resource && (
                <a
                  href={refusal.resource.type === 'phone' ? `tel:${refusal.resource.value}` : refusal.resource.value}
                  target={refusal.resource.type === 'url' ? '_blank' : undefined}
                  rel={refusal.resource.type === 'url' ? 'noopener noreferrer' : undefined}
                  style={{
                    display:'inline-block', padding:'12px 20px', background:C.brand,
                    color:'#E8F5EE', borderRadius:12, fontSize:14, fontWeight:700,
                    fontFamily:'DM Sans, sans-serif', textDecoration:'none', marginBottom:14,
                  }}
                >
                  {refusal.resource.label}
                </a>
              )}
              <div>
                <button
                  onClick={onClose}
                  style={{
                    padding:'10px 20px', background:'transparent', color:C.muted,
                    border:'1.5px solid #EAE4DA', borderRadius:10,
                    fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {stage === 'manual' && manual && (
            <div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:12, fontFamily:'DM Sans, sans-serif', lineHeight:1.5 }}>
                Mitzy couldn't tell exactly what to set up. Want to add it as a basic reminder?
              </div>
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', padding:'14px', marginBottom:10 }}>
                <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:6, fontFamily:'DM Sans, sans-serif' }}>Task name</div>
                <input
                  value={manual.label}
                  onChange={e => setManual(m => ({ ...m, label: e.target.value }))}
                  placeholder="e.g. Buy birthday gift"
                  style={{
                    width:'100%', padding:'10px 12px', fontSize:14,
                    fontFamily:'DM Sans, sans-serif', border:'1.5px solid #EAE4DA',
                    borderRadius:10, background:'#fff', color:C.ink, boxSizing:'border-box',
                  }}
                />
              </div>
              {saveError && (
                <div style={{ fontSize:12, color:C.red, marginBottom:10, fontFamily:'DM Sans, sans-serif', textAlign:'center' }}>{saveError}</div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                <button
                  onClick={onClose}
                  style={{
                    padding:'14px 18px', background:'#fff', color:C.muted,
                    border:'1.5px solid #EAE4DA', borderRadius:14,
                    fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualSave}
                  disabled={saving || !manual.label.trim()}
                  style={{
                    flex:1, padding:'14px',
                    background: (saving || !manual.label.trim()) ? '#7A9B8E' : C.brand,
                    color:'#E8F5EE', border:'none', borderRadius:14,
                    fontSize:15, fontWeight:700, fontFamily:'DM Sans, sans-serif',
                    cursor: (saving || !manual.label.trim()) ? 'default' : 'pointer',
                  }}
                >
                  {saving ? 'Saving…' : 'Add as reminder'}
                </button>
              </div>
            </div>
          )}

          {saveError && stage === 'confirm' && (
            <div style={{ fontSize:12, color:C.red, marginTop:8, fontFamily:'DM Sans, sans-serif', textAlign:'center' }}>{saveError}</div>
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
