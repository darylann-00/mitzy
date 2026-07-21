// Changing your name life event bundle. Split out from marriage — a name
// change can follow marriage, divorce, or be its own decision entirely, so
// it stands on its own rather than living inside another event's intake.
// Anchors to a start date the user can set in the past or future. No
// suppressCelebration — this is usually a positive step regardless of why
// someone's doing it.

import { computeDueDate, daysSince } from './eventDates';

export const NAME_CHANGE_PHASES = ['CORE', 'REST'];

export const NAME_CHANGE_PHASE_LABELS = {
  CORE: 'Start here',
  REST: 'Everywhere else',
};

// Most other institutions check your name against these two records first,
// so they come due well ahead of everything else.
const BUNDLE = [
  { id: 'update-ssn-card', phase: 'CORE', cat: 'finance', label: 'Update your name with Social Security', stakes: 'high', assistType: 'guidance',
    why: "Almost everything else — your license, bank, employer — checks against this record first." },
  { id: 'update-drivers-license', phase: 'CORE', cat: 'finance', label: "Update your driver's license or state ID", stakes: 'high', assistType: 'guidance',
    why: "Most other places ask to see this as proof the name change happened." },
  { id: 'update-passport', phase: 'REST', cat: 'finance', label: 'Update your passport', stakes: 'medium', assistType: 'guidance',
    why: "Only matters if you travel internationally, but it can take weeks — worth starting early." },
  { id: 'update-bank-accounts', phase: 'REST', cat: 'finance', label: 'Update your name on bank accounts and cards', stakes: 'high', assistType: 'guidance',
    why: "Your name needs to match your ID for the bank to keep serving you without friction." },
  { id: 'update-employer', phase: 'REST', cat: 'finance', label: 'Update your name with your employer or HR', stakes: 'high', assistType: 'guidance',
    why: "Payroll and tax withholding are filed under a name — a mismatch can hold up your paycheck." },
  { id: 'update-health-insurance', phase: 'REST', cat: 'health', label: 'Update your name with your health insurance', stakes: 'high', assistType: 'guidance',
    why: "Claims can get denied if the name on file doesn't match your ID." },
  { id: 'update-voter-registration', phase: 'REST', cat: 'finance', label: 'Update your voter registration', stakes: 'low', assistType: 'guidance',
    why: "A quick one, but easy to forget until an election is already close." },
  { id: 'update-utilities-lease', phase: 'REST', cat: 'home', label: 'Update utilities, lease, or mortgage documents', stakes: 'medium', assistType: 'guidance',
    why: "Keeps your name consistent on the paperwork tied to where you live." },
  { id: 'update-will-name', phase: 'REST', cat: 'finance', label: 'Update your will and estate documents', stakes: 'medium', assistType: 'guidance_companies',
    why: "Documents under your old name can slow things down for the people you've named in them." },
  { id: 'update-medical-records', phase: 'REST', cat: 'health', label: "Update your name with your doctor's office and pharmacy", stakes: 'low', assistType: 'guidance',
    why: "Keeps your records and prescriptions filed under the right name." },
  { id: 'update-subscriptions', phase: 'REST', cat: 'finance', label: 'Update your name on subscriptions and accounts', stakes: 'low', assistType: 'guidance',
    why: "The small stuff — streaming, shopping, loyalty accounts — worth a pass once the big ones are done." },
];

const PHASE_DUE_OFFSETS = { CORE: 14, REST: 45 };

// Which phases to offer on the "already handled?" checklist, based on how
// long ago the user started (or says they started).
export function retroactivePhases(answers) {
  const d = daysSince(answers?.date);
  if (d == null) return [];
  if (d > 45) return ['CORE', 'REST'];
  if (d > 14) return ['CORE'];
  return [];
}

export function retroactiveCandidates(answers) {
  const phases = new Set(retroactivePhases(answers));
  if (phases.size === 0) return [];
  return BUNDLE.filter(t => phases.has(t.phase));
}

export function tasksForIntake(answers) {
  const alreadyDone = new Set(answers?.alreadyDone || []);
  return BUNDLE
    .filter(t => !alreadyDone.has(t.id))
    .map(t => ({ ...t, dueDate: computeDueDate(answers?.date, PHASE_DUE_OFFSETS[t.phase]) }));
}

export const NAME_CHANGE = {
  id:    'name-change',
  label: 'Changing your name',
  bundle: BUNDLE,
  phases: NAME_CHANGE_PHASES,
  phaseLabels: NAME_CHANGE_PHASE_LABELS,
  retroactiveCandidates,
  tasksForIntake,
  intake: {
    steps: [
      {
        type: 'date',
        key:  'date',
        question: 'When did you start — or when do you plan to start?',
        help: "Doesn't need to be exact. It just helps Mitzy pace the paperwork.",
      },
    ],
  },
};
