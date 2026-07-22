// Moving life event bundle. Covers the admin side of relocating — address
// changes, utilities, providers, legal paperwork — not packing tips or
// interior design. Two separate gates keep legal tasks (license, car reg,
// voter, state taxes) and provider tasks (PCP, dentist, pediatrician, vet)
// independent: someone moving across California needs new providers but not
// a new state license, while someone crossing a state line 10 miles away
// needs the license but keeps their doctors. Profile fields (hasKids,
// hasPets, hasCar) are seeded from the user's profile so intake never
// re-asks them. Moving is stressful but good news: confetti stays on.

import { computeDueDate, daysSince } from './eventDates';

export const MOVING_PHASES = ['BEFORE', 'AFTER'];

export const MOVING_PHASE_LABELS = {
  BEFORE: 'Before the move',
  AFTER:  "After you're settled",
};

// ── Gate sets ─────────────────────────────────────────────────────────
const OWNS_HOME_ONLY      = new Set(['list-home']);
const RENTING_ONLY         = new Set(['give-notice']);
const KIDS_ONLY            = new Set(['school-records', 'enroll-school', 'find-pediatrician']);
const PETS_ONLY            = new Set(['vet-records', 'find-vet', 'register-pets']);
const OUT_OF_STATE_ONLY    = new Set(['register-car', 'voter-registration', 'file-both-state-taxes']);
const NEEDS_PROVIDERS_ONLY = new Set(['find-pcp', 'find-dentist', 'find-pediatrician', 'find-vet']);
const HAS_CAR_ONLY         = new Set(['register-car']);

const BUNDLE = [
  // ── Before the move ─────────────────────────────────────────────
  { id: 'research-movers', phase: 'BEFORE', cat: 'home', label: 'Research moving companies or plan a DIY move', stakes: 'medium', assistType: 'guidance',
    why: "Booking early saves money and guarantees availability — last-minute moves cost significantly more." },
  { id: 'give-notice', phase: 'BEFORE', cat: 'home', label: 'Notify your landlord or give notice', stakes: 'high', assistType: 'guidance',
    why: "Most leases require 30–60 days' notice — missing the window can cost you an extra month's rent." },
  { id: 'list-home', phase: 'BEFORE', cat: 'home', label: 'List your home or find a real estate agent', stakes: 'high', assistType: 'providers', searchQuery: 'real estate agent',
    why: "Selling a home takes time — the earlier you start, the less pressure you'll feel to accept a low offer." },
  { id: 'school-records', phase: 'BEFORE', cat: 'health', label: 'Request school records from current school', stakes: 'high', assistType: 'guidance',
    why: "Most schools need transcripts, immunization records, and IEPs before they'll enroll — requesting them early avoids a gap." },
  { id: 'vet-records', phase: 'BEFORE', cat: 'health', label: 'Get pet records from your current vet', stakes: 'medium', assistType: 'guidance',
    why: "A new vet will need vaccination history and any ongoing treatment records to pick up where yours left off." },
  { id: 'insurance', phase: 'BEFORE', cat: 'finance', label: 'Get renters or homeowners insurance for the new place', stakes: 'high', assistType: 'guidance',
    why: "Coverage should start the day you move in — a gap leaves you exposed if something goes wrong on move-in day." },
  { id: 'utilities', phase: 'BEFORE', cat: 'home', label: 'Transfer or set up utilities at the new place', stakes: 'high', assistType: 'guidance',
    why: "Scheduling transfers a week or two early means the lights are on when you arrive." },
  { id: 'mail-forwarding', phase: 'BEFORE', cat: 'home', label: 'Set up mail forwarding with USPS', stakes: 'high', assistType: 'guidance',
    why: "Takes effect in about a week, and only lasts 12 months — important mail slips through the cracks fast without it." },
  { id: 'notify-employer', phase: 'BEFORE', cat: 'finance', label: 'Update your employer with your new address', stakes: 'medium', assistType: 'guidance',
    why: "Payroll, tax withholding, and benefits paperwork all key off your address — better to update it before the next pay cycle." },
  // ── After the move ──────────────────────────────────────────────
  { id: 'update-license', phase: 'AFTER', cat: 'car', label: "Update your driver's license with your new address", stakes: 'high', assistType: 'guidance',
    why: "Most states require an address update within 30 days of moving — it's often needed for voter registration too." },
  { id: 'register-car', phase: 'AFTER', cat: 'car', label: 'Register your car in the new state', stakes: 'high', assistType: 'guidance',
    why: "States typically give you 30–90 days to re-register — after that you risk a ticket." },
  { id: 'voter-registration', phase: 'AFTER', cat: 'finance', label: 'Register to vote at your new address', stakes: 'medium', assistType: 'guidance',
    why: "You can't vote in your new district until you're registered there, and deadlines sneak up around elections." },
  { id: 'enroll-school', phase: 'AFTER', cat: 'health', label: 'Enroll kids at their new school', stakes: 'high', assistType: 'guidance',
    why: "Enrollment often requires proof of address, immunization records, and transcripts — having those ready (from the earlier task) makes this smoother." },
  { id: 'update-addresses', phase: 'AFTER', cat: 'finance', label: 'Update your address with banks, insurance, and subscriptions', stakes: 'medium', assistType: 'guidance',
    why: "Mail forwarding is temporary — anything you miss here starts bouncing after a year." },
  { id: 'find-pcp', phase: 'AFTER', cat: 'health', label: 'Find a new primary care doctor', stakes: 'medium', assistType: 'providers', searchQuery: 'primary care doctor',
    why: "Better to have one lined up before you actually need one." },
  { id: 'find-dentist', phase: 'AFTER', cat: 'health', label: 'Find a new dentist', stakes: 'medium', assistType: 'providers', searchQuery: 'dentist',
    why: "Easy to let this slide, but a cleaning appointment is a low-pressure way to get established." },
  { id: 'find-pediatrician', phase: 'AFTER', cat: 'health', label: 'Find a new pediatrician', stakes: 'high', assistType: 'providers', searchQuery: 'pediatrician',
    why: "Kids need a doctor on file for school forms, sick visits, and prescriptions — worth setting up before you need it urgently." },
  { id: 'find-vet', phase: 'AFTER', cat: 'health', label: 'Find a new vet', stakes: 'medium', assistType: 'providers', searchQuery: 'veterinarian',
    why: "An emergency vet visit is not when you want to be searching for one." },
  { id: 'register-pets', phase: 'AFTER', cat: 'health', label: 'Register or license pets in your new city or county', stakes: 'medium', assistType: 'guidance',
    why: "Many cities require pet licenses — it's usually cheap and quick, and some shelters check for it." },
  { id: 'update-emergency-contacts', phase: 'AFTER', cat: 'emergency', label: 'Update emergency contacts at work and school', stakes: 'medium', assistType: 'guidance',
    why: "Old contacts may not be nearby anymore — making sure the right person gets called matters." },
  { id: 'file-both-state-taxes', phase: 'AFTER', cat: 'finance', label: 'File state taxes in both states if you moved mid-year', stakes: 'high', assistType: 'guidance',
    why: "You owe each state for the portion of the year you lived there — missing one can trigger penalties." },
  { id: 'check-hazards', phase: 'AFTER', cat: 'emergency', label: 'Check if your new area has specific hazards', stakes: 'medium', assistType: 'guidance',
    why: "Flood zones, wildfire areas, tornado alleys — knowing what to prepare for is half the battle." },
];

