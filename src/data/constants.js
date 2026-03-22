export const C = {
  coral:  "#FF5C5C",
  yellow: "#FFD93D",
  mint:   "#6BCB77",
  sky:    "#4ECDC4",
  lav:    "#C77DFF",
  orange: "#FF9F1C",
  white:  "#FFFFFF",
  off:    "#FFF8F0",
  ink:    "#1A1A2E",
  muted:  "#9B9B9B",
  light:  "#F3F3F3",
};

export const KID_COLORS = [C.coral, C.sky, C.lav, C.orange, C.mint, C.yellow];

export const CAT_META = {
  home:      { label: "Home",      emoji: "🏠", color: C.coral  },
  car:       { label: "Car",       emoji: "🚗", color: C.sky    },
  health:    { label: "Health",    emoji: "💊", color: C.mint   },
  school:    { label: "School",    emoji: "🎒", color: C.lav    },
  finance:   { label: "Finance",   emoji: "💰", color: C.orange },
  emergency: { label: "Emergency", emoji: "⚡", color: C.coral  },
};

export const RAD_WORDS = [
  "RAAAAAAD", "TUBULAR", "GNARLY", "BODACIOUS",
  "COWABUNGA", "STELLAR", "FAR OUT", "RIGHTEOUS", "TRIUMPHANT",
];

export const GREETINGS = [
  "I already looked up three gutter cleaners. You're going to want to see this.",
  "Dentist called. I told them you'd be in touch. You're welcome.",
  "Already found someone for the furnace. You just have to say the word.",
  "Camp registration opens soon. I have the links ready. Don't thank me yet.",
  "Your insurance renews soon. I already pulled the comparison numbers.",
  "Someone needs to be on top of things around here. Clearly that's me.",
  "The vet called. I handled it. Mostly.",
  "Went ahead and researched everything. Cleared my schedule for this.",
  "Your smoke detector and I had a productive meeting. You're welcome.",
  "I've been busy. Turns out your car battery has also been busy. Dying.",
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
