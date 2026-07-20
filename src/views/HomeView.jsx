import { useState, useEffect, Fragment } from "react";
import { TrickleCard } from "../components/TrickleCard";
import { SwipeableTaskCard } from "../components/SwipeableTaskCard";
import { SnoozeTooltip }    from "../components/SnoozeTooltip";
import { HazardCard }  from "../components/HazardCard";
import { LifeEventNudge } from "../components/LifeEventNudge";
import { useProfileContext } from "../contexts/ProfileContext";
import { useTaskContext }    from "../contexts/TaskContext";
import { useCalendarContext } from "../contexts/CalendarContext";
import { useCapacityNudge, recordWeeklyStats, dismissCapacityNudge } from "../hooks/useCapacityNudge";
import { becameDueAfterPlan } from "../utils/taskLogic";
import { weekRangeLabel } from "../hooks/useWeeklyPlan";

// ─── Shared header pattern ─────────────────────────────────────────────────────
export function AppHeader({ rightContent }) {
  return (
    <div style={{
      background: '#1A5C3A',
      padding: '22px 22px 18px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Scatter shapes */}
      <div style={{ position:'absolute', width:60, height:60, borderRadius:'50%', background:'#0F3D27', top:-18, right:-16 }} />
      <div style={{ position:'absolute', width:30, height:30, borderRadius:'50%', background:'#06A77D', top:10, right:30 }} />
      <div style={{ position:'absolute', width:12, height:12, background:'#F77F00', transform:'rotate(45deg)', bottom:10, right:22 }} />
      <div style={{ position:'absolute', width:10, height:10, borderRadius:'50%', background:'#F4C430', top:6, right:72 }} />
      <div style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:'#D62828', bottom:14, right:58 }} />
      <div style={{ position:'absolute', width:22, height:22, borderRadius:'50%', border:'2.5px solid #06A77D', opacity:0.5, bottom:-6, right:90 }} />

      {/* Wordmark */}
      <div style={{ display:'flex', alignItems:'center', gap:11, position:'relative' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, flexShrink:0 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#D62828' }} />
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#F77F00' }} />
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#06A77D' }} />
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#F4C430' }} />
        </div>
        <span style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:36, color:'#E8F5EE', lineHeight:1 }}>
          mitzy
        </span>
      </div>

      {/* Right side */}
      <div style={{ fontSize:11, letterSpacing:'0.07em', textTransform:'uppercase', color:'#B8DCC8', textAlign:'right', lineHeight:1.5, position:'relative', fontFamily:'DM Sans, sans-serif' }}>
        {rightContent}
      </div>
    </div>
  );
}

// ─── HomeView-only header with greeting ────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function HomeHeader({ profile, doneThisWeek }) {
  const name = profile?.name ? `, ${profile.name}` : '';
  return (
    <div style={{
      background: '#1A5C3A',
      padding: '22px 22px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Scatter shapes */}
      <div style={{ position:'absolute', width:60, height:60, borderRadius:'50%', background:'#0F3D27', top:-18, right:-16 }} />
      <div style={{ position:'absolute', width:30, height:30, borderRadius:'50%', background:'#06A77D', top:10, right:30 }} />
      <div style={{ position:'absolute', width:12, height:12, background:'#F77F00', transform:'rotate(45deg)', bottom:10, right:22 }} />
      <div style={{ position:'absolute', width:10, height:10, borderRadius:'50%', background:'#F4C430', top:6, right:72 }} />
      <div style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:'#D62828', bottom:14, right:58 }} />
      <div style={{ position:'absolute', width:22, height:22, borderRadius:'50%', border:'2.5px solid #06A77D', opacity:0.5, bottom:-6, right:90 }} />

      {/* Wordmark row */}
      <div style={{ display:'flex', alignItems:'center', gap:11, position:'relative', marginBottom:10 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, flexShrink:0 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#D62828' }} />
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#F77F00' }} />
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#06A77D' }} />
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#F4C430' }} />
        </div>
        <span style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:36, color:'#E8F5EE', lineHeight:1 }}>
          mitzy
        </span>
      </div>

      {/* Greeting row — greeting left, pill bottom-right */}
      <div style={{ position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:22, color:'#E8F5EE', lineHeight:1.2 }}>
          {getGreeting()}{name}
        </div>
        {doneThisWeek > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: '#0F3D27',
            border: '1px solid #2A7A50',
            borderRadius: 20,
            padding: '4px 10px',
            flexShrink: 0,
            marginLeft: 12,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="#06A77D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily:'DM Sans, sans-serif', fontSize:11, fontWeight:600, color:'#B8DCC8' }}>
              {doneThisWeek} done this week
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'16px 0' }}>
      <div style={{ flex:1, height:1, background:'#EAE4DA' }} />
      <div style={{ width:8, height:8, background:'#FDFAF2', border:'1.5px solid #D0E4D8', transform:'rotate(45deg)', flexShrink:0 }} />
      <div style={{ flex:1, height:1, background:'#EAE4DA' }} />
    </div>
  );
}

