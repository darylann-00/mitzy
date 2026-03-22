import { useState } from "react";
import { C } from "../data/constants";

export function SlimOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    hasHome: null, hasCar: null, zip: "",
    hasKids: null, kids: [],
    hasPets: null, pets: [],
  });
  const [kidInput, setKidInput] = useState({ name: "", age: "" });
  const [petInput, setPetInput] = useState({ name: "", type: "dog", age: "", longCoat: false });
  const [err, setErr] = useState("");

  const go = n => setTimeout(() => { setStep(n); setErr(""); }, 200);

  const addKid = () => {
    if (!kidInput.name.trim() || !kidInput.age) { setErr("Need a name and age"); return; }
    setProfile(p => ({ ...p, kids: [...p.kids, { name: kidInput.name.trim(), age: kidInput.age }] }));
    setKidInput({ name: "", age: "" });
    setErr("");
  };

  const addPet = () => {
    if (!petInput.name.trim() || !petInput.age) { setErr("Need a name and age"); return; }
    setProfile(p => ({ ...p, pets: [...p.pets, { name: petInput.name.trim(), type: petInput.type, age: petInput.age, longCoat: petInput.longCoat }] }));
    setPetInput({ name: "", type: "dog", age: "", longCoat: false });
    setErr("");
  };

  const YesNo = ({ question, onYes, onNo }) => (
    <div>
      <div style={{ fontSize: 20, color: C.ink, lineHeight: 1.4, marginBottom: 28, fontWeight: 600 }}>{question}</div>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="pb" onClick={onYes} style={{ flex: 1, padding: "18px", fontSize: 18, background: C.coral, color: C.white, border: "none", borderRadius: 16, fontWeight: 700, boxShadow: "0 4px 12px rgba(255,92,92,0.3)" }}>yes</button>
        <button className="pb" onClick={onNo}  style={{ flex: 1, padding: "18px", fontSize: 18, background: C.light, color: C.ink,  border: "none", borderRadius: 16, fontWeight: 700 }}>no</button>
      </div>
    </div>
  );

  const NextBtn = ({ onClick, disabled, children }) => (
    <button className="pb" onClick={onClick} disabled={!!disabled} style={{ width: "100%", padding: "16px", fontSize: 16, background: !disabled ? C.coral : "#E0D8D0", color: C.white, border: "none", borderRadius: 14, fontWeight: 700, boxShadow: !disabled ? "0 4px 12px rgba(255,92,92,0.3)" : "none", marginTop: 4 }}>
      {children}
    </button>
  );

  const Chips = ({ items, onRemove, color }) => (
    <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: `${color}20`, border: `1.5px solid ${color}`, borderRadius: 12, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color, fontWeight: 600 }}>
            {item.name}{item.age ? ` (age ${item.age})` : ""}{item.type ? ` · ${item.type}` : ""}
          </span>
          <button className="pb" onClick={() => onRemove(i)} style={{ background: "transparent", color: C.coral, border: "none", fontSize: 16, padding: "0 4px" }}>×</button>
        </div>
      ))}
    </div>
  );

  const screens = [
    // Step 0: Home ownership
    <YesNo
      key="home"
      question="Do you own your home?"
      onYes={() => { setProfile(p => ({ ...p, hasHome: true  })); go(1); }}
      onNo ={() => { setProfile(p => ({ ...p, hasHome: false })); go(1); }}
    />,

    // Step 1: Car
    <YesNo
      key="car"
      question="Do you have a car?"
      onYes={() => { setProfile(p => ({ ...p, hasCar: true  })); go(2); }}
      onNo ={() => { setProfile(p => ({ ...p, hasCar: false })); go(2); }}
    />,

    // Step 2: Zip
    <div key="zip">
      <div style={{ fontSize: 20, color: C.ink, fontWeight: 600, marginBottom: 8 }}>What's your zip code?</div>
      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>Mitzy uses this to find local services and surface area-specific reminders.</div>
      <input type="text" placeholder="e.g. 97201" maxLength="10" value={profile.zip} onChange={e => setProfile(p => ({ ...p, zip: e.target.value }))} style={{ marginBottom: 14 }} />
      <NextBtn onClick={() => { if (profile.zip.trim()) go(3); else setErr("Zip code is required"); }} disabled={!profile.zip.trim()}>next →</NextBtn>
      {err && <div style={{ fontSize: 13, color: C.coral, marginTop: 8 }}>{err}</div>}
    </div>,

    // Step 3: Kids
    <div key="kids">
      {profile.hasKids === null ? (
        <YesNo
          question="Do you have kids?"
          onYes={() => setProfile(p => ({ ...p, hasKids: true  }))}
          onNo ={() => { setProfile(p => ({ ...p, hasKids: false })); go(4); }}
        />
      ) : (
        <>
          <div style={{ fontSize: 20, color: C.ink, fontWeight: 600, marginBottom: 18 }}>Add your kids</div>
          {profile.kids.length > 0 && <Chips items={profile.kids} onRemove={i => setProfile(p => ({ ...p, kids: p.kids.filter((_, j) => j !== i) }))} color={C.lav} />}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="text"   placeholder="Name" value={kidInput.name} onChange={e => setKidInput(x => ({ ...x, name: e.target.value }))} style={{ flex: 2 }} onKeyDown={e => e.key === "Enter" && addKid()} />
            <input type="number" placeholder="Age"  value={kidInput.age}  onChange={e => setKidInput(x => ({ ...x, age:  e.target.value }))} style={{ flex: 1 }} min="0" max="25" onKeyDown={e => e.key === "Enter" && addKid()} />
            <button className="pb" onClick={addKid} style={{ padding: "10px 14px", fontSize: 16, background: C.mint, color: C.white, border: "none", borderRadius: 12, fontWeight: 700 }}>+</button>
          </div>
          {err && <div style={{ fontSize: 13, color: C.coral, marginBottom: 8 }}>{err}</div>}
          <NextBtn onClick={() => { if (profile.kids.length === 0) { setErr("Add at least one kid"); return; } go(4); }}>done →</NextBtn>
        </>
      )}
    </div>,

    // Step 4: Pets
    <div key="pets">
      {profile.hasPets === null ? (
        <YesNo
          question="Do you have pets?"
          onYes={() => setProfile(p => ({ ...p, hasPets: true  }))}
          onNo ={() => { const final = { ...profile, hasPets: false }; setProfile(final); setTimeout(() => onComplete(final), 200); }}
        />
      ) : (
        <>
          <div style={{ fontSize: 20, color: C.ink, fontWeight: 600, marginBottom: 18 }}>Add your pets</div>
          {profile.pets.length > 0 && (
            <Chips
              items={profile.pets.map(a => ({ ...a, name: `${a.type === "dog" ? "🐕" : a.type === "cat" ? "🐈" : "🐾"} ${a.name}` }))}
              onRemove={i => setProfile(p => ({ ...p, pets: p.pets.filter((_, j) => j !== i) }))}
              color={C.orange}
            />
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="text"   placeholder="Name" value={petInput.name} onChange={e => setPetInput(x => ({ ...x, name: e.target.value }))} style={{ flex: 2 }} />
            <input type="number" placeholder="Age"  value={petInput.age}  onChange={e => setPetInput(x => ({ ...x, age:  e.target.value }))} style={{ flex: 1 }} min="0" max="30" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["dog", "cat", "other"].map(t => (
              <button key={t} className="pb" onClick={() => setPetInput(x => ({ ...x, type: t }))} style={{ flex: 1, padding: "10px", fontSize: 14, background: petInput.type === t ? C.sky : C.light, color: petInput.type === t ? C.white : C.ink, border: "none", borderRadius: 12, fontWeight: 600 }}>
                {t === "dog" ? "🐕" : t === "cat" ? "🐈" : "🐾"} {t}
              </button>
            ))}
          </div>
          {petInput.type === "dog" && (
            <button className="pb" onClick={() => setPetInput(x => ({ ...x, longCoat: !x.longCoat }))} style={{ width: "100%", padding: "10px", fontSize: 14, background: petInput.longCoat ? C.lav : C.light, color: petInput.longCoat ? C.white : C.ink, border: "none", borderRadius: 12, marginBottom: 10, fontWeight: 600 }}>
              {petInput.longCoat ? "long coat ✓" : "long coat?"}
            </button>
          )}
          <button className="pb" onClick={addPet} style={{ width: "100%", padding: "10px", fontSize: 14, background: C.light, color: C.ink, border: "none", borderRadius: 12, marginBottom: 10, fontWeight: 600 }}>
            + add pet
          </button>
          {err && <div style={{ fontSize: 13, color: C.coral, marginBottom: 8 }}>{err}</div>}
          {profile.pets.length > 0 && <NextBtn onClick={() => onComplete({ ...profile })}>let's go! →</NextBtn>}
        </>
      )}
    </div>,
  ];

  return (
    <div className="paper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ maxWidth: 400, width: "100%" }}>
        <div className="mf" style={{ fontSize: 36, color: C.coral, marginBottom: 4, textAlign: "center" }}>mitzy ✦</div>
        <div className="fontRead" style={{ fontSize: 14, color: C.muted, textAlign: "center", marginBottom: 36 }}>your household secretary</div>
        <div style={{ background: "rgba(255,92,92,0.14)", borderRadius: 999, height: 8, marginBottom: 32, overflow: "hidden" }}>
          <div style={{ background: C.coral, height: "100%", width: `${((step + 1) / 5) * 100}%`, borderRadius: 999, transition: "width 0.3s ease" }} />
        </div>
        <div className="bIn" key={step}>{screens[step]}</div>
      </div>
    </div>
  );
}
