import { useState } from "react";

export function MarkDoneModal({ task, onDone, onClose }) {
  const [dateStr,   setDateStr]   = useState(new Date().toISOString().split('T')[0]);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleDone = async () => {
    setSaving(true);
    setSaveError(false);
    const result = await onDone(task.id, dateStr || null);
    if (result?.error) { setSaving(false); setSaveError(true); }
    // on success App.js closes the modal via setMarkDoneModal(null)
  };

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(15,30,20,0.65)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pIn" style={{ background:'#FDFAF2', maxWidth:380, width:'100%', borderRadius:20, padding:'24px 22px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="mdCircle" style={{ width:52, height:52, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
          <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
            <polyline className="mdCheck" points="3,9 7,13 15,4" stroke="#06A77D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontFamily:"'Righteous', cursive", fontSize:20, color:'#06A77D', marginBottom:5 }}>Mark as done</div>
        <div style={{ fontSize:14, color:'#1C2B22', marginBottom:20, lineHeight:1.4, fontFamily:'DM Sans, sans-serif' }}>{task.label}</div>

        {!task.oneTime && (
          <>
            <div style={{ fontSize:12, color:'#4A6256', marginBottom:6, fontWeight:600, fontFamily:'DM Sans, sans-serif' }}>
              Date completed
            </div>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              style={{ marginBottom:16 }}
            />
          </>
        )}

        {saveError && (
          <div style={{ fontSize:13, color:'#D62828', textAlign:'center', marginBottom:10, fontFamily:'DM Sans, sans-serif' }}>
            Couldn't save. Try again.
          </div>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ flex:1, padding:'12px', background:'#F0EDE4', color:'#4A6256', border:'none', borderRadius:12, fontWeight:600, fontSize:14, cursor: saving ? 'default' : 'pointer', fontFamily:'DM Sans, sans-serif', opacity: saving ? 0.5 : 1 }}
          >
            cancel
          </button>
          <button
            onClick={handleDone}
            disabled={saving}
            style={{ flex:2, padding:'12px', background: saving ? '#4A6256' : '#06A77D', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor: saving ? 'default' : 'pointer', fontFamily:'DM Sans, sans-serif' }}
          >
            {saving ? 'Saving…' : 'done'}
          </button>
        </div>
      </div>
    </div>
  );
}
