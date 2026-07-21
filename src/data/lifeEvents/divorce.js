// Divorce / separation life event bundle. Unlike new-baby there's no fixed
// anchor date, so due dates are offsets from today, paced by how far along
// the user already is (intake `stage`). Celebration confetti is suppressed
// event-wide — even the empowering tasks sit inside a hard season.

import { computeDueDate, todayIso } from './eventDates';

export const DIVORCE_PHASES = ['EARLY', 'LEGAL', 'AFTER'];

export const DIVORCE_PHASE_LABELS = {
  EARLY: 'Getting started',
  LEGAL: 'During the process',
  AFTER: "After it's final",
};

// Gates from intake answers (and profile — hasKids is injected from the
// user's existing profile so we never ask what Mitzy already knows).
const KIDS_ONLY             = new Set(['plan-telling-kids', 'parenting-plan']);
const SHARED_FINANCES_ONLY  = new Set(['separate-accounts']);
const REQUIRES_BENEFICIARIES = new Set(['update-beneficiaries']);

const BUNDLE = [
  // ── Getting started ─────────────────────────────────────────────
  { id: 'consult-attorney', phase: 'EARLY', cat: 'finance', label: 'Consult a family law attorney', stakes: 'high', assistType: 'providers', searchQuery: 'family law attorney', windowDays: 14,
    why: "A lawyer can tell you what's actually at stake before you commit to anything." },
  { id: 'gather-documents', phase: 'EARLY', cat: 'finance', label: 'Gather financial documents (taxes, statements, deeds)', stakes: 'high', assistType: 'guidance',
    why: "Having these ready saves time — and back-and-forth — once things move into the legal process." },
  { id: 'open-own-account', phase: 'EARLY', cat: 'finance', label: 'Open a bank account in your own name', stakes: 'high', assistType: 'guidance',
    why: "Gives you a financial foothold that's entirely yours while everything else gets sorted out." },
  { id: 'check-credit', phase: 'EARLY', cat: 'finance', label: 'Pull your credit report and open a card in your name', stakes: 'medium', assistType: 'guidance',
    why: "Shared debt can still affect your credit even after you separate finances." },
  { id: 'inventory-assets', phase: 'EARLY', cat: 'finance', label: 'List shared assets and debts', stakes: 'medium', assistType: 'guidance',
    why: "A clear list makes the split conversation more concrete and less contentious." },
  { id: 'find-therapist', phase: 'EARLY', cat: 'health', label: 'Line up support — a therapist or counselor', stakes: 'medium', assistType: 'providers', searchQuery: 'therapist counselor', windowDays: 14,
    why: "Having support lined up early makes the rest of this easier to carry." },
  { id: 'plan-telling-kids', phase: 'EARLY', cat: 'health', label: 'Plan how to tell the kids', stakes: 'high', assistType: 'guidance',
    why: "How this gets shared shapes how the kids experience the whole thing." },
  // ── During the process ──────────────────────────────────────────
  { id: 'file-respond-petition', phase: 'LEGAL', cat: 'finance', label: 'File or respond to the divorce petition', stakes: 'high', assistType: 'guidance',
    why: "This officially starts the legal process, and deadlines to respond can be short." },
  { id: 'parenting-plan', phase: 'LEGAL', cat: 'health', label: 'Work out a parenting plan and custody schedule', stakes: 'high', assistType: 'guidance',
    why: "A clear schedule now means fewer decisions to renegotiate later." },
  { id: 'separate-accounts', phase: 'LEGAL', cat: 'finance', label: 'Separate joint accounts and update direct deposit', stakes: 'high', assistType: 'guidance',
    why: "Keeps you from being responsible for charges you no longer control." },
  { id: 'update-health-insurance', phase: 'LEGAL', cat: 'health', label: 'Sort out health insurance coverage', stakes: 'high', assistType: 'guidance',
    why: "Coverage often changes when a marriage ends — worth sorting out before there's a gap." },
  { id: 'housing-plan', phase: 'LEGAL', cat: 'home', label: 'Work out living arrangements', stakes: 'high', assistType: 'guidance',
    why: "Settling this early avoids scrambling once other deadlines hit." },
  // ── After it's final ────────────────────────────────────────────
  { id: 'update-will-divorce', phase: 'AFTER', cat: 'finance', label: 'Update your will and estate documents', stakes: 'high', assistType: 'guidance_companies',
    why: "Old wills often still name your ex — most people don't think to change this until it's pointed out." },
  { id: 'update-beneficiaries', phase: 'AFTER', cat: 'finance', label: 'Update beneficiaries (life insurance, retirement)', stakes: 'high', assistType: 'guidance',
    why: "These don't update automatically when a divorce is final — your ex may still be listed." },
  { id: 'update-emergency-contacts', phase: 'AFTER', cat: 'emergency', label: 'Update emergency contacts (school, doctor, work)', stakes: 'medium', assistType: 'guidance',
    why: "Schools, doctors, and workplaces still have your ex listed until you update it." },
  { id: 'update-tax-withholding', phase: 'AFTER', cat: 'finance', label: 'Update your tax withholding (W-4)', stakes: 'medium', assistType: 'guidance',
    why: "Your filing status changes, and withholding should match it." },
];

