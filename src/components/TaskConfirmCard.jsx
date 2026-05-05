import { useState } from "react";
import { C, CAT_META } from "../data/constants";
import { CategoryTile } from "./CategoryIcons";
import { FrequencyPicker, formatIntervalDays } from "./FrequencyPicker";

export function TaskConfirmCard({ task, onChange, onSave, onCancel, regenerating, regenError }) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(task.label || '');
  const [editingCat, setEditingCat] = useState(false);
  const [editingFreq, setEditingFreq] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showHow, setShowHow] = useState(false);

  const meta = CAT_META[task.cat] || CAT_META.home;
  const isLocked = task.riskTier === 3;
  const canDIY = task.riskTier === 2 && task.assistType === 'guidance_companies';

  const cycleAssumption = (key) => {
    const a = (task.assumptions || []).find(x => x.key === key);
    if (!a || !Array.isArray(a.options) || a.options.length < 2) return;
    const idx = a.options.indexOf(a.label);
    const next = a.options[(idx + 1) % a.options.length];
    onChange({ regenerate: { key, value: next } });
  };

  const setLabel = () => {
    const v = labelDraft.trim();
    if (v) onChange({ patch: { label: v } });
    setEditingLabel(false);
  };

  const setCat = (newCat) => {
    onChange({ patch: { cat: newCat } });
    setEditingCat(false);
  };

  const setInterval = (days) => {
    onChange({ patch: { intervalDays: days, windowDays: Math.max(3, Math.round(days * 0.2)), oneTime: false } });
    setEditingFreq(false);
  };

  const setOneTime = (oneTime) => {
    if (oneTime) {
      onChange({ patch: { oneTime: true, intervalDays: null, windowDays: 14 } });
    } else {
      onChange({ patch: { oneTime: false, intervalDays: task.intervalDays || 30, windowDays: task.windowDays || 7 } });
    }
  };

  const toggleDIY = () => {
    if (!canDIY) return;
    const newAssist = task.assistType === 'guidance_companies' ? 'guidance' : 'guidance_companies';
    onChange({ patch: { assistType: newAssist } });
  };

  const handleSave = () => {
    onSave({ ...task });
  };

  return (
    <div style={{ opacity: regenerating ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      {/* Label */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', padding:'14px 15px', marginBottom:10 }}>
        {!editingLabel ? (
          <div onClick={() => { setEditingLabel(true); setLabelDraft(task.label); }} style={{ cursor:'pointer' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, marginBottom:6, fontFamily:"'Righteous', cursive" }}>Task</div>
            <div style={{ fontSize:20, fontWeight:700, color:C.ink, fontFamily:'DM Sans, sans-serif', lineHeight:1.3 }}>
              {task.label}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, marginBottom:6, fontFamily:"'Righteous', cursive" }}>Task</div>
            <input
              autoFocus
              value={labelDraft}
              onChange={e => setLabelDraft(e.target.value)}
              onBlur={setLabel}
              onKeyDown={e => { if (e.key === 'Enter') setLabel(); if (e.key === 'Escape') setEditingLabel(false); }}
              style={{
                width:'100%', padding:'8px 10px', fontSize:18, fontWeight:700,
                fontFamily:'DM Sans, sans-serif', border:'1.5px solid #1A5C3A',
                borderRadius:8, background:'#fff', color:C.ink, boxSizing:'border-box',
              }}
            />
          </div>
        )}
      </div>

      {/* Category */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', padding:'12px 14px', marginBottom:10, position:'relative' }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, marginBottom:8, fontFamily:"'Righteous', cursive" }}>Category</div>
        <button
          onClick={() => setEditingCat(v => !v)}
          style={{
            display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
            background:C.light, border:'none', borderRadius:10, cursor:'pointer',
            fontFamily:'DM Sans, sans-serif', fontSize:14, fontWeight:600, color:C.ink,
          }}
        >
          <CategoryTile cat={task.cat} size={26} />
          <span>{meta.label}</span>
          <span style={{ color:C.muted, marginLeft:6 }}>▾</span>
        </button>
        {editingCat && (
          <div style={{
            position:'absolute', top:'calc(100% - 8px)', left:14, right:14, zIndex:10,
            background:'#fff', borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,0.12)', overflow:'hidden',
          }}>
            {Object.entries(CAT_META).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setCat(k)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  background: k === task.cat ? C.light : 'transparent', border:'none', cursor:'pointer',
                  fontSize:14, fontWeight:600, color:C.ink, textAlign:'left',
                  fontFamily:'DM Sans, sans-serif',
                }}
              >
                <CategoryTile cat={k} size={26} />
                <span>{v.label}</span>
                {k === task.cat && <span style={{ marginLeft:'auto', color:C.mint }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Frequency */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', padding:'12px 14px', marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: editingFreq ? 8 : 0 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, fontFamily:"'Righteous', cursive" }}>Frequency</div>
          <button
            onClick={() => setEditingFreq(v => !v)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, color:C.brand, fontFamily:'DM Sans, sans-serif' }}
          >
            {editingFreq ? 'Done' : 'Change'}
          </button>
        </div>
        <div style={{ fontSize:14, fontWeight:600, color:C.ink, fontFamily:'DM Sans, sans-serif', marginTop: editingFreq ? 0 : 6 }}>
          {task.oneTime ? 'One time' : (formatIntervalDays(task.intervalDays) || 'Not set')}
        </div>
        {editingFreq && (
          <div style={{ marginTop:10 }}>
            <FrequencyPicker
              value={task.intervalDays}
              defaultDays={task.intervalDays}
              onChange={setInterval}
              oneTime={!!task.oneTime}
              onToggleOneTime={setOneTime}
            />
          </div>
        )}
      </div>

      {/* Assumptions */}
      {Array.isArray(task.assumptions) && task.assumptions.length > 0 && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', padding:'12px 14px', marginBottom:10 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, marginBottom:8, fontFamily:"'Righteous', cursive" }}>Assumptions — tap to flip</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {task.assumptions.map(a => {
              const flippable = Array.isArray(a.options) && a.options.length > 1;
              return (
                <button
                  key={a.key}
                  onClick={() => flippable && cycleAssumption(a.key)}
                  disabled={!flippable || regenerating}
                  style={{
                    padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700,
                    fontFamily:'DM Sans, sans-serif', border:'1.5px solid #1A5C3A',
                    background:'#1A5C3A', color:'#E8F5EE',
                    cursor: flippable && !regenerating ? 'pointer' : 'default',
                    opacity: flippable ? 1 : 0.6,
                  }}
                >
                  {a.label}{flippable ? ' ↻' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DIY toggle for T2 */}
      {canDIY && (
        <div style={{ background:'#FFF8E1', border:'1px solid #F4C430', borderRadius:14, padding:'10px 14px', marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1, fontSize:12, color:C.ink, fontFamily:'DM Sans, sans-serif' }}>
            Mitzy recommends a pro for this. Want to do it yourself?
          </div>
          <button
            onClick={toggleDIY}
            style={{
              padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700,
              fontFamily:'DM Sans, sans-serif', cursor:'pointer', border:'1.5px solid #1A5C3A',
              background: task.assistType === 'guidance' ? '#1A5C3A' : '#fff',
              color: task.assistType === 'guidance' ? '#E8F5EE' : C.ink,
            }}
          >
            {task.assistType === 'guidance' ? 'DIY ✓' : 'I\'ll do it myself'}
          </button>
        </div>
      )}

      {/* Locked T3 notice */}
      {isLocked && (
        <div style={{ background:'#FDE8E8', border:'1px solid #F5C4C4', borderRadius:14, padding:'10px 14px', marginBottom:10, fontSize:12, color:C.ink, fontFamily:'DM Sans, sans-serif', lineHeight:1.5 }}>
          <strong>Pro required.</strong> This task involves safety-critical work — Mitzy will help you find a qualified professional.
        </div>
      )}

      {/* Why preview */}
      {task.why && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', marginBottom:10 }}>
          <button
            onClick={() => setShowWhy(v => !v)}
            style={{ width:'100%', padding:'12px 14px', background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'DM Sans, sans-serif' }}
          >
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, fontFamily:"'Righteous', cursive" }}>Why it matters</span>
            <span style={{ color:C.muted, fontSize:13 }}>{showWhy ? '−' : '+'}</span>
          </button>
          {showWhy && (
            <div style={{ padding:'0 14px 12px', fontSize:13, color:C.ink, lineHeight:1.6, fontFamily:'DM Sans, sans-serif' }}>
              {task.why}
            </div>
          )}
        </div>
      )}

      {/* Guidance preview */}
      {task.guidance && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', marginBottom:10 }}>
          <button
            onClick={() => setShowHow(v => !v)}
            style={{ width:'100%', padding:'12px 14px', background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'DM Sans, sans-serif' }}
          >
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.muted, fontFamily:"'Righteous', cursive" }}>How to do it</span>
            <span style={{ color:C.muted, fontSize:13 }}>{showHow ? '−' : '+'}</span>
          </button>
          {showHow && (
            <div style={{ padding:'0 14px 12px', fontSize:13, color:C.ink, lineHeight:1.6, fontFamily:'DM Sans, sans-serif', whiteSpace:'pre-wrap' }}>
              {task.guidance}
            </div>
          )}
        </div>
      )}

      {/* Regen error */}
      {regenError && (
        <div style={{ fontSize:12, color:C.red, marginBottom:10, fontFamily:'DM Sans, sans-serif', textAlign:'center' }}>
          {regenError}
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:8 }}>
        <button
          onClick={onCancel}
          style={{
            padding:'14px 18px', background:'#fff', color:C.muted,
            border:'1.5px solid #EAE4DA', borderRadius:14,
            fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={regenerating}
          style={{
            flex:1, padding:'14px', background: regenerating ? '#7A9B8E' : C.brand,
            color:'#E8F5EE', border:'none', borderRadius:14,
            fontSize:15, fontWeight:700, cursor: regenerating ? 'default' : 'pointer',
            fontFamily:'DM Sans, sans-serif',
          }}
        >
          Add to my tasks
        </button>
      </div>
    </div>
  );
}
