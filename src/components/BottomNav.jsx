import { C } from "../data/constants";

const TABS = [
  { id: "home", label: "Today", emoji: "✨" },
  { id: "all",  label: "All",   emoji: "📋" },
  { id: "you",  label: "You",   emoji: "👤" },
];

const TAB_COLORS = {
  home: { color: C.coral,  deep: "rgba(229,58,58,0.55)"  },
  all:  { color: C.yellow, deep: "rgba(230,184,0,0.45)"  },
  you:  { color: C.sky,    deep: "rgba(25,175,165,0.45)" },
};

export function BottomNav({ view, setView }) {
  return (
    <div className="paper" style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", zIndex: 200, padding: "10px 0 14px", borderTop: "4px solid rgba(255,92,92,0.18)" }}>
      {TABS.map(tab => {
        const active = view === tab.id;
        const { color, deep } = TAB_COLORS[tab.id];
        return (
          <button
            key={tab.id}
            className="pb"
            onClick={() => setView(tab.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", padding: "6px 0", position: "relative" }}
          >
            {active && (
              <div className="navBlob" style={{ background: `${color}33`, boxShadow: `0 10px 0 ${deep}` }} />
            )}
            <div style={{ fontSize: 22, lineHeight: 1, position: "relative" }}>{tab.emoji}</div>
            <div className="mf" style={{ fontSize: 12, color: active ? C.ink : C.muted, position: "relative", letterSpacing: 0.2 }}>
              {tab.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
