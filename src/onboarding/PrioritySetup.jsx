import { useState } from "react";
import { CAT_META } from "../data/constants";
import { CAT_ICON_CONFIG } from "../components/CategoryIcons";
import { isPriority } from "../data/taskFactory";

// Home/car task chip options
const CHIPS_GENERAL = [
  { key: 'recently',   label: 'Recently',         days: 30  },
  { key: 'few-months', label: 'A few months ago',  days: 90  },
  { key: 'over-year',  label: 'Over a year ago',   days: 400 },
  { key: 'never',      label: 'Never / not sure',  days: 730 },
];

// Health task chip options
const CHIPS_HEALTH = [
  { key: 'this-year',  label: 'This year',    days: 180 },
  { key: 'last-year',  label: 'Last year',    days: 400 },
  { key: 'two-plus',   label: '2+ years ago', days: 800 },
  { key: 'never',      label: 'Never / not sure', days: 730 },
];

export function PrioritySetup({ taskLib, onComplete }) {
  const priorityTasks = taskLib.filter(t => isPriority(t.id)).slice(0, 12);
  const [index,      setIndex]      = useState(0);
  const [selections, setSelections] = useState({});
  const [done,       setDone]       = useState(false);

  const current = priorityTasks[index];
  const sel     = selections[current?.id];
  const isLast  = index === priorityTasks.length - 1;

  if (!current && !done) {
    return null;
  }

  const finalize = (updatedSelections) => {
    const sels = updatedSelections || selections;
    const taskState = {};
    const disabled  = {};
    priorityTasks.forEach(t => {
      const entry = sels[t.id];
      if (entry) {
        const date = entry.type === 'exact'
          ? new Date(entry.date)
          : new Date(Date.now() - entry.days * 86400000);
        taskState[t.id] = { lastDone: date.toISOString(), scheduledDate: null };
      } else {
        disabled[t.id] = true;
      }
    });
    setDone(true);
    setTimeout(() => onComplete(taskState, disabled), 1800);
  };

  const advance = (updatedSelections) => {
    if (!isLast) {
      setIndex(i => i + 1);
    } else {
      finalize(updatedSelections || selections);
    }
  };

  const back = () => {
    if (index > 0) setIndex(i => i - 1);
  };

  const skip = () => advance();

  // Completion screen
  if (done) {
    return (
      <div style={{ minHeight:'100vh', background:'#1A5C3A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'#0F3D27', top:-40, right:-40 }} />
        <div style={{ position:'absolute', width:60, height:60, borderRadius:'50%', background:'#06A77D', top:20, right:60, opacity:0.7 }} />
        <div style={{ position:'absolute', width:80, height:80, borderRadius:'50%', background:'#0F3D27', bottom:-30, left:-20 }} />
        <div style={{ maxWidth:360, width:'100%', textAlign:'center', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:28 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#D62828' }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#F77F00' }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#06A77D' }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#F4C430' }} />
            </div>
            <span style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:40, color:'#E8F5EE', lineHeight:1 }}>mitzy</span>
          </div>
          <div style={{ fontFamily:"'Righteous', cursive", fontSize:26, color:'#E8F5EE', marginBottom:14, lineHeight:1.2 }}>
            Mitzy is ready. So are you.
          </div>
          <div style={{ fontSize:14, color:'#B8DCC8', lineHeight:1.7, marginBottom:36, fontFamily:'DM Sans, sans-serif' }}>
            I've built your list. I'll tell you what matters and help you close it out — one thing at a time.
          </div>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#06A77D', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <polyline points="4,10 8,14 16,5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const meta    = CAT_META[current.cat] || CAT_META.home;
  const iconCfg = CAT_ICON_CONFIG[current.cat] || CAT_ICON_CONFIG.home;
  const isHealthTask = current.cat === 'health';
  const chips = isHealthTask ? CHIPS_HEALTH : CHIPS_GENERAL;
  const progress = (index + 1) / priorityTasks.length;

  return (
    <div style={{ minHeight:'100vh', background:'#1A5C3A', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Scatter shapes */}
      <div style={{ position:'absolute', width:80, height:80, borderRadius:'50%', background:'#0F3D27', top:-24, right:-24 }} />
      <div style={{ position:'absolute', width:14, height:14, borderRadius:'50%', background:'#F4C430', top:40, right:70, opacity:0.8 }} />
      <div style={{ position:'absolute', width:10, height:10, background:'#F77F00', transform:'rotate(45deg)', top:60, right:100, opacity:0.7 }} />

      {/* Header area */}
      <div style={{ padding:'20px 20px 0', maxWidth:480, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>
        {/* Progress bar */}
        <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:999, height:6, marginBottom:10, overflow:'hidden' }}>
          <div style={{ background:'#F4C430', height:'100%', width:`${progress * 100}%`, borderRadius:999, transition:'width 0.3s ease' }} />
        </div>
        <div style={{ fontSize:11, color:'rgba(184,220,200,0.7)', fontFamily:'DM Sans, sans-serif', marginBottom:20 }}>
          Task {index + 1} of {priorityTasks.length}
        </div>

        {/* Task name */}
        <div className="bIn" key={index}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <iconCfg.Icon color="#E8F5EE" bg="transparent" size={16} />
            </div>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(184,220,200,0.8)', fontFamily:'DM Sans, sans-serif' }}>
              {meta.label}
            </span>
          </div>
          <div style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:24, color:'#E8F5EE', lineHeight:1.25, marginBottom:8 }}>
            {current.label}
          </div>
          {current.note && (
            <div style={{ fontSize:12, color:'#B8DCC8', lineHeight:1.6, marginBottom:24, fontFamily:'DM Sans, sans-serif' }}>
              {current.note}
            </div>
          )}
        </div>
      </div>

      {/* White card body */}
      <div style={{ background:'#FDFAF2', borderRadius:0, padding:'24px 20px 28px', flex:1 }}>
        <div style={{ maxWidth:480, margin:'0 auto' }}>

          <div style={{ fontSize:13, fontWeight:700, color:'#4A6256', marginBottom:14, fontFamily:'DM Sans, sans-serif' }}>
            When did you last do this?
          </div>

          {/* 2×2 chip grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:14 }}>
            {chips.map(chip => {
              const selected = sel?.type === 'fuzzy' && sel?.key === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => {
                    const newSel = { type:'fuzzy', key: chip.key, days: chip.days };
                    const newSelections = { ...selections, [current.id]: newSel };
                    setSelections(newSelections);
                    advance(newSelections);
                  }}
                  style={{
                    padding:'14px 12px', fontSize:13, fontWeight:700, textAlign:'center',
                    borderRadius:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                    border: selected ? '2px solid #1A5C3A' : '1.5px solid #EAE4DA',
                    background: selected ? '#E8F5EE' : '#fff',
                    color: selected ? '#1A5C3A' : '#1C2B22',
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Exact date — label + input on one row */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <span style={{ fontSize:11, color:'#4A6256', fontFamily:'DM Sans, sans-serif', whiteSpace:'nowrap' }}>
              Or pick an exact date:
            </span>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={sel?.type === 'exact' ? sel.date : ''}
              onChange={e => {
                if (!e.target.value) return;
                setSelections(s => ({ ...s, [current.id]: { type:'exact', date: e.target.value, days: null } }));
              }}
              onBlur={e => {
                if (!e.target.value) return;
                const newSelections = { ...selections, [current.id]: { type:'exact', date: e.target.value, days: null } };
                advance(newSelections);
              }}
              style={{ flex:'0 0 auto', width:'auto', padding:'4px 8px', fontSize:12, height:28, boxSizing:'border-box', borderRadius:4, border:'1.5px solid #EAE4DA', outline:'none' }}
            />
          </div>

          <div style={{ textAlign:'center', fontSize:11, color:'#9B9B9B', fontFamily:'DM Sans, sans-serif' }}>
            More tasks surface gradually as they become relevant.
          </div>
        </div>
      </div>

      {/* Green footer bar */}
      <div style={{ background:'#1A5C3A', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button
          onClick={back}
          style={{
            background:'none', border:'none', color:'#A8C9B5', fontSize:14,
            fontFamily:'DM Sans, sans-serif', cursor: index === 0 ? 'default' : 'pointer',
            opacity: index === 0 ? 0 : 1, padding:'4px 0', pointerEvents: index === 0 ? 'none' : 'auto',
          }}
        >
          ← Back
        </button>
        <button
          onClick={skip}
          style={{
            background:'none', border:'none', color:'#4A8C65', fontSize:12,
            fontFamily:'DM Sans, sans-serif', cursor:'pointer', padding:'4px 0',
          }}
        >
          Skip this one
        </button>
      </div>
    </div>
  );
}
