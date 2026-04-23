import { useState } from "react";
import { AppHeader } from "./HomeView";
import { HouseIcon, CarIcon, PersonIcon, PetIcon } from "../components/CategoryIcons";

// ─── Car data (shared with SlimOnboarding) ─────────────────────────────────────
const CAR_DATA = {
  Acura:           ['ILX', 'MDX', 'RDX', 'TLX'],
  Audi:            ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'TT'],
  BMW:             ['2 Series', '3 Series', '4 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'M3', 'M5'],
  Buick:           ['Enclave', 'Encore', 'Envision', 'LaCrosse'],
  Cadillac:        ['CT4', 'CT5', 'Escalade', 'XT4', 'XT5'],
  Chevrolet:       ['Blazer', 'Camaro', 'Colorado', 'Equinox', 'Malibu', 'Silverado 1500', 'Silverado 2500', 'Suburban', 'Tahoe', 'Traverse', 'Trax'],
  Chrysler:        ['300', 'Pacifica', 'Voyager'],
  Dodge:           ['Challenger', 'Charger', 'Durango', 'Journey'],
  Ford:            ['Bronco', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'F-250', 'Maverick', 'Mustang', 'Ranger', 'Transit'],
  GMC:             ['Acadia', 'Canyon', 'Sierra 1500', 'Sierra 2500', 'Terrain', 'Yukon'],
  Honda:           ['Accord', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Odyssey', 'Passport', 'Pilot', 'Ridgeline'],
  Hyundai:         ['Elantra', 'Ioniq 5', 'Kona', 'Palisade', 'Santa Fe', 'Sonata', 'Tucson'],
  Infiniti:        ['Q50', 'QX50', 'QX60', 'QX80'],
  Jeep:            ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Renegade', 'Wrangler'],
  Kia:             ['Carnival', 'EV6', 'Forte', 'K5', 'Soul', 'Sorento', 'Sportage', 'Stinger', 'Telluride'],
  Lexus:           ['ES', 'GX', 'IS', 'LS', 'NX', 'RX', 'UX'],
  Mazda:           ['CX-30', 'CX-5', 'CX-9', 'Mazda3', 'Mazda6', 'MX-5 Miata'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'GLE', 'S-Class'],
  Nissan:          ['Altima', 'Frontier', 'Kicks', 'Maxima', 'Murano', 'Pathfinder', 'Rogue', 'Sentra', 'Titan', 'Versa'],
  Ram:             ['1500', '2500', 'ProMaster'],
  Subaru:          ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback'],
  Tesla:           ['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y'],
  Toyota:          ['4Runner', 'Avalon', 'Camry', 'Corolla', 'Highlander', 'Prius', 'RAV4', 'Sequoia', 'Sienna', 'Tacoma', 'Tundra'],
  Volkswagen:      ['Atlas', 'Golf', 'ID.4', 'Jetta', 'Passat', 'Tiguan'],
  Volvo:           ['S60', 'V60', 'XC40', 'XC60', 'XC90'],
};
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 32 }, (_, i) => String(CUR_YEAR - i));

// ─── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  sectionCard: { background:'#fff', borderRadius:16, border:'1px solid #EAE4DA', marginBottom:10, overflow:'hidden' },
  sectionHeader: { display:'flex', alignItems:'center', gap:8, padding:'13px 16px', borderBottom:'1px solid #EAE4DA' },
  iconWrap: (bg) => ({ width:28, height:28, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }),
  sectionTitle: { fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'#1C2B22' },
  row: (last) => ({ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom: last ? 'none' : '1px solid #F5F0E8' }),
  rowLabel: { fontSize:12, color:'#4A6256', fontWeight:500, fontFamily:'DM Sans, sans-serif' },
  rowValue: (muted) => ({ fontSize:13, fontWeight:700, color: muted ? '#9B9B9B' : '#1C2B22', fontFamily:'DM Sans, sans-serif' }),
  fieldWrap: { padding:'10px 16px', borderBottom:'1px solid #F5F0E8' },
  fieldLabel: { fontSize:10, fontWeight:700, color:'#9B9B9B', fontFamily:'DM Sans, sans-serif', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:4 },
  input: { width:'100%', boxSizing:'border-box', fontSize:14, fontFamily:'DM Sans, sans-serif', border:'1px solid #D4CFC6', borderRadius:10, padding:'8px 11px', color:'#1C2B22', background:'#FDFAF2', outline:'none' },
};

