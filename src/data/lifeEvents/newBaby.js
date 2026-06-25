// New-baby life event bundle. Phases (T1/T2/T3/POST) are used for ordering and
// to drive the "already done?" intake screen for users joining mid-pregnancy.
// All bundle tasks become one-time custom_tasks with life_event_id set; the
// existing task pipeline handles status, scheduling, and completion.

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
const BUNDLE = [
  // ── First trimester ─────────────────────────────────────────────
  { id: 'choose-ob',              phase: 'T1', cat: 'health',  label: 'Choose an OB or midwife',                      stakes: 'high',   assistType: 'providers',         searchQuery: 'OB-GYN or midwife' },
  { id: 'first-prenatal',         phase: 'T1', cat: 'health',  label: 'Schedule first prenatal appointment',          stakes: 'high',   assistType: 'guidance' },
  { id: 'choose-hospital',        phase: 'T1', cat: 'health',  label: 'Research and choose a birth hospital or birth center', stakes: 'high',   assistType: 'providers',         searchQuery: 'birth hospital or birth center' },
  // ── Second trimester ────────────────────────────────────────────
  { id: 'tour-hospital',          phase: 'T2', cat: 'health',  label: 'Tour the birth hospital or birth center',      stakes: 'medium', assistType: 'guidance' },
  { id: 'pre-register-hospital',  phase: 'T2', cat: 'health',  label: 'Pre-register at the hospital',                 stakes: 'medium', assistType: 'guidance' },
  { id: 'choose-pediatrician',    phase: 'T2', cat: 'health',  label: 'Choose a pediatrician',                        stakes: 'high',   assistType: 'providers',         searchQuery: 'pediatrician' },
  { id: 'childbirth-class',       phase: 'T2', cat: 'health',  label: 'Sign up for a childbirth class',               stakes: 'medium', assistType: 'guidance' },
  { id: 'cpr-class',              phase: 'T2', cat: 'health',  label: 'Sign up for an infant CPR class',              stakes: 'medium', assistType: 'guidance' },
  { id: 'review-leave',           phase: 'T2', cat: 'finance', label: 'Review parental leave policy with your employer', stakes: 'high',   assistType: 'guidance' },
  { id: 'update-will',            phase: 'T2', cat: 'finance', label: 'Create or update your will',                   stakes: 'high',   assistType: 'guidance_companies' },
  // ── Third trimester ─────────────────────────────────────────────
  { id: 'birth-plan',             phase: 'T3', cat: 'health',  label: 'Write your birth plan',                        stakes: 'medium', assistType: 'guidance' },
  { id: 'install-car-seat',       phase: 'T3', cat: 'home',    label: 'Install and inspect the car seat',             stakes: 'high',   assistType: 'guidance' },
  { id: 'set-up-crib',            phase: 'T3', cat: 'home',    label: 'Set up the crib or bassinet',                  stakes: 'medium', assistType: 'guidance' },
  { id: 'hospital-bag',           phase: 'T3', cat: 'home',    label: 'Pack your hospital bag',                       stakes: 'medium', assistType: 'guidance' },
  { id: 'add-baby-insurance',     phase: 'T3', cat: 'finance', label: 'Add baby to your health insurance plan',       stakes: 'high',   assistType: 'guidance' },
  { id: 'postpartum-help',        phase: 'T3', cat: 'home',    label: 'Arrange postpartum help (family, meals, etc.)', stakes: 'medium', assistType: 'guidance' },
  // ── After birth ─────────────────────────────────────────────────
  { id: 'birth-cert',             phase: 'POST', cat: 'finance', label: 'Register the birth / apply for birth certificate', stakes: 'high',   assistType: 'guidance' },
  { id: 'ssn',                    phase: 'POST', cat: 'finance', label: 'Apply for Social Security number',           stakes: 'high',   assistType: 'guidance' },
  { id: 'first-pediatrician',     phase: 'POST', cat: 'health',  label: 'Schedule first pediatrician visit (3–5 days)', stakes: 'high',   assistType: 'guidance' },
  { id: 'update-life-insurance-bene', phase: 'POST', cat: 'finance', label: 'Update life insurance beneficiaries',    stakes: 'high',   assistType: 'guidance' },
  { id: 'update-retirement-bene', phase: 'POST', cat: 'finance', label: 'Update retirement account beneficiaries',    stakes: 'high',   assistType: 'guidance' },
];

export const NEW_BABY = {
  id:    'new-baby',
  label: 'New baby',
  bundle: BUNDLE,
  phaseLabels: NEW_BABY_PHASE_LABELS,
};

// ─── Intake-driven helpers ──────────────────────────────────────────

const DAY_MS = 86400000;
const T2_START_DAYS_TO_DUE = 180; // ~26 weeks pregnant
const T3_START_DAYS_TO_DUE = 90;  // ~30 weeks pregnant

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
  });
}
