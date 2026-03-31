import { useState } from "react";
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

function formatDueDate(days) {
  if (days === null || days === undefined) return 'due soon';
  if (days < 0) {
    const n = Math.abs(days);
    return `due ${n} day${n !== 1 ? 's' : ''} ago`;
  }
  if (days === 0) return 'due today';
  if (days <= 7)  return 'due this week';
  if (days <= 14) return `due in ${days} days`;
  if (days <= 30) return `due in ${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`;
  return `good for ${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`;
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

export function TaskDetailView({ task, status, taskState, savedProvider, getNext, onAssist, onSchedule, onDone, onBack, onMarkDone }) {
  const entry    = taskState[task.id];
  const meta     = CAT_META[task.cat] || CAT_META.home;
  const iconCfg  = CAT_ICON_CONFIG[task.cat] || CAT_ICON_CONFIG.home;
  const isOverdue = status === 'due' || status === 'confirm';
  const [editingLastDone, setEditingLastDone] = useState(false);

  // Days calculation
  // Last done / frequency / due next
  const lastDoneDate = entry?.lastDone ? new Date(entry.lastDone) : null;
  const lastDoneValue = lastDoneDate
    ? lastDoneDate.toISOString().slice(0, 10)
    : '';
  const frequencyStr = formatIntervalDays(task.intervalDays);
  const dueNextDate = lastDoneDate && task.intervalDays
    ? new Date(lastDoneDate.getTime() + task.intervalDays * 86400000)
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
                onClick={() => setEditingLastDone(v => !v)}
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
                <div style={{ flex:'1 1 0', minWidth:0, background:'#FDFAF2', borderRadius:10, padding:'7px 9px', border:'1px solid #EAE4DA' }}>
                  <div style={{ fontSize:9, color:'#4A6256', fontWeight:600, marginBottom:3, fontFamily:'DM Sans, sans-serif', whiteSpace:'nowrap' }}>Frequency</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1C2B22', fontFamily:'DM Sans, sans-serif', lineHeight:1.3, whiteSpace:'nowrap' }}>{frequencyStr}</div>
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
              <div style={{ marginTop:8 }}>
                <input
                  type="date"
                  defaultValue={lastDoneValue}
                  max={new Date().toISOString().slice(0, 10)}
                  style={{
                    width:'100%', padding:'8px 10px', fontSize:13, fontFamily:'DM Sans, sans-serif',
                    border:'1.5px solid #1A5C3A', borderRadius:8, background:'#fff',
                    color:'#1C2B22', boxSizing:'border-box',
                  }}
                  onChange={() => {}}
                  onBlur={e => {
                    if (e.target.value && onMarkDone) {
                      onMarkDone(task, e.target.value);
                    }
                    setEditingLastDone(false);
                  }}
                />
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
