import { useState } from "react";
import { CAT_META } from "../data/constants";
import { CAT_ICON_CONFIG } from "../components/CategoryIcons";
import { isPriority } from "../data/taskFactory";
import { isDependencySatisfied } from "../utils/taskLogic";

const CHIPS_GENERAL = [
  { key: 'recently',   label: 'Recently',         days: 30  },
  { key: 'few-months', label: 'A few months ago',  days: 90  },
  { key: 'over-year',  label: 'Over a year ago',   days: 400 },
  { key: 'never',      label: 'Never / not sure',  days: 730 },
];

const CHIPS_HEALTH = [
  { key: 'this-year',  label: 'This year',         days: 180 },
  { key: 'last-year',  label: 'Last year',          days: 400 },
  { key: 'two-plus',   label: '2+ years ago',       days: 800 },
  { key: 'never',      label: 'Never / not sure',   days: 730 },
];

const SLIDE_MS = 320;

const SLIDE_CSS = `
  @keyframes pslideInRight  { from { transform: translateX(100%) } to { transform: translateX(0) } }
  @keyframes pslideInLeft   { from { transform: translateX(-100%) } to { transform: translateX(0) } }
  @keyframes pslideOutLeft  { from { transform: translateX(0) } to { transform: translateX(-100%) } }
  @keyframes pslideOutRight { from { transform: translateX(0) } to { transform: translateX(100%) } }
  .ps-in-fwd  { animation: pslideInRight  ${SLIDE_MS}ms ease forwards; }
  .ps-in-bk   { animation: pslideInLeft   ${SLIDE_MS}ms ease forwards; }
  .ps-out-fwd { animation: pslideOutLeft  ${SLIDE_MS}ms ease forwards; }
  .ps-out-bk  { animation: pslideOutRight ${SLIDE_MS}ms ease forwards; }
`;

// Memphis scatter shapes — top right, matching SlimOnboarding
function ScatterShapes() {
  return (
    <>
      <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'#0F3D27', top:-40, right:-40, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:16, height:16, borderRadius:'50%', background:'#F4C430', top:52, right:132, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:14, height:14, background:'#F77F00', transform:'rotate(45deg)', top:72, right:98, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:12, height:12, borderRadius:'50%', background:'#D62828', top:38, right:82, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:40, height:40, borderRadius:'50%', border:'3px solid #06A77D', opacity:0.4, top:92, right:52, pointerEvents:'none' }} />
    </>
  );
}

// Single task screen — renders entirely on the green background
function TaskSlide({ task, selections, onChipSelect, onDateChange, onDateBlur }) {
  const meta    = CAT_META[task.cat]      || CAT_META.home;
  const iconCfg = CAT_ICON_CONFIG[task.cat] || CAT_ICON_CONFIG.home;
  const chips   = task.cat === 'health' ? CHIPS_HEALTH : CHIPS_GENERAL;
  const sel     = selections[task.id];

  return (
    <div style={{ padding:'16px 20px 24px', maxWidth:480, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>
      {/* Category icon + label */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <iconCfg.Icon color="#E8F5EE" bg="transparent" size={16} />
        </div>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(184,220,200,0.8)', fontFamily:'DM Sans, sans-serif' }}>
          {meta.label}
        </span>
      </div>

      {/* Task name */}
      <div style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:24, color:'#E8F5EE', lineHeight:1.25, marginBottom:8 }}>
        {task.label}
      </div>

      {/* Task note */}
      {task.note && (
        <div style={{ fontSize:12, color:'#B8DCC8', lineHeight:1.6, marginBottom:24, fontFamily:'DM Sans, sans-serif' }}>
          {task.note}
        </div>
      )}

      {/* "When did you last do this?" */}
      <div style={{ fontSize:13, fontWeight:700, color:'#E8F5EE', marginBottom:14, fontFamily:'DM Sans, sans-serif' }}>
        When did you last do this?
      </div>

      {/* 2×2 chip grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:14 }}>
        {chips.map(chip => {
          const selected = sel?.type === 'fuzzy' && sel?.key === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => onChipSelect(task.id, chip)}
              style={{
                padding:'14px 12px', fontSize:13, fontWeight:700, textAlign:'center',
                borderRadius:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                border: selected ? '2px solid #06A77D' : '1.5px solid #2A7A50',
                background: selected ? '#1A5C3A' : '#0F3D27',
                color:'#E8F5EE',
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Exact date row */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:11, color:'#B8DCC8', fontFamily:'DM Sans, sans-serif', whiteSpace:'nowrap' }}>
          Or pick an exact date:
        </span>
        <input
          type="date"
          max={new Date().toISOString().split('T')[0]}
          value={sel?.type === 'exact' ? sel.date : ''}
          onChange={e => onDateChange(task.id, e.target.value)}
          onBlur={e => onDateBlur(task.id, e.target.value)}
          style={{
            flex:'0 0 auto', width:'auto', padding:'4px 8px', fontSize:12, height:28,
            boxSizing:'border-box', borderRadius:4, outline:'none',
            border:'1.5px solid #2A7A50', background:'#0F3D27', color:'#E8F5EE',
          }}
        />
      </div>
    </div>
  );
}

