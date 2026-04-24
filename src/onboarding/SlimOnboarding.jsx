import { useState } from "react";
import ZIP_CODES from "../data/zipCodes";

// ─── Car data ──────────────────────────────────────────────────────────────────
const CAR_DATA = {
  Acura:         ['ILX', 'MDX', 'RDX', 'TLX'],
  Audi:          ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'TT'],
  BMW:           ['2 Series', '3 Series', '4 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'M3', 'M5'],
  Buick:         ['Enclave', 'Encore', 'Envision', 'LaCrosse'],
  Cadillac:      ['CT4', 'CT5', 'Escalade', 'XT4', 'XT5'],
  Chevrolet:     ['Blazer', 'Camaro', 'Colorado', 'Equinox', 'Malibu', 'Silverado 1500', 'Silverado 2500', 'Suburban', 'Tahoe', 'Traverse', 'Trax'],
  Chrysler:      ['300', 'Pacifica', 'Voyager'],
  Dodge:         ['Challenger', 'Charger', 'Durango', 'Journey'],
  Ford:          ['Bronco', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'F-250', 'Maverick', 'Mustang', 'Ranger', 'Transit'],
  GMC:           ['Acadia', 'Canyon', 'Sierra 1500', 'Sierra 2500', 'Terrain', 'Yukon'],
  Honda:         ['Accord', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Odyssey', 'Passport', 'Pilot', 'Ridgeline'],
  Hyundai:       ['Elantra', 'Ioniq 5', 'Kona', 'Palisade', 'Santa Fe', 'Sonata', 'Tucson'],
  Infiniti:      ['Q50', 'QX50', 'QX60', 'QX80'],
  Jeep:          ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Renegade', 'Wrangler'],
  Kia:           ['Carnival', 'EV6', 'Forte', 'K5', 'Soul', 'Sorento', 'Sportage', 'Stinger', 'Telluride'],
  Lexus:         ['ES', 'GX', 'IS', 'LS', 'NX', 'RX', 'UX'],
  Mazda:         ['CX-30', 'CX-5', 'CX-9', 'Mazda3', 'Mazda6', 'MX-5 Miata'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'GLE', 'S-Class'],
  Nissan:        ['Altima', 'Frontier', 'Kicks', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Sentra', 'Titan', 'Versa'],
  Ram:           ['1500', '2500', 'ProMaster'],
  Subaru:        ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback'],
  Tesla:         ['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y'],
  Toyota:        ['4Runner', 'Avalon', 'Camry', 'Corolla', 'Highlander', 'Prius', 'RAV4', 'Sequoia', 'Sienna', 'Tacoma', 'Tundra'],
  Volkswagen:    ['Atlas', 'Golf', 'ID.4', 'Jetta', 'Passat', 'Tiguan'],
  Volvo:         ['S60', 'V60', 'XC40', 'XC60', 'XC90'],
};
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 32 }, (_, i) => String(CUR_YEAR - i));

// ─── Full-screen green wrapper ─────────────────────────────────────────────────
function GreenScreen({ children }) {
  return (
    <div style={{ minHeight:'100vh', background:'#1A5C3A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 24px', position:'relative', overflow:'hidden' }}>
      {/* Scatter shapes */}
      <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'#0F3D27', top:-40, right:-40 }} />
      <div style={{ position:'absolute', width:60, height:60, borderRadius:'50%', background:'#06A77D', top:20, right:60, opacity:0.7 }} />
      <div style={{ position:'absolute', width:20, height:20, background:'#F77F00', transform:'rotate(45deg)', bottom:60, right:30 }} />
      <div style={{ position:'absolute', width:16, height:16, borderRadius:'50%', background:'#F4C430', top:50, right:130 }} />
      <div style={{ position:'absolute', width:12, height:12, borderRadius:'50%', background:'#D62828', bottom:100, right:80 }} />
      <div style={{ position:'absolute', width:40, height:40, borderRadius:'50%', border:'3px solid #06A77D', opacity:0.4, bottom:30, right:140 }} />
      <div style={{ position:'absolute', width:80, height:80, borderRadius:'50%', background:'#0F3D27', bottom:-30, left:-20 }} />
      <div style={{ position:'absolute', width:14, height:14, background:'#F4C430', transform:'rotate(45deg)', top:80, left:30, opacity:0.7 }} />
      {children}
    </div>
  );
}

// ─── Wordmark ──────────────────────────────────────────────────────────────────
function Wordmark() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:36, position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          <div style={{ width:12, height:12, borderRadius:'50%', background:'#D62828' }} />
          <div style={{ width:12, height:12, borderRadius:'50%', background:'#F77F00' }} />
          <div style={{ width:12, height:12, borderRadius:'50%', background:'#06A77D' }} />
          <div style={{ width:12, height:12, borderRadius:'50%', background:'#F4C430' }} />
        </div>
        <span style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:46, color:'#E8F5EE', lineHeight:1 }}>
          mitzy
        </span>
      </div>
    </div>
  );
}

