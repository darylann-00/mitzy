import { TaskAnswerChips } from "./TaskAnswerChips";

const CARD = {
  background:   '#FFFBEE',
  border:       '2px solid #F4C430',
  borderRadius: 14,
  padding:      '12px 14px',
  marginBottom: 4,
};

const CHIP_STYLE = {
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

const LABEL_STYLE = { fontSize: 11, color: '#8A6A00', marginBottom: 8, fontWeight: 400 };

export function TrickleCard({ task, onAnswer, onDismiss }) {
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

      <TaskAnswerChips
        task={task}
        onDone={(iso) => onAnswer({ taskId: task.id, lastDone: iso })}
        onNeeded={() => onAnswer({ taskId: task.id, needed: true })}
        onSkip={() => onAnswer({ taskId: task.id, notApplicable: true })}
        labelStyle={LABEL_STYLE}
        chipStyle={CHIP_STYLE}
        chipGridStyle={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}
      />
    </div>
  );
}
