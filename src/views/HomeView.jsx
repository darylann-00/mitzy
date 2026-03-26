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

export function HomeView({
  trickleQ,
  profile,
  pendingHazards,
  urgentTasks,
  upcomingTasks,
  providerHistory,
  getStatus,
  getDays,
  onSelectTask,
  onDoneTask,
  onTrickleAnswer,
  onTrickleDismiss,
  onHazardAccept,
  onHazardDismiss,
}) {
  const now = new Date();
  const dayOfWeek    = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthAndDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div style={{ background:'#FDFAF2', minHeight:'100vh' }}>
      <AppHeader rightContent={<>{dayOfWeek}<br />{monthAndDate}</>} />

      <div style={{ padding:'20px 18px 18px', maxWidth:680, margin:'0 auto' }}>

        {/* Trickle question */}
        {trickleQ && (
          <>
            <TrickleCard
              question={trickleQ}
              profile={profile}
              onAnswer={onTrickleAnswer}
              onDismiss={onTrickleDismiss}
            />
            <Divider />
          </>
        )}

        {/* Due now */}
        {urgentTasks.length > 0 && (
          <div style={{ marginBottom:4 }}>
            <SectionLabel label="Do these now" color="#D62828" />
            {urgentTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                status={getStatus(task)}
                days={getDays(task)}
                hasSavedProvider={!!providerHistory[task.id]}
                onSelect={onSelectTask}
                onDone={onDoneTask}
              />
            ))}
          </div>
        )}

        {urgentTasks.length > 0 && upcomingTasks.length > 0 && <Divider />}

        {/* Coming up */}
        {upcomingTasks.length > 0 && (
          <div>
            <SectionLabel label="Coming up" color="#F77F00" />
            {upcomingTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                status={getStatus(task)}
                days={getDays(task)}
                hasSavedProvider={!!providerHistory[task.id]}
                onSelect={onSelectTask}
                onDone={onDoneTask}
              />
            ))}
          </div>
        )}

        {/* Hazard card */}
        {pendingHazards && (
          <>
            <Divider />
            <HazardCard
              hazards={pendingHazards}
              onAccept={onHazardAccept}
              onDismiss={onHazardDismiss}
            />
          </>
        )}

        {/* All clear */}
        {urgentTasks.length === 0 && upcomingTasks.length === 0 && !pendingHazards && (
          <div style={{ background:'#FFFFFF', borderRadius:14, padding:'36px 20px', textAlign:'center', border:'1px solid #EAE4DA' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#E8F5EE', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <polyline points="4,10 8,14 16,5" stroke="#06A77D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontFamily:"'Righteous', cursive", fontSize:18, color:'#06A77D', marginBottom:6 }}>All clear</div>
            <div style={{ fontSize:13, color:'#4A6256', lineHeight:1.7, fontFamily:'DM Sans, sans-serif' }}>
              Nothing pressing right now. Mitzy has you covered.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