// ─── View row ──────────────────────────────────────────────────────────────────
function Row({ label, value, last }) {
  const empty = !value;
  return (
    <div style={S.row(last)}>
      <span style={S.rowLabel}>{label}</span>
      <span style={S.rowValue(empty)}>{empty ? 'Not set' : value}</span>
    </div>
  );
}

// ─── Toggle button ─────────────────────────────────────────────────────────────
function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ flex:1, fontSize:13, fontWeight:700, border:'none', borderRadius:10, padding:'8px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif', background: active ? '#1A5C3A' : '#F0EDE4', color: active ? '#fff' : '#4A6256' }}>
      {children}
    </button>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, iconBg, title }) {
  return (
    <div style={S.sectionHeader}>
      <div style={S.iconWrap(iconBg)}>{icon}</div>
      <span style={S.sectionTitle}>{title}</span>
    </div>
  );
}

// ─── Edit field ────────────────────────────────────────────────────────────────
function EditField({ label, last, children }) {
  return (
    <div style={{ ...S.fieldWrap, borderBottom: last ? 'none' : '1px solid #F5F0E8' }}>
      <div style={S.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

// ─── Saved providers icon ──────────────────────────────────────────────────────
function ProvidersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 14 L3 8 Q1 5 4 3 Q6.5 2 9 6 Q11.5 2 14 3 Q17 5 15 8 Z" fill="#D62828" />
      <polygon points="9,3 10,6.5 14,6.5 11,8.5 12,12 9,10 6,12 7,8.5 4,6.5 8,6.5" fill="#F4C430" />
    </svg>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────
export function ProfileView({ profile, providerHistory, onReset, onUpdateProfile, onAddHazardTasks, user, onSignOut }) {
  const [confirmReset,   setConfirmReset]   = useState(false);
  const [resetting,      setResetting]      = useState(false);
  const [resetError,     setResetError]     = useState(null);
  const [isEditing,      setIsEditing]      = useState(false);
  const [addingHazards,  setAddingHazards]  = useState(false);
  const [pendingRemove,  setPendingRemove]  = useState(null); // { type: 'car'|'kid'|'pet', index: number }

  // Edit state — all sections at once
  const [editHasHome,   setEditHasHome]   = useState(null);
  const [editZip,       setEditZip]       = useState('');
  const [editCars,      setEditCars]      = useState([]);
  const [carPicker,     setCarPicker]     = useState(null); // null | { year, make, model }
  const [editKids,      setEditKids]      = useState([]);
  const [editPets,      setEditPets]      = useState([]);
  const [editBirthYear, setEditBirthYear] = useState('');
  const [editInsurance, setEditInsurance] = useState('');

  const startEditing = () => {
    setEditHasHome(profile.hasHome);
    setEditZip(profile.zip || '');
    setEditCars(profile.cars?.length ? [...profile.cars] : (profile.car ? [profile.car] : []));
    setCarPicker(null);
    setEditKids((profile.kids || []).map(k => ({ ...k })));
    setEditPets((profile.pets || []).map(p => ({ ...p })));
    setEditBirthYear(profile.birthYear ? String(profile.birthYear) : '');
    setEditInsurance(profile.insurance || '');
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveAll = () => {
    onUpdateProfile({
      ...profile,
      hasHome:   editHasHome,
      zip:       editZip.trim() || null,
      cars:      editCars,
      car:       editCars[0] || null,
      kids:      editKids.filter(k => k.name.trim()),
      pets:      editPets.filter(p => p.name.trim()),
      birthYear: editBirthYear.trim() || null,
      insurance: editInsurance.trim() || null,
    });
    setIsEditing(false);
  };

  const commitCar = (picker) => {
    const label = `${picker.year} ${picker.make} ${picker.model}`;
    setEditCars(prev => [...prev, label]);
    setCarPicker(null);
  };

  const allProviders = Object.entries(providerHistory || {}).map(([taskId, p]) => ({ taskId, ...p }));
  const vehicleLabel = profile.cars?.length ? profile.cars.join(', ') : (profile.car || null);

  return (
    <div style={{ background:'#FDFAF2' }}>
      <AppHeader rightContent={<>Your<br />household</>} />

      <div style={{ padding:'20px 18px 100px', maxWidth:680, margin:'0 auto' }}>

        {/* Edit / Save bar */}
        {!isEditing ? (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
            <button
              onClick={startEditing}
              style={{ fontSize:13, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'7px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
            >
              Edit profile
            </button>
          </div>
        ) : null}

        {/* ── Home ── */}
        {(profile.hasHome !== null || profile.zip || isEditing) && (
          <div style={S.sectionCard}>
            <SectionHeader icon={<HouseIcon color="#1A5C3A" bg="#E8F5EE" size={16} />} iconBg="#E8F5EE" title="Home" />
            {isEditing ? (
              <>
                <EditField label="Ownership">
                  <div style={{ display:'flex', gap:8 }}>
                    <ToggleBtn active={editHasHome === true}  onClick={() => setEditHasHome(true)}>Owner</ToggleBtn>
                    <ToggleBtn active={editHasHome === false} onClick={() => setEditHasHome(false)}>Renter</ToggleBtn>
                  </div>
                </EditField>
                <EditField label="Zip code" last>
                  <input style={S.input} type="text" inputMode="numeric" value={editZip} onChange={e => setEditZip(e.target.value)} placeholder="e.g. 90210" />
                </EditField>
              </>
            ) : (
              <>
                <Row label="Ownership" value={profile.hasHome === true ? 'Owner' : profile.hasHome === false ? 'Renter' : null} />
                <Row label="Zip code"  value={profile.zip} last={!profile.zip || !!profile.hazards?.length} />
                {profile.zip && !profile.hazards?.length && (
                  <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>Disaster prep tasks for your area</span>
                    <button
                      disabled={addingHazards}
                      onClick={async () => { setAddingHazards(true); await onAddHazardTasks(); setAddingHazards(false); }}
                      style={{ fontSize:12, fontWeight:700, color: addingHazards ? '#9B9B9B' : '#1A5C3A', background:'none', border:'none', cursor: addingHazards ? 'default' : 'pointer', fontFamily:'DM Sans, sans-serif', padding:0 }}
                    >
                      {addingHazards ? 'Checking…' : '+ Add'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Car ── */}
        {profile.hasCar && (
          <div style={S.sectionCard}>
            <SectionHeader icon={<CarIcon color="#F77F00" bg="#FFF3E0" size={16} />} iconBg="#FFF3E0" title="Car" />
            {isEditing ? (
              <div style={{ padding:'10px 16px' }}>
                {/* Current cars list */}
                {editCars.map((car, i) => (
                  <div key={i} style={{ background:'#F5F0E8', borderRadius:10, marginBottom:8, overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>{car}</span>
                      {pendingRemove?.type === 'car' && pendingRemove.index === i
                        ? <span style={{ fontSize:12, color:'#D62828', fontFamily:'DM Sans, sans-serif', fontWeight:600 }}>Remove?</span>
                        : <button onClick={() => setPendingRemove({ type:'car', index:i })} style={{ fontSize:18, color:'#D62828', background:'none', border:'none', cursor:'pointer', padding:'0 4px', lineHeight:1 }}>×</button>
                      }
                    </div>
                    {pendingRemove?.type === 'car' && pendingRemove.index === i && (
                      <div style={{ display:'flex', gap:8, padding:'0 12px 10px' }}>
                        <button onClick={() => { setEditCars(editCars.filter((_,j)=>j!==i)); setPendingRemove(null); }} style={{ flex:1, fontSize:12, fontWeight:700, color:'#fff', background:'#D62828', border:'none', borderRadius:8, padding:'6px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>Yes, remove</button>
                        <button onClick={() => setPendingRemove(null)} style={{ flex:1, fontSize:12, fontWeight:700, color:'#4A6256', background:'#E8E2D8', border:'none', borderRadius:8, padding:'6px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
                {/* Cascading picker */}
                {carPicker !== null ? (
                  <>
                    <select
                      value={carPicker.year}
                      onChange={e => setCarPicker({ year: e.target.value, make: '', model: '' })}
                      style={{ ...S.input, marginBottom:8 }}
                    >
                      <option value="">Year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {carPicker.year && (
                      <select
                        value={carPicker.make}
                        onChange={e => setCarPicker(x => ({ ...x, make: e.target.value, model: '' }))}
                        style={{ ...S.input, marginBottom:8 }}
                      >
                        <option value="">Make</option>
                        {Object.keys(CAR_DATA).sort().map(make => <option key={make} value={make}>{make}</option>)}
                      </select>
                    )}
                    {carPicker.make && (
                      <select
                        value={carPicker.model}
                        onChange={e => {
                          const model = e.target.value;
                          if (model) commitCar({ ...carPicker, model });
                        }}
                        style={{ ...S.input, marginBottom:8 }}
                      >
                        <option value="">Model</option>
                        {CAR_DATA[carPicker.make].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    )}
                    <button
                      onClick={() => setCarPicker(null)}
                      style={{ fontSize:12, fontWeight:600, color:'#9B9B9B', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans, sans-serif', padding:'2px 0' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setCarPicker({ year:'', make:'', model:'' })}
                    style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                  >
                    {editCars.length === 0 ? '+ Add vehicle' : '+ Add another'}
                  </button>
                )}
              </div>
            ) : (
              <Row label={profile.cars?.length > 1 ? 'Vehicles' : 'Vehicle'} value={vehicleLabel} last />
            )}
          </div>
        )}

        {/* ── Kids ── */}
        {profile.hasKids && (
          <div style={S.sectionCard}>
            <SectionHeader icon={<PersonIcon color="#06A77D" bg="#E8F5EE" size={16} />} iconBg="#E8F5EE" title="Kids" />
            {isEditing ? (
              <div style={{ padding:'10px 16px' }}>
                {editKids.map((kid, i) => (
                  <div key={i} style={{ background:'#F5F0E8', borderRadius:10, marginBottom:8, padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ flex:1 }}>
                        <div style={S.fieldLabel}>Name</div>
                        <input
                          style={S.input}
                          type="text"
                          value={kid.name}
                          onChange={e => { const k=[...editKids]; k[i]={...k[i],name:e.target.value}; setEditKids(k); }}
                          placeholder="Name"
                        />
                      </div>
                      <div style={{ width:88 }}>
                        <div style={S.fieldLabel}>Birth year</div>
                        <input
                          style={S.input}
                          type="number"
                          value={kid.birthYear || ''}
                          onChange={e => { const k=[...editKids]; k[i]={...k[i],birthYear:e.target.value}; setEditKids(k); }}
                          placeholder="e.g. 2018"
                          min="1995" max={new Date().getFullYear()}
                        />
                      </div>
                      <button onClick={() => setPendingRemove({ type:'kid', index:i })} style={{ fontSize:20, color:'#D62828', background:'none', border:'none', cursor:'pointer', padding:'0 2px', lineHeight:1, marginTop:16, flexShrink:0 }}>×</button>
                    </div>
                    {pendingRemove?.type === 'kid' && pendingRemove.index === i && (
                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <button onClick={() => { setEditKids(editKids.filter((_,j)=>j!==i)); setPendingRemove(null); }} style={{ flex:1, fontSize:12, fontWeight:700, color:'#fff', background:'#D62828', border:'none', borderRadius:8, padding:'6px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
                          Remove{kid.name ? ` ${kid.name}` : ''}
                        </button>
                        <button onClick={() => setPendingRemove(null)} style={{ flex:1, fontSize:12, fontWeight:700, color:'#4A6256', background:'#E8E2D8', border:'none', borderRadius:8, padding:'6px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setEditKids([...editKids, { name:'', birthYear:'' }])}
                  style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                >
                  + Add child
                </button>
              </div>
            ) : (
              profile.kids?.length > 0
                ? profile.kids.map((k, i) => <Row key={i} label={k.name} value={k.birthYear ? `born ${k.birthYear}` : null} last={i === profile.kids.length - 1} />)
                : <Row label="No kids added" value={null} last />
            )}
          </div>
        )}

        {/* ── Pets ── */}
        {profile.hasPets && (
          <div style={S.sectionCard}>
            <SectionHeader icon={<PetIcon color="#F4C430" bg="#FFFBEE" size={16} />} iconBg="#FFFBEE" title="Pets" />
            {isEditing ? (
              <div style={{ padding:'10px 16px' }}>
                {editPets.map((pet, i) => (
                  <div key={i} style={{ background:'#F5F0E8', borderRadius:10, marginBottom:8, padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ flex:1 }}>
                        <div style={S.fieldLabel}>Name</div>
                        <input
                          style={S.input}
                          type="text"
                          value={pet.name}
                          onChange={e => { const p=[...editPets]; p[i]={...p[i],name:e.target.value}; setEditPets(p); }}
                          placeholder="Name"
                        />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={S.fieldLabel}>Type</div>
                        <input
                          style={S.input}
                          type="text"
                          value={pet.type || ''}
                          onChange={e => { const p=[...editPets]; p[i]={...p[i],type:e.target.value}; setEditPets(p); }}
                          placeholder="dog, cat…"
                        />
                      </div>
                      <button onClick={() => setPendingRemove({ type:'pet', index:i })} style={{ fontSize:20, color:'#D62828', background:'none', border:'none', cursor:'pointer', padding:'0 2px', lineHeight:1, marginTop:16, flexShrink:0 }}>×</button>
                    </div>
                    {pendingRemove?.type === 'pet' && pendingRemove.index === i && (
                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <button onClick={() => { setEditPets(editPets.filter((_,j)=>j!==i)); setPendingRemove(null); }} style={{ flex:1, fontSize:12, fontWeight:700, color:'#fff', background:'#D62828', border:'none', borderRadius:8, padding:'6px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
                          Remove{pet.name ? ` ${pet.name}` : ''}
                        </button>
                        <button onClick={() => setPendingRemove(null)} style={{ flex:1, fontSize:12, fontWeight:700, color:'#4A6256', background:'#E8E2D8', border:'none', borderRadius:8, padding:'6px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setEditPets([...editPets, { name:'', type:'' }])}
                  style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                >
                  + Add pet
                </button>
              </div>
            ) : (
              profile.pets?.length > 0
                ? profile.pets.map((a, i) => <Row key={i} label={a.name} value={a.type || 'pet'} last={i === profile.pets.length - 1} />)
                : <Row label="No pets added" value={null} last />
            )}
          </div>
        )}

        {/* ── Health ── */}
        <div style={S.sectionCard}>
          <SectionHeader icon={<PersonIcon color="#4A6256" bg="#F0EDE4" size={16} />} iconBg="#F0EDE4" title="Health" />
          {isEditing ? (
            <>
              <EditField label="Birth year">
                <input style={S.input} type="number" value={editBirthYear} onChange={e => setEditBirthYear(e.target.value)} placeholder="e.g. 1988" min="1900" max={new Date().getFullYear() - 18} />
              </EditField>
              <EditField label="Insurance provider" last>
                <input style={S.input} type="text" value={editInsurance} onChange={e => setEditInsurance(e.target.value)} placeholder="e.g. Blue Cross, Aetna…" />
              </EditField>
            </>
          ) : (
            <>
              <Row label="Birth year" value={profile.birthYear ? String(profile.birthYear) : null} />
              <Row label="Insurance" value={profile.insurance} last />
            </>
          )}
        </div>

        {/* ── Save / Cancel bar ── */}
        {isEditing && (
          <div style={{ display:'flex', gap:10, marginBottom:10 }}>
            <button onClick={saveAll} style={{ flex:1, fontSize:14, fontWeight:700, color:'#fff', background:'#1A5C3A', border:'none', borderRadius:20, padding:'12px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
              Save changes
            </button>
            <button onClick={cancelEdit} style={{ fontSize:14, fontWeight:600, color:'#4A6256', background:'#F0EDE4', border:'none', borderRadius:20, padding:'12px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
              Cancel
            </button>
          </div>
        )}

        {/* ── Saved providers ── */}
        {allProviders.length > 0 && (
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <div style={S.iconWrap('#FDE8E8')}><ProvidersIcon size={16} /></div>
              <span style={S.sectionTitle}>Saved providers</span>
            </div>
            {allProviders.map((p, i) => (
              <div key={i} style={{ padding:'11px 16px', borderBottom: i < allProviders.length - 1 ? '1px solid #F5F0E8' : 'none' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9B9B9B', marginBottom:3, fontFamily:'DM Sans, sans-serif' }}>
                  {p.taskId.replace(/-/g, ' ')}
                  {p.vote && (
                    <span style={{ marginLeft:6, color: p.vote === 'good' ? '#06A77D' : '#D62828' }}>
                      {p.vote === 'good' ? '· use again' : '· would avoid'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color: p.vote === 'bad' ? '#9B9B9B' : '#1C2B22', fontFamily:'DM Sans, sans-serif' }}>{p.name}</div>
                {p.notes && <div style={{ fontSize:12, color:'#4A6256', fontStyle:'italic', marginTop:2, fontFamily:'DM Sans, sans-serif' }}>{p.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── Account ── */}
        {user && (
          <div style={S.sectionCard}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid #F5F0E8' }}>
              <span style={S.rowLabel}>Signed in as</span>
              <span style={S.rowValue(false)}>{user.email}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px' }}>
              <span style={{ fontSize:13, fontWeight:500, color:'#9B9B9B', fontFamily:'DM Sans, sans-serif' }}>Sign out</span>
              <button
                onClick={onSignOut}
                style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                Log out
              </button>
            </div>
          </div>
        )}

        {/* ── Reset ── */}
        {resetError && (
          <div style={{ fontSize:12, color:'#D62828', fontFamily:'DM Sans, sans-serif', padding:'8px 16px', background:'#FDE8E8', borderRadius:10, marginBottom:8 }}>
            {resetError}
          </div>
        )}
        <div style={S.sectionCard}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px' }}>
            <span style={{ fontSize:13, fontWeight:500, color:'#9B9B9B', fontFamily:'DM Sans, sans-serif' }}>Start over</span>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                style={{ fontSize:12, fontWeight:700, color:'#D62828', background:'#FDE8E8', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                Reset Mitzy
              </button>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setConfirmReset(false); setResetError(null); }} style={{ fontSize:12, fontWeight:600, color:'#4A6256', background:'#F0EDE4', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
                  cancel
                </button>
                <button
                  disabled={resetting}
                  onClick={async () => {
                    setResetting(true);
                    setResetError(null);
                    const result = await onReset();
                    if (result?.error) { setResetError(result.error); setResetting(false); setConfirmReset(false); }
                  }}
                  style={{ fontSize:12, fontWeight:700, color:'#fff', background: resetting ? '#9B9B9B' : '#D62828', border:'none', borderRadius:20, padding:'5px 12px', cursor: resetting ? 'default' : 'pointer', fontFamily:'DM Sans, sans-serif' }}
                >
                  {resetting ? 'resetting…' : 'yes, reset'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
