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
      style={{ position: "relative", background: bg, borderRadius: 28, padding: "18px 18px 16px", marginBottom: 12, cursor: "pointer", transform: isUrgent ? `rotate(${tilt}deg)` : "none" }}
    >
      <div className="patchBadge mf" style={{ background: `${meta.color}E6`, color: C.white }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{meta.emoji}</span>
        <span>{meta.label}</span>
      </div>

      <div onClick={() => onSelect(task)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span className="mf" style={{ fontSize: 12, background: badgeBg, color: textColor, padding: "4px 10px", borderRadius: 999, letterSpacing: 0.2, border: badgeBorder }}>
            {badge}
          </span>
          {hasSavedProvider && <span className="mf" style={{ fontSize: 12, color: textColor, opacity: 0.85 }}>★ saved</span>}
        </div>
        <div className="fontRead" style={{ fontSize: 18, color: textColor, fontWeight: 700, lineHeight: 1.35, marginBottom: 6 }}>
          {task.label}
        </div>
        <div className="fontRead" style={{ fontSize: 13, color: textColor, opacity: 0.78 }}>
          {meta.emoji} {meta.label}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          className="pb btnSecondary"
          onClick={e => { e.stopPropagation(); onSelect(task); }}
          style={{ flex: 1, padding: "11px 10px", fontSize: 14, background: isUrgent || isScheduled ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.55)", color: textColor, border: isUrgent || isScheduled ? "2px solid rgba(255,255,255,0.28)" : "2px solid rgba(0,0,0,0.06)" }}
        >
          details
        </button>
        <button
          className={`pb btnPrimary ${isUrgent ? "shadowCoral" : isScheduled ? "shadowLav" : isComingUp ? "shadowYellow" : "shadowMint"}`}
          onClick={e => { e.stopPropagation(); onDone(task); }}
          style={{ flex: 2, padding: "12px 10px", fontSize: 15, background: "rgba(255,255,255,0.95)", color: isUrgent ? C.coral : isScheduled ? C.lav : C.ink }}
        >
          DONE ✓
        </button>
      </div>
    </div>
  );
}
