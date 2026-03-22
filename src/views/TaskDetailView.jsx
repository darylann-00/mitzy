import { C, CAT_META } from "../data/constants";

function intervalLabel(days) {
  if (days >= 730) return `${Math.round(days / 365)} years`;
  if (days >= 365) return "1 year";
  if (days >= 60)  return `${Math.round(days / 30)} months`;
  return `${days} days`;
}

const ASSIST_LABELS = {
  providers: "find local providers →",
  script:    "draft a message →",
  deadline:  "look up dates & links →",
  guidance:  "how to handle this →",
};

const ASSIST_DESCRIPTIONS = {
  providers: "I'll find 3-4 local, highly-rated providers for you.",
  script:    "I'll draft a ready-to-send message or call script.",
  deadline:  "I'll look up exact dates, official links, and phone numbers.",
  guidance:  "I'll give you practical guidance on what to do and what to watch for.",
};

export function TaskDetailView({ task, status, taskState, savedProvider, getNext, onAssist, onSchedule, onDone, onBack }) {
  const entry       = taskState[task.id];
  const meta        = CAT_META[task.cat] || CAT_META.home;
  const isUrgent    = status === "due" || status === "confirm";
  const isScheduled = status === "scheduled";
  const isComingUp  = status === "coming-up";

  const statusLabel = {
    due:        "ready to do",
    confirm:    "did this happen?",
    scheduled:  `scheduled for ${new Date(entry?.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    "coming-up": `coming up · due ${getNext(task)}`,
  }[status] || "on track";

  const headerBg    = isUrgent ? C.coral : isScheduled ? C.lav : isComingUp ? C.yellow : C.light;
  const headerColor = isUrgent || isScheduled ? C.white : C.ink;

  return (
    <div className="mr">
      {/* Back bar */}
      <div style={{ background: C.white, borderBottom: "2px solid #F0E8E0", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <button className="pb" onClick={onBack} style={{ background: C.off, border: "none", borderRadius: 12, padding: "8px 12px", fontSize: 14, color: C.ink }}>← back</button>
        <div className="mf" style={{ fontSize: 20, color: C.ink }}>{meta.emoji} {meta.label}</div>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Status header */}
        <div style={{ background: headerBg, borderRadius: 20, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: isUrgent || isScheduled ? C.white : C.muted, fontWeight: 600, marginBottom: 8 }}>
            {statusLabel}
          </div>
          <div style={{ fontSize: 19, color: headerColor, fontWeight: 700, lineHeight: 1.4 }}>
            {task.label}
          </div>
        </div>

        {/* Saved provider */}
        {savedProvider && (
          <div style={{ background: `${C.mint}15`, border: `1.5px solid ${C.mint}`, borderRadius: 16, padding: "12px 16px", marginBottom: 14 }}>
            <div className="mf" style={{ fontSize: 13, color: C.mint, marginBottom: 4 }}>last time you used</div>
            <div style={{ fontWeight: 600, color: C.ink }}>{savedProvider.name}</div>
          </div>
        )}

        {/* Task info */}
        <div style={{ background: C.white, borderRadius: 16, padding: "16px", marginBottom: 14, border: "1.5px solid #F0E8E0" }}>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{task.note}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, background: `${meta.color}15`, color: meta.color, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              every {intervalLabel(task.intervalDays)}
            </span>
            <span style={{ fontSize: 12, background: task.stakes === "high" ? `${C.coral}15` : task.stakes === "medium" ? `${C.yellow}15` : `${C.mint}15`, color: task.stakes === "high" ? C.coral : task.stakes === "medium" ? "#A07800" : C.mint, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              {task.stakes} stakes
            </span>
          </div>
        </div>

        {/* Assist */}
        <div style={{ background: `${C.lav}15`, border: `1.5px solid ${C.lav}`, borderRadius: 16, padding: "16px", marginBottom: 14 }}>
          <div className="mf" style={{ fontSize: 15, color: C.lav, marginBottom: 6 }}>mitzy can help ✦</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
            {ASSIST_DESCRIPTIONS[task.assistType] || ASSIST_DESCRIPTIONS.guidance}
          </div>
          <button className="pb" onClick={() => onAssist(task)} style={{ width: "100%", padding: "12px", fontSize: 15, background: C.lav, color: C.white, border: "none", borderRadius: 12, fontWeight: 700, boxShadow: "0 4px 12px rgba(199,125,255,0.3)" }}>
            {ASSIST_LABELS[task.assistType] || ASSIST_LABELS.guidance}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="pb" onClick={() => onSchedule(task)} style={{ flex: 1, padding: "13px", fontSize: 15, background: C.white, color: C.ink, border: "1.5px solid #E8E0D8", borderRadius: 14, fontWeight: 600 }}>
            📅 schedule
          </button>
          <button className="pb" onClick={() => onDone(task)} style={{ flex: 2, padding: "13px", fontSize: 15, background: C.mint, color: C.white, border: "none", borderRadius: 14, fontWeight: 700, boxShadow: "0 4px 12px rgba(107,203,119,0.3)" }}>
            ✓ mark done
          </button>
        </div>
      </div>
    </div>
  );
}
