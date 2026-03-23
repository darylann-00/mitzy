import { C, CAT_META } from "../data/constants";
import { stableTiltDeg } from "../utils/taskLogic";

export function TaskCard({ task, status, days, hasSavedProvider, onSelect, onDone }) {
  const isUrgent    = status === "due" || status === "confirm";
  const isScheduled = status === "scheduled";
  const isComingUp  = status === "coming-up";

  const bg          = isUrgent ? C.coral : isScheduled ? C.lav : isComingUp ? C.yellow : C.light;
  const textColor   = isUrgent || isScheduled ? C.white : C.ink;
  const badge       = isUrgent ? "do it now" : isScheduled ? "scheduled" : isComingUp ? `in ${days}d` : "coming up";

  const meta        = CAT_META[task.cat] || CAT_META.home;
  const tilt        = isUrgent ? stableTiltDeg(task.id) : 0;
  const shadowClass = isUrgent ? "shadowCoral" : isScheduled ? "shadowLav" : isComingUp ? "shadowYellow" : "";

  const badgeBg     = isUrgent || isScheduled ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.10)";
  const badgeBorder = isUrgent || isScheduled ? "2px solid rgba(255,255,255,0.35)" : "2px solid rgba(0,0,0,0.08)";

  return (
    <div
      className={`tc bIn ${shadowClass}`}
      style={{ position: "relative", background: bg, borderRadius: 20, padding: "12px 12px 10px", marginBottom: 8, cursor: "pointer", transform: isUrgent ? `rotate(${tilt}deg)` : "none" }}
    >
      <div className="patchBadge mf" style={{ background: `${meta.color}E6`, color: C.white }}>
        <span style={{ fontSize: 13, lineHeight: 1 }}>{meta.emoji}</span>
        <span>{meta.label}</span>
      </div>

      <div onClick={() => onSelect(task)}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span className="mf" style={{ fontSize: 10, background: badgeBg, color: textColor, padding: "3px 8px", borderRadius: 999, letterSpacing: 0.15, border: badgeBorder }}>
            {badge}
          </span>
          {hasSavedProvider && <span className="mf" style={{ fontSize: 10, color: textColor, opacity: 0.78 }}>★ saved</span>}
        </div>
        <div className="fontRead" style={{ fontSize: 18, color: textColor, fontWeight: 800, lineHeight: 1.25 }}>
          {task.label}
        </div>
      </div>

      <div className="taskActions" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9 }}>
        <button
          className="pb btnGhost"
          onClick={e => { e.stopPropagation(); onSelect(task); }}
          style={{ padding: "4px 6px", fontSize: 11, color: textColor, opacity: 0.82 }}
        >
          details
        </button>
        <button
          className={`pb btnPrimary ${isUrgent ? "shadowCoral" : isScheduled ? "shadowLav" : isComingUp ? "shadowYellow" : "shadowMint"}`}
          onClick={e => { e.stopPropagation(); onDone(task); }}
          style={{ flex: 1, padding: "10px 9px", fontSize: 13, background: "rgba(255,255,255,0.96)", color: isUrgent ? C.coral : isScheduled ? C.lav : C.ink }}
        >
          DONE ✓
        </button>
      </div>
    </div>
  );
}
