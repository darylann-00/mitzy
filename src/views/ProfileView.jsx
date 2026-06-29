import { useState, useRef, useEffect } from "react";
import { AppHeader } from "./HomeView";
import { HouseIcon, CarIcon, PersonIcon, PetIcon, LIFE_EVENT_ICON_CONFIG } from "../components/CategoryIcons";
import { Sheet } from "../components/Sheet";
import { useProfileContext } from "../contexts/ProfileContext";
import { useTaskContext }    from "../contexts/TaskContext";
import { useCalendarContext } from "../contexts/CalendarContext";
import { C } from "../data/constants";
import { LIFE_EVENT_DEFS } from "../data/lifeEvents";
import { INSURANCE_PROVIDERS } from "../data/insuranceProviders";
import { PROVIDER_TYPES } from "../data/providerTypes";
import { ProviderNameSearch } from "../components/ProviderNameSearch";

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

// ─── Heart icon (for "Love" provider vote) ──────────────────────────────────────
function HeartIcon({ size = 13, color = '#1B4DB3' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink:0 }}>
      <path d="M9 15.5 L2.8 9.6 Q0.5 7.2 2.6 4.7 Q4.8 2.3 9 6.3 Q13.2 2.3 15.4 4.7 Q17.5 7.2 15.2 9.6 Z" fill={color} />
    </svg>
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

