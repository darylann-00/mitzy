const CARD = {
  background:   '#FFFBEE',
  border:       '2px solid #F4C430',
  borderRadius: 14,
  padding:      '12px 14px',
  marginBottom: 4,
};

const chipStyle = {
  background: '#fff',
  border: '1.5px solid #F4C430',
  borderRadius: 20,
  padding: '5px 11px',
  fontSize: 11,
  fontWeight: 700,
  color: '#8A6A00',
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
};

const CHIPS_GENERAL = [
  { key: 'recently',   label: 'Recently',          days: 30  },
  { key: 'few-months', label: 'A few months ago',   days: 90  },
  { key: 'over-year',  label: 'Over a year ago',    days: 400 },
  { key: 'never',      label: 'Never / not sure',   days: 730 },
];

const CHIPS_HEALTH = [
  { key: 'this-year',  label: 'This year',          days: 180 },
  { key: 'last-year',  label: 'Last year',           days: 400 },
  { key: 'two-plus',   label: '2+ years ago',        days: 800 },
  { key: 'never',      label: 'Never / not sure',    days: 730 },
];

export function TrickleCard({ task, onAnswer, onDismiss }) {
  const chips = task.cat === 'health' ? CHIPS_HEALTH : CHIPS_GENERAL;

  const handleChip = (days) => {
    const lastDone = new Date(Date.now() - days * 86400000).toISOString();
    onAnswer({ taskId: task.id, lastDone });
  };

  return (
    <div style={CARD}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#B08A10', marginBottom:3, fontFamily:'DM Sans, sans-serif' }}>
            Quick check
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:'#1C2B22', lineHeight:1.3, fontFamily:'DM Sans, sans-serif' }}>
            {task.label}
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{ fontSize:11, fontWeight:700, color:'#B08A10', background:'#F4C430', border:'none', borderRadius:20, padding:'3px 10px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', flexShrink:0, whiteSpace:'nowrap' }}
        >
          maybe later
        </button>
      </div>

      {/* When did you last? */}
      <div style={{ fontSize:11, color:'#8A6A00', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>
        When did you last do this?
      </div>

      {/* Chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
        {chips.map(chip => (
          <button key={chip.key} onClick={() => handleChip(chip.days)} style={chipStyle}>
            {chip.label}
          </button>
        ))}
      </div>

      {/* Doesn't apply */}
      <button
        onClick={() => onAnswer({ taskId: task.id, notApplicable: true })}
        style={{ background:'none', border:'none', fontSize:11, color:'#B08A10', cursor:'pointer', fontFamily:'DM Sans, sans-serif', padding:0, textDecoration:'underline', opacity:0.7 }}
      >
        Doesn't apply to me
      </button>
    </div>
  );
}
