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
  { id: 'death-certificates', phase: 'FIRST', cat: 'finance', label: 'Order death certificates (get 10+ copies)', stakes: 'high', assistType: 'guidance',
    why: "Nearly every task ahead — accounts, benefits, insurance — asks for one of these.",
    guidance: "1. Contact your local vital records office (or ask the funeral home to order them for you — they often do this as part of their services). 2. Request at least 10-15 certified copies — banks, insurance, Social Security, and creditors will all ask for originals. 3. Ask about rush processing if available. 4. Expect to pay $10-25 per copy plus shipping. 5. Keep the originals in a safe place; you'll reference them frequently over the next months." },
  { id: 'funeral-arrangements', phase: 'FIRST', cat: 'health', label: 'Make funeral or memorial arrangements', stakes: 'high', assistType: 'guidance',
    why: "One of the first things to settle, often on a tight timeline.",
    guidance: "1. Call 2-3 funeral homes to ask about their services and costs. 2. Decide together whether you want a traditional funeral, cremation, memorial service, or other option. 3. Ask about itemized pricing — some funeral homes bundle services in ways that add cost. 4. If they had expressed wishes (written or verbal), honor those if you can afford to. 5. Ask the funeral home about their staff assistance with death certificates, obituaries, and logistics — many include this in their service." },
  { id: 'notify-people', phase: 'FIRST', cat: 'home', label: 'Notify family, friends, and their employer', stakes: 'medium', assistType: 'guidance',
    why: "News like this lands gentler coming from someone close, not secondhand.",
    guidance: "1. Start with immediate family and very close friends — consider calling rather than texting or email so they hear it from someone who knows them. 2. Ask a trusted person to help make calls if you need support doing this. 3. Share any service details once they're set. 4. Contact their employer's HR department to notify them and discuss logistics like final paycheck and benefits. 5. A brief note (email or card) to others who should know is fine — you don't owe a long explanation right now." },
  { id: 'secure-home', phase: 'FIRST', cat: 'home', label: 'Secure their home, car, and pets', stakes: 'high', assistType: 'guidance',
    why: "An empty home, unfed pets, or an unclaimed car can turn into a second problem fast.",
    guidance: "1. If their home is empty, change the locks or ensure all keys are accounted for — also ask a neighbor to keep an eye on it. 2. If they had a car, move it to a secure location and get the title and registration from their home. 3. If they left pets, arrange immediate care (stay with you, boarding, friend, or family) and gather their medical records, food, and routine. 4. Gather valuable items — jewelry, collections, electronics, documents — to a secure location. 5. Notify their insurance company of the death if they had a homeowner's or renters policy." },
  { id: 'locate-will', phase: 'FIRST', cat: 'finance', label: 'Locate the will and important papers', stakes: 'high', assistType: 'guidance',
    why: "Everything that follows — the estate, the executor, their wishes — depends on finding this.",
    guidance: "1. Search their home thoroughly — check desks, file cabinets, safes, and drawers. 2. Ask if they had a safe deposit box at a bank (ask their banks) and contact the bank to access it. 3. Call or email any attorney who may have represented them — many lawyers keep wills on file. 4. Look for other important documents too: insurance policies, stock certificates, real estate deeds, bank statements, and loan documents — all of these will matter in the coming months. 5. If you're the executor or administrator, you'll need these documents to settle the estate." },
  // ── The first weeks ─────────────────────────────────────────────
  { id: 'notify-ssa', phase: 'WEEKS', cat: 'finance', label: 'Notify Social Security', stakes: 'high', assistType: 'guidance',
    why: "Stops payments and starts any survivor benefits you may be owed.",
    guidance: "1. Call the Social Security Administration at 1-800-772-1213 or visit your local Social Security office in person with a death certificate. 2. Report the death as soon as possible — they'll stop monthly benefits. 3. Ask about any survivor benefits you may qualify for (if you're a spouse, child, or dependent). 4. Request a detailed explanation of what benefits will stop and what, if anything, you may be owed. 5. Keep your case number and the name of the SSA representative you spoke with for follow-up." },
  { id: 'notify-banks', phase: 'WEEKS', cat: 'finance', label: 'Notify their banks and freeze accounts', stakes: 'high', assistType: 'guidance',
    why: "Protects the accounts from unauthorized use while things get sorted out.",
    guidance: "1. Gather all account statements or search online for accounts you may not know about. 2. Call or visit each bank with a death certificate and ask to speak with a manager. 3. Request that all accounts be frozen to prevent unauthorized use — don't close them yet; the estate may need them. 4. Ask what documentation they'll need to transfer or close the account (usually a will, letters testamentary, or court order). 5. Get the name and direct number of the person helping you in case you need to follow up." },
  { id: 'life-insurance-claim', phase: 'WEEKS', cat: 'finance', label: 'File life insurance claims', stakes: 'high', assistType: 'guidance',
    why: "Claims can take weeks to process, so it's worth starting as soon as you're able.",
    guidance: "1. Search for insurance documents at home, in their car, and online (check email receipts and bank statements for premium payments). 2. Call their employer's HR department — many employers provide life insurance as a benefit. 3. Contact each insurer with the death certificate and file a claim — ask for a claim form and deadline. 4. Keep copies of everything you send. 5. Ask how long the claim will take to process and get a phone number to check status." },
  { id: 'probate-attorney', phase: 'WEEKS', cat: 'finance', label: 'Talk to a probate or estate attorney', stakes: 'high', assistType: 'providers', searchQuery: 'probate estate attorney', windowDays: 14,
    why: "They can tell you what actually needs a court process and what doesn't.",
    guidance: "1. Ask friends, family, or your accountant for referrals to a probate or estate attorney — or search your state bar association's lawyer referral service. 2. Call 2-3 attorneys to ask about a brief consultation (many offer 15-30 minutes free) to answer questions about the estate process. 3. Bring the will (if there is one), a death certificate, and a list of known assets and debts. 4. Ask specifically what does and doesn't need to go through probate — it varies by state and asset type. 5. Ask about their fees — they typically charge hourly, flat fees, or a percentage of the estate." },
  { id: 'notify-credit-bureaus', phase: 'WEEKS', cat: 'finance', label: 'Notify credit bureaus to prevent identity theft', stakes: 'high', assistType: 'guidance',
    why: "A deceased person's identity is a known target for fraud — this closes that door.",
    guidance: "1. Contact the three major credit bureaus — Equifax, Experian, and TransUnion — by phone or online to report the death. 2. Ask them to place a deceased-person alert on the credit report and to freeze the credit to prevent new accounts from being opened in their name. 3. Request a copy of the credit report to check for unknown debts or fraudulent accounts. 4. Ask what documents they need — usually a death certificate and proof of your relationship. 5. Consider requesting an annual fraud report for the next few years to catch any identity theft early." },
  { id: 'cancel-accounts', phase: 'WEEKS', cat: 'finance', label: 'Cancel subscriptions, utilities, and services', stakes: 'medium', assistType: 'guidance',
    why: "Stops charges on accounts that no longer need to keep running.",
    guidance: "1. Search their email, bank statements, and credit card statements for subscriptions and recurring charges — streaming services, apps, gym memberships, utilities, insurance, etc. 2. Make a list of all active accounts and subscriptions. 3. Call or email each company with a death certificate and request immediate cancellation. 4. Ask for written confirmation of cancellation and final billing date. 5. Continue to monitor the accounts (or credit card if you're still authorized) for several months to catch any that didn't cancel." },
  { id: 'forward-mail', phase: 'WEEKS', cat: 'home', label: 'Forward their mail', stakes: 'medium', assistType: 'guidance',
    why: "Keeps important paperwork from piling up at an empty address.",
    guidance: "1. Go to USPS.com/move or visit your local post office to set up mail forwarding from their address to yours. 2. Online forwarding costs $1.10 for identity verification and takes about a week to start — in person at the post office is free. 3. Forwarding lasts 12 months for first-class mail (bills, important documents) — packages and magazines may not forward, so watch for important items. 4. Update their mailing address directly with banks, insurance, and government agencies rather than relying only on forwarding. 5. Set a calendar reminder before the 12 months expire to make sure nothing important is still going to the old address." },
  { id: 'grief-support', phase: 'WEEKS', cat: 'health', label: 'Consider grief support or a counselor', stakes: 'medium', assistType: 'providers', searchQuery: 'grief counselor', windowDays: 14,
    why: "No timeline is 'right' for this — it's here whenever you're ready for it.",
    guidance: "1. If you're ready to talk to someone, ask your doctor for a therapist or grief counselor referral, or contact your employee assistance plan (EAP) if your employer offers one. 2. Many communities have free grief support groups — search online or ask a local hospice center for meetings. 3. Organizations like The Dinner Party or GriefShare offer in-person or online support for people at different stages of loss. 4. Talking to friends and family is also grief work — you don't need a professional to start processing. 5. There's no 'right time' for this, and no timeline you need to follow — consider it when you feel ready." },
  // ── The months after ────────────────────────────────────────────
  { id: 'final-tax-return', phase: 'MONTHS', cat: 'finance', label: 'File their final tax return', stakes: 'high', assistType: 'guidance',
    why: "Their estate still owes one, even after they're gone.",
    guidance: "1. Gather all tax documents for the year of death — W-2s, 1099s, records of deductions, and mortgage interest statements. 2. The final tax return covers income earned only through the date of death (not the full year). 3. You or an accountant will file IRS Form 1040 as usual, but mark it 'Final Return' with the date of death. 4. If the estate has significant income, it may need to file its own return (Form 1041) — an accountant or tax attorney can advise. 5. Ask the IRS about an extension if you need more time to gather documents." },
  { id: 'settle-estate', phase: 'MONTHS', cat: 'finance', label: 'Distribute assets and settle the estate', stakes: 'high', assistType: 'guidance',
    why: "The last step in wrapping up what they left behind.",
    guidance: "1. If there's a will, the named executor or administrator is responsible for overseeing distribution. If no will, your state's laws determine who inherits and in what order. 2. Gather all assets (bank accounts, investments, real estate, valuables, vehicles) and have them appraised if necessary — their value on the date of death determines tax liability for beneficiaries. 3. Pay any taxes, debts, and administrative costs from the estate before distributing assets to heirs. 4. Provide each beneficiary with an accounting of what they're receiving. 5. Once distributions are made and debts are settled, you can close the estate — this may require court approval depending on your state." },
  { id: 'update-own-will', phase: 'MONTHS', cat: 'finance', label: 'Update your own will and beneficiaries', stakes: 'medium', assistType: 'guidance_companies',
    why: "A loss like this is often when people realize their own affairs need updating too.",
    guidance: "1. Pull up your current will and power of attorney documents (if you have them) and review them with fresh eyes — what do you want to change? 2. Update beneficiaries on bank accounts, retirement accounts, and insurance policies — these pass outside the will and can override it if they're outdated. 3. Think about who you'd want handling your affairs and tell them — don't leave it a surprise. 4. Consider whether your wishes around funeral, organ donation, or medical decisions are clearly documented. 5. Update your will with an attorney if anything significant has changed, especially after a major life event like this." },
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
