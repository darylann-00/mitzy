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

export function StarIcon({ color = '#D62828', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <polygon points="9,1 11,7 17,7 12,11 14,17 9,13 4,17 6,11 1,7 7,7" fill={color} />
    </svg>
  );
}

export function SchoolIcon({ color = '#4A6256', bg = '#F0EDE4', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <polygon points="9,2 1,7 9,12 17,7" fill={color} />
      <rect x="5" y="12" width="8" height="4" rx="1" fill={color} />
      <line x1="15" y1="7" x2="15" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="15" r="1.5" fill={color} />
    </svg>
  );
}

// Map category key → icon component + colors
export const CAT_ICON_CONFIG = {
  home:      { Icon: HouseIcon,    color: '#1A5C3A', bg: '#E8F5EE', tileBg: '#E8F5EE'  },
  car:       { Icon: CarIcon,      color: '#F77F00', bg: '#FFF3E0', tileBg: '#FFF3E0'  },
  health:    { Icon: PersonIcon,   color: '#06A77D', bg: '#E8F5EE', tileBg: '#E8F5EE'  },
  school:    { Icon: SchoolIcon,   color: '#4A6256', bg: '#F0EDE4', tileBg: '#F0EDE4'  },
  finance:   { Icon: CalendarIcon, color: '#F77F00', bg: '#FFF3E0', tileBg: '#FFF3E0'  },
  emergency: { Icon: StarIcon,     color: '#D62828', bg: '#FDE8E8', tileBg: '#FDE8E8'  },
  pet:       { Icon: PetIcon,      color: '#F4C430', bg: '#FFFBEE', tileBg: '#FFFBEE'  },
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
