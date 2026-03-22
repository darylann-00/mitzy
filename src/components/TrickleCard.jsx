import { useState } from "react";
import { C } from "../data/constants";

export function TrickleCard({ question, profile, onAnswer, onDismiss }) {
  const [val, setVal] = useState("");

  const cardStyle = {
    background:  C.white,
    borderRadius: 20,
    padding:      "16px 18px",
    marginBottom: 12,
    border:       `1.5px solid ${C.yellow}`,
    boxShadow:    `0 4px 16px ${C.yellow}40`,
  };

  const Badge = () => (
    <div className="mf" style={{ background: C.yellow, color: C.ink, padding: "3px 10px", borderRadius: 20, fontSize: 12, marginBottom: 10, display: "inline-block" }}>
      quick question ✦
    </div>
  );

  const Body = () => (
    <>
      <div style={{ fontSize: 15, color: C.ink, marginBottom: 4, fontWeight: 600 }}>{question.label}</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{question.description}</div>
    </>
  );

  const Buttons = ({ onSave, disabled }) => (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="pb" onClick={onSave} disabled={disabled} style={{ flex: 1, padding: "10px", fontSize: 14, background: !disabled ? C.coral : "#E0D8D0", color: C.white, border: "none", borderRadius: 12, fontWeight: 700 }}>save</button>
      <button className="pb" onClick={onDismiss} style={{ padding: "10px 16px", fontSize: 14, background: C.light, color: C.muted, border: "none", borderRadius: 12 }}>skip</button>
    </div>
  );

  // Yes/no question
  if (question.id === "enrollment" && profile.hasKids) {
    return (
      <div style={cardStyle}>
        <Badge />
        <Body />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pb" onClick={() => onAnswer({ needsEnrollment: true })}  style={{ flex: 1, padding: "10px", fontSize: 15, background: C.lav,   color: C.white, border: "none", borderRadius: 12, fontWeight: 700 }}>yes</button>
          <button className="pb" onClick={() => onAnswer({ needsEnrollment: false })} style={{ flex: 1, padding: "10px", fontSize: 15, background: C.light, color: C.ink,  border: "none", borderRadius: 12, fontWeight: 700 }}>no</button>
        </div>
      </div>
    );
  }

  // Text input questions
  const INPUT_MAP = {
    car_details: { placeholder: "e.g. 2019 Honda CR-V", key: "car",       type: "text"   },
    insurance:   { placeholder: "e.g. Blue Cross, Aetna...", key: "insurance", type: "text" },
    age_health:  { placeholder: "e.g. 34",                   key: "age",       type: "number" },
  };

  const input = INPUT_MAP[question.id];
  if (!input) return null;

  return (
    <div style={cardStyle}>
      <Badge />
      <Body />
      <input
        type={input.type}
        placeholder={input.placeholder}
        value={val}
        onChange={e => setVal(e.target.value)}
        style={{ marginBottom: 10 }}
        min={input.type === "number" ? "18" : undefined}
        max={input.type === "number" ? "99" : undefined}
      />
      <Buttons onSave={() => onAnswer({ [input.key]: val })} disabled={!val.trim()} />
    </div>
  );
}
