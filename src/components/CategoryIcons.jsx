// Shared category SVG icons — used in AllView, TaskDetailView, ProfileView

export function HouseIcon({ color = '#1A5C3A', bg = '#E8F5EE', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <polygon points="9,2 1,8 3,8 3,16 15,16 15,8 17,8" fill={color} />
      <rect x="6" y="10" width="3" height="4" rx="1" fill={bg} />
      <rect x="11" y="10" width="2.5" height="2.5" rx="0.5" fill={bg} />
    </svg>
  );
}

export function CarIcon({ color = '#F77F00', bg = '#FFF3E0', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="1" y="8" width="16" height="6" rx="2" fill={color} />
      <path d="M4 8 L6 4 L12 4 L14 8" fill={color} />
      <circle cx="4.5" cy="14.5" r="2" fill={bg} />
      <circle cx="13.5" cy="14.5" r="2" fill={bg} />
      <rect x="7" y="5" width="4" height="2.5" rx="0.5" fill={bg} />
    </svg>
  );
}

export function PersonIcon({ color = '#06A77D', bg = '#E8F5EE', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="4.5" r="2.5" fill={color} />
      <line x1="9" y1="7" x2="9" y2="13" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="9" x2="4" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="9" x2="14" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="13" x2="6" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="13" x2="12" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ color = '#06A77D', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 16 C9 16 1.5 11.5 1.5 6.3 C1.5 3.6 3.6 2 5.7 2 C7.3 2 8.5 2.9 9 3.9 C9.5 2.9 10.7 2 12.3 2 C14.4 2 16.5 3.6 16.5 6.3 C16.5 11.5 9 16 9 16Z" fill={color} />
    </svg>
  );
}

export function CalendarIcon({ color = '#F77F00', bg = '#FFF3E0', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="2" fill={color} />
      <line x1="2" y1="7" x2="16" y2="7" stroke={bg} strokeWidth="1.5" />
      <line x1="6" y1="3" x2="6" y2="7" stroke={bg} strokeWidth="1.5" />
      <line x1="12" y1="3" x2="12" y2="7" stroke={bg} strokeWidth="1.5" />
    </svg>
  );
}

export function PetIcon({ color = '#F4C430', bg = '#FFFBEE', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="10" r="5" fill={color} />
      <polygon points="5,7 4,3 7,6" fill={color} />
      <polygon points="13,7 14,3 11,6" fill={color} />
      <circle cx="7" cy="10" r="1" fill={bg} />
      <circle cx="11" cy="10" r="1" fill={bg} />
      <path d="M14 12 Q17 10 16 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function SirenIcon({ color = '#D62828', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <g stroke={color} strokeWidth="1.3" strokeLinecap="round">
        <line x1="9" y1="0.5" x2="9" y2="2.6" />
        <line x1="3.6" y1="2.1" x2="4.9" y2="3.9" />
        <line x1="14.4" y1="2.1" x2="13.1" y2="3.9" />
        <line x1="1.2" y1="6.2" x2="3.3" y2="7" />
        <line x1="16.8" y1="6.2" x2="14.7" y2="7" />
        <line x1="0.4" y1="10.8" x2="2.7" y2="10.4" />
        <line x1="17.6" y1="10.8" x2="15.3" y2="10.4" />
      </g>
      <path d="M9 3.4C6.7 3.4 5 5.2 5 7.5V12H13V7.5C13 5.2 11.3 3.4 9 3.4Z" fill={color} />
      <rect x="4.2" y="12" width="9.6" height="3" rx="1" fill={color} />
    </svg>
  );
}

