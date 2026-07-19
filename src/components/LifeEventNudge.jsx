// Yellow trickle-styled card for life events. Two variants:
//   - 'discovery'  → one-time nudge introducing the feature
//   - 'wrapup'     → fires when every task in an active event is complete

const CARD = {
  background:   '#FFFBEE',
  border:       '2px solid #F4C430',
  borderRadius: 14,
  padding:      '12px 14px',
  marginBottom: 4,
};

const HEADER_LABEL = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#B08A10', marginBottom: 4,
  fontFamily: 'DM Sans, sans-serif',
};

const TITLE = {
  fontSize: 13, fontWeight: 700, color: '#1C2B22', lineHeight: 1.3,
  fontFamily: 'DM Sans, sans-serif', marginBottom: 6,
};

const BODY = {
  fontSize: 12, color: '#4A6256', lineHeight: 1.5,
  fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
};

const BUTTON_PRIMARY = {
  fontSize: 12, fontWeight: 700, color: '#fff',
  background: '#1A5C3A', border: 'none', borderRadius: 20,
  padding: '6px 14px', cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
};

const BUTTON_SECONDARY = {
  fontSize: 12, fontWeight: 700, color: '#B08A10',
  background: '#F4C430', border: 'none', borderRadius: 20,
  padding: '6px 14px', cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
};

export function LifeEventNudge({ variant, eventLabel, onPrimary, onDismiss }) {
  if (variant === 'discovery') {
    return (
      <div style={CARD}>
        <div style={HEADER_LABEL}>New from Mitzy</div>
        <div style={TITLE}>Going through something big?</div>
        <div style={BODY}>
          Getting married, a new baby, a divorce, losing someone close — Mitzy can walk you through the admin, one task at a time. Set one up from your Profile.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={BUTTON_PRIMARY}    onClick={onPrimary}>Show me</button>
          <button style={BUTTON_SECONDARY}  onClick={onDismiss}>Not now</button>
        </div>
      </div>
    );
  }

  if (variant === 'wrapup') {
    return (
      <div style={CARD}>
        <div style={HEADER_LABEL}>Looks like you're done</div>
        <div style={TITLE}>Wrap up "{eventLabel}"?</div>
        <div style={BODY}>
          You've handled every task. Anything else to add, or should Mitzy wrap this up?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={BUTTON_PRIMARY}   onClick={onPrimary}>All done</button>
          <button style={BUTTON_SECONDARY} onClick={onDismiss}>Not yet</button>
        </div>
      </div>
    );
  }

  return null;
}