function SectionLabel({ label, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
      <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }} />
      <span style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'#1C2B22', flex:1 }}>
        {label}
      </span>
      <div style={{ flex:1, height:2, borderRadius:1, background:color, opacity:0.2 }} />
    </div>
  );
}


function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function EarnedState({ doneThisWeek, profile, onGoToAll }) {
  const name = profile?.name ? `, ${profile.name}` : '';
  const count = doneThisWeek;
  const variants = [
    { headline: `You're on top of it${name}.`, sub: `${count} task${count !== 1 ? 's' : ''} handled this week. Nice work.` },
    { headline: 'Nothing to do but enjoy the day.', sub: `You knocked out ${count} this week.` },
    { headline: `All caught up${name}.`, sub: `${count} task${count !== 1 ? 's' : ''} done this week. ✓` },
  ];
  const { headline, sub } = variants[getDayOfYear() % 3];
  return (
    <div style={{ background:'#FFFFFF', borderRadius:14, padding:'32px 20px 24px', textAlign:'center', border:'1px solid #EAE4DA' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', background:'#E8F5EE', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <polyline points="4,11 9,16 18,5" stroke="#06A77D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontFamily:"'Righteous', cursive", fontSize:19, color:'#1C2B22', marginBottom:6 }}>{headline}</div>
      <div style={{ fontSize:13, color:'#4A6256', lineHeight:1.7, fontFamily:'DM Sans, sans-serif', marginBottom:20 }}>{sub}</div>
      <button
        onClick={onGoToAll}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#1A5C3A', fontFamily:'DM Sans, sans-serif', fontWeight:600, display:'inline-flex', alignItems:'center', gap:4 }}
      >
        Feeling ambitious? See what else Mitzy's tracking
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <polyline points="4,2 10,7 4,12" stroke="#1A5C3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function QuietState({ nextUpcomingTask, getDays }) {
  const daysAway = nextUpcomingTask ? getDays(nextUpcomingTask) : null;
  const nextLine = nextUpcomingTask && daysAway != null
    ? `Next up: ${nextUpcomingTask.label} in ${daysAway} day${daysAway !== 1 ? 's' : ''}.`
    : null;
  return (
    <div style={{ background:'#FFFFFF', borderRadius:14, padding:'32px 20px 24px', textAlign:'center', border:'1px solid #EAE4DA' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', background:'#E8F5EE', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <polyline points="4,11 9,16 18,5" stroke="#06A77D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontFamily:"'Righteous', cursive", fontSize:19, color:'#1C2B22', marginBottom:6 }}>You're on track.</div>
      <div style={{ fontSize:13, color:'#4A6256', lineHeight:1.7, fontFamily:'DM Sans, sans-serif' }}>
        Nothing pressing today. {nextLine ?? 'Mitzy has you covered.'}
      </div>
    </div>
  );
}

export function HomeView({
  trickleTask,
  pendingHazards,
  nextUpcomingTask,
  lifeEventNudge,
  onLifeEventNudgePrimary,
  onLifeEventNudgeDismiss,
  onGoToAll,
  onSelectTask,
  onDoneTask,
  onSnooze,
  onTrickleAnswer,
  onTrickleDismiss,
  onTrickleAssist,
  onHazardAccept,
  onHazardDismiss,
  onMatchConfirm,
  onMatchDismiss,
  onOpenWeeklyCheckIn,
}) {
  const { profile, providerHistory, updateProfile } = useProfileContext();
  const { homeTasks, doneThisWeek, getStatus, getDays, taskState, isInPlanMode, planTasks, planProgress, showWeeklyNudge, dismissWeeklyNudge, activePlan, scoredDue, planningNextWeek, planFloor } = useTaskContext();
  const todayTask = homeTasks[0] ?? null;
  const isDueThisWeek = (t) => {
    const s = getStatus(t);
    if (s === 'due' || s === 'needed' || s === 'confirm') return true;
    const d = getDays(t);
    return d === null || d <= 7;
  };
  const remaining = homeTasks.slice(1);
  const customWeek = remaining.filter(t => t.isCustom && isDueThisWeek(t));
  const MAX_LIBRARY = Math.max(0, 3 - customWeek.length);
  const libraryWeek = remaining.filter(t => !t.isCustom && isDueThisWeek(t)).slice(0, MAX_LIBRARY);
  const weekTasks = [...customWeek, ...libraryWeek];
  const { pendingCalendarMatches } = useCalendarContext();
  const capacityNudge = useCapacityNudge(profile.capacity, homeTasks.length, doneThisWeek);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    recordWeeklyStats(homeTasks.length, doneThisWeek);
  }, [homeTasks.length, doneThisWeek]);

  // Nudge cards compete for the same top-of-screen real estate. Priority order
  // (highest first): life event -> weekly check-in -> trickle -> capacity -> hazard.
  // Only the top 2 eligible nudges render; the rest wait for a later visit.
  const nudgeCandidates = [];

  if (lifeEventNudge) {
    nudgeCandidates.push({
      key: 'lifeEvent',
      priority: 0,
      node: (
        <LifeEventNudge
          variant={lifeEventNudge.variant}
          eventLabel={lifeEventNudge.eventLabel}
          onPrimary={onLifeEventNudgePrimary}
          onDismiss={onLifeEventNudgeDismiss}
        />
      ),
    });
  }

  if (showWeeklyNudge && !isInPlanMode) {
    nudgeCandidates.push({
      key: 'weeklyCheckIn',
      priority: 1,
      node: (
        <div style={{ background:'#FFFDE7', borderRadius:14, border:'1px solid #EAE4DA', padding:'18px 18px', marginBottom:4 }}>
          <div style={{
            fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
            color:'#B8960A', fontFamily:'DM Sans, sans-serif', marginBottom:6,
          }}>
            Weekly check-in
          </div>
          <div style={{ fontFamily:"'Righteous', cursive", fontSize:17, color:'#1C2B22', marginBottom:6 }}>
            {planningNextWeek ? 'Ready to plan next week?' : 'Ready to plan your week?'}
          </div>
          <div style={{ fontSize:13, color:'#4A6256', fontFamily:'DM Sans, sans-serif', lineHeight:1.5, marginBottom:14 }}>
            {planningNextWeek
              ? "Take a minute to tell Mitzy what's coming — she'll set up next week."
              : "Take a minute to tell Mitzy what's happening — she'll set up your week."}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={onOpenWeeklyCheckIn}
              style={{ flex:1, padding:'10px', fontSize:13, fontWeight:700, background:'#1A5C3A', color:'#E8F5EE', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
            >
              Let's do it
            </button>
            <button
              onClick={dismissWeeklyNudge}
              style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, background:'#F0EDE4', color:'#4A6256', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
            >
              Skip this week
            </button>
          </div>
        </div>
      ),
    });
  }

  if (trickleTask) {
    nudgeCandidates.push({
      key: 'trickle',
      priority: 2,
      node: (
        <TrickleCard
          task={trickleTask}
          onAnswer={onTrickleAnswer}
          onDismiss={onTrickleDismiss}
          onAssist={onTrickleAssist}
        />
      ),
    });
  }

  if (capacityNudge && !nudgeDismissed) {
    nudgeCandidates.push({
      key: 'capacity',
      priority: 3,
      node: (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAE4DA', padding:'16px 18px', marginBottom:4 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#1C2B22', marginBottom:10, fontFamily:'DM Sans, sans-serif', lineHeight:1.5 }}>
            {capacityNudge.message}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => {
                updateProfile({ ...profile, capacity: capacityNudge.suggestion });
                dismissCapacityNudge();
                setNudgeDismissed(true);
              }}
              style={{ flex:1, padding:'10px', fontSize:13, fontWeight:700, background:'#1A5C3A', color:'#E8F5EE', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
            >
              {capacityNudge.direction === 'up' ? 'Show me more' : 'Dial it back'}
            </button>
            <button
              onClick={() => { dismissCapacityNudge(); setNudgeDismissed(true); }}
              style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, background:'#F0EDE4', color:'#4A6256', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
            >
              I'm good
            </button>
          </div>
        </div>
      ),
    });
  }

  if (pendingHazards && !isInPlanMode) {
    nudgeCandidates.push({
      key: 'hazard',
      priority: 4,
      node: (
        <HazardCard
          hazards={pendingHazards}
          onAccept={onHazardAccept}
          onDismiss={onHazardDismiss}
        />
      ),
    });
  }

  const visibleNudges = [...nudgeCandidates].sort((a, b) => a.priority - b.priority).slice(0, 2);
  const hazardCardVisible = visibleNudges.some(n => n.key === 'hazard');

  return (
    <div style={{ background:'#FDFAF2' }}>
      <HomeHeader profile={profile} doneThisWeek={doneThisWeek} />

      <div style={{ padding:'20px 18px 160px', maxWidth:680, margin:'0 auto' }}>

        {/* Nudge cards — highest-priority 1-2 only, see priority list above */}
        {visibleNudges.map(n => (
          <Fragment key={n.key}>
            {n.node}
            <Divider />
          </Fragment>
        ))}

        {/* ─── Plan mode ──────────────────────────────────────────────── */}
        {isInPlanMode && (() => {
          const scheduledDates = activePlan?.scheduledDates || {};
          const doneTasks = planTasks.filter(t => {
            const entry = taskState[t.id];
            return entry?.lastDone && planFloor && entry.lastDone >= planFloor;
          });
          const pendingTasks = planTasks.filter(t => {
            const entry = taskState[t.id];
            return !(entry?.lastDone && planFloor && entry.lastDone >= planFloor);
          });
          const scheduled = pendingTasks.filter(t => scheduledDates[t.id]);
          const unscheduled = pendingTasks.filter(t => !scheduledDates[t.id]);

          // Tasks that became due only AFTER the plan was locked in and aren't
          // in it. Tasks already due at planning time were offered during the
          // check-in and deliberately left out — they don't count as "came up".
          // The plan stays finite — these get one quiet line, not cards.
          const planIds = new Set(activePlan?.taskIds || []);
          const cameUp = scoredDue.filter(t => {
            if (planIds.has(t.id)) return false;
            if (getStatus(t) !== 'due') return false;
            return becameDueAfterPlan(getDays(t), activePlan?.confirmedAt);
          });

          // Group scheduled tasks by date
          const byDate = {};
          scheduled.forEach(t => {
            const d = scheduledDates[t.id];
            if (!byDate[d]) byDate[d] = [];
            byDate[d].push(t);
          });
          const sortedDates = Object.keys(byDate).sort();

          return (
            <>
              {/* Progress bar */}
              <div style={{
                background:'#FFFFFF', borderRadius:12, border:'1px solid #EAE4DA',
                padding:'14px 16px', marginBottom:16,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>
                    {planProgress.done} of {planProgress.total} done
                    {activePlan?.weekStart && (
                      <span style={{ fontWeight:500, color:'#4A6256', marginLeft:8 }}>
                        · {weekRangeLabel(activePlan.weekStart)}
                      </span>
                    )}
                  </span>
                  {planProgress.done === planProgress.total && planProgress.total > 0 ? (
                    <span style={{ fontSize:12, color:'#06A77D', fontWeight:600, fontFamily:'DM Sans, sans-serif' }}>
                      All done!
                    </span>
                  ) : (
                    <button
                      onClick={onOpenWeeklyCheckIn}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#1A5C3A', fontWeight:600, fontFamily:'DM Sans, sans-serif', textDecoration:'underline', padding:0 }}
                    >
                      Adjust plan
                    </button>
                  )}
                </div>
                <div style={{ display:'flex', gap:3 }}>
                  {planTasks.map((t) => {
                    const isDone = doneTasks.some(d => d.id === t.id);
                    return (
                      <div key={t.id} style={{
                        flex:1, height:6, borderRadius:3,
                        background: isDone ? '#1A5C3A' : '#E8F0EC',
                      }} />
                    );
                  })}
                </div>
              </div>

              {/* Scheduled tasks by day */}
              {sortedDates.map(date => {
                const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
                return (
                  <div key={date} style={{ marginBottom:4 }}>
                    <SectionLabel label={dayName} color="#F4C430" />
                    {byDate[date].map(task => (
                      <SwipeableTaskCard
                        key={task.id}
                        task={{ ...task, scheduledDate: scheduledDates[task.id], lastDone: taskState[task.id]?.lastDone }}
                        status={getStatus(task)}
                        days={getDays(task)}
                        hasSavedProvider={!!providerHistory[task.id]}
                        onSelect={onSelectTask}
                        onDone={onDoneTask}
                        onSnooze={onSnooze}
                        showCategoryIcon
                        stepProgress={taskState[task.id]?.stepProgress}
                      />
                    ))}
                  </div>
                );
              })}

              {/* Unscheduled plan tasks */}
              {unscheduled.length > 0 && (
                <>
                  {sortedDates.length > 0 && <Divider />}
                  <div style={{ marginBottom:4 }}>
                    <SectionLabel label="This week" color="#F77F00" />
                    {unscheduled.map(task => (
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
                        stepProgress={taskState[task.id]?.stepProgress}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Done tasks */}
              {doneTasks.length > 0 && (
                <>
                  <Divider />
                  <div style={{ marginBottom:4 }}>
                    <SectionLabel label="Done" color="#06A77D" />
                    {doneTasks.map(task => (
                      <div key={task.id} style={{ opacity:0.5 }}>
                        <SwipeableTaskCard
                          task={{ ...task, scheduledDate: taskState[task.id]?.scheduledDate, lastDone: taskState[task.id]?.lastDone }}
                          status="ok"
                          days={null}
                          hasSavedProvider={!!providerHistory[task.id]}
                          onSelect={onSelectTask}
                          showCategoryIcon
                          stepProgress={taskState[task.id]?.stepProgress}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* All plan tasks done */}
              {planProgress.done === planProgress.total && planProgress.total > 0 && (
                <EarnedState doneThisWeek={planProgress.done} profile={profile} onGoToAll={onGoToAll} />
              )}

              {/* Quiet pointer to newly-due tasks outside the frozen plan */}
              {cameUp.length > 0 && (
                <div style={{ textAlign:'center', marginTop:16 }}>
                  <button
                    onClick={onGoToAll}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#4A6256', fontFamily:'DM Sans, sans-serif', display:'inline-flex', alignItems:'center', gap:4 }}
                  >
                    {cameUp.length} thing{cameUp.length !== 1 ? 's' : ''} came up this week — take a look
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <polyline points="4,2 10,7 4,12" stroke="#4A6256" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          );
        })()}

        {/* ─── Live mode (no weekly plan) ────────────────────────────── */}
        {!isInPlanMode && (
          <>
            {/* Today — single highest-priority task */}
            {todayTask && (() => {
              const match = pendingCalendarMatches.find(m => m.taskId === todayTask.id);
              return (
                <div style={{ marginBottom: 4 }}>
                  <SectionLabel label="Today" color="#1A5C3A" />
                  <SnoozeTooltip visible />
                  <SwipeableTaskCard
                    task={{ ...todayTask, scheduledDate: taskState[todayTask.id]?.scheduledDate, lastDone: taskState[todayTask.id]?.lastDone }}
                    status={getStatus(todayTask)}
                    days={getDays(todayTask)}
                    hasSavedProvider={!!providerHistory[todayTask.id]}
                    onSelect={onSelectTask}
                    onDone={onDoneTask}
                    onSnooze={onSnooze}
                    showCategoryIcon
                    subtitle={getStatus(todayTask) === 'needed' && getDays(todayTask) === null ? '' : undefined}
                    stepProgress={taskState[todayTask.id]?.stepProgress}
                    pendingMatch={match}
                    onMatchConfirm={match ? () => onMatchConfirm(todayTask.id, match.eventDate) : undefined}
                    onMatchDismiss={match ? () => onMatchDismiss(todayTask.id) : undefined}
                  />
                </div>
              );
            })()}

            {/* This week — remaining tasks, uncapped */}
            {todayTask && weekTasks.length > 0 && (
              <>
                <Divider />
                <div style={{ marginBottom: 4 }}>
                  <SectionLabel label="This week" color="#F77F00" />
                  {weekTasks.map(task => {
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
                        subtitle={getStatus(task) === 'needed' && getDays(task) === null ? '' : undefined}
                        stepProgress={taskState[task.id]?.stepProgress}
                        pendingMatch={match}
                        onMatchConfirm={match ? () => onMatchConfirm(task.id, match.eventDate) : undefined}
                        onMatchDismiss={match ? () => onMatchDismiss(task.id) : undefined}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Nudge to All page when only one task */}
            {todayTask && weekTasks.length === 0 && !hazardCardVisible && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: 14,
                padding: '18px 20px',
                textAlign: 'center',
                border: '1px solid #EAE4DA',
                marginTop: 12,
              }}>
                <div style={{ fontSize: 13, color: '#4A6256', fontFamily: 'DM Sans, sans-serif', marginBottom: 10 }}>
                  Just the one for now.
                </div>
                <button
                  onClick={onGoToAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#1A5C3A', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  See what else Mitzy's tracking
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <polyline points="4,2 10,7 4,12" stroke="#1A5C3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}

            {/* Empty state — two variants based on whether user has done anything this week */}
            {homeTasks.length === 0 && !hazardCardVisible && (
              doneThisWeek > 0
                ? <EarnedState doneThisWeek={doneThisWeek} profile={profile} onGoToAll={onGoToAll} />
                : <QuietState nextUpcomingTask={nextUpcomingTask} getDays={getDays} />
            )}
          </>
        )}

      </div>
    </div>
  );
}