export function KidIcon({ color = '#4A6256', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="4.5" r="2.5" fill={color} />
      <line x1="9" y1="7" x2="9" y2="13" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="9" x2="4" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="9" x2="14" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="13" x2="6" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="9" y1="13" x2="12" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PinIcon({ color = '#1A5C3A', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 1C5.7 1 3 3.6 3 6.8 3 11 9 17 9 17S15 11 15 6.8C15 3.6 12.3 1 9 1Z" fill={color} />
      <circle cx="9" cy="6.8" r="2.2" fill="#fff" />
    </svg>
  );
}

export function LightningIcon({ color = '#F4C430', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <polygon points="10,1 3,11 8,11 7,17 15,7 10,7" fill={color} />
    </svg>
  );
}

export function BabyIcon({ color = '#06A77D', bg = '#E8F5EE', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="10" r="6" fill={color} />
      <path d="M5 5.5 Q9 2 13 5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="6.7" cy="9.5" r="1" fill={bg} />
      <circle cx="11.3" cy="9.5" r="1" fill={bg} />
      <path d="M7 12.3 Q9 13.6 11 12.3" stroke={bg} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function EarthquakeIcon({ color = '#D62828', bg = '#FDE8E8', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <path d="M1 9 L5 9 L7 5 L9.5 13 L11.5 7 L13 9 L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function WildfireIcon({ color = '#D62828', bg = '#FDE8E8', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <path d="M9 2 C6 6 5 8 6 11 C6.5 12.6 8 13.5 9.5 13 C8.5 11.5 8.7 10.3 9.5 9.5 C10.8 11 11.5 11.8 11 13.2 C12.6 12.2 13.3 10 12.3 7.8 C12.1 9 11.4 9.4 11 9 C11.4 6.5 10.6 4 9 2Z" fill={color} />
    </svg>
  );
}

export function HurricaneIcon({ color = '#1A5C3A', bg = '#E8F5EE', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <path d="M9 3 C12.5 3 15 5 14.5 7.5 C14.2 9 12.5 9.3 12 8 C11.7 7.2 12.3 6.5 13 6.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M9 9 C5.5 9 3 11 3.5 13.5 C3.8 15 5.5 15.3 6 14 C6.3 13.2 5.7 12.5 5 12.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M3.5 7 C5 4.5 8 4 9 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M14.5 11 C13 13.5 10 14 9 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function TornadoIcon({ color = '#4A6256', bg = '#F0EDE4', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <path d="M3 4 L15 4 L11.5 7.3 L13 7.3 L10 10.3 L11 10.3 L8.5 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function WinterStormIcon({ color = '#6B8DD6', bg = '#EAF0FB', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round">
        <line x1="9" y1="3" x2="9" y2="15" />
        <line x1="3.9" y1="6" x2="14.1" y2="12" />
        <line x1="3.9" y1="12" x2="14.1" y2="6" />
      </g>
    </svg>
  );
}

export function FloodIcon({ color = '#06A77D', bg = '#E8F5EE', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <path d="M2 8 Q4.5 6 7 8 Q9.5 10 12 8 Q14.5 6 16 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M2 12 Q4.5 10 7 12 Q9.5 14 12 12 Q14.5 10 16 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// "Other" category — four-dot motif from the Mitzy logo
export function OtherIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="5.5"  cy="5.5"  r="3" fill="#D62828" />
      <circle cx="12.5" cy="5.5"  r="3" fill="#F77F00" />
      <circle cx="5.5"  cy="12.5" r="3" fill="#06A77D" />
      <circle cx="12.5" cy="12.5" r="3" fill="#F4C430" />
    </svg>
  );
}

export const HAZARD_ICON_CONFIG = {
  earthquake: { Icon: EarthquakeIcon,  color: '#D62828' },
  wildfire:   { Icon: WildfireIcon,    color: '#D62828' },
  hurricane:  { Icon: HurricaneIcon,   color: '#1A5C3A' },
  tornado:    { Icon: TornadoIcon,     color: '#4A6256' },
  winter:     { Icon: WinterStormIcon, color: '#6B8DD6' },
  flood:      { Icon: FloodIcon,       color: '#06A77D' },
};

// Two interlocked rings — getting married.
export function WeddingRingsIcon({ color = '#B08A10', bg = '#FFFBEE', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <circle cx="6.9" cy="9.6" r="3.4" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="11.1" cy="9.6" r="3.4" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M9 4 L7.8 5.4 L9 6.4 L10.2 5.4 Z" fill={color} />
    </svg>
  );
}

// Two rings drifting apart — divorce / separation.
export function RingsIcon({ color = '#4A6256', bg = '#F0EDE4', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <circle cx="6" cy="10" r="3.4" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="12.5" cy="8" r="3.4" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M12.5 3 L12.5 4.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// A single tulip — remembrance, for loss of a loved one.
export function TulipIcon({ color = '#6B8DD6', bg = '#EEF2FB', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill={bg} />
      <path d="M9 9 L9 14.5" stroke="#06A77D" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 12.5 Q11.5 12 12.3 10" stroke="#06A77D" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M5.8 4.2 L5.8 7.2 Q5.8 9.8 9 9.8 Q12.2 9.8 12.2 7.2 L12.2 4.2 L10.4 5.8 L9 4 L7.6 5.8 Z" fill={color} />
    </svg>
  );
}

export const LIFE_EVENT_ICON_CONFIG = {
  'new-baby':          BabyIcon,
  'marriage':          WeddingRingsIcon,
  'divorce':           RingsIcon,
  'loss-of-loved-one': TulipIcon,
};

// Map category key → icon component + colors
export const CAT_ICON_CONFIG = {
  home:      { Icon: HouseIcon,    color: '#1A5C3A', bg: '#E8F5EE', tileBg: '#E8F5EE'  },
  car:       { Icon: CarIcon,      color: '#F77F00', bg: '#FFF3E0', tileBg: '#FFF3E0'  },
  health:    { Icon: HeartIcon,    color: '#06A77D', bg: '#E8F5EE', tileBg: '#E8F5EE'  },
  school:    { Icon: KidIcon,      color: '#4A6256', bg: '#F0EDE4', tileBg: '#F0EDE4'  },
  finance:   { Icon: CalendarIcon, color: '#F77F00', bg: '#FFF3E0', tileBg: '#FFF3E0'  },
  emergency: { Icon: SirenIcon,    color: '#D62828', bg: '#FDE8E8', tileBg: '#FDE8E8'  },
  pet:       { Icon: PetIcon,      color: '#F4C430', bg: '#FFFBEE', tileBg: '#FFFBEE'  },
  other:     { Icon: OtherIcon,    color: '#4A6256', bg: '#F0EDE4', tileBg: '#F0EDE4'  },
};

export function CategoryTile({ cat, size = 26 }) {
  const cfg = CAT_ICON_CONFIG[cat] || CAT_ICON_CONFIG.home;
  const { Icon, color, bg, tileBg } = cfg;
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 7,
      background: tileBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon color={color} bg={bg} size={Math.round(size * 0.65)} />
    </div>
  );
}
