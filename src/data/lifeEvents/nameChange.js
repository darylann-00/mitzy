// Changing your name life event bundle. Split out from marriage — a name
// change can follow marriage, divorce, or be its own decision entirely, so
// it stands on its own rather than living inside another event's intake.
// Anchors to a start date the user can set in the past or future. No
// suppressCelebration — this is usually a positive step regardless of why
// someone's doing it.

import { computeDueDate, daysSince } from './eventDates';
import { officialLink } from '../officialLinks';

export const NAME_CHANGE_PHASES = ['CORE', 'REST'];

export const NAME_CHANGE_PHASE_LABELS = {
  CORE: 'Start here',
  REST: 'Everywhere else',
};

// Most other institutions check your name against these two records first,
// so they come due well ahead of everything else.
const BUNDLE = [
  { id: 'update-ssn-card', phase: 'CORE', cat: 'finance', label: 'Update your name with Social Security', stakes: 'high', assistType: 'guidance',
    why: "Almost everything else — your license, bank, employer — checks against this record first.",
    guidance: `1. Gather your birth certificate, marriage certificate or court order, and valid ID. 2. Start at ${officialLink('ssa-name-change', "Social Security's name change page")} — in some states you can do the whole thing from your my Social Security account. 3. If you can't do it online, call 1-800-772-1213 to make an appointment at your local office. 4. Bring originals and copies of your documents — they'll return originals. 5. Your updated card arrives by mail in about 1-2 weeks.` },
  { id: 'update-drivers-license', phase: 'CORE', cat: 'finance', label: "Update your driver's license or state ID", stakes: 'high', assistType: 'jurisdiction',
    why: "Most other places ask to see this as proof the name change happened.",
    guidance: `1. ${officialLink('dmv-directory', "Find your state's DMV site")} and check what documents you need — usually a certified birth certificate or court order. 2. Make an appointment at your local DMV (walk-ins may have long waits). 3. Bring your court order or marriage certificate, current ID, and the state's name change form. 4. You'll likely need a new photo — some states waive the fee for name changes, others don't. 5. Get your temporary ID printed on the spot; your new license arrives by mail in 1-2 weeks.` },
  { id: 'update-passport', phase: 'REST', cat: 'finance', label: 'Update your passport', stakes: 'medium', assistType: 'guidance',
    why: "Only matters if you travel internationally, but it can take weeks — worth starting early.",
    guidance: `1. Get a certified copy of your court order or marriage certificate if you don't have one. 2. Check ${officialLink('passport-change', 'the State Department name change page')} — which form you need depends on how long ago your passport was issued, and within the first year there's usually no fee. 3. Gather your current passport, new court order, and ID. 4. Some routes mail in, others need a passport acceptance facility — the same page has the finder. 5. Confirm current processing times on that page before you count on a travel date.` },
  { id: 'update-bank-accounts', phase: 'REST', cat: 'finance', label: 'Update your name on bank accounts and cards', stakes: 'high', assistType: 'guidance',
    why: "Your name needs to match your ID for the bank to keep serving you without friction.",
    guidance: "1. Call your bank's customer service or visit your local branch with your new ID and court order. 2. Ask to update the name on all accounts — checking, savings, credit cards, and loans. 3. Most banks let you start the process online or by phone, but may need documents by mail or in person. 4. Your existing debit card stays active during the update; credit and debit cards are reissued to your new name. 5. Keep old card numbers handy for any subscriptions or auto-pay set to the old account." },
  { id: 'update-employer', phase: 'REST', cat: 'finance', label: 'Update your name with your employer or HR', stakes: 'high', assistType: 'guidance',
    why: "Payroll and tax withholding are filed under a name — a mismatch can hold up your paycheck.",
    guidance: "1. Email your HR department or visit them in person with your new ID and court order. 2. Provide your employee ID and new legal name. 3. Ask them to update your name in the payroll system, W-4, and health insurance records — these are often linked. 4. Confirm they'll reissue your W-2 with the updated name for tax purposes. 5. Check your next pay stub to make sure the name change went through." },
  { id: 'update-health-insurance', phase: 'REST', cat: 'health', label: 'Update your name with your health insurance', stakes: 'high', assistType: 'guidance',
    why: "Claims can get denied if the name on file doesn't match your ID.",
    guidance: "1. Call the customer service number on your insurance card with your policy number handy. 2. Have your new ID and court order ready — they'll ask for verification. 3. Confirm the update will appear on your ID card (some reissue immediately, others in the next batch). 4. Ask them to update your name in their system for both medical and pharmaceutical benefits. 5. Follow up with your doctor's office to ensure they received the updated information from your insurer." },
  { id: 'update-voter-registration', phase: 'REST', cat: 'finance', label: 'Update your voter registration', stakes: 'low', assistType: 'jurisdiction',
    why: "A quick one, but easy to forget until an election is already close.",
    guidance: `1. Start at ${officialLink('vote-register', 'vote.gov')} and pick your state — it hands you off to your state's own registration site. 2. Most states let you update online with your driver's license number or last four digits of your SSN. 3. Enter your new legal name and confirm your registration. 4. Some states require you to re-register by mail or in person — the state page will say. 5. Print or save your updated registration confirmation if one is offered.` },
  { id: 'update-utilities-lease', phase: 'REST', cat: 'home', label: 'Update utilities, lease, or mortgage documents', stakes: 'medium', assistType: 'guidance',
    why: "Keeps your name consistent on the paperwork tied to where you live.",
    guidance: "1. Contact your landlord or mortgage lender with a copy of your court order. 2. For a lease, ask them to note the name change in your lease file or issue an amendment. 3. Call each utility (gas, electric, water, internet, phone) with your account number and new name. 4. Ask if they need a copy of your court order mailed or emailed — some do, most just update over the phone. 5. Update the name on any auto-pay arrangements if needed, though most systems auto-update." },
  { id: 'update-will-name', phase: 'REST', cat: 'finance', label: 'Update your will and estate documents', stakes: 'medium', assistType: 'guidance_companies',
    why: "Documents under your old name can slow things down for the people you've named in them.",
    guidance: "1. Pull up your will, power of attorney, and healthcare directives. 2. If they're old (more than a few years), consider having an attorney review them — laws change. 3. Contact the attorney or legal service that drafted them and ask about amending to reflect your new name. 4. You may be able to add an addendum rather than redoing the whole document. 5. Make sure all copies are updated and stored securely — tell your executor where to find them." },
  { id: 'update-medical-records', phase: 'REST', cat: 'health', label: "Update your name with your doctor's office and pharmacy", stakes: 'low', assistType: 'guidance',
    why: "Keeps your records and prescriptions filed under the right name.",
    guidance: "1. Call your primary care doctor's office and ask to update your chart with your new legal name. 2. Provide your date of birth and current ID to verify your identity. 3. Ask if they need copies of your court order — many just update over the phone. 4. Call your pharmacy with your date of birth and new name — they can merge your old and new profiles. 5. Update your name with any specialists (dentist, dermatologist, therapist, etc.) if you see them regularly." },
  { id: 'update-subscriptions', phase: 'REST', cat: 'finance', label: 'Update your name on subscriptions and accounts', stakes: 'low', assistType: 'guidance',
    why: "The small stuff — streaming, shopping, loyalty accounts — worth a pass once the big ones are done.",
    guidance: "1. Make a list of subscriptions and online accounts (streaming, email, social media, shopping sites, rewards programs). 2. Log into each account's settings or profile page. 3. Update your name in the account settings — most sites have a 'Profile' or 'Account Info' section. 4. For subscriptions (Netflix, Spotify, etc.), update the billing name to match your payment method. 5. Some older accounts may not have self-service name changes — contact customer service for those." },
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
