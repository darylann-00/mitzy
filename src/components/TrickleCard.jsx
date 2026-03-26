import { useState } from "react";

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

function Header({ label, onDismiss }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:9 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#1C2B22', lineHeight:1.3, flex:1, fontFamily:'DM Sans, sans-serif' }}>
        {label}
      </div>
      <button
        onClick={onDismiss}
        style={{ fontSize:11, fontWeight:700, color:'#B08A10', background:'#F4C430', border:'none', borderRadius:20, padding:'3px 10px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', flexShrink:0, whiteSpace:'nowrap' }}
      >
        maybe later
      </button>
    </div>
  );
}

export function TrickleCard({ question, profile, onAnswer, onDismiss }) {
  const [val, setVal] = useState('');

  // Spec-compliant: questions with options array → chip UI
  if (question.options?.length > 0) {
    return (
      <div style={CARD}>
        <Header label={question.label} onDismiss={onDismiss} />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {question.options.map(opt => (
            <button
              key={opt.value ?? opt.label}
              onClick={() => onAnswer({ _trickleValue: opt.value })}
              style={chipStyle}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Yes/no question (enrollment)
  if (question.id === 'enrollment' && profile.hasKids) {
    return (
      <div style={CARD}>
        <Header label={question.label} onDismiss={onDismiss} />
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          <button style={chipStyle} onClick={() => onAnswer({ needsEnrollment: true  })}>Yes</button>
          <button style={chipStyle} onClick={() => onAnswer({ needsEnrollment: false })}>No</button>
          <button style={chipStyle} onClick={onDismiss}>Not sure</button>
        </div>
      </div>
    );
  }

  // Text input questions
  const INPUT_MAP = {
    car_details: { placeholder: 'e.g. 2019 Honda CR-V',      key: 'car',       type: 'text'   },
    insurance:   { placeholder: 'e.g. Blue Cross, Aetna...', key: 'insurance', type: 'text'   },
    age_health:  { placeholder: 'e.g. 34',                   key: 'age',       type: 'number' },
  };

  const input = INPUT_MAP[question.id];
  if (!input) return null;

  const canSave = val.trim().length > 0;

  return (
    <div style={CARD}>
      <Header label={question.label} onDismiss={onDismiss} />
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input
          type={input.type}
          placeholder={input.placeholder}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canSave && onAnswer({ [input.key]: val })}
          style={{ flex:1, marginBottom:0 }}
          min={input.type === 'number' ? '18' : undefined}
          max={input.type === 'number' ? '99' : undefined}
        />
        <button
          onClick={() => onAnswer({ [input.key]: val })}
          disabled={!canSave}
          style={{
            padding:'10px 16px', fontSize:13, fontWeight:700, flexShrink:0,
            border:'none', borderRadius:10, cursor: canSave ? 'pointer' : 'default',
            fontFamily:'DM Sans, sans-serif',
            background: canSave ? '#F4C430' : '#E0D8D0',
            color: canSave ? '#7a5900' : '#4A6256',
          }}
        >
          save
        </button>
      </div>
    </div>
  );
}
