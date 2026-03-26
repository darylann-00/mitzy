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

// ─── Saved providers heart+star icon ──────────────────────────────────────────
function ProvidersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 14 L3 8 Q1 5 4 3 Q6.5 2 9 6 Q11.5 2 14 3 Q17 5 15 8 Z" fill="#D62828" />
      <polygon points="9,3 10,6.5 14,6.5 11,8.5 12,12 9,10 6,12 7,8.5 4,6.5 8,6.5" fill="#F4C430" />
    </svg>
  );
}

export function ProfileView({ profile, providerHistory, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);

  // Home section rows
  const homeRows = [
    profile.hasHome !== null && { label: 'Ownership', value: profile.hasHome ? 'Owner' : 'Renter' },
    profile.zip               && { label: 'Zip code',  value: profile.zip  },
  ].filter(Boolean);

  // Car section rows
  const carRows = [
    { label: 'Vehicle', value: profile.car || 'On file' },
    profile.insurance && { label: 'Insurance', value: profile.insurance },
  ].filter(Boolean);

  // All saved providers (across all tasks)
  const allProviders = Object.entries(providerHistory || {}).map(([taskId, p]) => ({
    taskId, ...p,
  }));

  return (
    <div style={{ background:'#FDFAF2', minHeight:'100vh' }}>
      <AppHeader rightContent={<>Your<br />household</>} />

      <div style={{ padding:'20px 18px 24px', maxWidth:680, margin:'0 auto' }}>

        {/* Home */}
        {(profile.hasHome !== null || profile.zip) && (
          <ProfileSection
            icon={<HouseIcon color="#1A5C3A" bg="#E8F5EE" size={16} />}
            iconBg="#E8F5EE"
            title="Home"
            rows={homeRows}
          />
        )}

        {/* Car */}
        {profile.hasCar && (
          <ProfileSection
            icon={<CarIcon color="#F77F00" bg="#FFF3E0" size={16} />}
            iconBg="#FFF3E0"
            title="Car"
            rows={carRows}
          />
        )}

        {/* Kids */}
        {profile.hasKids && profile.kids?.length > 0 && (
          <ProfileSection
            icon={<PersonIcon color="#06A77D" bg="#E8F5EE" size={16} />}
            iconBg="#E8F5EE"
            title="Kids"
            rows={profile.kids.map(k => ({ label: k.name, value: `age ${k.age}` }))}
          />
        )}

        {/* Pets */}
        {profile.hasPets && profile.pets?.length > 0 && (
          <ProfileSection
            icon={<PetIcon color="#F4C430" bg="#FFFBEE" size={16} />}
            iconBg="#FFFBEE"
            title="Pets"
            rows={profile.pets.map(a => ({ label: a.name, value: a.type || 'pet' }))}
          />
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

        {/* Age */}
        {profile.age && (
          <ProfileSection
            icon={<PersonIcon color="#4A6256" bg="#F0EDE4" size={16} />}
            iconBg="#F0EDE4"
            title="Health"
            rows={[{ label: 'Age', value: profile.age }]}
          />
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
