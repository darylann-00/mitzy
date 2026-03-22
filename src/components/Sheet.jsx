import { C } from "../data/constants";

export function Sheet({ onClose, title, children }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.6)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sUp" style={{ background: C.off, width: "100%", maxWidth: 640, maxHeight: "88vh", display: "flex", flexDirection: "column", borderRadius: "24px 24px 0 0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, background: "#E0D8D0", borderRadius: 2, margin: "0 auto 14px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="mf" style={{ fontSize: 20, color: C.coral }}>{title}</div>
            <button className="pb" onClick={onClose} style={{ background: C.light, border: "none", borderRadius: 10, padding: "6px 12px", fontSize: 14, color: C.muted }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 32px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
