import { TrickleCard } from "../components/TrickleCard";
import { TaskCard }    from "../components/TaskCard";
import { HazardCard }  from "../components/HazardCard";

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
  profile,
  pendingHazards,
  focusTasks,
  doneThisWeek,
  nextUpcomingTask,
  getDays,
  providerHistory,
  getStatus,
  onGoToAll,
  onSelectTask,
  onDoneTask,
  onTrickleAnswer,
  onTrickleDismiss,
  onTrickleAssist,
  onHazardAccept,
  onHazardDismiss,
}) {
  return (
    <div style={{ background:'#FDFAF2' }}>
      <HomeHeader profile={profile} doneThisWeek={doneThisWeek} />

      <div style={{ padding:'20px 18px 160px', maxWidth:680, margin:'0 auto' }}>

        {/* Trickle question */}
        {trickleTask && (
          <>
            <TrickleCard
              task={trickleTask}
              onAnswer={onTrickleAnswer}
              onDismiss={onTrickleDismiss}
              onAssist={onTrickleAssist}
            />
            <Divider />
          </>
        )}

        {/* Focus for today */}
        {focusTasks.length > 0 && (
          <div style={{ marginBottom:4 }}>
            <SectionLabel label="Focus for today" color="#1A5C3A" />
            {focusTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                status={getStatus(task)}
                days={getDays(task)}
                hasSavedProvider={!!providerHistory[task.id]}
                onSelect={onSelectTask}
                onDone={onDoneTask}
                subtitle={getStatus(task) === 'needed' ? '' : undefined}
              />
            ))}
          </div>
        )}

        {/* Hazard card */}
        {pendingHazards && (
          <>
            {focusTasks.length > 0 && <Divider />}
            <HazardCard
              hazards={pendingHazards}
              onAccept={onHazardAccept}
              onDismiss={onHazardDismiss}
            />
          </>
        )}

        {/* Empty state — two variants based on whether user has done anything this week */}
        {focusTasks.length === 0 && !pendingHazards && (
          doneThisWeek > 0
            ? <EarnedState doneThisWeek={doneThisWeek} profile={profile} onGoToAll={onGoToAll} />
            : <QuietState nextUpcomingTask={nextUpcomingTask} getDays={getDays} />
        )}

      </div>
    </div>
  );
}
