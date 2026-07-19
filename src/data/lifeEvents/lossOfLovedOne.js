// Loss of a loved one life event bundle. Phrased around "they/their" so it
// works for a parent, spouse, sibling, or close friend without separate
// bundles. Due dates anchor to the date of passing; the estate-admin tasks
// are gated on the user actually being the one settling affairs, so grieving
// users who aren't the executor only see the human-sized tasks.
// suppressCelebration: no confetti anywhere in this event.

import { computeDueDate, daysSince } from './eventDates';

export const LOSS_PHASES = ['FIRST', 'WEEKS', 'MONTHS'];

export const LOSS_PHASE_LABELS = {
  FIRST:  'The first days',
  WEEKS:  'The first weeks',
  MONTHS: 'The months after',
};

// Tasks that only apply if the user is handling the estate (executor or
// next of kin managing their affairs).
const ESTATE_ONLY = new Set([
  'notify-ssa',
  'notify-banks',
  'life-insurance-claim',
  'probate-attorney',
  'notify-credit-bureaus',
  'cancel-accounts',
  'forward-mail',
  'final-tax-return',
  'settle-estate',
]);

const BUNDLE = [
  // ── The first days ──────────────────────────────────────────────
  { id: 'death-certificates',   phase: 'FIRST', cat: 'finance', label: 'Order death certificates (get 10+ copies)',          stakes: 'high',   assistType: 'guidance' },
  { id: 'funeral-arrangements', phase: 'FIRST', cat: 'health',  label: 'Make funeral or memorial arrangements',              stakes: 'high',   assistType: 'guidance' },
  { id: 'notify-people',        phase: 'FIRST', cat: 'home',    label: 'Notify family, friends, and their employer',         stakes: 'medium', assistType: 'guidance' },
  { id: 'secure-home',          phase: 'FIRST', cat: 'home',    label: 'Secure their home, car, and pets',                   stakes: 'high',   assistType: 'guidance' },
  { id: 'locate-will',          phase: 'FIRST', cat: 'finance', label: 'Locate the will and important papers',               stakes: 'high',   assistType: 'guidance' },
  // ── The first weeks ─────────────────────────────────────────────
  { id: 'notify-ssa',           phase: 'WEEKS', cat: 'finance', label: 'Notify Social Security',                             stakes: 'high',   assistType: 'guidance' },
  { id: 'notify-banks',         phase: 'WEEKS', cat: 'finance', label: 'Notify their banks and freeze accounts',             stakes: 'high',   assistType: 'guidance' },
  { id: 'life-insurance-claim', phase: 'WEEKS', cat: 'finance', label: 'File life insurance claims',                         stakes: 'high',   assistType: 'guidance' },
  { id: 'probate-attorney',     phase: 'WEEKS', cat: 'finance', label: 'Talk to a probate or estate attorney',               stakes: 'high',   assistType: 'providers', searchQuery: 'probate estate attorney', windowDays: 14 },
  { id: 'notify-credit-bureaus', phase: 'WEEKS', cat: 'finance', label: 'Notify credit bureaus to prevent identity theft',   stakes: 'high',   assistType: 'guidance' },
  { id: 'cancel-accounts',      phase: 'WEEKS', cat: 'finance', label: 'Cancel subscriptions, utilities, and services',      stakes: 'medium', assistType: 'guidance' },
  { id: 'forward-mail',         phase: 'WEEKS', cat: 'home',    label: 'Forward their mail',                                 stakes: 'medium', assistType: 'guidance' },
  { id: 'grief-support',        phase: 'WEEKS', cat: 'health',  label: 'Consider grief support or a counselor',              stakes: 'medium', assistType: 'providers', searchQuery: 'grief counselor', windowDays: 14 },
  // ── The months after ────────────────────────────────────────────
  { id: 'final-tax-return',     phase: 'MONTHS', cat: 'finance', label: 'File their final tax return',                       stakes: 'high',   assistType: 'guidance' },
  { id: 'settle-estate',        phase: 'MONTHS', cat: 'finance', label: 'Distribute assets and settle the estate',           stakes: 'high',   assistType: 'guidance' },
  { id: 'update-own-will',      phase: 'MONTHS', cat: 'finance', label: 'Update your own will and beneficiaries',            stakes: 'medium', assistType: 'guidance_companies' },
];

// Days after the date of passing that each phase's tasks come due.
const PHASE_DUE_OFFSETS = { FIRST: 10, WEEKS: 45, MONTHS: 180 };
const DUE_OFFSET_OVERRIDES = {
  'grief-support':    30,
  'final-tax-return': 300, // due with the next tax season, not in the raw weeks
};

// How far back the loss was determines which phases go on the
// "already handled?" checklist.
export function retroactivePhases(answers) {
  const d = daysSince(answers?.date);
  if (d == null) return [];
  if (d > 240) return ['FIRST', 'WEEKS', 'MONTHS'];
  if (d > 75)  return ['FIRST', 'WEEKS'];
  if (d > 21)  return ['FIRST'];
  return [];
}

function passesGates(t, answers) {
  if (ESTATE_ONLY.has(t.id) && !answers?.handlingEstate) return false;
  return true;
}

export function retroactiveCandidates(answers) {
  const phases = new Set(retroactivePhases(answers));
  if (phases.size === 0) return [];
  return BUNDLE.filter(t => phases.has(t.phase) && passesGates(t, answers));
}

export function tasksForIntake(answers) {
  const alreadyDone = new Set(answers?.alreadyDone || []);
  return BUNDLE
    .filter(t => !alreadyDone.has(t.id) && passesGates(t, answers))
    .map(t => ({
      ...t,
      dueDate: computeDueDate(answers?.date, DUE_OFFSET_OVERRIDES[t.id] ?? PHASE_DUE_OFFSETS[t.phase]),
    }));
}

export const LOSS_OF_LOVED_ONE = {
  id:    'loss-of-loved-one',
  label: 'Loss of a loved one',
  suppressCelebration: true,
  bundle: BUNDLE,
  phases: LOSS_PHASES,
  phaseLabels: LOSS_PHASE_LABELS,
  retroactiveCandidates,
  tasksForIntake,
  intake: {
    steps: [
      {
        type: 'date',
        key:  'date',
        question: 'When did they pass?',
        help: "We're sorry you're going through this. A rough date is fine — it helps Mitzy pace things gently.",
        allowPast: true,
      },
      {
        type: 'booleans',
        question: 'One question, so Mitzy only shows what applies.',
        help: "The estate and paperwork tasks only apply if this is yours to carry.",
        fields: [
          { key: 'handlingEstate', label: 'Are you helping settle their affairs (executor or next of kin)?' },
        ],
      },
    ],
  },
};