// Pacing: how many days from now each phase's tasks come due, per stage.
// Further along = earlier-phase tasks become near-term catch-up items.
const STAGE_DUE_OFFSETS = {
  starting:  { EARLY: 21, LEGAL: 90, AFTER: 210 },
  filed:     { EARLY: 14, LEGAL: 45, AFTER: 150 },
  finalized: { EARLY: 7,  LEGAL: 14, AFTER: 60 },
};

// Phases the user may have already handled, by stage.
const RETRO_PHASES = {
  starting:  [],
  filed:     ['EARLY'],
  finalized: ['EARLY', 'LEGAL'],
};

function passesGates(t, answers) {
  if (KIDS_ONLY.has(t.id) && !answers?.hasKids)                          return false;
  if (SHARED_FINANCES_ONLY.has(t.id) && !answers?.sharedFinances)        return false;
  if (REQUIRES_BENEFICIARIES.has(t.id) && !answers?.hasInsuranceOrRetirement) return false;
  return true;
}

export function retroactiveCandidates(answers) {
  const phases = new Set(RETRO_PHASES[answers?.stage] ?? []);
  if (phases.size === 0) return [];
  return BUNDLE.filter(t => phases.has(t.phase) && passesGates(t, answers));
}

export function tasksForIntake(answers) {
  const alreadyDone = new Set(answers?.alreadyDone || []);
  const offsets = STAGE_DUE_OFFSETS[answers?.stage] ?? STAGE_DUE_OFFSETS.starting;
  const anchor = todayIso();
  return BUNDLE
    .filter(t => !alreadyDone.has(t.id) && passesGates(t, answers))
    .map(t => ({ ...t, dueDate: computeDueDate(anchor, offsets[t.phase]) }));
}

export const DIVORCE = {
  id:    'divorce',
  label: 'Divorce or separation',
  suppressCelebration: true,
  bundle: BUNDLE,
  phases: DIVORCE_PHASES,
  phaseLabels: DIVORCE_PHASE_LABELS,
  retroactiveCandidates,
  tasksForIntake,
  intake: {
    steps: [
      {
        type: 'choice',
        key:  'stage',
        question: 'Where are you in the process?',
        help: "This helps Mitzy pace things and skip what's behind you.",
        options: [
          { value: 'starting',  label: 'Just getting started' },
          { value: 'filed',     label: 'Paperwork filed / in progress' },
          { value: 'finalized', label: "It's final or nearly final" },
        ],
      },
      {
        type: 'booleans',
        question: 'Two quick questions.',
        help: "Some tasks only apply if these do. We'll skip them if not.",
        fields: [
          { key: 'sharedFinances',           label: 'Do you and your ex share finances (joint accounts, cards, or property)?' },
          { key: 'hasInsuranceOrRetirement', label: 'Do you have life insurance or a retirement account?' },
        ],
      },
    ],
  },
};
