import { useState } from "react";
import { TaskCard } from "../components/TaskCard";
import { SwipeableTaskCard } from "../components/SwipeableTaskCard";
import { SnoozeIcon } from "../components/SnoozeIcon";
import { HouseIcon, CarIcon, PersonIcon, CalendarIcon, StarIcon, PetIcon, CategoryTile } from "../components/CategoryIcons";
import { TaskAnswerChips } from "../components/TaskAnswerChips";
import { AppHeader } from "./HomeView";
import { useProfileContext } from "../contexts/ProfileContext";
import { useTaskContext }    from "../contexts/TaskContext";
import { useCalendarContext } from "../contexts/CalendarContext";
import { isWindowActive }    from "../utils/taskLogic";
import { LIFE_EVENT_DEFS } from "../data/lifeEvents";

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
function ExploreSection({ tasks, markDone, markNeeded, markNotApplicable }) {
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

  const handleNA = (task) => {
    markNotApplicable(task.id);
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
                    onSkip={!task.oneTime ? () => handleNA(task) : undefined}
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

// ─── Life event group ──────────────────────────────────────────────────────────
function LifeEventGroup({ event, tasks, taskState, getStatus, getDays, providerHistory, pendingCalendarMatches, onSelectTask, onDoneTask, onMatchConfirm, onMatchDismiss }) {
  const [open, setOpen] = useState(true);
  const def = LIFE_EVENT_DEFS[event.type];
  if (!def || tasks.length === 0) return null;
  const doneCount = tasks.filter(t => taskState[t.id]?.lastDone).length;

  return (
    <div style={{ marginTop: 16, marginBottom: 4 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'12px 14px', marginBottom: 10,
          background:'#FFFBEE', border:'1.5px solid #F4C430', borderRadius:12,
          cursor:'pointer',
        }}
      >
        <span style={{ fontSize: 22 }}>{def.emoji}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>
            {def.label}
          </div>
          <div style={{ fontSize:11, color:'#8A6A00', fontFamily:'DM Sans, sans-serif', marginTop: 2 }}>
            {doneCount} of {tasks.length} done
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.15s', flexShrink:0 }}
        >
          <polyline points="2,4 7,10 12,4" stroke="#8A6A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && tasks.map(task => {
        const match = pendingCalendarMatches.find(m => m.taskId === task.id);
        return (
          <TaskCard
            key={task.id}
            task={{ ...task, scheduledDate: taskState[task.id]?.scheduledDate, lastDone: taskState[task.id]?.lastDone }}
            status={getStatus(task)}
            days={getDays(task)}
            hasSavedProvider={!!providerHistory[task.id]}
            onSelect={onSelectTask}
            onDone={onDoneTask}
            showCategoryIcon
            subtitle=""
            pendingMatch={match}
            onMatchConfirm={match ? () => onMatchConfirm(task.id, match.eventDate) : undefined}
            onMatchDismiss={match ? () => onMatchDismiss(task.id) : undefined}
            stepProgress={taskState[task.id]?.stepProgress}
          />
        );
      })}
    </div>
  );
}

// ─── Snoozed section ──────────────────────────────────────────────────────
function SnoozedSection({ tasks, taskState, onSelectTask, onUnsnooze }) {
  const [open, setOpen] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <>
      <GroupDivider />
      <div style={{ marginTop: 18 }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '0 2px', marginBottom: open ? 10 : 0,
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase',
            color: '#4A6256', fontFamily: "'Righteous', 'Trebuchet MS', cursive",
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <SnoozeIcon size={14} color="#4A6256" />
            {tasks.length} snoozed
            <div style={{ flex: 1, height: 1, background: '#EAE4DA' }} />
          </div>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0, marginLeft: 6 }}
          >
            <polyline points="2,4 7,10 12,4" stroke="#4A6256" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {open && tasks.map(task => (
          <TaskCard
            key={task.id}
            task={{ ...task, snoozedUntil: taskState[task.id]?.snoozedUntil }}
            status="snoozed"
            days={null}
            onSelect={onSelectTask}
            onDone={() => {}}
            onUnsnooze={onUnsnooze}
            showCategoryIcon
          />
        ))}
      </div>
    </>
  );
}

