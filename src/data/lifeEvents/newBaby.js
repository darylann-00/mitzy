// New-baby life event bundle. Phases (T1/T2/T3/POST) are used for ordering and
// to drive the "already done?" intake screen for users joining mid-pregnancy.
// All bundle tasks become one-time custom_tasks with life_event_id set; the
// existing task pipeline handles status, scheduling, and completion.

import { computeDueDate } from './eventDates';

export const NEW_BABY_PHASES = ['T1', 'T2', 'T3', 'POST'];

export const NEW_BABY_PHASE_LABELS = {
  T1:   'First trimester',
  T2:   'Second trimester',
  T3:   'Third trimester',
  POST: 'After birth',
};

// Tasks where it doesn't make sense to ask "already done?" once the baby has
// arrived — they're either too late to do or pregnancy-only with no after-baby
// equivalent. Filtered out of the post-birth retroactive checklist entirely.
const SKIP_IF_POST_BIRTH = new Set([
  'choose-ob',
  'first-prenatal',
  'choose-hospital',
  'tour-hospital',
  'pre-register-hospital',
  'childbirth-class',
  'birth-plan',
  'hospital-bag',
]);

// Tasks that only apply if the user is carrying the pregnancy themselves.
// Adoption / surrogacy users skip these entirely.
const PREGNANCY_ONLY = new Set([
  'choose-ob',
  'first-prenatal',
  'choose-hospital',
  'tour-hospital',
  'pre-register-hospital',
  'childbirth-class',
  'birth-plan',
  'hospital-bag',
]);

// Tasks gated by intake answers. Filtered out if the user said "no" to the
// corresponding question — Mitzy doesn't surface beneficiary updates for
// accounts the user doesn't have.
const REQUIRES_LIFE_INSURANCE = new Set(['update-life-insurance-bene']);
const REQUIRES_RETIREMENT     = new Set(['update-retirement-bene']);

