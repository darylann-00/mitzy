import { useState } from "react";
import { C, CAT_META } from "../data/constants";
import { TaskCard } from "../components/TaskCard";

export function AllView({ activeTasks, getStatus, getDays, providerHistory, onSelectTask, onDoneTask, onAddTask }) {
  const [activeCategory, setActiveCategory] = useState("home");
  const [showAll, setShowAll] = useState(false);

  const availableCategories = Object.keys(CAT_META).filter(c => activeTasks.some(t => t.cat === c));
  const categoryTasks       = activeTasks.filter(t => t.cat === activeCategory);
  const shownTasks          = showAll ? categoryTasks : categoryTasks.filter(t => getStatus(t) !== "ok");

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px" }}>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 16, WebkitOverflowScrolling: "touch" }}>
        {availableCategories.map(cat => {
          const meta   = CAT_META[cat];
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              className="pb"
              onClick={() => setActiveCategory(cat)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 14, background: active ? meta.color : C.white, color: active ? C.white : C.ink, border: `1.5px solid ${active ? meta.color : "#E8E0D8"}`, borderRadius: 20, whiteSpace: "nowrap", fontWeight: active ? 700 : 500, flexShrink: 0 }}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}
      </div>

      {/* Count + filter toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="mf" style={{ fontSize: 14, color: C.muted }}>{shownTasks.length} task{shownTasks.length !== 1 ? "s" : ""}</div>
        <button className="pb" onClick={() => setShowAll(x => !x)} style={{ fontSize: 13, background: showAll ? C.ink : C.light, color: showAll ? C.white : C.muted, border: "none", borderRadius: 10, padding: "5px 12px", fontWeight: 600 }}>
          {showAll ? "due only" : "show all"}
        </button>
      </div>

      {/* Empty state */}
      {shownTasks.length === 0 && (
        <div style={{ background: C.white, borderRadius: 20, padding: "28px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
          <div className="mf" style={{ fontSize: 15, color: C.mint }}>all clear in {CAT_META[activeCategory]?.label}!</div>
        </div>
      )}

      {/* Task list */}
      {shownTasks.map(task => (
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

      <button className="pb" onClick={onAddTask} style={{ width: "100%", marginTop: 16, padding: "14px", fontSize: 15, background: C.white, color: C.ink, border: "1.5px dashed #C4BAB0", borderRadius: 16, fontWeight: 600 }}>
        + add custom task
      </button>
    </div>
  );
}
