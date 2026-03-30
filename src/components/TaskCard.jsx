import { CategoryTile } from "./CategoryIcons";

export function formatDueDate(days) {
  if (days === null || days === undefined) return '';
  if (days < -14) return "Hasn't been done in a while";
  if (days < 0) {
    const n = Math.abs(days);
    return `due ${n} day${n !== 1 ? 's' : ''} ago`;
  }
  if (days === 0) return 'due today';
  if (days <= 7)  return 'due this week';
  if (days <= 14) return `due in ${days} days`;
  if (days <= 30) return `due in ${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`;
  return `good for ${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`;
}

const BAR_COLOR = {
  'due':        '#D62828',
  'needed':     '#F77F00',
  'coming-up':  '#F77F00',
  'scheduled':  '#F4C430',
  'ok':         '#06A77D',
  'confirm':    '#06A77D',
};

export function TaskCard({ task, status, days, onSelect, onDone, showCategoryIcon = false, subtitle }) {
  const barColor = BAR_COLOR[status] ?? '#EAE4DA';
  const isActive = status === 'due' || status === 'needed' || status === 'coming-up';
  const dueText  = subtitle !== undefined ? subtitle : formatDueDate(days);

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 14,
      padding: '13px 12px 13px 0',
      marginBottom: 7,
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #EAE4DA',
      overflow: 'hidden',
    }}>
      {/* Left status bar */}
      <div style={{
        width: 6,
        alignSelf: 'stretch',
        flexShrink: 0,
        marginRight: 12,
        background: barColor,
      }} />

      {/* Category icon tile — AllView only */}
      {showCategoryIcon && (
        <div style={{ marginRight: 10, flexShrink: 0 }}>
          <CategoryTile cat={task.cat} size={26} />
        </div>
      )}

      {/* Task info */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelect(task)}>
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#1C2B22',
          fontFamily: 'DM Sans, sans-serif',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {task.label}
        </div>
        {dueText && (
          <div style={{
            fontSize: 11,
            color: '#4A6256',
            marginTop: 2,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {dueText}
          </div>
        )}
      </div>

      {/* Let's do it */}
      <button
        onClick={e => { e.stopPropagation(); onSelect(task); }}
        style={{
          fontSize: 11,
          padding: '6px 11px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 700,
          background: isActive ? '#F77F00' : '#E8F0EC',
          color: isActive ? '#fff' : '#1A5C3A',
          whiteSpace: 'nowrap',
          marginRight: 8,
          flexShrink: 0,
        }}
      >
        Let's do it
      </button>

      {/* Checkmark */}
      <button
        onClick={e => { e.stopPropagation(); onDone(task); }}
        aria-label={`mark ${task.label} done`}
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          border: '2px solid #1A5C3A',
          background: '#E8F5EE',
          flexShrink: 0,
          cursor: 'pointer',
          marginRight: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <polyline points="3,8 6.5,11.5 13,4" stroke="#1A5C3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