// ─── Insurance picker ──────────────────────────────────────────────────────────
function InsurancePicker({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState(null);
  const anchorRef = useRef(null);

  useEffect(() => { if (!open) setQuery(value || ''); }, [value, open]);

  const filtered = query.trim()
    ? INSURANCE_PROVIDERS.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : INSURANCE_PROVIDERS;

  const select = (label) => { onChange(label); setQuery(label); setOpen(false); };
  const clear  = () => { onChange(''); setQuery(''); setOpen(false); };

  const openDropdown = () => {
    if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    setOpen(true);
  };

  return (
    <div>
      <div ref={anchorRef} style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid #D4CFC6', borderRadius:10, padding:'7px 11px', background:'#FDFAF2' }}>
        <input
          style={{ flex:1, fontSize:14, fontFamily:'DM Sans, sans-serif', border:'none', outline:'none', background:'transparent', color:'#1C2B22' }}
          placeholder="Search providers…"
          value={query}
          onFocus={openDropdown}
          onChange={e => { setQuery(e.target.value); openDropdown(); }}
        />
        {value && !open && (
          <button onClick={clear} style={{ fontSize:16, lineHeight:1, border:'none', background:'none', cursor:'pointer', color:'#9B9B9B', padding:'0 2px' }}>×</button>
        )}
      </div>
      {open && rect && (filtered.length > 0 || query.trim()) && (
        <div style={{ position:'fixed', zIndex:1000, top: rect.bottom + 4, left: rect.left, width: rect.width, background:'#fff', border:'1px solid #D4CFC6', borderRadius:10, maxHeight:200, overflowY:'auto', boxShadow:'0 4px 12px rgba(0,0,0,0.12)' }}>
          {filtered.map(({ label }) => (
            <button
              key={label}
              onMouseDown={e => { e.preventDefault(); select(label); }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 14px', fontSize:13, fontFamily:'DM Sans, sans-serif', border:'none', borderBottom:'1px solid #F5F0E8', cursor:'pointer', background: label === value ? '#E8F5EE' : '#fff', color: label === value ? '#1A5C3A' : '#1C2B22', fontWeight: label === value ? 700 : 400 }}
            >
              {label}
            </button>
          ))}
          {query.trim() && !INSURANCE_PROVIDERS.some(p => p.label.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              onMouseDown={e => { e.preventDefault(); select(query.trim()); }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 14px', fontSize:13, fontFamily:'DM Sans, sans-serif', border:'none', cursor:'pointer', background:'#F0EDE4', color:'#1A5C3A', fontWeight:700 }}
            >
              Add "{query.trim()}"
            </button>
          )}
        </div>
      )}
      {open && <div style={{ position:'fixed', inset:0, zIndex:999 }} onMouseDown={() => setOpen(false)} />}
    </div>
  );
}

// ─── Provider type picker (searchable picklist, with custom add) ───────────────
function ProviderTypePicker({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState(null);
  const anchorRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { if (!open) setQuery(value || ''); }, [value, open]);

  const filtered = query.trim()
    ? PROVIDER_TYPES.filter(t => t.toLowerCase().includes(query.toLowerCase()))
    : PROVIDER_TYPES;

  const select = (label) => {
    onChange(label);
    setQuery(label);
    setOpen(false);
    inputRef.current?.blur();
  };

  const closeDropdown = () => { setOpen(false); setQuery(value || ''); };

  const openDropdown = () => {
    if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const updateRect = () => { if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect()); };
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open]);

  return (
    <div>
      <div ref={anchorRef} style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid #D4CFC6', borderRadius:10, padding:'7px 11px', background:'#FDFAF2' }}>
        <input
          ref={inputRef}
          style={{ flex:1, fontSize:14, fontFamily:'DM Sans, sans-serif', border:'none', outline:'none', background:'transparent', color:'#1C2B22' }}
          placeholder="e.g. plumber, dentist, vet"
          value={query}
          onFocus={e => { e.target.select(); openDropdown(); }}
          onChange={e => { setQuery(e.target.value); openDropdown(); }}
        />
        {value && !open && (
          <button onClick={() => { onChange(''); setQuery(''); }} style={{ fontSize:16, lineHeight:1, border:'none', background:'none', cursor:'pointer', color:'#9B9B9B', padding:'0 2px' }}>×</button>
        )}
      </div>
      {open && rect && (filtered.length > 0 || query.trim()) && (
        <div style={{ position:'fixed', zIndex:1000, top: rect.bottom + 4, left: rect.left, width: rect.width, background:'#fff', border:'1px solid #D4CFC6', borderRadius:10, maxHeight:200, overflowY:'auto', boxShadow:'0 4px 12px rgba(0,0,0,0.12)' }}>
          {filtered.map(label => (
            <button
              key={label}
              onMouseDown={e => { e.preventDefault(); select(label); }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 14px', fontSize:13, fontFamily:'DM Sans, sans-serif', border:'none', borderBottom:'1px solid #F5F0E8', cursor:'pointer', background: label === value ? '#E8F5EE' : '#fff', color: label === value ? '#1A5C3A' : '#1C2B22', fontWeight: label === value ? 700 : 400 }}
            >
              {label}
            </button>
          ))}
          {query.trim() && !PROVIDER_TYPES.some(t => t.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              onMouseDown={e => { e.preventDefault(); select(query.trim()); }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 14px', fontSize:13, fontFamily:'DM Sans, sans-serif', border:'none', cursor:'pointer', background:'#F0EDE4', color:'#1A5C3A', fontWeight:700 }}
            >
              Add "{query.trim()}"
            </button>
          )}
        </div>
      )}
      {open && <div style={{ position:'fixed', inset:0, zIndex:999 }} onMouseDown={closeDropdown} />}
    </div>
  );
}

// ─── Life events icon ──────────────────────────────────────────────────────────
function LifeEventsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" fill="#F4C430" />
      <circle cx="9" cy="7.5" r="2" fill="#fff" />
      <path d="M5 14 Q9 11 13 14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────
export function ProfileView({ onReset, onPreviewHazardTasks, onConfirmHazardTasks, user, onSignOut, onStartLifeEvent }) {
  const { profile, providerHistory, updateProfile: onUpdateProfile, lifeEvents, saveProvider, updateProvider, removeProvider } = useProfileContext();
  const { taskState } = useTaskContext();
  const { calGranted, connectCalendar } = useCalendarContext();
  const [confirmReset,   setConfirmReset]   = useState(false);
  const [resetting,      setResetting]      = useState(false);
  const [resetError,     setResetError]     = useState(null);
  const [isEditing,      setIsEditing]      = useState(false);
  const [addingHazards,  setAddingHazards]  = useState(false);
  const [hazardPreview,  setHazardPreview]  = useState(null); // { hazards, tasks } | null
  const [pendingRemove,  setPendingRemove]  = useState(null); // { type: 'car'|'kid'|'pet', index: number }
  const [confirmDismissEvent, setConfirmDismissEvent] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null); // provider id being edited
  const [editProviderVote, setEditProviderVote] = useState(null);
  const [editProviderNotes, setEditProviderNotes] = useState('');
  const [pendingRemoveProvider, setPendingRemoveProvider] = useState(null); // provider id
  const [addingProvider, setAddingProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderFor, setNewProviderFor] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');
  const [newProviderNotes, setNewProviderNotes] = useState('');
  const [newProviderVote, setNewProviderVote] = useState(null);

  // Edit state — all sections at once
  const [editHasHome,   setEditHasHome]   = useState(null);
  const [editZip,       setEditZip]       = useState('');
  const [editCars,      setEditCars]      = useState([]);
  const [carPicker,     setCarPicker]     = useState(null); // null | { year, make, model }
  const [editKids,      setEditKids]      = useState([]);
  const [editPets,      setEditPets]      = useState([]);
  const [editName,      setEditName]      = useState('');
  const [editBirthYear, setEditBirthYear] = useState('');
  const [editInsurance, setEditInsurance] = useState('');
  const [editGender,    setEditGender]    = useState(null);

  const startEditing = () => {
    setEditHasHome(profile.hasHome);
    setEditZip(profile.zip || '');
    setEditCars(profile.cars?.length ? [...profile.cars] : (profile.car ? [profile.car] : []));
    setCarPicker(null);
    setEditKids((profile.kids || []).map(k => ({ ...k })));
    setEditPets((profile.pets || []).map(p => ({ ...p })));
    setEditName(profile.name || '');
    setEditBirthYear(profile.birthYear ? String(profile.birthYear) : '');
    setEditInsurance(profile.insurance || '');
    setEditGender(profile.gender || null);
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
      name:      editName.trim() || null,
      birthYear: editBirthYear.trim() || null,
      insurance: editInsurance.trim() || null,
      gender:    editGender || null,
    });
    setIsEditing(false);
  };

  const commitCar = (picker) => {
    const label = `${picker.year} ${picker.make} ${picker.model}`;
    setEditCars(prev => [...prev, label]);
    setCarPicker(null);
  };

  const allProviders = Object.entries(providerHistory || {}).flatMap(([taskId, list]) => (list || []).map(p => ({ taskId, ...p })));
  const vehicleLabel = profile.cars?.length ? profile.cars.join(', ') : (profile.car || null);

  const HAZARD_LABELS = { earthquake:'Earthquake', wildfire:'Wildfire', hurricane:'Hurricane', tornado:'Tornado', winter:'Winter Storm', flood:'Flooding' };

  return (
    <div style={{ background:'#FDFAF2' }}>
      <AppHeader rightContent={<>Your<br />household</>} />

      {hazardPreview && (
        <Sheet title="Disaster prep tasks" onClose={() => setHazardPreview(null)}>
          <p style={{ fontSize:13, color:C.muted, marginTop:0, marginBottom:12 }}>
            Based on your zip, we found risk for: <strong style={{ color:C.ink }}>{hazardPreview.hazards.map(h => HAZARD_LABELS[h] || h).join(', ')}</strong>
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            {hazardPreview.tasks.map(t => (
              <div key={t.id} style={{ background:C.light, borderRadius:12, padding:'10px 14px' }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.ink, fontFamily:'DM Sans, sans-serif' }}>{t.label}</div>
                {t.note && <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{t.note}</div>}
              </div>
            ))}
          </div>
          <button
            className="pb"
            onClick={() => { onConfirmHazardTasks(hazardPreview.hazards); setHazardPreview(null); }}
            style={{ width:'100%', padding:'13px', fontSize:15, fontWeight:700, background:C.green, color:'#fff', border:'none', borderRadius:14, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
          >
            Add {hazardPreview.tasks.length} tasks
          </button>
        </Sheet>
      )}

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
                      onClick={async () => {
                        setAddingHazards(true);
                        const preview = await onPreviewHazardTasks();
                        setAddingHazards(false);
                        if (preview) setHazardPreview(preview);
                      }}
                      style={{ fontSize:12, fontWeight:700, color: addingHazards ? '#9B9B9B' : '#1A5C3A', background:'none', border:'none', cursor: addingHazards ? 'default' : 'pointer', fontFamily:'DM Sans, sans-serif', padding:0 }}
                    >
                      {addingHazards ? 'Checking…' : 'See tasks'}
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
                    <div style={{ marginTop:8 }}>
                      <div style={S.fieldLabel}>Insurance provider</div>
                      <InsurancePicker value={kid.insurance || ''} onChange={v => { const k=[...editKids]; k[i]={...k[i],insurance:v}; setEditKids(k); }} />
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
                  onClick={() => setEditKids([...editKids, { name:'', birthYear:'', insurance:'' }])}
                  style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                >
                  + Add child
                </button>
              </div>
            ) : (
              profile.kids?.length > 0
                ? profile.kids.map((k, i) => {
                    const portalUrl = INSURANCE_PROVIDERS.find(p => p.label === k.insurance)?.portal;
                    return (
                      <div key={i}>
                        <Row label={k.name} value={k.birthYear ? `born ${k.birthYear}` : null} />
                        <div style={S.row(i === profile.kids.length - 1)}>
                          <span style={S.rowLabel}>Insurance</span>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={S.rowValue(!k.insurance)}>{k.insurance || 'Not set'}</span>
                            {portalUrl && (
                              <a href={portalUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, fontWeight:700, color:C.brand, textDecoration:'none', fontFamily:'DM Sans, sans-serif' }}>Portal ↗</a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
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

        {/* ── Health: Self ── */}
        <div style={S.sectionCard}>
          <SectionHeader icon={<PersonIcon color="#4A6256" bg="#F0EDE4" size={16} />} iconBg="#F0EDE4" title="Self" />
          {isEditing ? (
            <>
              <EditField label="Name">
                <input style={S.input} type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="First name" />
              </EditField>
              <EditField label="Birth year">
                <input style={S.input} type="number" value={editBirthYear} onChange={e => setEditBirthYear(e.target.value)} placeholder="e.g. 1988" min="1900" max={new Date().getFullYear() - 18} />
              </EditField>
              <EditField label="Gender">
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[['woman','Woman'],['man','Man'],['nonbinary','Non-binary'],['prefer-not','Prefer not to say']].map(([key, label]) => (
                    <button key={key} onClick={() => setEditGender(key)} style={{ fontSize:12, fontWeight:700, border:'none', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', background: editGender === key ? '#1A5C3A' : '#F0EDE4', color: editGender === key ? '#fff' : '#4A6256' }}>{label}</button>
                  ))}
                </div>
              </EditField>
              <EditField label="Insurance provider" last>
                <InsurancePicker value={editInsurance} onChange={setEditInsurance} />
              </EditField>
            </>
          ) : (
            <>
              <Row label="Name" value={profile.name} />
              <Row label="Birth year" value={profile.birthYear ? String(profile.birthYear) : null} />
              {profile.gender && profile.gender !== 'prefer-not' && (
                <Row label="Gender" value={{ woman:'Woman', man:'Man', nonbinary:'Non-binary' }[profile.gender] ?? null} />
              )}
              {(() => {
                const portalUrl = INSURANCE_PROVIDERS.find(p => p.label === profile.insurance)?.portal;
                return (
                  <div style={S.row(true)}>
                    <span style={S.rowLabel}>Insurance</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={S.rowValue(!profile.insurance)}>{profile.insurance || 'Not set'}</span>
                      {portalUrl && (
                        <a href={portalUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, fontWeight:700, color:C.brand, textDecoration:'none', fontFamily:'DM Sans, sans-serif' }}>Portal ↗</a>
                      )}
                    </div>
                  </div>
                );
              })()}
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
        <div style={S.sectionCard}>
          <div style={S.sectionHeader}>
            <div style={S.iconWrap('#FDE8E8')}><ProvidersIcon size={16} /></div>
            <span style={S.sectionTitle}>Saved providers</span>
          </div>
          {allProviders.length === 0 && !addingProvider && (
            <div style={{ padding:'14px 16px', fontSize:13, color:'#9B9B9B', fontFamily:'DM Sans, sans-serif' }}>
              No providers saved yet
            </div>
          )}
          {allProviders.map((p, i) => (
            <div key={p.id} style={{ borderBottom: i < allProviders.length - 1 || addingProvider ? '1px solid #F5F0E8' : 'none' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'11px 16px', cursor:'pointer' }}
                onClick={() => {
                  if (editingProvider === p.id) {
                    setEditingProvider(null);
                  } else {
                    setEditingProvider(p.id);
                    setEditProviderVote(p.vote || null);
                    setEditProviderNotes(p.notes || '');
                    setPendingRemoveProvider(null);
                  }
                }}
              >
                <div style={{ flex:1 }}>
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
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop:6, flexShrink:0, transform: editingProvider === p.id ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}>
                  <polyline points="2,4 6,8 10,4" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {editingProvider === p.id && (
                <div style={{ padding:'0 16px 14px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1C2B22', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>How was it?</div>
                  <div style={{ display:'flex', gap:7, marginBottom:8 }}>
                    <button
                      onClick={() => setEditProviderVote(editProviderVote === 'good' ? null : 'good')}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, borderRadius:9, padding:'8px 0', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif', border:'1.5px solid #C7D9F5', background: editProviderVote==='good' ? '#1B4DB3' : '#EAF1FD', color: editProviderVote==='good' ? '#EAF1FD' : '#1B4DB3' }}
                    >
                      <HeartIcon color={editProviderVote==='good' ? '#EAF1FD' : '#1B4DB3'} />
                      Good
                    </button>
                    <button
                      onClick={() => setEditProviderVote(editProviderVote === 'bad' ? null : 'bad')}
                      style={{ flex:1, borderRadius:9, padding:'8px 0', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif', border:'1.5px solid #F5C4C4', background: editProviderVote==='bad' ? '#D62828' : '#FDE8E8', color: editProviderVote==='bad' ? '#fff' : '#D62828' }}
                    >
                      Not good
                    </button>
                  </div>
                  <input
                    placeholder="Any notes? (optional)"
                    value={editProviderNotes}
                    onChange={e => setEditProviderNotes(e.target.value)}
                    style={{ ...S.input, marginBottom:10 }}
                  />
                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      onClick={() => {
                        updateProvider(p.taskId, p.id, { vote: editProviderVote, notes: editProviderNotes });
                        setEditingProvider(null);
                      }}
                      style={{ flex:1, fontSize:13, fontWeight:700, color:'#fff', background:'#1A5C3A', border:'none', borderRadius:10, padding:'10px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                    >
                      Save
                    </button>
                    {pendingRemoveProvider === p.id ? (
                      <>
                        <button
                          onClick={() => {
                            removeProvider(p.taskId, p.id);
                            setEditingProvider(null);
                            setPendingRemoveProvider(null);
                          }}
                          style={{ fontSize:12, fontWeight:700, color:'#fff', background:'#D62828', border:'none', borderRadius:10, padding:'10px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                        >
                          Yes, remove
                        </button>
                        <button
                          onClick={() => setPendingRemoveProvider(null)}
                          style={{ fontSize:12, fontWeight:600, color:'#4A6256', background:'#F0EDE4', border:'none', borderRadius:10, padding:'10px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setPendingRemoveProvider(p.id)}
                        style={{ fontSize:12, fontWeight:700, color:'#D62828', background:'#FDE8E8', border:'none', borderRadius:10, padding:'10px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add provider form */}
          {addingProvider ? (
            <div style={{ padding:'12px 16px', borderTop: allProviders.length > 0 ? '1px solid #F5F0E8' : 'none' }}>
              <EditField label="Provider name">
                <ProviderNameSearch
                  value={newProviderName}
                  onChange={setNewProviderName}
                  zip={profile.zip}
                  onSelectPlace={place => { if (place.phone && !newProviderPhone) setNewProviderPhone(place.phone); }}
                />
              </EditField>
              <EditField label="What for">
                <ProviderTypePicker value={newProviderFor} onChange={setNewProviderFor} />
              </EditField>
              <EditField label="Phone (optional)">
                <input style={S.input} type="tel" value={newProviderPhone} onChange={e => setNewProviderPhone(e.target.value)} placeholder="(555) 123-4567" />
              </EditField>
              <EditField label="Notes (optional)">
                <input style={S.input} type="text" value={newProviderNotes} onChange={e => setNewProviderNotes(e.target.value)} placeholder="Great bedside manner, fast service…" />
              </EditField>
              <div style={{ padding:'10px 16px 0' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#1C2B22', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>How was it?</div>
                <div style={{ display:'flex', gap:7, marginBottom:12 }}>
                  <button
                    onClick={() => setNewProviderVote(newProviderVote === 'good' ? null : 'good')}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, borderRadius:9, padding:'8px 0', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif', border:'1.5px solid #C7D9F5', background: newProviderVote==='good' ? '#1B4DB3' : '#EAF1FD', color: newProviderVote==='good' ? '#EAF1FD' : '#1B4DB3' }}
                  >
                    <HeartIcon color={newProviderVote==='good' ? '#EAF1FD' : '#1B4DB3'} />
                    Good
                  </button>
                  <button
                    onClick={() => setNewProviderVote(newProviderVote === 'bad' ? null : 'bad')}
                    style={{ flex:1, borderRadius:9, padding:'8px 0', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif', border:'1.5px solid #F5C4C4', background: newProviderVote==='bad' ? '#D62828' : '#FDE8E8', color: newProviderVote==='bad' ? '#fff' : '#D62828' }}
                  >
                    Not good
                  </button>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, padding:'0 16px 4px' }}>
                <button
                  disabled={!newProviderName.trim() || !newProviderFor.trim()}
                  onClick={() => {
                    const key = newProviderFor.trim().toLowerCase().replace(/\s+/g, '-');
                    saveProvider(key, {
                      name: newProviderName.trim(),
                      phone: newProviderPhone.trim() || null,
                      vote: newProviderVote,
                      notes: newProviderNotes.trim() || '',
                    });
                    setAddingProvider(false);
                    setNewProviderName('');
                    setNewProviderFor('');
                    setNewProviderPhone('');
                    setNewProviderNotes('');
                    setNewProviderVote(null);
                  }}
                  style={{ flex:1, fontSize:13, fontWeight:700, color:'#fff', background: newProviderName.trim() && newProviderFor.trim() ? '#1A5C3A' : '#D0C8C0', border:'none', borderRadius:10, padding:'10px 0', cursor: newProviderName.trim() && newProviderFor.trim() ? 'pointer' : 'default', fontFamily:'DM Sans, sans-serif' }}
                >
                  Save provider
                </button>
                <button
                  onClick={() => {
                    setAddingProvider(false);
                    setNewProviderName('');
                    setNewProviderFor('');
                    setNewProviderPhone('');
                    setNewProviderNotes('');
                    setNewProviderVote(null);
                  }}
                  style={{ fontSize:13, fontWeight:600, color:'#4A6256', background:'#F0EDE4', border:'none', borderRadius:10, padding:'10px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding:'10px 16px' }}>
              <button
                onClick={() => setAddingProvider(true)}
                style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                + Add provider
              </button>
            </div>
          )}
        </div>

        {/* ── Life events ── */}
        {(() => {
          const active = lifeEvents?.activeEvent;
          const def = active ? LIFE_EVENT_DEFS[active.type] : null;
          const eventTasks = lifeEvents?.activeEventTasks ?? [];
          const doneCount = eventTasks.filter(t => taskState[t.id]?.lastDone).length;
          const totalCount = eventTasks.length;

          return (
            <div style={S.sectionCard}>
              <SectionHeader icon={<LifeEventsIcon size={16} />} iconBg="#FFFBEE" title="Life events" />
              {active && def ? (
                <>
                  <div style={{ padding:'13px 16px', borderBottom: '1px solid #F5F0E8' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom: 4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {(() => {
                          const EventIcon = LIFE_EVENT_ICON_CONFIG[def.id];
                          return EventIcon ? <EventIcon size={22} /> : null;
                        })()}
                        <span style={{ fontSize:14, fontWeight:700, color:C.ink, fontFamily:'DM Sans, sans-serif' }}>
                          {def.label}
                        </span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', borderRadius:20, padding:'3px 10px', fontFamily:'DM Sans, sans-serif' }}>
                        {doneCount} of {totalCount} done
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:C.muted, fontFamily:'DM Sans, sans-serif' }}>
                      Find your event tasks at the top of the All tab.
                    </div>
                  </div>
                  <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    {!confirmDismissEvent ? (
                      <>
                        <span style={{ fontSize:12, color:C.muted, fontFamily:'DM Sans, sans-serif' }}>Wrap this up</span>
                        <button
                          onClick={() => setConfirmDismissEvent(true)}
                          style={{ fontSize:12, fontWeight:700, color:'#D62828', background:'#FDE8E8', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                        >
                          Remove event
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize:12, color:'#D62828', fontFamily:'DM Sans, sans-serif', fontWeight:700 }}>
                          Remove event and all its tasks?
                        </span>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => setConfirmDismissEvent(false)} style={{ fontSize:12, fontWeight:600, color:'#4A6256', background:'#F0EDE4', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              try { await lifeEvents.dismissEvent(active.id); setConfirmDismissEvent(false); }
                              catch { setConfirmDismissEvent(false); }
                            }}
                            style={{ fontSize:12, fontWeight:700, color:'#fff', background:'#D62828', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                          >
                            Yes, remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding:'10px 16px' }}>
                  <div style={{ fontSize:12, color:C.muted, fontFamily:'DM Sans, sans-serif', marginBottom: 8 }}>
                    Going through something big? Mitzy can walk you through the admin.
                  </div>
                  {Object.entries(LIFE_EVENT_DEFS).map(([key, eventDef]) => {
                    const EventIcon = LIFE_EVENT_ICON_CONFIG[eventDef.id];
                    return (
                    <button
                      key={key}
                      onClick={() => onStartLifeEvent(key)}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:10,
                        padding:'11px 12px', cursor:'pointer',
                        background:'#fff', border:'1.5px solid #EAE4DA', borderRadius:10,
                        textAlign:'left', fontFamily:'DM Sans, sans-serif',
                      }}
                    >
                      {EventIcon && <EventIcon size={22} />}
                      <span style={{ fontSize:13, fontWeight:700, color:C.ink, flex:1 }}>{eventDef.label}</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <polyline points="4,2 10,7 4,12" stroke="#4A6256" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  );})}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Account ── */}
        {user && (
          <div style={S.sectionCard}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid #F5F0E8' }}>
              <span style={S.rowLabel}>Signed in as</span>
              <span style={S.rowValue(false)}>{user.email}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid #F5F0E8' }}>
              <span style={S.rowLabel}>Google Calendar</span>
              {calGranted ? (
                <span style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', borderRadius:20, padding:'5px 12px', fontFamily:'DM Sans, sans-serif' }}>
                  Connected
                </span>
              ) : (
                <button
                  onClick={connectCalendar}
                  style={{ fontSize:12, fontWeight:700, color:'#4285F4', background:'#EEF2FF', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
                >
                  Connect
                </button>
              )}
            </div>
            <div style={{ padding:'13px 16px', borderBottom:'1px solid #F5F0E8' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={S.rowLabel}>My bandwidth</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[
                  { key: 'low',    label: 'Light' },
                  { key: 'normal', label: 'Normal' },
                  { key: 'high',   label: 'All in' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => onUpdateProfile({ ...profile, capacity: key })}
                    style={{
                      flex:1, padding:'8px 6px', fontSize:12, fontWeight:700, textAlign:'center',
                      borderRadius:10, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
                      border: (profile.capacity || 'normal') === key ? '2px solid #1A5C3A' : '1.5px solid #EAE4DA',
                      background: (profile.capacity || 'normal') === key ? '#E8F5EE' : '#fff',
                      color: (profile.capacity || 'normal') === key ? '#1A5C3A' : '#4A6256',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color:'#9B9B9B', marginTop:6, fontFamily:'DM Sans, sans-serif' }}>
                {(profile.capacity || 'normal') === 'low' ? 'Showing only critical tasks' :
                 (profile.capacity || 'normal') === 'high' ? 'Showing everything you can get ahead on' :
                 'Balanced — a few tasks at a time'}
              </div>
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
