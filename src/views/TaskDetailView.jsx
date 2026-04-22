import { useState, useRef, useEffect } from "react";
import { CAT_META } from "../data/constants";
import { CAT_ICON_CONFIG } from "../components/CategoryIcons";

function formatIntervalDays(days) {
  if (!days) return null;
  if (days < 14) return `every ${days} day${days !== 1 ? 's' : ''}`;
  if (days < 60) return `every ${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`;
  if (days < 365) return `every ${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`;
  const years = Math.round(days / 365);
  return `every ${years} year${years !== 1 ? 's' : ''}`;
}

const FREQ_CANDIDATES = [3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365, 548, 730, 1095, 1460, 1825, 2555, 3650];

function getFrequencyPresets(defaultDays) {
  const below = FREQ_CANDIDATES.filter(d => d < defaultDays).slice(-4);
  return [...new Set([...below, defaultDays])];
}


const ASSIST_SUBTITLES = {
  providers: (task) => {
    const meta = CAT_META[task.cat];
    return `Find a local ${meta?.label?.toLowerCase() || 'service'} near you`;
  },
  script:   () => 'Help me make the call',
  deadline: () => 'Show me the key dates and links',
  guidance: () => null,
};

// ─── Calendar SVG ──────────────────────────────────────────────────────────────
function CalSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="2" fill="#4A6256" />
      <line x1="2" y1="7" x2="16" y2="7" stroke="#FDFAF2" strokeWidth="1.5" />
      <line x1="6" y1="3" x2="6" y2="7" stroke="#FDFAF2" strokeWidth="1.5" />
      <line x1="12" y1="3" x2="12" y2="7" stroke="#FDFAF2" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Four dot mark ─────────────────────────────────────────────────────────────
function FourDots({ size = 7 }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', background:'#D62828' }} />
      <div style={{ width:size, height:size, borderRadius:'50%', background:'#F77F00' }} />
      <div style={{ width:size, height:size, borderRadius:'50%', background:'#06A77D' }} />
      <div style={{ width:size, height:size, borderRadius:'50%', background:'#F4C430' }} />
    </div>
  );
}

