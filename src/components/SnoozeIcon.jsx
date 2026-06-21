const BLUE = '#6B8DD6';

export function SnoozeIcon({ size = 20, color = BLUE }) {
  const scale = size / 20;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 44 16" fill="none" style={{ display: 'block' }}>
      <g stroke={color} fill="none" strokeLinecap="round">
        {/* Left eye */}
        <path d="M2 6 Q9 14 16 6" strokeWidth={2.5 / scale || 2.5} />
        <path d="M5 9 L4 12.5" strokeWidth={1.8 / scale || 1.8} />
        <path d="M9 11 L9 14.5" strokeWidth={1.8 / scale || 1.8} />
        <path d="M13 9 L14 12.5" strokeWidth={1.8 / scale || 1.8} />

        {/* Right eye */}
        <path d="M28 6 Q35 14 42 6" strokeWidth={2.5 / scale || 2.5} />
        <path d="M31 9 L30 12.5" strokeWidth={1.8 / scale || 1.8} />
        <path d="M35 11 L35 14.5" strokeWidth={1.8 / scale || 1.8} />
        <path d="M39 9 L40 12.5" strokeWidth={1.8 / scale || 1.8} />
      </g>
    </svg>
  );
}

export const SNOOZE_BLUE = BLUE;