// Task templates — copy is plain and direct, no confetti suppression needed
// since babies are good news. Stakes are high (admin/legal) and medium
// (setup/prep) to drive sensible scoring against the user's other tasks.
// windowDays = booking lead: how many days before the due date the task
// starts surfacing as "coming up" (defaults to 7 when unset).
const BUNDLE = [
  // ── First trimester ─────────────────────────────────────────────
  { id: 'choose-ob', phase: 'T1', cat: 'health', label: 'Choose an OB or midwife', stakes: 'high', assistType: 'providers', searchQuery: 'OB-GYN or midwife', windowDays: 21,
    why: "Your OB or midwife is with you for every appointment from here on, so it's worth choosing early." },
  { id: 'first-prenatal', phase: 'T1', cat: 'health', label: 'Schedule first prenatal appointment', stakes: 'high', assistType: 'guidance', windowDays: 21,
    why: "Early prenatal visits are when the first key screenings happen." },
  { id: 'choose-hospital', phase: 'T1', cat: 'health', label: 'Research and choose a birth hospital or birth center', stakes: 'high', assistType: 'providers', searchQuery: 'birth hospital or birth center', windowDays: 21,
    why: "Insurance and provider networks narrow this down — easier to sort out early than while you're in labor." },
  // ── Second trimester ────────────────────────────────────────────
  { id: 'tour-hospital', phase: 'T2', cat: 'health', label: 'Tour the birth hospital or birth center', stakes: 'medium', assistType: 'guidance', windowDays: 14,
    why: "Seeing the maternity ward ahead of time makes the day itself feel less unfamiliar." },
  { id: 'pre-register-hospital', phase: 'T2', cat: 'health', label: 'Pre-register at the hospital', stakes: 'medium', assistType: 'guidance',
    why: "Less paperwork to fill out later, while you're in labor." },
  { id: 'choose-pediatrician', phase: 'T2', cat: 'health', label: 'Choose a pediatrician', stakes: 'high', assistType: 'providers', searchQuery: 'pediatrician', windowDays: 21,
    why: "Baby's first visit happens within days of birth, so it helps to have someone chosen already." },
  { id: 'childbirth-class', phase: 'T2', cat: 'health', label: 'Sign up for a childbirth class', stakes: 'medium', assistType: 'guidance', windowDays: 30,
    why: "Classes fill up, and it's easier to fit in before the third trimester gets busy." },
  { id: 'cpr-class', phase: 'T2', cat: 'health', label: 'Sign up for an infant CPR class', stakes: 'medium', assistType: 'guidance', windowDays: 14,
    why: "A skill you hope to never need, but good to have before baby arrives." },
  { id: 'review-leave', phase: 'T2', cat: 'finance', label: 'Review parental leave policy with your employer', stakes: 'high', assistType: 'guidance',
    why: "Knowing your leave and pay ahead of time gives you room to actually plan around it." },
  { id: 'update-will', phase: 'T2', cat: 'finance', label: 'Create or update your will', stakes: 'high', assistType: 'guidance_companies',
    why: "A will names who cares for your child if something happens to you — most people don't have one until this point." },
  // ── Third trimester ─────────────────────────────────────────────
  { id: 'birth-plan', phase: 'T3', cat: 'health', label: 'Write your birth plan', stakes: 'medium', assistType: 'guidance',
    why: "Writing down your preferences means your care team knows them even if you can't say so in the moment." },
  { id: 'install-car-seat', phase: 'T3', cat: 'home', label: 'Install and inspect the car seat', stakes: 'high', assistType: 'guidance',
    why: "Many hospitals won't discharge you without a properly installed car seat." },
  { id: 'set-up-crib', phase: 'T3', cat: 'home', label: 'Set up the crib or bassinet', stakes: 'medium', assistType: 'guidance',
    why: "Easier to put together now than during the sleep-deprived days right after birth." },
  { id: 'hospital-bag', phase: 'T3', cat: 'home', label: 'Pack your hospital bag', stakes: 'medium', assistType: 'guidance',
    why: "Labor can start with little warning — better to have this ready than to scramble." },
  { id: 'add-baby-insurance', phase: 'T3', cat: 'finance', label: 'Add baby to your health insurance plan', stakes: 'high', assistType: 'guidance',
    why: "Most plans have a short window after birth to add a new dependent." },
  { id: 'postpartum-help', phase: 'T3', cat: 'home', label: 'Arrange postpartum help (family, meals, etc.)', stakes: 'medium', assistType: 'guidance',
    why: "The first weeks go easier with help lined up in advance, not scrambled together after the fact." },
  // ── After birth ─────────────────────────────────────────────────
  { id: 'birth-cert', phase: 'POST', cat: 'finance', label: 'Register the birth / apply for birth certificate', stakes: 'high', assistType: 'guidance',
    why: "Almost everything else — the SSN, insurance, a passport later — needs this first." },
  { id: 'ssn', phase: 'POST', cat: 'finance', label: 'Apply for Social Security number', stakes: 'high', assistType: 'guidance',
    why: "You'll need it to add baby to insurance, claim tax credits, and open accounts down the line." },
  { id: 'first-pediatrician', phase: 'POST', cat: 'health', label: 'Schedule first pediatrician visit (3–5 days)', stakes: 'high', assistType: 'guidance',
    why: "This first visit checks weight, feeding, and jaundice in the days right after birth." },
  { id: 'update-life-insurance-bene', phase: 'POST', cat: 'finance', label: 'Update life insurance beneficiaries', stakes: 'high', assistType: 'guidance',
    why: "A new dependent usually means updating who's covered if something happens to you." },
  { id: 'update-retirement-bene', phase: 'POST', cat: 'finance', label: 'Update retirement account beneficiaries', stakes: 'high', assistType: 'guidance',
    why: "Worth double-checking who's listed now that your family's grown." },
];

// ─── Intake-driven helpers ──────────────────────────────────────────

const DAY_MS = 86400000;
const T2_START_DAYS_TO_DUE = 180; // ~26 weeks pregnant
const T3_START_DAYS_TO_DUE = 90;  // ~30 weeks pregnant

