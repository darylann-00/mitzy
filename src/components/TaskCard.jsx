import { CategoryTile } from "./CategoryIcons";
import { MatchConfirmationChip } from "./MatchConfirmationChip";
import { SnoozeIcon } from "./SnoozeIcon";

export function formatDueDate(days, lastDone) {
  if (days === null || days === undefined) return '';
  if (days < -14) {
    if (lastDone) {
      const date = new Date(lastDone);
      return `Last done ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return "Hasn't been done in a while";
  }
  if (days < 0) {
    const n = Math.abs(days);
    return `due ${n} day${n !== 1 ? 's' : ''} ago`;
  }
  if (days === 0) return 'due today';
  if (days <= 7)  return 'due this week';
  if (days <= 14) return `due in ${days} days`;
  return `due in ${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`;
}

export function formatOkDate(days) {
  if (days === null || days === undefined) return '';
  if (days <= 30) return formatDueDate(days);
  return `good for ${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`;
}

const BAR_COLOR = {
  'due':        '#D62828',
  'needed':     '#F77F00',
  'coming-up':  '#F77F00',
  'scheduled':  '#F4C430',
  'ok':         '#06A77D',
  'confirm':    '#06A77D',
  'snoozed':    '#6B8DD6',
};

export function TaskCard({
  task, status, days, onSelect, onDone, onSnooze, onUnsnooze,
  showCategoryIcon = false, subtitle, noMargin = false,
  pendingMatch, onMatchConfirm, onMatchDismiss,
  stepProgress,
}) {
  const barColor = BAR_COLOR[status] ?? '#EAE4DA';
  const isActive = status === 'due' || status === 'needed' || status === 'coming-up';
  const isSnoozed = status === 'snoozed';

  let dueText = subtitle !== undefined ? subtitle
    : status === 'ok' ? formatOkDate(days)
    : formatDueDate(days, task.lastDone);

  // Show scheduled date if status is scheduled
  if (status === 'scheduled' && task.scheduledDate) {
    const date = new Date(task.scheduledDate);
    dueText = `Scheduled: ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  if (isSnoozed && task.snoozedUntil) {
    const date = new Date(task.snoozedUntil + 'T12:00:00');
    dueText = `Snoozed until ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  return (
    <div data-testid="task-card" style={{
      background: '#FFFFFF',
      borderRadius: 14,
      padding: '13px 12px 13px 0',
      marginBottom: (noMargin || isSnoozed) ? 0 : 7,
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #EAE4DA',
      overflow: 'hidden',
      opacity: isSnoozed ? 0.6 : 1,
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#1C2B22',
          fontFamily: 'DM Sans, sans-serif',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: 'pointer',
        }} onClick={() => onSelect(task)}>
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
        {stepProgress && task.steps && (() => {
          const done = task.steps.filter(s => stepProgress[s.key]?.done).length;
          const total = task.steps.length;
          if (done > 0 && done < total) return (
            <div style={{ fontSize: 11, color: '#06A77D', marginTop: 2, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
              {done} of {total} steps done
            </div>
          );
          return null;
        })()}
        {pendingMatch && (
          <MatchConfirmationChip
            match={pendingMatch}
            onConfirm={onMatchConfirm}
            onDismiss={onMatchDismiss}
          />
        )}
      </div>

      {isSnoozed ? (
        <button
          onClick={e => { e.stopPropagation(); onUnsnooze?.(task.id); }}
          style={{
            fontSize: 11,
            padding: '6px 11px',
            borderRadius: 8,
            border: '1.5px solid #6B8DD6',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            background: 'rgba(107,141,214,0.1)',
            color: '#6B8DD6',
            whiteSpace: 'nowrap',
            marginRight: 8,
            flexShrink: 0,
          }}
        >
          Wake up
        </button>
      ) : (
        <>
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

          {/* Snooze */}
          {onSnooze && (
            <button
              onClick={e => { e.stopPropagation(); onSnooze(task); }}
              aria-label={`snooze ${task.label}`}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: '1.5px solid #D0C8C0',
                background: '#F8F5EC',
                flexShrink: 0,
                cursor: 'pointer',
                marginRight: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <SnoozeIcon size={15} color="#9BAFC4" />
            </button>
          )}

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
        </>
      )}
    </div>
  );
}
