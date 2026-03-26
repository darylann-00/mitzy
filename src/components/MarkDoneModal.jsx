import { useState } from "react";
import { ASSIST_CACHE_PREFIX } from "../utils/storage";

const PRAISE = [
  "You are so on top of it.",
  "Look at you, handling it.",
  "One less thing to carry.",
];

function parseProviders(text) {
  try {
    const match = text?.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return null;
}

function getSessionProviders(taskId) {
  try {
    const raw = localStorage.getItem(`${ASSIST_CACHE_PREFIX}-${taskId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const providers = parseProviders(typeof parsed.data === 'string' ? parsed.data : '');
      return providers?.slice(0, 3) || [];
    }
  } catch {}
  return [];
}

export function MarkDoneModal({ task, onDone, onClose, providerHistory, onSaveProvider }) {
  const [step,     setStep]     = useState('date'); // 'date' | 'celebrate'
  const [dateStr,  setDateStr]  = useState('');
  const [selected, setSelected] = useState(null);
  const [vote,     setVote]     = useState(null);
  const [note,     setNote]     = useState('');
  const [provSaved, setProvSaved] = useState(false);

  const praiseText = PRAISE[task.id.charCodeAt(0) % PRAISE.length];
  const sessionProviders = getSessionProviders(task.id);
  const savedProvider    = providerHistory?.[task.id];
  const showProvQ        = task.assistType === 'providers';

  // Merge: saved provider (if not in session) + session providers
  const providerChips = (() => {
    const chips = [...sessionProviders];
    if (savedProvider && !chips.find(p => p.name === savedProvider.name)) {
      chips.unshift({ name: savedProvider.name, ...savedProvider });
    }
    return chips;
  })();

  const handleDone = () => {
    onDone(task.id, dateStr || null);
    setStep('celebrate');
  };

  const handleSaveProvider = () => {
    if (!selected || selected === 'other') {
      setProvSaved(true);
      return;
    }
    onSaveProvider?.(task.id, { ...selected, vote, notes: note });
    setProvSaved(true);
  };

  // ── Date step ─────────────────────────────────────────────────────────────────
  if (step === 'date') {
    return (
      <div
        style={{ position:'fixed', inset:0, background:'rgba(15,30,20,0.65)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="pIn" style={{ background:'#FDFAF2', maxWidth:380, width:'100%', borderRadius:20, padding:'24px 22px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#E8F5EE', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <polyline points="3,9 7,13 15,4" stroke="#06A77D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontFamily:"'Righteous', cursive", fontSize:20, color:'#06A77D', marginBottom:5 }}>Mark as done</div>
          <div style={{ fontSize:14, color:'#1C2B22', marginBottom:20, lineHeight:1.4, fontFamily:'DM Sans, sans-serif' }}>{task.label}</div>

          <div style={{ fontSize:12, color:'#4A6256', marginBottom:6, fontWeight:600, fontFamily:'DM Sans, sans-serif' }}>
            When? <span style={{ fontWeight:400 }}>(optional)</span>
          </div>
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={dateStr}
            onChange={e => setDateStr(e.target.value)}
            style={{ marginBottom:16 }}
          />

          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={onClose}
              style={{ flex:1, padding:'12px', background:'#F0EDE4', color:'#4A6256', border:'none', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
            >
              cancel
            </button>
            <button
              onClick={handleDone}
              style={{ flex:2, padding:'12px', background:'#06A77D', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
            >
              {dateStr ? 'save date' : 'done today'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Celebrate step ────────────────────────────────────────────────────────────
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,30,20,0.65)', zIndex:600, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div className="sUp" style={{ background:'#FDFAF2', width:'100%', maxWidth:480, borderRadius:'20px 20px 0 0', padding:'24px 20px 36px', maxHeight:'88vh', overflowY:'auto' }}>

        {/* Praise */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontFamily:"'Righteous', cursive", fontSize:26, color:'#06A77D', marginBottom:6 }}>{praiseText}</div>
          <div style={{ fontSize:13, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>Mitzy's got it from here.</div>
        </div>

        {/* Provider question */}
        {showProvQ && !provSaved && (
          <div style={{ background:'#fff', borderRadius:14, padding:14, border:'1px solid #EAE4DA', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#1C2B22', marginBottom:10, fontFamily:'DM Sans, sans-serif' }}>
              Want to tell me where you went?
            </div>
            <div style={{ fontSize:12, color:'#4A6256', marginBottom:10, fontFamily:'DM Sans, sans-serif' }}>
              So we can remember for next time.
            </div>

            {/* Provider chips */}
            {providerChips.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                {providerChips.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(p)}
                    style={{
                      borderRadius:20, padding:'7px 13px', fontSize:12, fontWeight:700,
                      cursor:'pointer', border:'1.5px solid #D4E8DC', fontFamily:'DM Sans, sans-serif',
                      background: selected?.name === p.name ? '#1A5C3A' : '#fff',
                      color: selected?.name === p.name ? '#E8F5EE' : '#1C2B22',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
                <button
                  onClick={() => setSelected('other')}
                  style={{
                    borderRadius:20, padding:'7px 13px', fontSize:12, fontWeight:700, cursor:'pointer',
                    fontFamily:'DM Sans, sans-serif', border:'1px solid #E0D8CC',
                    background: selected === 'other' ? '#1A5C3A' : '#F0EDE4',
                    color: selected === 'other' ? '#E8F5EE' : '#4A6256',
                  }}
                >
                  Somewhere else
                </button>
              </div>
            )}

            {/* Vote */}
            {selected && selected !== 'other' && (
              <>
                <div style={{ display:'flex', gap:7, marginBottom:10 }}>
                  <button
                    onClick={() => setVote('good')}
                    style={{ flex:1, borderRadius:10, padding:'9px 0', fontSize:12, fontWeight:700, border:'1.5px solid #C8E8D4', cursor:'pointer', fontFamily:'DM Sans, sans-serif', background: vote==='good' ? '#1A5C3A' : '#E8F5EE', color: vote==='good' ? '#E8F5EE' : '#1A5C3A' }}
                  >
                    Would go back
                  </button>
                  <button
                    onClick={() => setVote('bad')}
                    style={{ flex:1, borderRadius:10, padding:'9px 0', fontSize:12, fontWeight:700, border:'1.5px solid #F5C4C4', cursor:'pointer', fontFamily:'DM Sans, sans-serif', background: vote==='bad' ? '#D62828' : '#FDE8E8', color: vote==='bad' ? '#fff' : '#D62828' }}
                  >
                    Would avoid
                  </button>
                </div>
                <input
                  placeholder="Any notes? (optional)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ marginBottom:10 }}
                />
              </>
            )}

            <div style={{ display:'flex', gap:8 }}>
              {selected && (
                <button
                  onClick={handleSaveProvider}
                  disabled={selected !== 'other' && !vote}
                  style={{
                    flex:2, padding:'10px', fontSize:13, fontWeight:700, border:'none', borderRadius:10, cursor: (selected === 'other' || vote) ? 'pointer' : 'default', fontFamily:'DM Sans, sans-serif',
                    background: (selected === 'other' || vote) ? '#1A5C3A' : '#D0C8C0', color:'#E8F5EE',
                  }}
                >
                  Save
                </button>
              )}
              <button
                onClick={() => setProvSaved(true)}
                style={{ flex:1, padding:'10px', fontSize:12, background:'none', border:'none', color:'#A8BEB2', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                maybe later
              </button>
            </div>
          </div>
        )}

        {/* Saved confirmation */}
        {provSaved && selected && selected !== 'other' && (
          <div style={{ background:'#E8F5EE', borderRadius:14, padding:'13px 14px', border:'2px solid #1A5C3A', marginBottom:12, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'#1A5C3A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <polyline points="2,7 5.5,10.5 12,3.5" stroke="#E8F5EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>{selected.name} saved</div>
              <div style={{ fontSize:11, color:'#4A6256', marginTop:2, fontFamily:'DM Sans, sans-serif' }}>
                {vote === 'good' ? "Mitzy will suggest them next time" : "Mitzy won't suggest them again"}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{ width:'100%', background:'#1A5C3A', border:'none', borderRadius:12, padding:14, fontSize:14, fontWeight:700, color:'#E8F5EE', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
        >
          Back to my list
        </button>

      </div>
    </div>
  );
}
