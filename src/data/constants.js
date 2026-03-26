export const C = {
  // Brand
  brand:       '#1A5C3A',
  brandDark:   '#0F3D27',
  brandLight:  '#E8F5EE',
  brandTint:   '#E8F0EC',

  // Status colors
  red:         '#D62828',
  orange:      '#F77F00',
  green:       '#06A77D',
  yellow:      '#F4C430',

  // Neutrals
  ink:         '#1C2B22',
  muted:       '#4A6256',
  bg:          '#FDFAF2',
  card:        '#FFFFFF',
  cardBorder:  '#EAE4DA',
  surface:     '#F0EDE4',

  // Backward-compat aliases
  coral:       '#D62828',
  mint:        '#06A77D',
  lav:         '#4A6256',
  sky:         '#06A77D',
  white:       '#FDFAF2',
  off:         '#FDFAF2',
  light:       '#F0EDE4',
};

export const KID_COLORS = [C.red, C.orange, C.green, C.yellow, C.brand, C.muted];

export const CAT_META = {
  home:      { label: "Home",      emoji: "🏠", color: C.red    },
  car:       { label: "Car",       emoji: "🚗", color: C.brand  },
  health:    { label: "Health",    emoji: "💊", color: C.green  },
  school:    { label: "School",    emoji: "🎒", color: C.orange },
  finance:   { label: "Finance",   emoji: "💰", color: C.orange },
  emergency: { label: "Emergency", emoji: "⚡", color: C.red    },
  pet:       { label: "Pet",       emoji: "🐾", color: C.yellow },
};

export const RAD_WORDS = [
  "RAAAAAAD", "TUBULAR", "GNARLY", "BODACIOUS",
  "COWABUNGA", "STELLAR", "FAR OUT", "RIGHTEOUS", "TRIUMPHANT",
];

export const TRICKLE_QUESTIONS = [
  {
    id: "car_details",
    visit: 2,
    label: "What do you drive?",
    description: "Helps Mitzy give you accurate service intervals.",
  },
  {
    id: "insurance",
    visit: 3,
    label: "What's your insurance?",
    description: "Mitzy uses this when finding in-network providers.",
  },
  {
    id: "age_health",
    visit: 4,
    label: "How old are you?",
    description: "Surfaces age-appropriate health reminders.",
  },
  {
    id: "enrollment",
    visit: 5,
    label: "Does your school require annual re-enrollment?",
    description: "Some districts do, some don't.",
  },
];
