import { C, KID_COLORS } from "../data/constants";
import { TaskCard } from "../components/TaskCard";
import { TrickleCard } from "../components/TrickleCard";
import { HazardCard } from "../components/HazardCard";

export function HomeView({
  trickleQ,
  profile,
  pendingHazards,
  needsConfirm,
  urgentTasks,
  upcomingTasks,
  providerHistory,
  taskState,
  getStatus,
  getDays,
  getNext,
  onSelectTask,
  onDoneTask,
  onScheduleTask,
  onTrickleAnswer,
  onTrickleDismiss,
  onHazardAccept,
  onHazardDismiss,
}) {
  return (
    <div className="viewWrap">

      {/* Trickle question */}
      {trickleQ && (
        <TrickleCard
          question={trickleQ}
          profile={profile}
          onAnswer={onTrickleAnswer}
          onDismiss={onTrickleDismiss}
        />
      )}

      {/* Hazard card */}
      {pendingHazards && (
        <HazardCard
          hazards={pendingHazards}
          onAccept={onHazardAccept}
          onDismiss={onHazardDismiss}
        />
      )}

      {/* Scheduled date confirmations */}
      {needsConfirm.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="mf" style={{ fontSize: 14, color: C.muted, marginBottom: 10 }}>quick check-in</div>
          {needsConfirm.map(task => (
            <div key={task.id} style={{ background: C.white, borderRadius: 16, padding: "14px 16px", marginBottom: 8, border: `1.5px solid ${C.mint}` }}>
              <div style={{ fontSize: 15, color: C.ink, fontWeight: 600, marginBottom: 10 }}>{task.label}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="pb" onClick={() => onDoneTask(task)}     style={{ flex: 2, padding: "9px", fontSize: 14, background: C.mint, color: C.white, border: "none", borderRadius: 12, fontWeight: 700 }}>yep, done ✓</button>
                <button className="pb" onClick={() => onScheduleTask(task)} style={{ flex: 1, padding: "9px", fontSize: 14, background: C.light, color: C.ink,  border: "none", borderRadius: 12, fontWeight: 600 }}>reschedule</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Urgent tasks */}
      {urgentTasks.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <div className="mf sectionLabel" style={{ color: C.coral, marginBottom: 12, fontSize: 17 }}>
            <span className="sectionSquiggle" style={{ color: C.coral }} />
            <span>do these now</span>
            <span style={{ opacity: 0.9 }}>✦</span>
          </div>
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

      {/* Upcoming tasks */}
      {upcomingTasks.length > 0 && (
        <div style={{ marginTop: urgentTasks.length > 0 ? 16 : 0 }}>
          <div className="mf sectionLabel" style={{ color: "#A07800", marginBottom: 12, fontSize: 17 }}>
            <span className="sectionSquiggle" style={{ color: "#A07800" }} />
            <span>coming up</span>
            <span style={{ opacity: 0.9 }}>★</span>
          </div>
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

      {/* All clear state */}
      {urgentTasks.length === 0 && upcomingTasks.length === 0 && needsConfirm.length === 0 && (
        <div style={{ background: C.white, borderRadius: 20, padding: "36px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
          <div className="mf" style={{ fontSize: 18, color: C.mint, marginBottom: 8 }}>all clear!</div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>Nothing pressing. Mitzy is satisfied.</div>
        </div>
      )}

      {/* Kid / pet chips */}
      {(profile.kids?.length > 0 || profile.pets?.length > 0) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
          {profile.kids?.map((k, i) => (
            <div key={`k${k.name}`} style={{ padding: "5px 12px", fontSize: 13, background: `${KID_COLORS[i % KID_COLORS.length]}20`, border: `1.5px solid ${KID_COLORS[i % KID_COLORS.length]}`, borderRadius: 20, color: KID_COLORS[i % KID_COLORS.length], fontWeight: 600 }}>
              {k.name} · {k.age}
            </div>
          ))}
          {profile.pets?.map(a => (
            <div key={`p${a.name}`} style={{ padding: "5px 12px", fontSize: 13, background: `${C.orange}15`, border: `1.5px solid ${C.orange}`, borderRadius: 20, color: C.orange, fontWeight: 600 }}>
              {a.type === "dog" ? "🐕" : a.type === "cat" ? "🐈" : "🐾"} {a.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