// Due-date offsets from the move date (negative = before).
const PHASE_DUE_OFFSETS = { BEFORE: -14, AFTER: 30 };
const DUE_OFFSET_OVERRIDES = {
  'research-movers':          -45,
  'list-home':                -90,
  'give-notice':              -30,
  'school-records':           -30,
  'vet-records':              -21,
  'insurance':                -14,
  'utilities':                 -7,
  'mail-forwarding':          -14,
  'notify-employer':           -7,
  'update-license':            14,
  'register-car':              30,
  'voter-registration':        30,
  'enroll-school':             14,
  'update-addresses':          14,
  'find-pcp':                  30,
  'find-dentist':              45,
  'find-pediatrician':         30,
  'find-vet':                  45,
  'register-pets':             30,
  'update-emergency-contacts': 14,
  'file-both-state-taxes':     90,
  'check-hazards':             14,
};

// Retro phases by stage — users who already moved may have handled the
// before-the-move tasks; offer them as "already handled?" checklist.
const RETRO_PHASES = {
  looking: [],
  found:   [],
  moved:   ['BEFORE'],
};

function passesGates(t, answers) {
  if (OWNS_HOME_ONLY.has(t.id) && !answers?.ownsHome)                  return false;
  if (RENTING_ONLY.has(t.id) && answers?.ownsHome)                     return false;
  if (KIDS_ONLY.has(t.id) && !answers?.hasKids)                        return false;
  if (PETS_ONLY.has(t.id) && !answers?.hasPets)                        return false;
  if (OUT_OF_STATE_ONLY.has(t.id) && !answers?.outOfState)             return false;
  if (NEEDS_PROVIDERS_ONLY.has(t.id) && !answers?.needNewProviders)    return false;
  if (HAS_CAR_ONLY.has(t.id) && !answers?.hasCar)                     return false;
  return true;
}

export function retroactiveCandidates(answers) {
  const phases = new Set(RETRO_PHASES[answers?.stage] ?? []);
  if (phases.size === 0) return [];
  return BUNDLE.filter(t => phases.has(t.phase) && passesGates(t, answers));
}

export function tasksForIntake(answers) {
  const alreadyDone = new Set(answers?.alreadyDone || []);
  const anchor = answers?.date;
  return BUNDLE
    .filter(t => !alreadyDone.has(t.id) && passesGates(t, answers))
    .map(t => {
      const task = { ...t, dueDate: computeDueDate(anchor, DUE_OFFSET_OVERRIDES[t.id] ?? PHASE_DUE_OFFSETS[t.phase]) };
      if (t.id === 'update-license' && answers?.outOfState) {
        task.label = "Get your new state driver’s license";
        task.why = "Most states require a new license within 30–90 days of establishing residency — your old state’s license won’t be valid much longer.";
      }
      return task;
    });
}

export const MOVING = {
  id:    'moving',
  label: 'Moving',
  bundle: BUNDLE,
  phases: MOVING_PHASES,
  phaseLabels: MOVING_PHASE_LABELS,
  retroactiveCandidates,
  tasksForIntake,
  intake: {
    steps: [
      {
        type: 'choice',
        key:  'stage',
        question: 'Where are you in the process?',
        help: "Helps Mitzy pace things and skip what’s behind you.",
        options: [
          { value: 'looking', label: 'Still looking' },
          { value: 'found',   label: 'Found a place' },
          { value: 'moved',   label: 'Already moved' },
        ],
      },
      {
        type: 'date',
        key:  'date',
        question: "When’s the move — or when was it?",
        help: 'An estimate is fine — Mitzy will pace things around it.',
      },
      {
        type: 'booleans',
        question: 'A few quick questions.',
        help: 'Some tasks only apply if these do — Mitzy will skip the rest.',
        fields: [
          { key: 'ownsHome',          label: 'Do you own your current home?' },
          { key: 'outOfState',        label: 'Are you moving to a different state?' },
          { key: 'needNewProviders',  label: 'Will you need to find new doctors and local services?' },
        ],
      },
    ],
  },
};
