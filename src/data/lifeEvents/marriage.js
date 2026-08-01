// Getting married life event bundle. Deliberately the admin side only —
// license, insurance windows, beneficiaries — not wedding planning (venues
// and guest lists are not Mitzy's lane). Name change is its own life event
// (`nameChange.js`) since it isn't unique to marriage. Due dates anchor to
// the wedding date, which can be in the future or the past; for users adding
// the event after the wedding, the before-the-day tasks are moot and skipped
// entirely. Weddings are good news: confetti stays on.

import { computeDueDate, daysSince } from './eventDates';
import { officialLink } from '../officialLinks';

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
    why: "This is easier to think through calmly beforehand than to figure out later.",
    guidance: "1. Talk with a family lawyer about what a prenup covers and whether it makes sense for your situation. 2. Have an open conversation with your partner about your financial goals, debts, and assets. 3. If you both decide to pursue one, each hire a separate lawyer — courts may void a prenup if only one spouse had representation. 4. Draft the agreement at least a few weeks before the wedding so neither party feels rushed. 5. Both sign and notarize it before the ceremony." },
  { id: 'marriage-license', phase: 'BEFORE', cat: 'finance', label: 'Get your marriage license', stakes: 'high', assistType: 'jurisdiction', windowDays: 21,
    why: "Most states require this before the ceremony, and licenses often expire after a set window — timing matters.",
    guidance: "1. Check your state's marriage license requirements online — rules vary on residency, waiting periods, and required documentation. 2. Visit your county courthouse or clerk's office with your partner, bringing your ID, birth certificate, and Social Security card. 3. Complete the application form and pay a fee. Your county sets this fee — ask the clerk when you call to make an appointment. 4. Understand your state's waiting period — some are immediate, others require a 1–3 day waiting period before the ceremony. 5. Keep the signed license safe after the ceremony — your officiant will sign it, and you'll need it for vital records and name changes." },
  // ── After the wedding ───────────────────────────────────────────
  { id: 'marriage-certificates', phase: 'AFTER', cat: 'finance', label: 'Order certified copies of your marriage certificate', stakes: 'high', assistType: 'jurisdiction',
    why: "You'll need certified copies for the name change, insurance, and benefits paperwork ahead.",
    guidance: `1. Contact the vital records office in the county where you were married — this is usually the county clerk's office or health department, and ${officialLink('vital-records', 'the CDC directory')} lists the right one for every state. 2. Request 3–5 certified copies of your marriage certificate — you'll need them for name change, Social Security, insurance, and your will. 3. There's a fee per copy, which your county sets — ask the clerk when you call. Processing usually takes 1–2 weeks. 4. Ask about rush processing if you need them sooner — fees may apply. 5. Keep the originals in a safe place and use copies for all applications.` },
  { id: 'add-spouse-insurance', phase: 'AFTER', cat: 'health', label: 'Review health insurance — add your spouse or pick one plan', stakes: 'high', assistType: 'guidance',
    why: "Marriage opens a special enrollment window that typically closes within a couple months of the wedding.",
    guidance: `1. Check whether your spouse has coverage through their employer — if so, compare plans side-by-side with yours on cost, deductible, and coverage. 2. If both of you work, decide whether to add them to your plan, use their plan, or keep separate coverage. 3. Contact your HR or insurance company within the first 30–60 days of marriage — marriage qualifies for special enrollment outside open enrollment. 4. Submit required documents: marriage certificate, spouse's ID, and employer information if they have coverage. 5. If your spouse has a pre-existing condition or takes regular medications, verify coverage details before finalizing the switch. 6. If either of you buys your own plan rather than getting it through work, marriage opens a ${officialLink('healthcare-sep', 'Special Enrollment Period')} with its own deadline.` },
  { id: 'joint-accounts', phase: 'AFTER', cat: 'finance', label: 'Set up joint accounts', stakes: 'medium', assistType: 'guidance',
    why: "Worth deciding deliberately rather than merging finances by default.",
    guidance: "1. Discuss which types of accounts make sense to combine — checking, savings, investment accounts — and which to keep separate. 2. Visit your bank together or set up an account online with both names on the signature card. 3. Decide on account permissions — do both people need to approve large withdrawals, or just access? 4. Transfer money in as agreed and update automatic deposits or bill payments. 5. Keep good records of each person's contributions if you plan to track separate property for tax or estate purposes." },
  { id: 'update-beneficiaries', phase: 'AFTER', cat: 'finance', label: 'Update beneficiaries (life insurance, retirement)', stakes: 'high', assistType: 'guidance',
    why: "These don't update automatically when you marry — old beneficiaries stay listed until you change them.",
    guidance: "1. Gather your life insurance policies, 401k, IRA, and any other accounts with beneficiary designations. 2. Log into each account or call the provider and request a beneficiary update form. 3. Decide who to name as primary and contingent — most people name their spouse, but be deliberate about it if you have children from a previous relationship or assets you're keeping separate. 4. Submit the forms and keep copies for your records. 5. Review every 2–3 years or after major life changes — beneficiary designations override what's in your will, so they need to match your intent." },
  { id: 'update-tax-withholding', phase: 'AFTER', cat: 'finance', label: 'Update your tax withholding (W-4)', stakes: 'medium', assistType: 'guidance',
    why: "Your tax bracket changes when you marry — adjusting withholding now avoids a surprise at filing time.",
    guidance: `1. Get the current W-4 from your HR department, or download it from ${officialLink('irs-w4', 'the IRS Form W-4 page')}. 2. Use the IRS withholding calculator to estimate your new filing status (Married Filing Jointly or Married Filing Separately) and whether your withholding has changed. 3. Complete the form with your new filing status and any other changes, then submit it to payroll or HR. 4. Changes take effect on your next paycheck. 5. If you both work, compare filing jointly against filing separately before you set withholding — joint comes out lower for most couples, but separate can win if one of you has large medical bills or income-driven student loan payments.` },
  { id: 'update-will', phase: 'AFTER', cat: 'finance', label: 'Create or update your will and estate documents', stakes: 'high', assistType: 'guidance_companies',
    why: "Marriage is one of the few moments worth reviewing who's named in your will and other estate documents.",
    guidance: "1. If you don't have a will, use an online service like LegalZoom or Nolo, or hire a lawyer — marriage is the right time to make one. 2. Decide who you want as executor and primary beneficiary, and name contingent beneficiaries in case you both pass away — most people name their spouse, but think it through if you have children from a previous relationship or assets you're deliberately keeping separate. 3. Review and update any other estate documents like a power of attorney or healthcare directive — your spouse may need to be named there too. 4. Sign and notarize the documents according to your state's rules. 5. Store the originals in a safe deposit box or fireproof safe and tell your spouse where they are." },
  { id: 'emergency-contacts', phase: 'AFTER', cat: 'emergency', label: 'Update emergency contacts and records', stakes: 'medium', assistType: 'guidance',
    why: "Work, school, and medical records still list your old emergency contact until you update them.",
    guidance: "1. Update your emergency contact at work through HR or your employee portal — list your spouse's name and phone number. 2. Call your doctor's office, dentist, and any specialists to update your emergency contact on file. 3. If you have kids, update the emergency contact and authorized pickup list at their school or daycare. 4. Update emergency contacts at your gym, any regular activities, or anywhere else that has one on file." },
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