export function PrioritySetup({ taskLib, onComplete }) {
  const priorityTasks = taskLib.filter(t => isPriority(t.id) && isDependencySatisfied(t, {})).slice(0, 12);
  const [index,      setIndex]      = useState(0);
  const [selections, setSelections] = useState({});
  const [done,       setDone]       = useState(false);
  const [slide,      setSlide]      = useState(null); // { dir:'forward'|'back', nextIdx:number }

  const current = priorityTasks[index];
  const isLast  = index === priorityTasks.length - 1;

  if (!current && !done) return null;

  const finalize = (sels) => {
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

  const doSlide = (dir, nextIdx, nextSels) => {
    if (slide) return;
    if (nextSels) setSelections(nextSels);
    setSlide({ dir, nextIdx });
    setTimeout(() => {
      setIndex(nextIdx);
      setSlide(null);
    }, SLIDE_MS);
  };

  const advance = (updatedSelections) => {
    const sels = updatedSelections || selections;
    if (!isLast) {
      doSlide('forward', index + 1, updatedSelections || null);
    } else {
      if (updatedSelections) setSelections(updatedSelections);
      finalize(sels);
    }
  };

  const back = () => {
    if (index > 0 && !slide) doSlide('back', index - 1, null);
  };

  const skip = () => {
    if (!slide) advance();
  };

  const handleChipSelect = (taskId, chip) => {
    if (slide) return;
    const newSel = { type:'fuzzy', key: chip.key, days: chip.days };
    const newSelections = { ...selections, [taskId]: newSel };
    advance(newSelections);
  };

  const handleDateChange = (taskId, value) => {
    if (!value) return;
    setSelections(s => ({ ...s, [taskId]: { type:'exact', date: value, days: null } }));
  };

  const handleDateBlur = (taskId, value) => {
    if (!value || slide) return;
    const newSelections = { ...selections, [taskId]: { type:'exact', date: value, days: null } };
    advance(newSelections);
  };

  const progress    = (index + 1) / priorityTasks.length;
  // During a slide, the arriving task index
  const arrivingIdx = slide ? slide.nextIdx : index;

  // Completion screen
  if (done) {
    return (
      <div style={{ minHeight:'100vh', background:'#1A5C3A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 24px', position:'relative', overflow:'hidden' }}>
        <ScatterShapes />
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

  return (
    <>
      <style>{SLIDE_CSS}</style>
      <div style={{ minHeight:'100vh', background:'#1A5C3A', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <ScatterShapes />

        {/* Progress bar — stays put, not part of slide */}
        <div style={{ padding:'20px 20px 0', maxWidth:480, margin:'0 auto', width:'100%', boxSizing:'border-box', position:'relative', zIndex:1 }}>
          <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:999, height:6, marginBottom:10, overflow:'hidden' }}>
            <div style={{ background:'#F4C430', height:'100%', width:`${progress * 100}%`, borderRadius:999, transition:'width 0.3s ease' }} />
          </div>
          <div style={{ fontSize:11, color:'rgba(184,220,200,0.7)', fontFamily:'DM Sans, sans-serif', marginBottom:8 }}>
            Task {index + 1} of {priorityTasks.length}
          </div>
        </div>

        {/* Sliding content region */}
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          {/* Departing screen — only during a slide */}
          {slide && (
            <div
              key={`depart-${index}`}
              className={slide.dir === 'forward' ? 'ps-out-fwd' : 'ps-out-bk'}
              style={{ position:'absolute', top:0, left:0, right:0, bottom:0 }}
            >
              <TaskSlide
                task={current}
                selections={selections}
                onChipSelect={() => {}}
                onDateChange={() => {}}
                onDateBlur={() => {}}
              />
            </div>
          )}

          {/* Arriving / settled screen — key stays stable across slide→settle transition */}
          <div
            key={arrivingIdx}
            className={slide ? (slide.dir === 'forward' ? 'ps-in-fwd' : 'ps-in-bk') : ''}
            style={{ position: slide ? 'absolute' : 'relative', top:0, left:0, right:0, bottom:0 }}
          >
            <TaskSlide
              task={priorityTasks[arrivingIdx]}
              selections={selections}
              onChipSelect={handleChipSelect}
              onDateChange={handleDateChange}
              onDateBlur={handleDateBlur}
            />
          </div>
        </div>

        {/* Footer bar */}
        <div style={{ background:'#0F3D27', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:1 }}>
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
    </>
  );
}
