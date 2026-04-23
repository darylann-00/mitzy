import { useState } from "react";
import { TaskCard } from "../components/TaskCard";
import { HouseIcon, CarIcon, PersonIcon, CalendarIcon, StarIcon, PetIcon, CategoryTile } from "../components/CategoryIcons";
import { TaskAnswerChips } from "../components/TaskAnswerChips";
import { AppHeader } from "./HomeView";
import { useProfileContext } from "../contexts/ProfileContext";
import { useTaskContext }    from "../contexts/TaskContext";

// ─── Group divider (Memphis dots) ──────────────────────────────────────────────
function GroupDivider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, margin:'14px 0 0', padding:'0 2px' }}>
      <div style={{ flex:1, height:1, background:'#EAE4DA' }} />
      <div style={{ width:5, height:5, borderRadius:'50%', background:'#D4E8DC' }} />
      <div style={{ width:7, height:7, background:'#E8F0EC', border:'1.5px solid #D4E8DC', transform:'rotate(45deg)' }} />
      <div style={{ width:5, height:5, borderRadius:'50%', background:'#D4E8DC' }} />
      <div style={{ flex:1, height:1, background:'#EAE4DA' }} />
    </div>
  );
}

// ─── Group label ───────────────────────────────────────────────────────────────
function GroupLabel({ label }) {
  return (
    <div style={{
      fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
      color:'#4A6256', marginBottom:9, marginTop:18,
      fontFamily:"'Righteous', 'Trebuchet MS', cursive",
      display:'flex', alignItems:'center', gap:8,
    }}>
      {label}
      <div style={{ flex:1, height:1, background:'#EAE4DA' }} />
    </div>
  );
}

// ─── Category filter chips ─────────────────────────────────────────────────────
const ALL_CATS = [
  { key: 'all',       label: 'All',       Icon: null       },
  { key: 'home',      label: 'Home',      Icon: HouseIcon,    color:'#1A5C3A', bg:'#E8F5EE' },
  { key: 'car',       label: 'Car',       Icon: CarIcon,      color:'#F77F00', bg:'#FFF3E0' },
  { key: 'health',    label: 'Health',    Icon: PersonIcon,   color:'#06A77D', bg:'#E8F5EE' },
  { key: 'finance',   label: 'Finance',   Icon: CalendarIcon, color:'#F77F00', bg:'#FFF3E0' },
  { key: 'school',    label: 'School',    Icon: PersonIcon,   color:'#4A6256', bg:'#F0EDE4' },
  { key: 'emergency', label: 'Emergency', Icon: StarIcon,     color:'#D62828', bg:'#FDE8E8' },
  { key: 'pet',       label: 'Pet',       Icon: PetIcon,      color:'#F4C430', bg:'#FFFBEE' },
];

// ─── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:12, fontWeight:700, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>{label}</span>
      <div
        onClick={onToggle}
        style={{
          width:38, height:22, borderRadius:999, cursor:'pointer',
          background: on ? '#1A5C3A' : '#D0C8C0',
          position:'relative', transition:'background 0.15s',
          flexShrink:0,
        }}
      >
        <div style={{
          position:'absolute', top:3, left: on ? 17 : 3,
          width:16, height:16, borderRadius:'50%', background:'#fff',
          transition:'left 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  );
}

// ─── Explore section ───────────────────────────────────────────────────────────
function ExploreSection({ tasks, markDone, markNeeded }) {
  const [open,     setOpen]     = useState(false);
  const [expanded, setExpanded] = useState(null);

  if (tasks.length === 0) return null;

  const handleDone = (task, iso) => {
    markDone(task.id, iso.split('T')[0]);
    setExpanded(null);
  };

  const handleNeeded = (task) => {
    markNeeded(task.id);
    setExpanded(null);
  };

  return (
    <>
      <GroupDivider />
      <div style={{ marginTop:18 }}>

        {/* Header / toggle row */}
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer', padding:'0 2px', marginBottom: open ? 10 : 0,
          }}
        >
          <div style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase',
            color:'#4A6256', fontFamily:"'Righteous', 'Trebuchet MS', cursive",
            display:'flex', alignItems:'center', gap:8,
          }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} to explore
            <div style={{ flex:1, height:1, background:'#EAE4DA' }} />
          </div>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.15s', flexShrink:0, marginLeft:6 }}
          >
            <polyline points="2,4 7,10 12,4" stroke="#4A6256" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Task rows */}
        {open && tasks.map(task => {
          const isExp = expanded === task.id;
          return (
            <div key={task.id} style={{ marginBottom:6 }}>

              {/* Row header */}
              <div
                onClick={() => setExpanded(prev => prev === task.id ? null : task.id)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 12px',
                  borderRadius: isExp ? '10px 10px 0 0' : 10,
                  background: isExp ? '#F0EDE4' : '#fff',
                  border:'1.5px solid #EAE4DA',
                  borderBottom: isExp ? '1px solid #E4DFD6' : '1.5px solid #EAE4DA',
                  cursor:'pointer',
                }}
              >
                <CategoryTile cat={task.cat} size={24} />
                <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>
                  {task.label}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.15s', flexShrink:0 }}
                >
                  <polyline points="1,3 6,9 11,3" stroke="#4A6256" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Expanded picker */}
              {isExp && (
                <div style={{ background:'#F8F5EC', border:'1.5px solid #EAE4DA', borderTop:'none', borderRadius:'0 0 10px 10px', padding:'12px 12px 14px' }}>
                  <TaskAnswerChips
                    task={task}
                    onDone={(iso) => handleDone(task, iso)}
                    onNeeded={() => handleNeeded(task)}
                    showDatePicker={!task.oneTime}
                    labelStyle={{ fontSize:12, fontWeight:700, color:'#4A6256', marginBottom:10 }}
                    chipGridStyle={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:10 }}
                  />
                </div>
              )}

            </div>
          );
        })}

      </div>
    </>
  );
}