// ─── Option button ─────────────────────────────────────────────────────────────
function OptionBtn({ label, sub, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width:'100%', borderRadius:14, padding:'14px 16px', marginBottom:8,
        display:'flex', alignItems:'center', gap:12, cursor:'pointer',
        background: selected ? '#E8F5EE' : '#fff',
        border: selected ? '1.5px solid #1A5C3A' : '1.5px solid #EAE4DA',
      }}
    >
      <div style={{
        width:22, height:22, borderRadius:'50%', flexShrink:0,
        border: selected ? 'none' : '2px solid #C8D8CC',
        background: selected ? '#1A5C3A' : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="#E8F5EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'#4A6256', marginTop:2, fontFamily:'DM Sans, sans-serif' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Progress bar (for question screens) ──────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div style={{ width:'100%', background:'rgba(255,255,255,0.15)', borderRadius:999, height:6, marginBottom:28, overflow:'hidden' }}>
      <div style={{ background:'#F4C430', height:'100%', width:`${(current / total) * 100}%`, borderRadius:999, transition:'width 0.3s ease' }} />
    </div>
  );
}

// ─── Question screen wrapper ────────────────────────────────────────────────────
function QuestionScreen({ step, total, question, children }) {
  return (
    <div style={{ width:'100%', maxWidth:400, position:'relative' }}>
      <ProgressBar current={step} total={total} />
      <div style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:22, color:'#E8F5EE', marginBottom:22, lineHeight:1.3 }}>
        {question}
      </div>
      {children}
    </div>
  );
}