// ─── AllView ───────────────────────────────────────────────────────────────────
export function AllView({ onSelectTask, onDoneTask, activeCategory, setActiveCategory, dueOnly, setDueOnly, onMatchConfirm, onMatchDismiss, onSnooze }) {
  const { providerHistory, region, lifeEvents } = useProfileContext();
  const { activeTasks: allActiveTasks, getStatus, getDays, markDone, markNeeded, markNotApplicable, taskState, snoozedTasks, unsnoozeTask } = useTaskContext();
  const { pendingCalendarMatches } = useCalendarContext();

  // Separate life-event tasks from the rest — they render in their own group at
  // the top, not interleaved with HVAC filters and pet vaccines.
  const activeEvent = lifeEvents?.activeEvent;
  const eventTaskIds = new Set((lifeEvents?.activeEventTasks ?? []).map(t => t.id));
  const activeTasks = allActiveTasks.filter(t => !eventTaskIds.has(t.id));
  const eventTasks = activeEvent
    ? allActiveTasks.filter(t => eventTaskIds.has(t.id))
    : [];

  // Which categories are actually present in tasks
  const presentCats = new Set(activeTasks.map(t => t.cat));
  const visibleCats = ALL_CATS.filter(c => c.key === 'all' || presentCats.has(c.key));

  // Filter by category
  const filtered = activeCategory === 'all'
    ? activeTasks
    : activeTasks.filter(t => t.cat === activeCategory);

  // Separate unknown (no lastDone) from known; hide completed one-time tasks
  const knownFiltered   = filtered.filter(t => getStatus(t) !== 'unknown' && !(t.oneTime && getStatus(t) === 'ok'));
  const unknownFiltered = filtered.filter(t => getStatus(t) === 'unknown');

  // Sort known tasks by score (due first), treating out-of-season as "ok"
  const sortScore = (t) => {
    if (!isWindowActive(t, region)) return 1;
    const s = getStatus(t);
    if (s === 'due' || s === 'confirm') return 3;
    if (s === 'coming-up' || s === 'scheduled') return 2;
    return 1;
  };
  // Within each group, sort by soonest: most overdue first (lowest getDays value)
  const daysKey = (t) => {
    const d = getDays(t);
    return d === null ? Infinity : d;
  };
  const sorted = [...knownFiltered].sort((a, b) => {
    const scoreDiff = sortScore(b) - sortScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return daysKey(a) - daysKey(b);
  });

  // Three groups — out-of-season tasks always land in allGood
  const needsAttention = sorted.filter(t => isWindowActive(t, region) && ['due', 'needed', 'confirm'].includes(getStatus(t)));
  const comingUp       = sorted.filter(t => isWindowActive(t, region) && ['coming-up', 'scheduled'].includes(getStatus(t)));
  const allGood        = sorted.filter(t => !isWindowActive(t, region) || getStatus(t) === 'ok');

  const seasonSubtitle = (t) => {
    if (isWindowActive(t, region)) return undefined;
    return t.seasonalLabel ? `Coming up in ${t.seasonalLabel}` : 'Out of season';
  };

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

        {/* Life event group renders only on the All filter so category views
            stay clean. Always at the top, always expanded by default. */}
        {activeEvent && eventTasks.length > 0 && activeCategory === 'all' && (
          <LifeEventGroup
            event={activeEvent}
            tasks={eventTasks}
            taskState={taskState}
            getStatus={getStatus}
            getDays={getDays}
            providerHistory={providerHistory}
            pendingCalendarMatches={pendingCalendarMatches}
            onSelectTask={onSelectTask}
            onDoneTask={onDoneTask}
            onMatchConfirm={onMatchConfirm}
            onMatchDismiss={onMatchDismiss}
          />
        )}

        {!hasKnown && unknownFiltered.length === 0 && (
          <div style={{ background:'#FFFFFF', borderRadius:14, padding:'36px 20px', textAlign:'center', border:'1px solid #EAE4DA', marginTop:16 }}>
            <div style={{ fontFamily:"'Righteous', cursive", fontSize:16, color:'#06A77D', marginBottom:6 }}>Nothing here</div>
            <div style={{ fontSize:13, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>No tasks in this category yet.</div>
          </div>
        )}

        {needsAttention.length > 0 && (
          <>
            <GroupLabel label="Needs attention" />
            {needsAttention.map(task => {
              const match = pendingCalendarMatches.find(m => m.taskId === task.id);
              return (
                <SwipeableTaskCard
                  key={task.id}
                  task={{ ...task, scheduledDate: taskState[task.id]?.scheduledDate, lastDone: taskState[task.id]?.lastDone }}
                  status={getStatus(task)}
                  days={getDays(task)}
                  hasSavedProvider={!!providerHistory[task.id]}
                  onSelect={onSelectTask}
                  onDone={onDoneTask}
                  onSnooze={onSnooze}
                  showCategoryIcon
                  subtitle={getStatus(task) === 'needed' ? '' : undefined}
                  pendingMatch={match}
                  onMatchConfirm={match ? () => onMatchConfirm(task.id, match.eventDate) : undefined}
                  onMatchDismiss={match ? () => onMatchDismiss(task.id) : undefined}
            stepProgress={taskState[task.id]?.stepProgress}
                />
              );
            })}
          </>
        )}

        {showComingUp && comingUp.length > 0 && (
          <>
            {needsAttention.length > 0 && <GroupDivider />}
            <GroupLabel label="Coming up" />
            {comingUp.map(task => {
              const match = pendingCalendarMatches.find(m => m.taskId === task.id);
              return (
                <SwipeableTaskCard
                  key={task.id}
                  task={{ ...task, scheduledDate: taskState[task.id]?.scheduledDate, lastDone: taskState[task.id]?.lastDone }}
                  status={getStatus(task)}
                  days={getDays(task)}
                  hasSavedProvider={!!providerHistory[task.id]}
                  onSelect={onSelectTask}
                  onDone={onDoneTask}
                  onSnooze={onSnooze}
                  showCategoryIcon
                  pendingMatch={match}
                  onMatchConfirm={match ? () => onMatchConfirm(task.id, match.eventDate) : undefined}
                  onMatchDismiss={match ? () => onMatchDismiss(task.id) : undefined}
            stepProgress={taskState[task.id]?.stepProgress}
                />
              );
            })}
          </>
        )}

        {showAllGood && allGood.length > 0 && (
          <>
            {(needsAttention.length > 0 || comingUp.length > 0) && <GroupDivider />}
            <GroupLabel label="All good" />
            {allGood.map(task => {
              const match = pendingCalendarMatches.find(m => m.taskId === task.id);
              return (
                <SwipeableTaskCard
                  key={task.id}
                  task={{ ...task, scheduledDate: taskState[task.id]?.scheduledDate, lastDone: taskState[task.id]?.lastDone }}
                  status={getStatus(task)}
                  days={getDays(task)}
                  hasSavedProvider={!!providerHistory[task.id]}
                  onSelect={onSelectTask}
                  onDone={onDoneTask}
                  onSnooze={onSnooze}
                  showCategoryIcon
                  subtitle={seasonSubtitle(task)}
                  pendingMatch={match}
                  onMatchConfirm={match ? () => onMatchConfirm(task.id, match.eventDate) : undefined}
                  onMatchDismiss={match ? () => onMatchDismiss(task.id) : undefined}
            stepProgress={taskState[task.id]?.stepProgress}
                />
              );
            })}
          </>
        )}

        <SnoozedSection tasks={activeCategory === 'all' ? snoozedTasks : snoozedTasks.filter(t => t.cat === activeCategory)} taskState={taskState} onSelectTask={onSelectTask} onUnsnooze={unsnoozeTask} />

        <ExploreSection tasks={unknownFiltered} markDone={markDone} markNeeded={markNeeded} markNotApplicable={markNotApplicable} />

      </div>
    </div>
  );
}
