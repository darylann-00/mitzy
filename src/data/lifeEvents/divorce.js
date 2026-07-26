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
    why: "A lawyer can tell you what's actually at stake before you commit to anything.",
    guidance: "1. Search for family law attorneys in your area or ask for referrals from trusted friends. 2. Call 3–4 offices and ask about initial consultation fees (often free or $100–300). 3. Prepare a brief overview of your situation and ask what documents they'll want to review. 4. At the consultation, ask what their retainer is, how they bill, and what happens if things get contested." },
  { id: 'gather-documents', phase: 'EARLY', cat: 'finance', label: 'Gather financial documents (taxes, statements, deeds)', stakes: 'high', assistType: 'guidance',
    why: "Having these ready saves time — and back-and-forth — once things move into the legal process.",
    guidance: "1. Pull your last 2–3 years of tax returns (you and your spouse) from your files or download from your tax preparer. 2. Get statements for all joint bank and investment accounts — last 3 months at minimum. 3. Find property deeds in your files or county records online. 4. Collect statements for any retirement accounts, 401ks, IRAs, HSAs. 5. Gather mortgage or loan documents if you have them." },
  { id: 'open-own-account', phase: 'EARLY', cat: 'finance', label: 'Open a bank account in your own name', stakes: 'high', assistType: 'guidance',
    why: "Gives you a financial foothold that's entirely yours while everything else gets sorted out.",
    guidance: "1. Choose a bank or credit union — compare fees and minimum balances. 2. Go in person or open online — you'll need your ID, Social Security number, and often an initial deposit ($25–100 typically). 3. Get your account number and routing number. 4. If your paycheck goes to a joint account, set up direct deposit to this new account or plan to transfer funds weekly." },
  { id: 'check-credit', phase: 'EARLY', cat: 'finance', label: 'Pull your credit report and open a card in your name', stakes: 'medium', assistType: 'guidance',
    why: "Shared debt can still affect your credit even after you separate finances.",
    guidance: "1. Go to annualcreditreport.com (free, official source) and pull your report from all three bureaus — Equifax, Experian, TransUnion. 2. Review the report for inaccuracies and check what joint accounts are listed. 3. Contact your creditors to separate any joint cards before the divorce finalizes — they'll move the balance to one person's name. 4. Apply for a credit card in your name only to build independent credit history." },
  { id: 'inventory-assets', phase: 'EARLY', cat: 'finance', label: 'List shared assets and debts', stakes: 'medium', assistType: 'guidance',
    why: "A clear list makes the split conversation more concrete and less contentious.",
    guidance: "1. List the house, car, and other real property with approximate values. 2. List bank and investment accounts with current balances. 3. List retirement accounts (401k, IRA, etc.) with balances. 4. List all debts — mortgage, car loans, credit cards, student loans — with balances. 5. Add personal items of high value — art, jewelry, collectibles. 6. Use your last joint tax return and account statements as a reference to make sure you haven't missed anything." },
  { id: 'find-therapist', phase: 'EARLY', cat: 'health', label: 'Line up support — a therapist or counselor', stakes: 'medium', assistType: 'providers', searchQuery: 'therapist counselor', windowDays: 14,
    why: "Having support lined up early makes the rest of this easier to carry.",
    guidance: "1. Ask your doctor, friends, or your company's EAP (Employee Assistance Program) for referrals. 2. Search Psychology Today or Therapyden for therapists in your area who specialize in divorce or family issues. 3. Call a few and ask if they're taking new clients, their rates, and whether they accept your insurance. 4. Ask if they've worked with divorced people or co-parenting situations." },
  { id: 'plan-telling-kids', phase: 'EARLY', cat: 'health', label: 'Plan how to tell the kids', stakes: 'high', assistType: 'guidance',
    why: "How this gets shared shapes how the kids experience the whole thing.",
    guidance: "1. Decide with your spouse on timing and basic talking points before the conversation. 2. Plan to tell them together, in a calm moment — not after an argument. 3. Keep it simple: explain that you both love them and that this is about your relationship, not anything they did. 4. Prepare answers for 'Where will I live?' and 'Will I still see both of you?' 5. Let them ask questions and reassure them that both parents will stay involved." },
  // ── During the process ──────────────────────────────────────────
  { id: 'file-respond-petition', phase: 'LEGAL', cat: 'finance', label: 'File or respond to the divorce petition', stakes: 'high', assistType: 'guidance',
    why: "This officially starts the legal process, and deadlines to respond can be short.",
    guidance: "1. If you're filing first, your attorney will prepare the petition with your information and grounds for divorce. 2. You'll file it with your county clerk's office — usually with a filing fee of $200–500. 3. Your spouse will be served a copy — this officially starts the process. 4. If your spouse files first, you'll receive papers with a deadline to respond — usually 20–30 days. 5. Work with your attorney to prepare your response; missing the deadline has serious consequences." },
  { id: 'parenting-plan', phase: 'LEGAL', cat: 'health', label: 'Work out a parenting plan and custody schedule', stakes: 'high', assistType: 'guidance',
    why: "A clear schedule now means fewer decisions to renegotiate later.",
    guidance: "1. Decide whether you want joint custody, sole custody, or some other arrangement. 2. Create a schedule — which parent has which days/weeks, holiday rotations, school breaks. 3. Cover logistics: who handles school decisions, medical decisions, where pickups happen. 4. Address communication between ex-partners (email, text, or co-parenting app like OurFamilyWizard). 5. Write it down — courts want specifics, not verbal agreements. 6. Your attorney will file this as part of the divorce." },
  { id: 'separate-accounts', phase: 'LEGAL', cat: 'finance', label: 'Separate joint accounts and update direct deposit', stakes: 'high', assistType: 'guidance',
    why: "Keeps you from being responsible for charges you no longer control.",
    guidance: "1. Contact your bank and credit card companies to separate joint accounts — ask what they need from both parties. 2. Close joint credit cards or have one person take ownership; don't leave them open and shared. 3. Update your direct deposit with payroll to go to your new solo bank account. 4. Set up a process to handle shared bills during the separation — decide who pays what. 5. Cancel any joint subscriptions or auto-pays and set up your own accounts." },
  { id: 'update-health-insurance', phase: 'LEGAL', cat: 'health', label: 'Sort out health insurance coverage', stakes: 'high', assistType: 'guidance',
    why: "Coverage often changes when a marriage ends — worth sorting out before there's a gap.",
    guidance: "1. Check your current coverage — is it through your spouse's employer or your own? 2. If it's through your spouse's job, ask the HR department about COBRA continuation (usually available for up to 36 months). 3. If you lose coverage, check healthcare.gov for marketplace plans or your state's insurance marketplace. 4. If you have kids, they may stay on your spouse's plan temporarily — confirm this in your divorce agreement. 5. Update any existing policies to remove your spouse as a dependent or beneficiary." },
  { id: 'housing-plan', phase: 'LEGAL', cat: 'home', label: 'Work out living arrangements', stakes: 'high', assistType: 'guidance',
    why: "Settling this early avoids scrambling once other deadlines hit.",
    guidance: "1. Decide who stays in the home or if you both leave. 2. If one person stays, decide how the mortgage, property tax, and maintenance get handled. 3. If both are leaving, plan the timeline — does one person move out immediately or do you both transition? 4. If renting, one or both of you will need a new lease or to be removed from the current one. 5. Discuss this with your attorney before agreeing — it affects the property settlement." },
  // ── After it's final ────────────────────────────────────────────
  { id: 'update-will-divorce', phase: 'AFTER', cat: 'finance', label: 'Update your will and estate documents', stakes: 'high', assistType: 'guidance_companies',
    why: "Old wills often still name your ex — most people don't think to change this until it's pointed out.",
    guidance: "1. Contact an attorney or use a service like LegalZoom or Nolo to update your will. 2. If your current will names your ex-spouse as executor, beneficiary, or guardian — change it. 3. Update your power of attorney and healthcare proxy documents — remove your ex. 4. File the new will with your attorney or keep it in a safe place and tell your executor where it is. 5. Some states automatically revoke bequests to an ex-spouse at divorce, but don't rely on that — update proactively." },
  { id: 'update-beneficiaries', phase: 'AFTER', cat: 'finance', label: 'Update beneficiaries (life insurance, retirement)', stakes: 'high', assistType: 'guidance',
    why: "These don't update automatically when a divorce is final — your ex may still be listed.",
    guidance: "1. Call your life insurance company (or check your policy) to see who's listed as beneficiary. 2. Request a beneficiary change form and submit it in writing. 3. Do the same for retirement accounts (401k, IRA, Roth IRA) — call the plan administrator. 4. Check any annuities or other investment accounts. 5. Ask your employer's benefits office for a list of any benefits with named beneficiaries. 6. Update your will too in case there's anything your will covers." },
  { id: 'update-emergency-contacts', phase: 'AFTER', cat: 'emergency', label: 'Update emergency contacts (school, doctor, work)', stakes: 'medium', assistType: 'guidance',
    why: "Schools, doctors, and workplaces still have your ex listed until you update it.",
    guidance: "1. Contact your kids' school and provide updated emergency contact information — remove your ex or clarify that both parents should be contacted. 2. Call your doctor's office and update records to remove your spouse. 3. Email your HR department to update emergency contacts, beneficiaries on any company benefits, and your personal information. 4. Update any other regular contacts: dentist, childcare provider, kids' activities, pediatrician." },
  { id: 'update-tax-withholding', phase: 'AFTER', cat: 'finance', label: 'Update your tax withholding (W-4)', stakes: 'medium', assistType: 'guidance',
    why: "Your filing status changes, and withholding should match it.",
    guidance: "1. Get a new W-4 from your HR department or download it from irs.gov. 2. Update your filing status to Single (or Head of Household if you have dependents) and adjust the number of dependents. 3. Use the IRS Tax Withholding Estimator on irs.gov to check whether your withholding amount makes sense for your new situation. 4. Submit the completed form to your payroll department — changes take effect on your next paycheck." },
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
