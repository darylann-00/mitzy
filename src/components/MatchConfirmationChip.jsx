import { CalendarIcon } from "./CategoryIcons";

export function MatchConfirmationChip({ match, onConfirm, onDismiss }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
      padding: '6px 8px',
      borderRadius: 6,
      background: 'rgba(244, 196, 48, 0.15)',
      fontSize: 11,
      fontFamily: 'DM Sans, sans-serif',
      color: '#1C2B22',
    }}>
      <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
        <CalendarIcon size={12} />
        Found: <span style={{ fontWeight: 600 }}>{match.eventTitle}</span> — yours?
      </span>
      <button
        onClick={onConfirm}
        style={{
          padding: '3px 8px',
          borderRadius: 4,
          border: 'none',
          background: '#F4C430',
          color: '#1C2B22',
          fontSize: 10,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        Yes
      </button>
      <button
        onClick={onDismiss}
        style={{
          padding: '3px 8px',
          borderRadius: 4,
          border: 'none',
          background: '#E8F0EC',
          color: '#1A5C3A',
          fontSize: 10,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        Not mine
      </button>
    </div>
  );
}