// ─── AllView ───────────────────────────────────────────────────────────────────
export function AllView({ onSelectTask, onDoneTask, activeCategory, setActiveCategory, dueOnly, setDueOnly }) {
  const { providerHistory } = useProfileContext();
  const { activeTasks, getStatus, getDays, markDone, markNeeded } = useTaskContext();

  // Which categories are actually present in tasks
  const presentCats = new Set(activeTasks.map(t => t.cat));
  const visibleCats = ALL_CATS.filter(c => c.key === 'all' || presentCats.has(c.key));

  // Filter by category
  const filtered = activeCategory === 'all'
    ? activeTasks
    : activeTasks.filter(t => t.cat === activeCategory);

  // Separate unknown (no lastDone) from known
  const knownFiltered   = filtered.filter(t => getStatus(t) !== 'unknown');
  const unknownFiltered = filtered.filter(t => getStatus(t) === 'unknown');

  // Sort known tasks by score (due first)
  const sortScore = (t) => {
    const s = getStatus(t);
    if (s === 'due' || s === 'confirm') return 3;
    if (s === 'coming-up' || s === 'scheduled') return 2;
    return 1;
  };
  const sorted = [...knownFiltered].sort((a, b) => sortScore(b) - sortScore(a));

  // Three groups
  const needsAttention = sorted.filter(t => ['due', 'needed', 'confirm'].includes(getStatus(t)));
  const comingUp       = sorted.filter(t => ['coming-up', 'scheduled'].includes(getStatus(t)));
  const allGood        = sorted.filter(t => getStatus(t) === 'ok');

  // Due-only mode collapses to just needsAttention
  const showComingUp = !dueOnly;
  const showAllGood  = !dueOnly;

  const hasKnown = needsAttention.length > 0 || comingUp.length > 0 || allGood.length > 0;

  return (
    <div style={{ background:'#FDFAF2' }}>
      <AppHeader rightContent={<>Everything<br />you're tracking</>} />

      {/* Filter controls */}
      <div style={{ background:'#FDFAF2', padding:'12px 18px 0', maxWidth:680, margin:'0 auto' }}>

        {/* Category chips */}
        <div style={{
          display:'flex', gap:7, overflowX:'auto', paddingBottom:12,
          WebkitOverflowScrolling:'touch',
          msOverflowStyle:'none', scrollbarWidth:'none',
        }}>
          {visibleCats.map(({ key, label, Icon, color, bg }) => {
            const active = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'7px 13px',
                  borderRadius:20, flexShrink:0,
                  fontFamily:'DM Sans, sans-serif',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                  border: active ? 'none' : '1.5px solid #D4E8DC',
                  background: active ? '#1A5C3A' : '#fff',
                  color: active ? '#E8F5EE' : '#4A6256',
                  whiteSpace:'nowrap',
                }}
              >
                {Icon && <Icon color={active ? '#E8F5EE' : (color || '#4A6256')} bg={active ? '#1A5C3A' : (bg || '#F0EDE4')} size={14} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Due only toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:14, borderBottom:'1px solid #EAE4DA' }}>
          <Toggle on={dueOnly} onToggle={() => setDueOnly(x => !x)} label="Due only" />
        </div>
      </div>

      {/* Task groups */}
      <div style={{ padding:'0 18px 160px', maxWidth:680, margin:'0 auto' }}>

        {!hasKnown && unknownFiltered.length === 0 && (
          <div style={{ background:'#FFFFFF', borderRadius:14, padding:'36px 20px', textAlign:'center', border:'1px solid #EAE4DA', marginTop:16 }}>
            <div style={{ fontFamily:"'Righteous', cursive", fontSize:16, color:'#06A77D', marginBottom:6 }}>Nothing here</div>
            <div style={{ fontSize:13, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>No tasks in this category yet.</div>
          </div>
        )}

        {needsAttention.length > 0 && (
          <>
            <GroupLabel label="Needs attention" />
            {needsAttention.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                status={getStatus(task)}
                days={getDays(task)}
                hasSavedProvider={!!providerHistory[task.id]}
                onSelect={onSelectTask}
                onDone={onDoneTask}
                showCategoryIcon
                subtitle={getStatus(task) === 'needed' ? '' : undefined}
              />
            ))}
          </>
        )}

        {showComingUp && comingUp.length > 0 && (
          <>
            {needsAttention.length > 0 && <GroupDivider />}
            <GroupLabel label="Coming up" />
            {comingUp.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                status={getStatus(task)}
                days={getDays(task)}
                hasSavedProvider={!!providerHistory[task.id]}
                onSelect={onSelectTask}
                onDone={onDoneTask}
                showCategoryIcon
              />
            ))}
          </>
        )}

        {showAllGood && allGood.length > 0 && (
          <>
            {(needsAttention.length > 0 || comingUp.length > 0) && <GroupDivider />}
            <GroupLabel label="All good" />
            {allGood.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                status={getStatus(task)}
                days={getDays(task)}
                hasSavedProvider={!!providerHistory[task.id]}
                onSelect={onSelectTask}
                onDone={onDoneTask}
                showCategoryIcon
              />
            ))}
          </>
        )}

        <ExploreSection tasks={unknownFiltered} markDone={markDone} markNeeded={markNeeded} />

      </div>
    </div>
  );
}
