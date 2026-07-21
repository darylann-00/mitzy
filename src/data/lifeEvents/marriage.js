// Getting married life event bundle. Deliberately the admin side only —
// license, insurance windows, beneficiaries — not wedding planning (venues
// and guest lists are not Mitzy's lane). Name change is its own life event
// (`nameChange.js`) since it isn't unique to marriage. Due dates anchor to
// the wedding date, which can be in the future or the past; for users adding
// the event after the wedding, the before-the-day tasks are moot and skipped
// entirely. Weddings are good news: confetti stays on.

import { computeDueDate, daysSince } from './eventDates';

export const MARRIAGE_PHASES = ['BEFORE', 'AFTER'];

export const MARRIAGE_PHASE_LABELS = {
  BEFORE: 'Before the big day',
  AFTER:  'After the wedding',
};

// Moot once the wedding has happened — you can't get the license for a
// wedding that already occurred.
const SKIP_IF_POST_WEDDING = new Set(['prenup', 'marriage-license']);

// Gates from intake answers. Checked with `=== true` rather than truthiness
// because an unresolved "not sure yet" answer is stored as the string
// 'unsure', which is truthy — a loose check would let those tasks through
// before the user has actually decided.
const COMBINING_ONLY         = new Set(['joint-accounts']);
const REQUIRES_BENEFICIARIES = new Set(['update-beneficiaries']);

const BUNDLE = [
  // ── Before the big day ──────────────────────────────────────────
  { id: 'prenup', phase: 'BEFORE', cat: 'finance', label: 'Decide whether you want a prenup', stakes: 'medium', assistType: 'guidance',
    why: "This is easier to think through calmly beforehand than to figure out later." },
  { id: 'marriage-license', phase: 'BEFORE', cat: 'finance', label: 'Get your marriage license', stakes: 'high', assistType: 'guidance', windowDays: 21,
    why: "Most states require this before the ceremony, and licenses often expire after a set window — timing matters." },
  // ── After the wedding ───────────────────────────────────────────
  { id: 'marriage-certificates', phase: 'AFTER', cat: 'finance', label: 'Order certified copies of your marriage certificate', stakes: 'high', assistType: 'guidance',
    why: "You'll need certified copies for the name change, insurance, and benefits paperwork ahead." },
  { id: 'add-spouse-insurance', phase: 'AFTER', cat: 'health', label: 'Review health insurance — add your spouse or pick one plan', stakes: 'high', assistType: 'guidance',
    why: "Marriage opens a special enrollment window that typically closes within a couple months of the wedding." },
  { id: 'joint-accounts', phase: 'AFTER', cat: 'finance', label: 'Set up joint accounts', stakes: 'medium', assistType: 'guidance',
    why: "Worth deciding deliberately rather than merging finances by default." },
  { id: 'update-beneficiaries', phase: 'AFTER', cat: 'finance', label: 'Update beneficiaries (life insurance, retirement)', stakes: 'high', assistType: 'guidance',
    why: "These don't update automatically when you marry — old beneficiaries stay listed until you change them." },
  { id: 'update-tax-withholding', phase: 'AFTER', cat: 'finance', label: 'Update your tax withholding (W-4)', stakes: 'medium', assistType: 'guidance',
    why: "Your tax bracket changes when you marry — adjusting withholding now avoids a surprise at filing time." },
  { id: 'update-will', phase: 'AFTER', cat: 'finance', label: 'Create or update your will and estate documents', stakes: 'high', assistType: 'guidance_companies',
    why: "Marriage is one of the few moments worth reviewing who's named in your will and other estate documents." },
  { id: 'emergency-contacts', phase: 'AFTER', cat: 'emergency', label: 'Update emergency contacts and records', stakes: 'medium', assistType: 'guidance',
    why: "Work, school, and medical records still list your old emergency contact until you update them." },
];

// Due dates relative to the wedding date (negative = before). The health
// insurance task is deliberately tight: marriage opens a special enrollment
// window that typically closes 30–60 days after the wedding.
const PHASE_DUE_OFFSETS = { BEFORE: -30, AFTER: 30 };
const DUE_OFFSET_OVERRIDES = {
  'prenup':                -90,
  'marriage-license':      -21,
  'marriage-certificates':  21,
  'add-spouse-insurance':   21,
  'update-tax-withholding': 45,
  'joint-accounts':         60,
  'update-beneficiaries':   60,
  'update-will':            90,
  'emergency-contacts':     90,
};

function isPostWedding(answers) {
  const d = daysSince(answers?.date);
  return d != null && d > 0;
}

function passesGates(t, answers) {
  if (COMBINING_ONLY.has(t.id) && answers?.combiningFinances !== true)        return false;
  if (REQUIRES_BENEFICIARIES.has(t.id) && answers?.hasInsuranceOrRetirement !== true) return false;
  return true;
}

// Users adding the event a while after the wedding may have handled the
// paperwork already; offer the after-phase checklist once it's plausibly done.
export function retroactiveCandidates(answers) {
  const d = daysSince(answers?.date);
  if (d == null || d <= 30) return [];
  return BUNDLE.filter(t => t.phase === 'AFTER' && passesGates(t, answers));
}

export function tasksForIntake(answers) {
  const post = isPostWedding(answers);
  const alreadyDone = new Set(answers?.alreadyDone || []);
  return BUNDLE
    .filter(t => {
      if (alreadyDone.has(t.id))                      return false;
      if (post && SKIP_IF_POST_WEDDING.has(t.id))     return false;
      if (!passesGates(t, answers))                   return false;
      return true;
    })
    .map(t => ({
      ...t,
      dueDate: computeDueDate(answers?.date, DUE_OFFSET_OVERRIDES[t.id] ?? PHASE_DUE_OFFSETS[t.phase]),
    }));
}

export const MARRIAGE = {
  id:    'marriage',
  label: 'Getting married',
  bundle: BUNDLE,
  phases: MARRIAGE_PHASES,
  phaseLabels: MARRIAGE_PHASE_LABELS,
  retroactiveCandidates,
  tasksForIntake,
  intake: {
    steps: [
      {
        type: 'date',
        key:  'date',
        question: "When's the wedding — or when was it?",
        help: 'Either works — Mitzy paces the paperwork around the date. An estimate is fine.',
      },
      {
        type: 'booleans',
        question: 'A few quick questions.',
        help: "Some tasks only apply if these do. If you're not sure yet, say so — you can settle it later from the event card in your Profile.",
        fields: [
          // A real open decision this early on — offers "not sure yet" so it
          // can be answered later without re-running the whole intake.
          { key: 'combiningFinances',        label: 'Are you planning to combine finances (joint accounts)?', allowUnsure: true },
          { key: 'hasInsuranceOrRetirement', label: 'Do you have life insurance or a retirement account?' },
        ],
      },
    ],
  },
};
