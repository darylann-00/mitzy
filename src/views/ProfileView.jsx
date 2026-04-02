import { useState } from "react";
import { AppHeader } from "./HomeView";
import { HouseIcon, CarIcon, PersonIcon, PetIcon } from "../components/CategoryIcons";

// ─── Section card ──────────────────────────────────────────────────────────────
function ProfileSection({ icon, iconBg, title, rows, onEdit }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EAE4DA', marginBottom:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid #EAE4DA' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {icon}
          </div>
          <span style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'#1C2B22' }}>
            {title}
          </span>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{ fontSize:11, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'3px 10px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
          >
            Edit
          </button>
        )}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom: i < rows.length - 1 ? '1px solid #F5F0E8' : 'none' }}
        >
          <span style={{ fontSize:12, color:'#4A6256', fontWeight:500, fontFamily:'DM Sans, sans-serif' }}>{row.label}</span>
          <span style={{ fontSize:13, fontWeight:700, color: row.muted ? '#9B9B9B' : '#1C2B22', fontFamily:'DM Sans, sans-serif' }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Edit card shell ───────────────────────────────────────────────────────────
function EditCard({ icon, iconBg, title, onSave, onCancel, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EAE4DA', marginBottom:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 16px', borderBottom:'1px solid #EAE4DA' }}>
        <div style={{ width:28, height:28, borderRadius:8, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {icon}
        </div>
        <span style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'#1C2B22', flex:1 }}>
          {title}
        </span>
      </div>
      <div style={{ padding:'14px 16px' }}>
        {children}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button onClick={onSave} style={{ flex:1, fontSize:13, fontWeight:700, color:'#fff', background:'#1A5C3A', border:'none', borderRadius:20, padding:'8px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
            Save
          </button>
          <button onClick={onCancel} style={{ fontSize:13, fontWeight:600, color:'#4A6256', background:'#F0EDE4', border:'none', borderRadius:20, padding:'8px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Field styles ──────────────────────────────────────────────────────────────
const fieldLabel = { fontSize:11, fontWeight:600, color:'#4A6256', fontFamily:'DM Sans, sans-serif', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 };
const fieldInput = { width:'100%', boxSizing:'border-box', fontSize:14, fontFamily:'DM Sans, sans-serif', border:'1px solid #D4CFC6', borderRadius:10, padding:'8px 11px', marginBottom:12, color:'#1C2B22', background:'#FDFAF2', outline:'none' };
const toggleRow = { display:'flex', gap:8, marginBottom:12 };
function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ flex:1, fontSize:13, fontWeight:700, border:'none', borderRadius:10, padding:'8px 0', cursor:'pointer', fontFamily:'DM Sans, sans-serif', background: active ? '#1A5C3A' : '#F0EDE4', color: active ? '#fff' : '#4A6256' }}>
      {children}
    </button>
  );
}

// ─── Saved providers heart+star icon ──────────────────────────────────────────
function ProvidersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 14 L3 8 Q1 5 4 3 Q6.5 2 9 6 Q11.5 2 14 3 Q17 5 15 8 Z" fill="#D62828" />
      <polygon points="9,3 10,6.5 14,6.5 11,8.5 12,12 9,10 6,12 7,8.5 4,6.5 8,6.5" fill="#F4C430" />
    </svg>
  );
}

