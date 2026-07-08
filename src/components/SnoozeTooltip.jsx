import { useProfileContext } from "../contexts/ProfileContext";
import { SnoozeIcon } from "./SnoozeIcon";

export function SnoozeTooltip({ visible }) {
  const { profile, updateUiState } = useProfileContext();
  const dismissed = !!profile?.uiState?.snoozeTipDismissed;

  if (dismissed || !visible) return null;

  const dismiss = () => {
    updateUiState({ snoozeTipDismissed: true });
  };

  return (
    <div
      onClick={dismiss}
      style={{
        background: '#6B8DD6',
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <SnoozeIcon size={18} color="#fff" />
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: '#fff',
        fontFamily: 'DM Sans, sans-serif',
        flex: 1,
      }}>
        Swipe left on a task to snooze it for later
      </span>
      <span style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'DM Sans, sans-serif',
        flexShrink: 0,
      }}>
        Got it
      </span>
    </div>
  );
}