// ─── Next button ───────────────────────────────────────────────────────────────
function NextBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={!!disabled}
      style={{
        width:'100%', padding:'15px', fontSize:15, fontWeight:700, cursor: disabled ? 'default' : 'pointer',
        border:'none', borderRadius:14, marginTop:4, fontFamily:'DM Sans, sans-serif',
        background: disabled ? 'rgba(255,255,255,0.2)' : '#F4C430',
        color: disabled ? 'rgba(255,255,255,0.5)' : '#7a5900',
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function SlimOnboarding({ onComplete }) {
  const [step,     setStep]     = useState(-1); // -1 = welcome
  const [profile,  setProfile]  = useState({ name: '', birthYear: '', gender: '', hasHome: null, hasCar: null, cars: [], zip: '', hasKids: null, kids: [], hasPets: null, pets: [] });
  const [carInput,     setCarInput]     = useState({ year: '', make: '', model: '' });
  const [carInputOpen, setCarInputOpen] = useState(false);
  const [kidInputOpen, setKidInputOpen] = useState(false);
  const [petInputOpen, setPetInputOpen] = useState(false);
  const [editingCar,   setEditingCar]   = useState(null);
  const [editingKid,   setEditingKid]   = useState(null);
  const [editingPet,   setEditingPet]   = useState(null);
  const [kidInput, setKidInput] = useState({ name: '', birthYear: '' });
  const [petInput, setPetInput] = useState({ name: '', type: '', birthYear: '', longCoat: false });
  const [err,           setErr]           = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [completing,    setCompleting]    = useState(false);

  const TOTAL_STEPS = 6;
  const go = n => setTimeout(() => { setStep(n); setErr(''); }, 200);

  const editCar = (i) => {
    const label = profile.cars[i];
    const year = label.slice(0, 4);
    const rest  = label.slice(5);
    const make  = Object.keys(CAR_DATA).find(m => rest === m || rest.startsWith(m + ' ')) || '';
    const model = make ? rest.slice(make.length + 1) : rest;
    setProfile(p => ({ ...p, cars: p.cars.filter((_, j) => j !== i) }));
    setCarInput({ year, make, model });
    setEditingCar(label);
    setCarInputOpen(true);
  };

  const editKid = (i) => {
    const k = profile.kids[i];
    setProfile(p => ({ ...p, kids: p.kids.filter((_, j) => j !== i) }));
    setKidInput({ name: k.name, birthYear: k.birthYear });
    setEditingKid(k.name);
    setKidInputOpen(true);
  };

  const editPet = (i) => {
    const a = profile.pets[i];
    setProfile(p => ({ ...p, pets: p.pets.filter((_, j) => j !== i) }));
    setPetInput({ name: a.name, type: a.type, birthYear: a.birthYear, longCoat: a.longCoat });
    setEditingPet(a.name);
    setPetInputOpen(true);
  };

  const tryNameAge = () => {
    if (!profile.name.trim() || !profile.birthYear) { setErr('Please fill in all fields.'); return; }
    const year = Number(profile.birthYear);
    if (year > CUR_YEAR - 18 || year < CUR_YEAR - 120) { setErr('Please enter a valid birth year.'); return; }
    if (!profile.gender) { setErr('Please select a gender option.'); return; }
    go(1);
  };

  const tryZip = () => {
    const v = profile.zip.trim();
    if (!/^\d{5}(-\d{4})?$/.test(v)) { setErr('Enter a valid 5-digit zip code'); return; }
    if (!ZIP_CODES.has(v.slice(0, 5))) { setErr("We don't recognize that zip code — double check it?"); return; }
    go(4);
  };

  const commitCar = (input) => {
    const label = `${input.year} ${input.make} ${input.model}`;
    setProfile(p => ({ ...p, cars: [...p.cars, label] }));
    setCarInput({ year: '', make: '', model: '' });
    setEditingCar(null);
    setCarInputOpen(false);
  };

  const commitKid = (input) => {
    const yr = Number(input.birthYear);
    if (!input.birthYear || yr > CUR_YEAR || yr < CUR_YEAR - 30) { setErr('Please enter a valid birth year.'); return; }
    setProfile(p => ({ ...p, kids: [...p.kids, { name: input.name.trim(), birthYear: input.birthYear }] }));
    setKidInput({ name: '', birthYear: '' });
    setEditingKid(null);
    setKidInputOpen(false);
    setErr('');
  };

  const commitPet = (input) => {
    const yr = Number(input.birthYear);
    if (!input.birthYear || yr > CUR_YEAR || yr < CUR_YEAR - 40) { setErr('Please enter a valid birth year.'); return; }
    setProfile(p => ({ ...p, pets: [...p.pets, { name: input.name.trim(), type: input.type, birthYear: input.birthYear, longCoat: input.longCoat }] }));
    setPetInput({ name: '', type: '', birthYear: '', longCoat: false });
    setEditingPet(null);
    setPetInputOpen(false);
    setErr('');
  };

  // ── Welcome screen ────────────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <GreenScreen>
        <div style={{ maxWidth:380, width:'100%', textAlign:'center', position:'relative' }}>
          <Wordmark />
          <div style={{ fontFamily:"'Righteous', cursive", fontSize:28, color:'#E8F5EE', marginBottom:14, lineHeight:1.2 }}>
            Your household, handled.
          </div>
          <div style={{ fontSize:14, color:'#B8DCC8', lineHeight:1.7, marginBottom:20, fontFamily:'DM Sans, sans-serif' }}>
            Tell me a little about your home and I'll take it from there. No lists to build. No guessing what's due.
          </div>
          <div style={{ fontSize:12, color:'rgba(184,220,200,0.6)', marginBottom:28, fontFamily:'DM Sans, sans-serif' }}>
            Your info is only used to personalize your experience — never sold or shared.
          </div>
          <button
            onClick={() => setStep(0)}
            style={{ width:'100%', padding:'16px', fontSize:16, fontWeight:700, background:'#F4C430', color:'#7a5900', border:'none', borderRadius:14, cursor:'pointer', fontFamily:'DM Sans, sans-serif', marginBottom:14 }}
          >
            Let's get started
          </button>
          <div style={{ fontSize:12, color:'rgba(184,220,200,0.7)', fontFamily:'DM Sans, sans-serif' }}>
            Takes about 2 minutes
          </div>
        </div>
      </GreenScreen>
    );
  }

  // ── Transition screen ─────────────────────────────────────────────────────────
  if (showTransition) {
    const summaryItems = [
      'Home',
      ...(profile.hasCar   ? ['Car']  : []),
      ...(profile.hasKids  ? ['Kids'] : []),
      ...(profile.hasPets  ? ['Pets'] : []),
    ];
    return (
      <div style={{ minHeight:'100vh', background:'#1A5C3A', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'#0F3D27', top:-40, right:-40 }} />
        <div style={{ position:'absolute', width:60, height:60, borderRadius:'50%', background:'#06A77D', top:20, right:60, opacity:0.7 }} />
        <div style={{ position:'absolute', width:20, height:20, background:'#F77F00', transform:'rotate(45deg)', bottom:60, right:30 }} />
        <div style={{ position:'absolute', width:16, height:16, borderRadius:'50%', background:'#F4C430', top:50, right:130 }} />
        <div style={{ position:'absolute', width:80, height:80, borderRadius:'50%', background:'#0F3D27', bottom:-30, left:-20 }} />
        <div style={{ position:'absolute', width:14, height:14, background:'#F4C430', transform:'rotate(45deg)', top:80, left:30, opacity:0.7 }} />

        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'28px 24px' }}>
        <div style={{ width:'100%', maxWidth:400, position:'relative' }}>
          {/* Card 1 — completed */}
          <div style={{ background:'#0F3D27', borderRadius:16, padding:'18px 20px', marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(184,220,200,0.5)', fontFamily:'DM Sans, sans-serif' }}>Your household</span>
              <span style={{ background:'#06A77D', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, fontFamily:'DM Sans, sans-serif' }}>Done</span>
            </div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {summaryItems.map(item => (
                <div key={item} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <polyline points="2,6.5 5.5,10 11,3" stroke="#06A77D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ color:'#E8F5EE', fontSize:13, fontWeight:600, fontFamily:'DM Sans, sans-serif' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 — upcoming */}
          <div style={{ background:'#0F3D27', border:'1.5px solid #06A77D', borderRadius:16, padding:'18px 20px', marginBottom:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(184,220,200,0.5)', fontFamily:'DM Sans, sans-serif' }}>Last step</span>
              <span style={{ background:'#F4C430', color:'#7a5900', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, fontFamily:'DM Sans, sans-serif' }}>Up next</span>
            </div>
            <p style={{ color:'#B8DCC8', fontSize:14, lineHeight:1.65, margin:0, fontFamily:'DM Sans, sans-serif' }}>
              A few questions to figure out what actually needs attention.
            </p>
          </div>

          <button
            disabled={completing}
            onClick={() => { setCompleting(true); onComplete(profile); }}
            style={{ width:'100%', padding:'16px', fontSize:15, fontWeight:700, background: completing ? '#c9a400' : '#F4C430', color:'#7a5900', border:'none', borderRadius:14, cursor: completing ? 'default' : 'pointer', fontFamily:'DM Sans, sans-serif', transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          >
            {completing ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation:'spin 0.7s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke="#7a5900" strokeWidth="2" strokeOpacity="0.3" />
                  <path d="M8 2 A6 6 0 0 1 14 8" stroke="#7a5900" strokeWidth="2" strokeLinecap="round" />
                </svg>
                One moment…
              </>
            ) : "Let's go"}
          </button>
        </div>
        </div>

        <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', position:'relative', zIndex:1 }}>
          <button
            onClick={() => setShowTransition(false)}
            style={{ background:'none', border:'none', color:'#A8C9B5', fontSize:14, fontFamily:'DM Sans, sans-serif', cursor:'pointer', padding:'4px 0' }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Question screens ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#1A5C3A', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      {/* Scatter shapes */}
      <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'#0F3D27', top:-40, right:-40 }} />
      <div style={{ position:'absolute', width:60, height:60, borderRadius:'50%', background:'#06A77D', top:20, right:60, opacity:0.7 }} />
      <div style={{ position:'absolute', width:20, height:20, background:'#F77F00', transform:'rotate(45deg)', bottom:60, right:30 }} />
      <div style={{ position:'absolute', width:16, height:16, borderRadius:'50%', background:'#F4C430', top:50, right:130 }} />
      <div style={{ position:'absolute', width:12, height:12, borderRadius:'50%', background:'#D62828', bottom:100, right:80 }} />
      <div style={{ position:'absolute', width:80, height:80, borderRadius:'50%', background:'#0F3D27', bottom:-30, left:-20 }} />
      <div style={{ position:'absolute', width:14, height:14, background:'#F4C430', transform:'rotate(45deg)', top:80, left:30, opacity:0.7 }} />

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'28px 24px' }}>
      <div style={{ maxWidth:400, width:'100%', position:'relative' }}>
        <div className="bIn" key={step}>

          {/* Step 0: Name + age */}
          {step === 0 && (
            <QuestionScreen step={1} total={TOTAL_STEPS} question="A little about you">
              <div style={{ fontSize:13, color:'#B8DCC8', marginBottom:16, fontFamily:'DM Sans, sans-serif' }}>
                So Mitzy knows what to call you and which health tasks are relevant.
              </div>
              <input
                type="text" placeholder="First name" value={profile.name}
                onChange={e => { setProfile(p => ({ ...p, name: e.target.value })); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && tryNameAge()}
                style={{ marginBottom:10, width:'100%', boxSizing:'border-box' }}
              />
              <input
                type="number" placeholder="Birth year (e.g. 1988)" value={profile.birthYear} min={CUR_YEAR - 120} max={CUR_YEAR - 18}
                onChange={e => { setProfile(p => ({ ...p, birthYear: e.target.value })); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && tryNameAge()}
                style={{ marginBottom:14, width:'100%', boxSizing:'border-box' }}
              />
              <div style={{ fontSize:12, color:'rgba(184,220,200,0.6)', marginBottom:10, fontFamily:'DM Sans, sans-serif', lineHeight:1.5 }}>
                Gender is used for health screening suggestions like mammograms and prostate checks — choose whatever fits your health needs.
                
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:14 }}>
                {[
                  { key:'woman',      label:'Woman' },
                  { key:'man',        label:'Man' },
                  { key:'nonbinary',  label:'Non-binary / genderqueer' },
                  { key:'prefer-not', label:'Prefer not to say' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setProfile(p => ({ ...p, gender: key })); setErr(''); }}
                    style={{
                      padding:'11px 8px', fontSize:12, fontWeight:700, textAlign:'center',
                      borderRadius:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif', lineHeight:1.3,
                      border: profile.gender === key ? '2px solid #E8F5EE' : '1.5px solid rgba(255,255,255,0.2)',
                      background: profile.gender === key ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                      color: profile.gender === key ? '#E8F5EE' : 'rgba(232,245,238,0.7)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {err && <div style={{ fontSize:13, color:'#F77F00', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>{err}</div>}
              <NextBtn onClick={tryNameAge} disabled={!profile.name.trim() || !profile.birthYear || !profile.gender}>Next</NextBtn>
            </QuestionScreen>
          )}

          {/* Step 1: Own or rent */}
          {step === 1 && (
            <QuestionScreen step={2} total={TOTAL_STEPS} question="Do you own or rent?">
              <div style={{ fontSize:13, color:'#B8DCC8', marginBottom:16, fontFamily:'DM Sans, sans-serif' }}>
                Helps Mitzy know which home maintenance tasks apply to you.
              </div>
              <OptionBtn label="Owner"  sub="I own my home"     selected={profile.hasHome === true}  onClick={() => { setProfile(p => ({ ...p, hasHome: true  })); go(2); }} />
              <OptionBtn label="Renter" sub="I rent my place"   selected={profile.hasHome === false} onClick={() => { setProfile(p => ({ ...p, hasHome: false })); go(2); }} />
            </QuestionScreen>
          )}

          {/* Step 2: Car */}
          {step === 2 && (
            <QuestionScreen step={3} total={TOTAL_STEPS} question="Do you have a car?">
              <div style={{ fontSize:13, color:'#B8DCC8', marginBottom:16, fontFamily:'DM Sans, sans-serif' }}>
                So Mitzy can remind you about registration, oil changes, and inspections.
              </div>
              {profile.hasCar === null ? (
                <>
                  <OptionBtn label="Yes" selected={false} onClick={() => { setProfile(p => ({ ...p, hasCar: true })); setCarInputOpen(true); }} />
                  <OptionBtn label="No"  selected={false} onClick={() => { setProfile(p => ({ ...p, hasCar: false })); setStep(3); setErr(''); }} />
                </>
              ) : (
                <>
                  {profile.cars.length > 0 && (
                    <div style={{ marginBottom:12 }}>
                      {profile.cars.map((car, i) => (
                        <div key={i} style={{ background:'rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 12px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={() => editCar(i)}>
                          <span style={{ color:'#E8F5EE', fontSize:13, fontWeight:600, fontFamily:'DM Sans, sans-serif' }}>{car}</span>
                          <button onClick={e => { e.stopPropagation(); setProfile(p => ({ ...p, cars: p.cars.filter((_, j) => j !== i) })); }} style={{ background:'transparent', border:'none', color:'rgba(184,220,200,0.7)', fontSize:18, cursor:'pointer', padding:'0 4px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {carInputOpen ? (
                    <>
                      {editingCar && (
                        <div style={{ fontSize:12, color:'rgba(184,220,200,0.75)', marginBottom:10, fontFamily:'DM Sans, sans-serif' }}>
                          Editing your {editingCar}
                        </div>
                      )}
                      <select
                        value={carInput.year}
                        onChange={e => setCarInput({ year: e.target.value, make: '', model: '' })}
                        style={{ width:'100%', marginBottom:8 }}
                      >
                        <option value="">Year</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      {carInput.year && (
                        <select
                          value={carInput.make}
                          onChange={e => setCarInput(x => ({ ...x, make: e.target.value, model: '' }))}
                          style={{ width:'100%', marginBottom:8 }}
                        >
                          <option value="">Make</option>
                          {Object.keys(CAR_DATA).sort().map(make => <option key={make} value={make}>{make}</option>)}
                        </select>
                      )}
                      {carInput.make && (
                        <select
                          value={carInput.model}
                          onChange={e => {
                            const model = e.target.value;
                            const next = { ...carInput, model };
                            setCarInput(next);
                            if (model) commitCar(next);
                          }}
                          style={{ width:'100%', marginBottom:14 }}
                        >
                          <option value="">Model</option>
                          {CAR_DATA[carInput.make].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      )}
                    </>
                  ) : profile.cars.length === 0 ? (
                    <>
                      <OptionBtn label="No cars added" selected={true} onClick={() => {}} />
                      <button
                        onClick={() => { setProfile(p => ({ ...p, hasCar: true })); setCarInput({ year: '', make: '', model: '' }); setCarInputOpen(true); }}
                        style={{ background:'none', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:10, color:'rgba(232,245,238,0.8)', fontSize:13, fontWeight:600, padding:'10px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', width:'100%', marginBottom:12 }}
                      >
                        + Add a vehicle
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setCarInput({ year: '', make: '', model: '' }); setEditingCar(null); setCarInputOpen(true); }}
                      style={{ background:'none', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:10, color:'rgba(232,245,238,0.8)', fontSize:13, fontWeight:600, padding:'10px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', width:'100%', marginBottom:12 }}
                    >
                      + Add another vehicle
                    </button>
                  )}
                  <NextBtn onClick={() => {
                    if (carInputOpen) {
                      if (carInput.year && carInput.make && carInput.model) {
                        commitCar(carInput);
                      } else if (editingCar) {
                        setProfile(p => ({ ...p, cars: [...p.cars, editingCar] }));
                        setEditingCar(null);
                        setCarInputOpen(false);
                      } else {
                        setCarInputOpen(false);
                      }
                    }
                    go(3);
                  }}>Next</NextBtn>
                </>
              )}
            </QuestionScreen>
          )}

          {/* Step 3: Zip */}
          {step === 3 && (
            <QuestionScreen step={4} total={TOTAL_STEPS} question="What's your zip code?">
              <div style={{ fontSize:13, color:'#B8DCC8', marginBottom:16, fontFamily:'DM Sans, sans-serif' }}>
                Mitzy uses this to find local services and surface area-specific reminders.
              </div>
              <input
                type="text" placeholder="e.g. 97201" maxLength="10"
                value={profile.zip}
                onChange={e => { setProfile(p => ({ ...p, zip: e.target.value })); setErr(''); }}
                onBlur={() => {
                  const v = profile.zip.trim();
                  if (!v) return;
                  if (!/^\d{5}(-\d{4})?$/.test(v)) { setErr('Enter a valid 5-digit zip code'); return; }
                  if (!ZIP_CODES.has(v.slice(0, 5))) setErr("We don't recognize that zip code — double check it?");
                }}
                onKeyDown={e => { if (e.key === 'Enter') tryZip(); }}
                style={{ marginBottom:14 }}
              />
              {err && <div style={{ fontSize:13, color:'#F77F00', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>{err}</div>}
              <NextBtn onClick={tryZip} disabled={!/^\d{5}(-\d{4})?$/.test(profile.zip.trim())}>
                Next
              </NextBtn>
            </QuestionScreen>
          )}

          {/* Step 4: Kids */}
          {step === 4 && (
            <QuestionScreen step={5} total={TOTAL_STEPS} question="Any kids at home?">
              <div style={{ fontSize:13, color:'#B8DCC8', marginBottom:16, fontFamily:'DM Sans, sans-serif' }}>
                So Mitzy can surface the right health visits and school-year tasks.
              </div>
              {profile.hasKids === null ? (
                <>
                  <OptionBtn label="Yes" selected={false} onClick={() => { setProfile(p => ({ ...p, hasKids: true })); setKidInputOpen(true); }} />
                  <OptionBtn label="No"  selected={false} onClick={() => { setProfile(p => ({ ...p, hasKids: false })); setStep(5); setErr(''); }} />
                </>
              ) : (
                <>
                  {profile.kids.length > 0 && (
                    <div style={{ marginBottom:14 }}>
                      {profile.kids.map((k, i) => (
                        <div key={i} style={{ background:'rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 12px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={() => editKid(i)}>
                          <span style={{ color:'#E8F5EE', fontSize:13, fontWeight:600, fontFamily:'DM Sans, sans-serif' }}>{k.name}, born {k.birthYear}</span>
                          <button onClick={e => { e.stopPropagation(); setProfile(p => ({ ...p, kids: p.kids.filter((_, j) => j !== i) })); }} style={{ background:'transparent', border:'none', color:'rgba(184,220,200,0.7)', fontSize:18, cursor:'pointer', padding:'0 4px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {kidInputOpen ? (
                    <>
                    {editingKid && (
                      <div style={{ fontSize:12, color:'rgba(184,220,200,0.75)', marginBottom:10, fontFamily:'DM Sans, sans-serif' }}>
                        Editing {editingKid}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                      <input
                        type="text" placeholder="Name" value={kidInput.name} style={{ flex:2 }}
                        onChange={e => { const n = e.target.value; setKidInput(x => ({ ...x, name: n })); if (!n.trim() && !kidInput.birthYear) setErr(''); }}
                      />
                      <input
                        type="number" placeholder="Birth year" value={kidInput.birthYear} style={{ flex:1 }} min={CUR_YEAR - 30} max={CUR_YEAR}
                        onChange={e => { const a = e.target.value; setKidInput(x => ({ ...x, birthYear: a })); if (!kidInput.name.trim() && !a) setErr(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') { const next = { ...kidInput }; if (next.name.trim() && next.birthYear) commitKid(next); } }}
                      />
                      <button
                        onClick={() => { if (kidInput.name.trim() && kidInput.birthYear) commitKid(kidInput); }}
                        style={{ padding:'10px 14px', background:'#F4C430', color:'#7a5900', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:18, flexShrink:0 }}
                      >+</button>
                    </div>
                    {kidInput.birthYear && Number(kidInput.birthYear) < CUR_YEAR - 25 && <div style={{ fontSize:12, color:'rgba(244,196,48,0.85)', marginBottom:6, fontFamily:'DM Sans, sans-serif' }}>Just want to make sure — does that birth year look right?</div>}
                    {err && <div style={{ fontSize:12, color:'#F4C430', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>{err}</div>}
                    </>
                  ) : profile.kids.length === 0 ? (
                    <>
                      <OptionBtn label="No kids added" selected={true} onClick={() => {}} />
                      <button
                        onClick={() => { setProfile(p => ({ ...p, hasKids: true })); setKidInput({ name: '', birthYear: '' }); setKidInputOpen(true); }}
                        style={{ background:'none', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:10, color:'rgba(232,245,238,0.8)', fontSize:13, fontWeight:600, padding:'10px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', width:'100%', marginBottom:12 }}
                      >
                        + Add a kid
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setKidInput({ name: '', birthYear: '' }); setEditingKid(null); setKidInputOpen(true); }}
                      style={{ background:'none', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:10, color:'rgba(232,245,238,0.8)', fontSize:13, fontWeight:600, padding:'10px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', width:'100%', marginBottom:12 }}
                    >
                      + Add another kid
                    </button>
                  )}
                  <NextBtn onClick={() => {
                    if (kidInputOpen) {
                      const hasPartial = kidInput.name.trim() || kidInput.birthYear;
                      const isComplete = kidInput.name.trim() && kidInput.birthYear;
                      if (isComplete) { commitKid(kidInput); go(5); return; }
                      if (hasPartial) { setErr(kidInput.name.trim() ? `Finish adding ${kidInput.name.trim()} or clear the fields to continue.` : 'Finish adding this entry or clear the fields to continue.'); return; }
                    }
                    setKidInputOpen(false);
                    go(5);
                  }}>
                    Next
                  </NextBtn>
                </>
              )}
            </QuestionScreen>
          )}

          {/* Step 5: Pets */}
          {step === 5 && (
            <QuestionScreen step={6} total={TOTAL_STEPS} question="Any pets?">
              <div style={{ fontSize:13, color:'#B8DCC8', marginBottom:16, fontFamily:'DM Sans, sans-serif' }}>
                Tracks vet visits and grooming based on your pet's age and type.
              </div>
              {profile.hasPets === null ? (
                <>
                  <OptionBtn label="Yes" selected={false} onClick={() => { setProfile(p => ({ ...p, hasPets: true })); setPetInputOpen(true); }} />
                  <OptionBtn label="No"  selected={false} onClick={() => { setProfile(p => ({ ...p, hasPets: false })); setShowTransition(true); }} />
                </>
              ) : (
                <>
                  {profile.pets.length > 0 && (
                    <div style={{ marginBottom:14 }}>
                      {profile.pets.map((a, i) => (
                        <div key={i} style={{ background:'rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 12px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={() => editPet(i)}>
                          <span style={{ color:'#E8F5EE', fontSize:13, fontWeight:600, fontFamily:'DM Sans, sans-serif' }}>{a.name} · {a.type}</span>
                          <button onClick={e => { e.stopPropagation(); setProfile(p => ({ ...p, pets: p.pets.filter((_, j) => j !== i) })); }} style={{ background:'transparent', border:'none', color:'rgba(184,220,200,0.7)', fontSize:18, cursor:'pointer', padding:'0 4px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {petInputOpen ? (
                    <>
                      {editingPet && (
                        <div style={{ fontSize:12, color:'rgba(184,220,200,0.75)', marginBottom:10, fontFamily:'DM Sans, sans-serif' }}>
                          Editing {editingPet}
                        </div>
                      )}
                      {/* Step 1: Name + birth year */}
                      <div style={{ display:'flex', gap:8, marginBottom:err ? 6 : 10 }}>
                        <input type="text" placeholder="Name" value={petInput.name} onChange={e => { const n = e.target.value; setPetInput(x => ({ ...x, name: n })); if (!n.trim() && !petInput.birthYear && !petInput.type) setErr(''); }} style={{ flex:2 }} />
                        <input type="number" placeholder="Birth year" value={petInput.birthYear} onChange={e => { const a = e.target.value; setPetInput(x => ({ ...x, birthYear: a })); if (!petInput.name.trim() && !a && !petInput.type) setErr(''); }} style={{ flex:1 }} min={CUR_YEAR - 40} max={CUR_YEAR} />
                      </div>
                      {petInput.birthYear && Number(petInput.birthYear) < CUR_YEAR - 30 && <div style={{ fontSize:12, color:'rgba(244,196,48,0.85)', marginBottom:6, fontFamily:'DM Sans, sans-serif' }}>Just want to make sure — does that birth year look right?</div>}
                      {err && <div style={{ fontSize:12, color:'#F4C430', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>{err}</div>}
                      {/* Step 2: Type — appears once name + birth year are filled */}
                      {petInput.name.trim() && petInput.birthYear && (
                        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                          {['dog', 'cat', 'other'].map(t => (
                            <button
                              key={t}
                              onClick={() => {
                                const next = { ...petInput, type: t };
                                setPetInput(next);
                                if (t !== 'dog') commitPet(next);
                              }}
                              style={{ flex:1, padding:'10px', fontSize:13, fontWeight:700, border:'none', borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif', background: petInput.type === t ? '#F4C430' : 'rgba(255,255,255,0.15)', color: petInput.type === t ? '#7a5900' : '#E8F5EE' }}
                            >
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Step 3: Coat — appears only for dogs, auto-commits on selection */}
                      {petInput.type === 'dog' && (
                        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                          {[{ label:'Short', value:false }, { label:'Long', value:true }].map(({ label, value }) => (
                            <button
                              key={label}
                              onClick={() => commitPet({ ...petInput, longCoat: value })}
                              style={{ flex:1, padding:'10px', fontSize:13, fontWeight:700, border:'none', borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif', background:'rgba(255,255,255,0.15)', color:'#E8F5EE' }}
                            >
                              {label} coat
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : profile.pets.length === 0 ? (
                    <>
                      <OptionBtn label="No pets added" selected={true} onClick={() => {}} />
                      <button
                        onClick={() => { setProfile(p => ({ ...p, hasPets: true })); setPetInput({ name: '', type: '', birthYear: '', longCoat: false }); setPetInputOpen(true); }}
                        style={{ background:'none', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:10, color:'rgba(232,245,238,0.8)', fontSize:13, fontWeight:600, padding:'10px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', width:'100%', marginBottom:12 }}
                      >
                        + Add a pet
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setPetInput({ name: '', type: '', birthYear: '', longCoat: false }); setEditingPet(null); setPetInputOpen(true); }}
                      style={{ background:'none', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:10, color:'rgba(232,245,238,0.8)', fontSize:13, fontWeight:600, padding:'10px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', width:'100%', marginBottom:12 }}
                    >
                      + Add another pet
                    </button>
                  )}
                  <NextBtn onClick={() => {
                    if (petInputOpen) {
                      const isComplete = petInput.name.trim() && petInput.birthYear && petInput.type && (petInput.type !== 'dog' || editingPet !== null);
                      const hasPartial = petInput.name.trim() || petInput.birthYear || petInput.type;
                      if (isComplete) { commitPet(petInput); setShowTransition(true); return; }
                      if (hasPartial) {
                        setErr(petInput.name.trim() ? `Finish adding ${petInput.name.trim()} or clear the fields to continue.` : 'Finish adding this entry or clear the fields to continue.');
                        return;
                      }
                    }
                    setPetInputOpen(false);
                    setShowTransition(true);
                  }}>Let's go</NextBtn>
                </>
              )}
            </QuestionScreen>
          )}

        </div>
      </div>
      </div>

      {/* Footer bar */}
      <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', position:'relative', zIndex:1 }}>
        <button
          onClick={() => setStep(s => s - 1)}
          style={{
            background:'none', border:'none', color:'#A8C9B5', fontSize:14,
            fontFamily:'DM Sans, sans-serif', cursor: step === 0 ? 'default' : 'pointer',
            opacity: step === 0 ? 0 : 1, padding:'4px 0', pointerEvents: step === 0 ? 'none' : 'auto',
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