export function TaskDetailView({ task, status, taskState, savedProvider, getNext, onAssist, onSchedule, onDone, onBack, onMarkDone, onSetIntervalOverride }) {
  const entry    = taskState[task.id];
  const meta     = CAT_META[task.cat] || CAT_META.home;
  const iconCfg  = CAT_ICON_CONFIG[task.cat] || CAT_ICON_CONFIG.home;
  const isOverdue = status === 'due' || status === 'confirm';
  const [editingLastDone, setEditingLastDone] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [customNum, setCustomNum] = useState('');
  const [customUnit, setCustomUnit] = useState('months');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customNumRef = useRef(null);
  const dateInputWrapRef = useRef(null);

  // Close date picker when clicking outside
  useEffect(() => {
    if (!editingLastDone) return;
    const handleClickOutside = e => {
      if (dateInputWrapRef.current && !dateInputWrapRef.current.contains(e.target)) {
        setEditingLastDone(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingLastDone]);

  // Last done / frequency / due next
  const effectiveInterval = entry?.intervalDays ?? task.intervalDays;
  const lastDoneDate = entry?.lastDone ? new Date(entry.lastDone) : null;
  const lastDoneValue = lastDoneDate
    ? lastDoneDate.toISOString().slice(0, 10)
    : '';
  const frequencyStr = formatIntervalDays(effectiveInterval);
  const dueNextDate = lastDoneDate && effectiveInterval
    ? new Date(lastDoneDate.getTime() + effectiveInterval * 86400000)
    : null;
  const dueNextStr = dueNextDate
    ? dueNextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  // Assist subtitle
  const getSubtitle = ASSIST_SUBTITLES[task.assistType];
  const assistSubtitle = getSubtitle ? getSubtitle(task) : null;

  // Parse guidance into steps
  const steps = task.guidance
    ? task.guidance.split(/\d+\.\s+/).filter(Boolean)
    : null;

  return (
    <div style={{ background:'#FDFAF2', minHeight:'100vh' }}>

      {/* Green header */}
      <div style={{
        background: '#1A5C3A',
        padding: '16px 18px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Scatter shapes */}
        <div style={{ position:'absolute', width:50, height:50, borderRadius:'50%', background:'#0F3D27', top:-14, right:-12 }} />
        <div style={{ position:'absolute', width:24, height:24, borderRadius:'50%', background:'#06A77D', top:8, right:24 }} />
        <div style={{ position:'absolute', width:10, height:10, background:'#F77F00', transform:'rotate(45deg)', bottom:8, right:18 }} />
        <div style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:'#F4C430', top:5, right:58 }} />
        <div style={{ position:'absolute', width:18, height:18, borderRadius:'50%', border:'2px solid #06A77D', opacity:0.5, bottom:-4, right:72 }} />

        {/* Back button + category */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, position:'relative' }}>
          <button
            onClick={onBack}
            style={{
              width:32, height:32, borderRadius:8, background:'#0F3D27',
              border:'none', cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:22, height:22, borderRadius:6, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <iconCfg.Icon color="#E8F5EE" bg="transparent" size={13} />
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:'#B8DCC8', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'DM Sans, sans-serif' }}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Task name */}
        <div style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:24, color:'#E8F5EE', lineHeight:1.2, marginBottom:12, position:'relative' }}>
          {task.label}
        </div>

      </div>

      <div style={{ padding:'16px 18px 32px', maxWidth:680, margin:'0 auto' }}>

        {/* Saved provider callout */}
        {savedProvider && (
          <div style={{ background:'#E8F5EE', border:'1.5px solid #1A5C3A', borderRadius:14, padding:'11px 14px', marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:'#1A5C3A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="#E8F5EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>Last used</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>{savedProvider.name}</div>
              {savedProvider.notes && <div style={{ fontSize:12, color:'#4A6256', fontStyle:'italic', fontFamily:'DM Sans, sans-serif' }}>{savedProvider.notes}</div>}
            </div>
          </div>
        )}

        {/* Relevant dates */}
        {!task.oneTime && (
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', marginBottom:10, padding:'11px 15px' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4A6256', marginBottom:9, fontFamily:"'Righteous', cursive" }}>
              Relevant dates
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {/* Last done */}
              <div
                onClick={() => { setEditingLastDone(true); setEditingFrequency(false); setShowCustomInput(false); setCustomNum(''); }}
                style={{ flex:'1 1 0', minWidth:0, background:'#FDFAF2', borderRadius:10, padding:'7px 9px', cursor:'pointer', border:`1.5px solid ${editingLastDone ? '#1A5C3A' : '#EAE4DA'}` }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:9, color:'#4A6256', fontWeight:600, marginBottom:3, fontFamily:'DM Sans, sans-serif', whiteSpace:'nowrap' }}>Last done</div>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ marginBottom:3, flexShrink:0 }}>
                    <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" stroke="#4A6256" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#1C2B22', fontFamily:'DM Sans, sans-serif', lineHeight:1.3, whiteSpace:'nowrap' }}>
                  {lastDoneDate ? lastDoneDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                </div>
              </div>
              {/* Frequency */}
              {frequencyStr && (
                <div
                  onClick={() => { setEditingFrequency(true); setEditingLastDone(false); setShowCustomInput(false); setCustomNum(''); }}
                  style={{ flex:'1 1 0', minWidth:0, background:'#FDFAF2', borderRadius:10, padding:'7px 9px', cursor:'pointer', border:`1.5px solid ${editingFrequency ? '#1A5C3A' : '#EAE4DA'}` }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:9, color:'#4A6256', fontWeight:600, marginBottom:3, fontFamily:'DM Sans, sans-serif', whiteSpace:'nowrap' }}>Frequency</div>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ marginBottom:3, flexShrink:0 }}>
                      <path d="M8.5 1.5l2 2L3 11H1V9L8.5 1.5z" stroke="#4A6256" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color: entry?.intervalDays ? '#1A5C3A' : '#1C2B22', fontFamily:'DM Sans, sans-serif', lineHeight:1.3, whiteSpace:'nowrap' }}>{frequencyStr}</div>
                </div>
              )}
              {/* Due next */}
              {dueNextStr && (
                <div style={{ flex:'1 1 0', minWidth:0, background:'#FDFAF2', borderRadius:10, padding:'7px 9px', border:'1px solid #EAE4DA' }}>
                  <div style={{ fontSize:9, color:'#4A6256', fontWeight:600, marginBottom:3, fontFamily:'DM Sans, sans-serif', whiteSpace:'nowrap' }}>Due next</div>
                  <div style={{ fontSize:11, fontWeight:700, color: isOverdue ? '#D62828' : '#1C2B22', fontFamily:'DM Sans, sans-serif', lineHeight:1.3, whiteSpace:'nowrap' }}>{dueNextStr}</div>
                </div>
              )}
            </div>
            {editingLastDone && (
              <div ref={dateInputWrapRef} style={{ marginTop:8 }}>
                <input
                  type="date"
                  defaultValue={lastDoneValue}
                  max={new Date().toISOString().slice(0, 10)}
                  style={{
                    width:'auto', padding:'8px 10px', fontSize:13, fontFamily:'DM Sans, sans-serif',
                    border:'1.5px solid #1A5C3A', borderRadius:8, background:'#fff',
                    color:'#1C2B22',
                  }}
                  onChange={e => {
                    if (e.target.value && onMarkDone) {
                      onMarkDone(task, e.target.value);
                      setEditingLastDone(false);
                    }
                  }}
                />
              </div>
            )}
            {editingFrequency && task.intervalDays && (
              <div style={{ marginTop:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>Change frequency</div>
                  <button
                    onClick={() => { setEditingFrequency(false); setShowCustomInput(false); setCustomNum(''); }}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', fontSize:16, color:'#4A6256', lineHeight:1 }}
                  >×</button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                  {getFrequencyPresets(task.intervalDays).map(days => {
                    const isDefault = days === task.intervalDays;
                    const isCurrent = days === effectiveInterval && !showCustomInput;
                    return (
                      <button
                        key={days}
                        onClick={() => {
                          setShowCustomInput(false);
                          if (onSetIntervalOverride) onSetIntervalOverride(task.id, days);
                          setEditingFrequency(false);
                        }}
                        style={{
                          padding:'5px 11px', borderRadius:20, fontSize:11, fontWeight:700,
                          fontFamily:'DM Sans, sans-serif', cursor:'pointer', border:'1.5px solid',
                          borderColor: isCurrent ? '#1A5C3A' : '#EAE4DA',
                          background: isCurrent ? '#1A5C3A' : '#fff',
                          color: isCurrent ? '#E8F5EE' : '#1C2B22',
                        }}
                      >
                        {formatIntervalDays(days)}{isDefault ? ' ✓' : ''}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setShowCustomInput(v => !v);
                      setTimeout(() => customNumRef.current?.focus(), 50);
                    }}
                    style={{
                      padding:'5px 11px', borderRadius:20, fontSize:11, fontWeight:700,
                      fontFamily:'DM Sans, sans-serif', cursor:'pointer', border:'1.5px solid',
                      borderColor: showCustomInput ? '#1A5C3A' : '#EAE4DA',
                      background: showCustomInput ? '#E8F5EE' : '#fff',
                      color: '#1C2B22',
                    }}
                  >
                    Custom
                  </button>
                </div>
                {showCustomInput && (
                  <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:12, color:'#4A6256', fontFamily:'DM Sans, sans-serif', flexShrink:0 }}>Every</span>
                    <input
                      ref={customNumRef}
                      type="number"
                      min="1"
                      value={customNum}
                      onChange={e => setCustomNum(e.target.value)}
                      placeholder="e.g. 3"
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
                        color:'#1C2B22', width:'auto',
                      }}
                    >
                      <option value="days">days</option>
                      <option value="months">months</option>
                      <option value="years">years</option>
                    </select>
                    <button
                      onClick={() => {
                        const n = parseInt(customNum, 10);
                        if (!n || n < 1) return;
                        const mult = { days: 1, months: 30, years: 365 }[customUnit];
                        if (onSetIntervalOverride) onSetIntervalOverride(task.id, n * mult);
                        setShowCustomInput(false);
                        setCustomNum('');
                        setEditingFrequency(false);
                      }}
                      style={{
                        padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:700,
                        fontFamily:'DM Sans, sans-serif', background:'#1A5C3A', color:'#E8F5EE',
                        border:'none', cursor:'pointer', flexShrink:0,
                      }}
                    >
                      Set
                    </button>
                  </div>
                )}
                <div style={{ fontSize:10, color:'#4A6256', fontFamily:'DM Sans, sans-serif', marginTop:6 }}>
                  ✓ marks the default recommendation
                </div>
              </div>
            )}
            {!task.oneTime && task.intervalDays && effectiveInterval > task.intervalDays && (
              <div style={{
                background:'#FFF8E1', border:'1px solid #F4C430', borderRadius:8,
                padding:'8px 10px', fontSize:12, color:'#1C2B22', fontFamily:'DM Sans, sans-serif', lineHeight:1.5,
                marginTop:10,
              }}>
                <strong>Heads up:</strong> the standard recommendation is {formatIntervalDays(task.intervalDays)}.
              </div>
            )}
          </div>
        )}

        {/* Why it matters */}
        <div style={{ background:'#fff', borderRadius:14, padding:'13px 15px', border:'1px solid #EAE4DA', marginBottom:10 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4A6256', marginBottom:7, fontFamily:"'Righteous', cursive" }}>
            Why it matters
          </div>
          <div style={{ fontSize:13, color:'#1C2B22', lineHeight:1.6, fontFamily:'DM Sans, sans-serif' }}>
            {task.why || task.note || 'This keeps your home running smoothly and helps avoid bigger problems down the line.'}
          </div>
        </div>

        {/* How to do it */}
        <div style={{ background:'#fff', borderRadius:14, padding:'13px 15px', border:'1px solid #EAE4DA', marginBottom:10 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4A6256', marginBottom:8, fontFamily:"'Righteous', cursive" }}>
            How to do it
          </div>
          {steps ? (
            steps.map((step, i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom: i < steps.length - 1 ? 10 : 0 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'#E8F0EC', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:'#1A5C3A', fontFamily:'DM Sans, sans-serif' }}>
                  {i + 1}
                </div>
                <div style={{ fontSize:13, color:'#1C2B22', lineHeight:1.5, flex:1, fontFamily:'DM Sans, sans-serif' }}>{step.trim()}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize:13, color:'#4A6256', lineHeight:1.6, fontFamily:'DM Sans, sans-serif' }}>
              {task.note
                ? 'Follow standard procedures or tap below to let Mitzy walk you through it.'
                : 'Tap "Want Mitzy to help?" below and get step-by-step guidance.'}
            </div>
          )}
        </div>

        {/* Assist button */}
        {task.assistType && (
          <button
            onClick={() => onAssist(task)}
            style={{
              width:'100%', background:'#1A5C3A', border:'none', borderRadius:14,
              padding:'15px 16px', display:'flex', alignItems:'center', gap:12,
              cursor:'pointer', marginBottom:8, boxSizing:'border-box',
            }}
          >
            <FourDots size={7} />
            <div style={{ flex:1, textAlign:'left' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#E8F5EE', fontFamily:'DM Sans, sans-serif' }}>Want Mitzy to help?</div>
              {assistSubtitle && <div style={{ fontSize:11, color:'#7DD8B0', marginTop:2, fontFamily:'DM Sans, sans-serif' }}>{assistSubtitle}</div>}
            </div>
            <div style={{ width:30, height:30, borderRadius:8, background:'#0F3D27', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        )}

        {/* Bottom row */}
        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={() => onSchedule(task)}
            style={{
              background:'#fff', border:'1.5px solid #EAE4DA', borderRadius:14,
              padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:7,
              cursor:'pointer', flexShrink:0,
            }}
          >
            <CalSVG />
            <span style={{ fontSize:12, fontWeight:700, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>Add to calendar</span>
          </button>

          <button
            onClick={() => onDone(task)}
            style={{
              flex:1, background:'#06A77D', border:'none', borderRadius:14,
              height:52, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <polyline points="3,9 7,13 15,4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize:15, fontWeight:700, color:'#fff', fontFamily:'DM Sans, sans-serif' }}>Mark as done</span>
          </button>
        </div>

      </div>
    </div>
  );
}
