import { useState } from "react";
import { C } from "../data/constants";

export function YouView({ profile, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);

  const infoRows = [
    profile.hasHome  && { label: "🏠 Home",      value: "owns home"            },
    profile.hasCar   && { label: "🚗 Car",        value: profile.car || "has car" },
    profile.zip      && { label: "📍 Zip",        value: profile.zip            },
    profile.insurance && { label: "💊 Insurance", value: profile.insurance      },
    profile.birthYear && { label: "🎂 Born",       value: profile.birthYear      },
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px" }}>
      <div className="mf" style={{ fontSize: 22, color: C.ink, marginBottom: 20 }}>your profile ✦</div>

      {/* Info rows */}
      {infoRows.length > 0 && (
        <div style={{ background: C.white, borderRadius: 20, padding: "16px", marginBottom: 16, border: "1.5px solid #F0E8E0" }}>
          {infoRows.map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < infoRows.length - 1 ? "1px solid #F0E8E0" : "none" }}>
              <div style={{ fontSize: 14, color: C.muted }}>{row.label}</div>
              <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{row.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kids */}
      {profile.kids?.length > 0 && (
        <div style={{ background: C.white, borderRadius: 20, padding: "16px", marginBottom: 16, border: "1.5px solid #F0E8E0" }}>
          <div className="mf" style={{ fontSize: 14, color: C.muted, marginBottom: 10 }}>kids</div>
          {profile.kids.map((k, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < profile.kids.length - 1 ? "1px solid #F0E8E0" : "none" }}>
              <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{k.name}</div>
              <div style={{ fontSize: 14, color: C.muted }}>born {k.birthYear}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pets */}
      {profile.pets?.length > 0 && (
        <div style={{ background: C.white, borderRadius: 20, padding: "16px", marginBottom: 16, border: "1.5px solid #F0E8E0" }}>
          <div className="mf" style={{ fontSize: 14, color: C.muted, marginBottom: 10 }}>pets</div>
          {profile.pets.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < profile.pets.length - 1 ? "1px solid #F0E8E0" : "none" }}>
              <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{a.type === "dog" ? "🐕" : a.type === "cat" ? "🐈" : "🐾"} {a.name}</div>
              <div style={{ fontSize: 14, color: C.muted }}>born {a.birthYear}</div>
            </div>
          ))}
        </div>
      )}

      {/* Reset */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        {!confirmReset ? (
          <button className="pb" onClick={() => setConfirmReset(true)} style={{ fontSize: 13, color: C.muted, background: "transparent", border: "none", textDecoration: "underline" }}>
            re-run setup
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: C.muted }}>This clears everything and starts over.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pb" onClick={() => setConfirmReset(false)} style={{ padding: "10px 18px", fontSize: 14, background: C.light, color: C.muted, border: "none", borderRadius: 12, fontWeight: 600 }}>cancel</button>
              <button className="pb" onClick={onReset}                      style={{ padding: "10px 18px", fontSize: 14, background: C.coral, color: C.white, border: "none", borderRadius: 12, fontWeight: 700 }}>yes, reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