export function ProfileView({ profile, providerHistory, onReset, onUpdateProfile, user, onSignOut }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [editSection,  setEditSection]  = useState(null); // 'home' | 'car' | 'kids' | 'pets' | 'health'

  // ── Home edit state ──
  const [editHasHome, setEditHasHome] = useState(null);
  const [editZip,     setEditZip]     = useState('');

  // ── Car edit state ──
  const [editCars, setEditCars] = useState('');

  // ── Kids edit state ──
  const [editKids, setEditKids] = useState([]);

  // ── Pets edit state ──
  const [editPets, setEditPets] = useState([]);

  // ── Health edit state ──
  const [editAge,       setEditAge]       = useState('');
  const [editInsurance, setEditInsurance] = useState('');

  const openEdit = (section) => {
    if (section === 'home') {
      setEditHasHome(profile.hasHome);
      setEditZip(profile.zip || '');
    } else if (section === 'car') {
      const label = profile.cars?.length ? profile.cars.join(', ') : (profile.car || '');
      setEditCars(label);
    } else if (section === 'kids') {
      setEditKids((profile.kids || []).map(k => ({ ...k })));
    } else if (section === 'pets') {
      setEditPets((profile.pets || []).map(p => ({ ...p })));
    } else if (section === 'health') {
      setEditAge(profile.age ? String(profile.age) : '');
      setEditInsurance(profile.insurance || '');
    }
    setEditSection(section);
  };

  const cancelEdit = () => setEditSection(null);

  const saveHome = () => {
    onUpdateProfile({ ...profile, hasHome: editHasHome, zip: editZip.trim() || null });
    setEditSection(null);
  };

  const saveCar = () => {
    const cars = editCars.split(',').map(s => s.trim()).filter(Boolean);
    onUpdateProfile({ ...profile, cars, car: cars[0] || null });
    setEditSection(null);
  };

  const saveKids = () => {
    onUpdateProfile({ ...profile, kids: editKids.filter(k => k.name.trim()) });
    setEditSection(null);
  };

  const savePets = () => {
    onUpdateProfile({ ...profile, pets: editPets.filter(p => p.name.trim()) });
    setEditSection(null);
  };

  const saveHealth = () => {
    onUpdateProfile({ ...profile, age: editAge.trim() || null, insurance: editInsurance.trim() || null });
    setEditSection(null);
  };

  // ── Display data ──
  const homeRows = [
    profile.hasHome !== null && { label: 'Ownership', value: profile.hasHome ? 'Owner' : 'Renter' },
    profile.zip               && { label: 'Zip code',  value: profile.zip  },
  ].filter(Boolean);

  const vehicleLabel = profile.cars?.length ? profile.cars.join(', ') : (profile.car || null);
  const carRows = [
    vehicleLabel && { label: profile.cars?.length > 1 ? 'Vehicles' : 'Vehicle', value: vehicleLabel },
  ].filter(Boolean);

  const healthRows = [
    profile.age       && { label: 'Age',       value: profile.age },
    profile.insurance && { label: 'Insurance', value: profile.insurance },
    !profile.age && !profile.insurance && { label: 'No info yet', value: '', muted: true },
  ].filter(Boolean);

  const allProviders = Object.entries(providerHistory || {}).map(([taskId, p]) => ({ taskId, ...p }));

  return (
    <div style={{ background:'#FDFAF2' }}>
      <AppHeader rightContent={<>Your<br />household</>} />

      <div style={{ padding:'20px 18px 100px', maxWidth:680, margin:'0 auto' }}>

        {/* Home */}
        {(profile.hasHome !== null || profile.zip) && (
          editSection === 'home' ? (
            <EditCard
              icon={<HouseIcon color="#1A5C3A" bg="#E8F5EE" size={16} />}
              iconBg="#E8F5EE"
              title="Home"
              onSave={saveHome}
              onCancel={cancelEdit}
            >
              <div style={fieldLabel}>Ownership</div>
              <div style={toggleRow}>
                <ToggleBtn active={editHasHome === true}  onClick={() => setEditHasHome(true)}>Owner</ToggleBtn>
                <ToggleBtn active={editHasHome === false} onClick={() => setEditHasHome(false)}>Renter</ToggleBtn>
              </div>
              <div style={fieldLabel}>Zip code</div>
              <input style={fieldInput} type="text" inputMode="numeric" value={editZip} onChange={e => setEditZip(e.target.value)} placeholder="e.g. 90210" />
            </EditCard>
          ) : (
            <ProfileSection
              icon={<HouseIcon color="#1A5C3A" bg="#E8F5EE" size={16} />}
              iconBg="#E8F5EE"
              title="Home"
              rows={homeRows}
              onEdit={() => openEdit('home')}
            />
          )
        )}

        {/* Car */}
        {profile.hasCar && (
          editSection === 'car' ? (
            <EditCard
              icon={<CarIcon color="#F77F00" bg="#FFF3E0" size={16} />}
              iconBg="#FFF3E0"
              title="Car"
              onSave={saveCar}
              onCancel={cancelEdit}
            >
              <div style={fieldLabel}>Vehicle(s) — separate multiple with commas</div>
              <input
                style={{ ...fieldInput, marginBottom:0 }}
                type="text"
                value={editCars}
                onChange={e => setEditCars(e.target.value)}
                placeholder="e.g. 2019 Honda Civic, 2021 Tesla Model 3"
                autoFocus
              />
            </EditCard>
          ) : (
            <ProfileSection
              icon={<CarIcon color="#F77F00" bg="#FFF3E0" size={16} />}
              iconBg="#FFF3E0"
              title="Car"
              rows={carRows}
              onEdit={() => openEdit('car')}
            />
          )
        )}

        {/* Kids */}
        {profile.hasKids && profile.kids?.length > 0 && (
          editSection === 'kids' ? (
            <EditCard
              icon={<PersonIcon color="#06A77D" bg="#E8F5EE" size={16} />}
              iconBg="#E8F5EE"
              title="Kids"
              onSave={saveKids}
              onCancel={cancelEdit}
            >
              {editKids.map((kid, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
                  <input
                    style={{ ...fieldInput, flex:2, marginBottom:0 }}
                    type="text"
                    value={kid.name}
                    onChange={e => { const k=[...editKids]; k[i]={...k[i],name:e.target.value}; setEditKids(k); }}
                    placeholder="Name"
                  />
                  <input
                    style={{ ...fieldInput, width:64, marginBottom:0 }}
                    type="number"
                    value={kid.age}
                    onChange={e => { const k=[...editKids]; k[i]={...k[i],age:e.target.value}; setEditKids(k); }}
                    placeholder="Age"
                    min="0" max="25"
                  />
                  <button onClick={() => setEditKids(editKids.filter((_,j)=>j!==i))} style={{ fontSize:18, color:'#D62828', background:'none', border:'none', cursor:'pointer', padding:'0 4px', lineHeight:1 }}>×</button>
                </div>
              ))}
              <button
                onClick={() => setEditKids([...editKids, { name:'', age:'' }])}
                style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                + Add child
              </button>
            </EditCard>
          ) : (
            <ProfileSection
              icon={<PersonIcon color="#06A77D" bg="#E8F5EE" size={16} />}
              iconBg="#E8F5EE"
              title="Kids"
              rows={profile.kids.map(k => ({ label: k.name, value: `age ${k.age}` }))}
              onEdit={() => openEdit('kids')}
            />
          )
        )}

        {/* Pets */}
        {profile.hasPets && profile.pets?.length > 0 && (
          editSection === 'pets' ? (
            <EditCard
              icon={<PetIcon color="#F4C430" bg="#FFFBEE" size={16} />}
              iconBg="#FFFBEE"
              title="Pets"
              onSave={savePets}
              onCancel={cancelEdit}
            >
              {editPets.map((pet, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
                  <input
                    style={{ ...fieldInput, flex:2, marginBottom:0 }}
                    type="text"
                    value={pet.name}
                    onChange={e => { const p=[...editPets]; p[i]={...p[i],name:e.target.value}; setEditPets(p); }}
                    placeholder="Name"
                  />
                  <input
                    style={{ ...fieldInput, flex:1, marginBottom:0 }}
                    type="text"
                    value={pet.type || ''}
                    onChange={e => { const p=[...editPets]; p[i]={...p[i],type:e.target.value}; setEditPets(p); }}
                    placeholder="Type"
                  />
                  <button onClick={() => setEditPets(editPets.filter((_,j)=>j!==i))} style={{ fontSize:18, color:'#D62828', background:'none', border:'none', cursor:'pointer', padding:'0 4px', lineHeight:1 }}>×</button>
                </div>
              ))}
              <button
                onClick={() => setEditPets([...editPets, { name:'', type:'' }])}
                style={{ fontSize:12, fontWeight:700, color:'#1A5C3A', background:'#E8F5EE', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                + Add pet
              </button>
            </EditCard>
          ) : (
            <ProfileSection
              icon={<PetIcon color="#F4C430" bg="#FFFBEE" size={16} />}
              iconBg="#FFFBEE"
              title="Pets"
              rows={profile.pets.map(a => ({ label: a.name, value: a.type || 'pet' }))}
              onEdit={() => openEdit('pets')}
            />
          )
        )}

        {/* Saved providers */}
        {allProviders.length > 0 && (
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EAE4DA', marginBottom:10, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 16px', borderBottom:'1px solid #EAE4DA' }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'#FDE8E8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <ProvidersIcon size={16} />
              </div>
              <span style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'#1C2B22' }}>
                Saved providers
              </span>
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

        {/* Health (age + insurance) */}
        {editSection === 'health' ? (
          <EditCard
            icon={<PersonIcon color="#4A6256" bg="#F0EDE4" size={16} />}
            iconBg="#F0EDE4"
            title="Health"
            onSave={saveHealth}
            onCancel={cancelEdit}
          >
            <div style={fieldLabel}>Age</div>
            <input style={fieldInput} type="number" value={editAge} onChange={e => setEditAge(e.target.value)} placeholder="e.g. 35" min="0" max="120" autoFocus />
            <div style={fieldLabel}>Insurance provider</div>
            <input style={{ ...fieldInput, marginBottom:0 }} type="text" value={editInsurance} onChange={e => setEditInsurance(e.target.value)} placeholder="e.g. Blue Cross, Aetna..." />
          </EditCard>
        ) : (
          <ProfileSection
            icon={<PersonIcon color="#4A6256" bg="#F0EDE4" size={16} />}
            iconBg="#F0EDE4"
            title="Health"
            rows={healthRows}
            onEdit={() => openEdit('health')}
          />
        )}

        {/* Account */}
        {user && (
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EAE4DA', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid #F5F0E8' }}>
              <span style={{ fontSize:12, color:'#4A6256', fontWeight:500, fontFamily:'DM Sans, sans-serif' }}>Signed in as</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>{user.email}</span>
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

        {/* Reset */}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EAE4DA', marginBottom:10 }}>
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
                <button onClick={() => setConfirmReset(false)} style={{ fontSize:12, fontWeight:600, color:'#4A6256', background:'#F0EDE4', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
                  cancel
                </button>
                <button onClick={onReset} style={{ fontSize:12, fontWeight:700, color:'#fff', background:'#D62828', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
                  yes, reset
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