// Due dates relative to the baby's due date (negative = before). Phase
// defaults, with per-task overrides where the real deadline is sharper —
// e.g. the first pediatrician visit happens days after birth, not weeks.
const PHASE_DUE_OFFSETS = { T1: -180, T2: -90, T3: -21, POST: 30 };
const DUE_OFFSET_OVERRIDES = {
  'choose-ob':                  -215,
  'first-prenatal':             -210,
  'install-car-seat':           -30,
  'hospital-bag':               -30,
  'add-baby-insurance':          21,  // enrollment window opens at birth
  'first-pediatrician':           5,
  'birth-cert':                  21,
  'ssn':                         45,
  'update-life-insurance-bene':  60,
  'update-retirement-bene':      60,
};

export function daysToDue(dueDateIso) {
  if (!dueDateIso) return null;
  const due = new Date(dueDateIso);
  return Math.floor((due.getTime() - Date.now()) / DAY_MS);
}

export function isPostBirth(answers) {
  if (!answers) return false;
  if (answers.conceptionPath !== 'pregnancy') {
    // Adoption / surrogacy: post-birth iff baby has arrived
    return answers.babyHome === true;
  }
  const days = daysToDue(answers.dueDate);
  return days != null && days < 0;
}

// Which phases should the user be asked "already done?" about, given their
// intake answers? Empty array means no retroactive screen needed.
export function retroactivePhases(answers) {
  if (!answers) return [];
  if (isPostBirth(answers)) return ['T1', 'T2', 'T3'];
  if (answers.conceptionPath !== 'pregnancy') return []; // adoption pre-arrival: no retro
  const days = daysToDue(answers.dueDate);
  if (days == null) return [];
  if (days <= T3_START_DAYS_TO_DUE) return ['T1', 'T2'];
  if (days <= T2_START_DAYS_TO_DUE) return ['T1'];
  return [];
}

// The set of bundle items the user might plausibly have already done, given
// their intake. Used to populate the retroactive checklist.
export function retroactiveCandidates(answers) {
  const phases = retroactivePhases(answers);
  if (phases.length === 0) return [];
  const phaseSet = new Set(phases);
  const post = isPostBirth(answers);
  return BUNDLE.filter(t => {
    if (!phaseSet.has(t.phase)) return false;
    if (post && SKIP_IF_POST_BIRTH.has(t.id)) return false;
    if (t.id && PREGNANCY_ONLY.has(t.id) && answers.conceptionPath !== 'pregnancy') return false;
    return true;
  });
}

// Final task list to create after intake. Filters by conceptionPath, account
// gates, post-birth skips, and any items the user checked off as already done.
// Each surviving task gets a due date anchored to the baby's due date (clamped
// so mid-stream joiners see catch-up tasks as "coming up", not overdue).
export function tasksForIntake(answers) {
  const post = isPostBirth(answers);
  const alreadyDone = new Set(answers?.alreadyDone || []);
  return BUNDLE.filter(t => {
    if (alreadyDone.has(t.id))                                            return false;
    if (PREGNANCY_ONLY.has(t.id) && answers.conceptionPath !== 'pregnancy') return false;
    if (post && SKIP_IF_POST_BIRTH.has(t.id))                              return false;
    if (REQUIRES_LIFE_INSURANCE.has(t.id) && !answers.hasLifeInsurance)    return false;
    if (REQUIRES_RETIREMENT.has(t.id)     && !answers.hasRetirement)       return false;
    return true;
  }).map(t => ({
    ...t,
    dueDate: computeDueDate(answers?.dueDate, DUE_OFFSET_OVERRIDES[t.id] ?? PHASE_DUE_OFFSETS[t.phase]),
  }));
}

export const NEW_BABY = {
  id:    'new-baby',
  label: 'New baby',
  bundle: BUNDLE,
  phases: NEW_BABY_PHASES,
  phaseLabels: NEW_BABY_PHASE_LABELS,
  retroactiveCandidates,
  tasksForIntake,
};
