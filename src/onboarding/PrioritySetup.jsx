import { useState } from "react";
import { C, CAT_META } from "../data/constants";
import { isPriority } from "../data/taskFactory";

const FUZZY_OPTIONS = [
  { label: "Within the last month",  months: 0.5  },
  { label: "1–3 months ago",         months: 2    },
  { label: "3–6 months ago",         months: 4.5  },
  { label: "6–12 months ago",        months: 9    },
  { label: "Over a year ago",        months: 15   },
  { label: "Not sure / never done",  months: null },
];

export function PrioritySetup({ taskLib, onComplete }) {
  const priorityTasks = taskLib.filter(t => isPriority(t.id)).slice(0, 12);
  const [index,      setIndex]      = useState(0);
  const [selections, setSelections] = useState({});

  const current = priorityTasks[index];
  const sel     = selections[current?.id];
  const isLast  = index === priorityTasks.length - 1;
  const meta    = current ? (CAT_META[current.cat] || CAT_META.home) : CAT_META.home;

  const advance = () => {
    if (!isLast) {
      setIndex(i => i + 1);
    } else {
      const taskState = {};
      const disabled  = {};
      priorityTasks.forEach(t => {
        const entry = selections[t.id];
        if (entry) {
          const date = entry.type === "exact"
            ? new Date(entry.date)
            : new Date(Date.now() - entry.months * 30 * 86400000);
          taskState[t.id] = { lastDone: date.toISOString(), scheduledDate: null };
        } else {
          disabled[t.id] = true;
        }
      });
      onComplete(taskState, disabled);
    }
  };

  const skip = () => {
    if (!isLast) setIndex(i => i + 1);
    else onComplete({}, {});
  };

  if (!current) return null;

  return (
    <div className="paper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div className="mf" style={{ fontSize: 36, color: C.coral, textAlign: "center", marginBottom: 4 }}>mitzy ✦</div>
        <div className="fontRead" style={{ fontSize: 14, color: C.muted, textAlign: "center", marginBottom: 28 }}>
          Let me get caught up on where things stand
        </div>

        {/* Progress bar */}
        <div style={{ background: "rgba(199,125,255,0.14)", borderRadius: 999, height: 8, marginBottom: 28, overflow: "hidden" }}>
          <div style={{ background: C.lav, height: "100%", width: `${((index + 1) / priorityTasks.length) * 100}%`, borderRadius: 999, transition: "width 0.3s ease" }} />
        </div>

        <div className="bIn" key={index}>
          {/* Task card */}
          <div style={{ background: "rgba(255,255,255,0.92)", borderRadius: 28, padding: "18px 20px", marginBottom: 16, border: `3px solid ${meta.color}33` }}>
            <div className="mf" style={{ display: "inline-block", background: `${meta.color}26`, color: meta.color, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 10, border: `2px solid ${meta.color}3D` }}>
              {meta.emoji} {meta.label}
            </div>
            <div className="fontRead" style={{ fontSize: 18, color: C.ink, fontWeight: 700, lineHeight: 1.45, marginBottom: 8 }}>
              {current.label}
            </div>
            <div className="fontRead" style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, paddingTop: 10, borderTop: "2px dotted rgba(255,92,92,0.18)" }}>
              {current.note}
            </div>
          </div>

          <div className="mf" style={{ fontSize: 14, color: C.muted, marginBottom: 10 }}>When did you last do this?</div>

          {/* Fuzzy options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {FUZZY_OPTIONS.map(opt => {
              const selected = sel?.type === "fuzzy" && sel?.months === opt.months;
              return (
                <button
                  key={opt.label}
                  className="pb"
                  onClick={() => setSelections(s => ({ ...s, [current.id]: { type: "fuzzy", months: opt.months } }))}
                  style={{ padding: "12px 14px", fontSize: 14, textAlign: "left", background: selected ? C.coral : "rgba(255,255,255,0.92)", color: selected ? C.white : C.ink, border: `3px solid ${selected ? C.coral : "rgba(255,92,92,0.18)"}`, borderRadius: 18, fontWeight: 700 }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Exact date */}
          <input
            type="date"
            max={new Date().toISOString().split("T")[0]}
            value={sel?.type === "exact" ? sel.date : ""}
            onChange={e => setSelections(s => ({ ...s, [current.id]: { type: "exact", date: e.target.value } }))}
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button className="pb btnSecondary" onClick={skip} style={{ padding: "12px 18px", fontSize: 14, background: "rgba(255,255,255,0.7)", color: C.muted, border: "3px solid rgba(155,155,155,0.18)" }}>
              skip
            </button>
            <button
              className={`pb btnPrimary ${sel !== undefined ? "shadowCoral" : ""}`}
              onClick={advance}
              disabled={sel === undefined}
              style={{ flex: 1, padding: "14px", fontSize: 16, background: sel !== undefined ? C.coral : "rgba(224,216,208,0.95)", color: C.white }}
            >
              {isLast ? "let's go! →" : "next →"}
            </button>
          </div>

          <div className="fontRead" style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: C.muted }}>
            More tasks surface gradually as they become relevant.
          </div>
        </div>
      </div>
    </div>
  );
}
