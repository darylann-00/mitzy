import { useState } from "react";

export function ProfileConflictModal({ onResolve }) {
  const [confirmReplace, setConfirmReplace] = useState(false);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,30,20,0.65)', zIndex: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        className="pIn"
        style={{
          background: '#FDFAF2', maxWidth: 380, width: '100%', borderRadius: 20,
          padding: '24px 22px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {!confirmReplace ? (
          <>
            <div style={{ fontFamily: "'Righteous', cursive", fontSize: 20, color: '#1A5C3A', marginBottom: 8 }}>
              We found a saved Mitzy setup
            </div>
            <div style={{ fontSize: 14, color: '#1C2B22', marginBottom: 22, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>
              It looks like you already have an account with us. Want to load that, or replace it with what you just built?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => onResolve('use-saved')}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: '#06A77D', color: '#fff',
                  fontSize: 15, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Use my saved setup
              </button>

              <button
                onClick={() => setConfirmReplace(true)}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  border: '1.5px solid #4A6256', background: 'transparent',
                  color: '#4A6256', fontSize: 15, fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                }}
              >
                Replace with new setup
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Righteous', cursive", fontSize: 20, color: '#D62828', marginBottom: 8 }}>
              Are you sure?
            </div>
            <div style={{ fontSize: 14, color: '#1C2B22', marginBottom: 22, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>
              This will overwrite your existing Mitzy data.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmReplace(false)}
                style={{
                  flex: 1, padding: '12px', background: '#F0EDE4', color: '#4A6256',
                  border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                cancel
              </button>
              <button
                onClick={() => onResolve('use-new')}
                style={{
                  flex: 2, padding: '12px', background: '#D62828', color: '#fff',
                  border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Yes, replace
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
