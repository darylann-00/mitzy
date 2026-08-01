// Divorce / separation life event bundle. Unlike new-baby there's no fixed
// anchor date, so due dates are offsets from today, paced by how far along
// the user already is (intake `stage`). Celebration confetti is suppressed
// event-wide — even the empowering tasks sit inside a hard season.
//
// The legal steps branch on intake `representation` (attorney / mediation /
// self / undecided). Self-filers get the procedural tasks an attorney would
// otherwise absorb — forms, service, the final hearing — and the shared tasks
// swap in guidance that doesn't route through a lawyer (see `guidanceFor`).

import { computeDueDate, todayIso } from './eventDates';
import { officialLink } from '../officialLinks';

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

// Representation path (intake `representation`). Plenty of people divorce
// without a lawyer, so the legal steps split: an attorney handles the filing,
// a mediator handles the negotiation but not the filing, or the user does all
// of it. Tasks not listed here show on every path.
const REPRESENTATION_ONLY = {
  'consult-attorney':         ['attorney', 'undecided'],
  'legal-aid-check':          ['self'],
  'court-forms':              ['self'],
  'check-uncontested':        ['self'],
  'serve-papers':             ['self'],
  'final-hearing':            ['self'],
  'find-mediator':            ['mediation'],
  'prepare-mediation':        ['mediation'],
  'file-mediation-agreement': ['mediation'],
};

// Events started before the representation question shipped have no answer for
// it. Treat those as 'undecided' so they keep the task set they already have.
const DEFAULT_REPRESENTATION = 'undecided';

const BUNDLE = [
  // ── Getting started ─────────────────────────────────────────────
  { id: 'consult-attorney', phase: 'EARLY', cat: 'finance', label: 'Consult a family law attorney', stakes: 'high', assistType: 'providers', searchQuery: 'family law attorney', windowDays: 14,
    why: "A lawyer can tell you what's actually at stake before you commit to anything.",
    guidance: "1. Search for family law attorneys in your area or ask for referrals from trusted friends. 2. Call 3–4 offices and ask about initial consultation fees (often free or $100–300). 3. Prepare a brief overview of your situation and ask what documents they'll want to review. 4. At the consultation, ask what their retainer is, how they bill, and what happens if things get contested." },
  { id: 'legal-aid-check', phase: 'EARLY', cat: 'finance', label: 'Check if you qualify for free or low-cost legal help', stakes: 'medium', assistType: 'jurisdiction',
    why: "Handling the filing yourself doesn't mean going in blind — an hour with a lawyer on the parts that matter is often free or close to it.",
    guidance: "1. Look up your state's legal aid organization. Most states have one that serves people under an income cutoff, and that cutoff is set locally — check theirs rather than assuming you won't qualify. 2. Ask your county courthouse whether it has a self-help center or a free legal clinic; many hold walk-in hours. 3. Check whether a nearby law school runs a family law clinic — supervised students handle cases, usually free. 4. Ask your state bar association about its lawyer referral service; some offer a reduced-fee first consultation. 5. If none of those fit, ask a family law attorney about 'unbundled' or limited-scope representation — you handle the filing and pay only for specific help, like a review of your paperwork before it goes in." },
  { id: 'find-mediator', phase: 'EARLY', cat: 'finance', label: 'Find a divorce mediator', stakes: 'high', assistType: 'providers', searchQuery: 'divorce mediator', windowDays: 14,
    why: "A mediator works with both of you at once, which usually costs far less than two lawyers negotiating against each other.",
    guidance: "1. Search for divorce or family mediators in your area, or ask your court whether it keeps a roster — many do. 2. Ask whether they're an attorney-mediator or a non-attorney mediator. Attorney-mediators can usually draft the final agreement; non-attorneys often can't. 3. Ask their rate and how it gets split between you and your spouse — 50/50 is common. 4. Ask roughly how many sessions a case like yours takes. 5. Understand the role: a mediator is neutral, represents neither of you, and can't tell either of you whether a deal is good for you." },
  { id: 'check-uncontested', phase: 'EARLY', cat: 'finance', label: 'Check whether you qualify for the simplified divorce process', stakes: 'medium', assistType: 'jurisdiction',
    why: "Most states have a shorter, cheaper track for couples who agree on everything — worth knowing before you start down the long one.",
    guidance: "1. Ask the clerk's office, or check your state court's self-help site, whether your state offers a simplified, summary, or uncontested divorce. 2. The qualifying conditions are set by your state — they commonly involve how long you were married, whether you have children together, and whether property and debt fall under a set amount. Confirm the actual list for your state. 3. It generally requires that you and your spouse agree on everything in writing, so talk it through before you file. 4. If you qualify, ask for that specific form packet — it's usually much shorter. 5. If you don't, ask what the standard process involves so you know what you're taking on." },
  { id: 'court-forms', phase: 'EARLY', cat: 'finance', label: "Find your court's divorce forms and self-help resources", stakes: 'high', assistType: 'jurisdiction',
    why: "Every court has its own forms and its own way it wants them filed — starting from the right packet saves a rejected filing.",
    guidance: "1. Find your county's district or family court website and look for a self-help, family law, or divorce forms section. 2. Many state court systems publish a statewide packet of approved forms — check your state's judicial branch site as well as the county's. 3. Call the clerk's office and ask which packet fits your situation and whether they have a filing checklist. Clerks can't give legal advice, but they can tell you what paperwork they require. 4. Ask what the filing fee is and whether the court has a fee waiver for people who can't afford it — the amount and the waiver rules are both set locally. 5. Ask how many copies they want and whether the court accepts e-filing. 6. If your court has a self-help center, go in person once — it's the fastest way to find out what you're missing." },
  { id: 'gather-documents', phase: 'EARLY', cat: 'finance', label: 'Gather financial documents (taxes, statements, deeds)', stakes: 'high', assistType: 'guidance',
    why: "Having these ready saves time — and back-and-forth — once things move into the legal process.",
    guidance: "1. Pull your last 2–3 years of tax returns (you and your spouse) from your files or download from your tax preparer. 2. Get statements for all joint bank and investment accounts — last 3 months at minimum. 3. Find property deeds in your files or county records online. 4. Collect statements for any retirement accounts, 401ks, IRAs, HSAs. 5. Gather mortgage or loan documents if you have them." },
  { id: 'open-own-account', phase: 'EARLY', cat: 'finance', label: 'Open a bank account in your own name', stakes: 'high', assistType: 'guidance',
    why: "Gives you a financial foothold that's entirely yours while everything else gets sorted out.",
    guidance: "1. Choose a bank or credit union — compare fees and minimum balances. 2. Go in person or open online — you'll need your ID, Social Security number, and often an initial deposit ($25–100 typically). 3. Get your account number and routing number. 4. If your paycheck goes to a joint account, set up direct deposit to this new account or plan to transfer funds weekly." },
  { id: 'check-credit', phase: 'EARLY', cat: 'finance', label: 'Pull your credit report and open a card in your name', stakes: 'medium', assistType: 'guidance',
    why: "Shared debt can still affect your credit even after you separate finances.",
    guidance: `1. Pull your report from all three bureaus at ${officialLink('annual-credit-report', 'annualcreditreport.com')} — the federally authorized free source. 2. Review it for inaccuracies and note every joint account. 3. Contact your creditors to separate any joint cards before the divorce finalizes — they'll move the balance to one person's name. 4. Apply for a credit card in your name only to build independent credit history. 5. If you're worried about a spouse opening accounts in your name, ${officialLink('ftc-credit-freeze', 'a credit freeze')} is free and reversible.` },
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
  { id: 'file-respond-petition', phase: 'LEGAL', cat: 'finance', label: 'File or respond to the divorce petition', stakes: 'high', assistType: 'jurisdiction',
    why: "This officially starts the legal process, and deadlines to respond can be short.",
    guidance: "1. If you're filing first, your attorney will prepare the petition with your information and grounds for divorce. 2. You'll file it with your county clerk's office. There's a filing fee, which your county sets — ask the clerk what it is when you call. 3. Your spouse will be served a copy — this officially starts the process. 4. If your spouse files first, you'll receive papers with a deadline to respond. That deadline is set by your state and it can be short, so check the papers and confirm the date with your attorney right away. 5. Work with your attorney to prepare your response; missing the deadline has serious consequences.",
    guidanceFor: {
      self: `1. Start from the petition form in your court's packet — it's usually the first one. If you don't have the packet yet, ${officialLink('lawhelp-forms', 'LawHelp.org lists free court forms and self-help guides by state')}. 2. Fill it out completely. Blanks and inconsistencies are the most common reason a filing gets handed back. 3. File it with your county clerk. There's a filing fee your county sets — ask the clerk what it is, and ask about a fee waiver in the same call if paying it would be a hardship. 4. Ask how many copies they need, and keep a stamped copy for your own records. 5. If your spouse filed first, you were served papers that state a deadline to respond. That deadline is set by your state and it can be short — read the papers, confirm the date with the clerk, and put it on your calendar the same day. 6. File something on time even if you're still working out the details. Missing the response deadline can let the court decide the terms without you.`,
      mediation: "1. Mediation settles the terms, but the divorce itself still runs through the court — someone has to file a petition to open the case. 2. Decide with your spouse and your mediator who files and when. Some couples file first and mediate the terms; others mediate first and file with the agreement already in hand. 3. File with your county clerk. There's a filing fee your county sets — ask the clerk what it is. 4. Your spouse is then served, or signs a waiver or acceptance of service if you're cooperating — ask the clerk for that form. 5. If your spouse filed first, you were served with a deadline to respond that's set by your state. Respond on time even while mediation is underway — mediation does not pause the court's clock.",
    } },
  { id: 'serve-papers', phase: 'LEGAL', cat: 'finance', label: 'Serve the papers and file proof of service', stakes: 'high', assistType: 'jurisdiction',
    why: "The case doesn't move forward until the court has proof your spouse was properly served.",
    guidance: "1. Ask the clerk which service methods your court accepts — commonly a sheriff's deputy, a private process server, certified mail, or your spouse signing a waiver or acceptance of service. 2. You generally cannot hand the papers over yourself; someone else has to do it. Confirm the rule with the clerk before you try. 3. If your spouse will cooperate, the waiver route is usually the cheapest and fastest — ask for that form. 4. Whoever serves the papers completes a proof of service (sometimes called a return of service). 5. File that proof with the court. Skipping it is a common way for a case to stall for months with nothing happening. 6. Ask the clerk how long you have to complete service after filing — that window is set by your state." },
  { id: 'prepare-mediation', phase: 'LEGAL', cat: 'finance', label: 'Prepare for your mediation sessions', stakes: 'medium', assistType: 'guidance',
    why: "Walking in knowing what you actually need makes the sessions shorter, and shorter sessions cost less.",
    guidance: "1. Bring your asset and debt list plus recent statements — the mediator works from real numbers, not estimates. 2. Before the first session, write down three lists: what you need, what you'd like, and what you can let go of. Knowing the difference is most of the work. 3. If you have kids, sketch the schedule you want, holidays included, so you're reacting to a draft instead of starting from nothing. 4. Agree on ground rules with your spouse — one person speaks at a time, no re-litigating the past. 5. Consider having a consulting attorney review anything before you sign it. A mediator is neutral and can't tell you whether the deal is good for you specifically." },
  { id: 'file-mediation-agreement', phase: 'LEGAL', cat: 'finance', label: 'Turn your mediation agreement into a court order', stakes: 'high', assistType: 'jurisdiction',
    why: "A signed agreement isn't binding until a judge enters it — until then there's nothing to enforce.",
    guidance: "1. Get the final agreement in writing and signed by both of you. 2. Ask the clerk's office what your court needs in order to enter a mediated agreement — usually the agreement itself plus a petition and a proposed decree. 3. Ask whether your court requires a hearing to approve it, or whether it can be entered on the paperwork alone. 4. Check that the agreement covers everything the court expects — property, debts, support, and a parenting plan if you have kids. Incomplete agreements get sent back. 5. Once the judge signs, ask the clerk for certified copies — you'll need them to retitle property and update accounts." },
  { id: 'final-hearing', phase: 'LEGAL', cat: 'finance', label: 'Prepare for your final hearing and decree', stakes: 'high', assistType: 'jurisdiction',
    why: "This is the step that actually ends the marriage — and the paperwork you bring is what the judge signs.",
    guidance: "1. Ask the clerk how to request a final hearing date, and whether your court requires a hearing at all — some states finalize uncontested cases on paperwork alone. 2. Ask whether your state has a waiting period between filing and finalizing. There usually is one, and its length is set by the state. 3. Prepare the final decree or judgment ahead of time — most courts want it drafted and ready for the judge to sign, not written afterward. 4. Bring copies of your settlement agreement, parenting plan, and any financial disclosures your court requires. 5. Arrive early and answer the judge's questions directly and briefly — uncontested final hearings are often short. 6. After the judge signs, ask the clerk for certified copies. You'll need them to change your name, retitle property, and update accounts." },
  { id: 'parenting-plan', phase: 'LEGAL', cat: 'health', label: 'Work out a parenting plan and custody schedule', stakes: 'high', assistType: 'guidance',
    why: "A clear schedule now means fewer decisions to renegotiate later.",
    guidance: "1. Decide whether you want joint custody, sole custody, or some other arrangement. 2. Create a schedule — which parent has which days/weeks, holiday rotations, school breaks. 3. Cover logistics: who handles school decisions, medical decisions, where pickups happen. 4. Address communication between ex-partners (email, text, or co-parenting app like OurFamilyWizard). 5. Write it down — courts want specifics, not verbal agreements. 6. File it as part of the divorce. Your attorney or mediator handles this if you have one; if you're filing yourself, ask the clerk which parenting plan form your court requires — most courts have a specific one." },
  { id: 'separate-accounts', phase: 'LEGAL', cat: 'finance', label: 'Separate joint accounts and update direct deposit', stakes: 'high', assistType: 'guidance',
    why: "Keeps you from being responsible for charges you no longer control.",
    guidance: "1. Contact your bank and credit card companies to separate joint accounts — ask what they need from both parties. 2. Close joint credit cards or have one person take ownership; don't leave them open and shared. 3. Update your direct deposit with payroll to go to your new solo bank account. 4. Set up a process to handle shared bills during the separation — decide who pays what. 5. Cancel any joint subscriptions or auto-pays and set up your own accounts." },
  { id: 'update-health-insurance', phase: 'LEGAL', cat: 'health', label: 'Sort out health insurance coverage', stakes: 'high', assistType: 'guidance',
    why: "Coverage often changes when a marriage ends — worth sorting out before there's a gap.",
    guidance: "1. Check your current coverage — is it through your spouse's employer or your own? 2. If it's through your spouse's job, ask the HR department about COBRA continuation (usually available for up to 36 months). 3. If you lose coverage, check healthcare.gov for marketplace plans or your state's insurance marketplace. 4. If you have kids, they may stay on your spouse's plan temporarily — confirm this in your divorce agreement. 5. Update any existing policies to remove your spouse as a dependent or beneficiary." },
  { id: 'housing-plan', phase: 'LEGAL', cat: 'home', label: 'Work out living arrangements', stakes: 'high', assistType: 'guidance',
    why: "Settling this early avoids scrambling once other deadlines hit.",
    guidance: "1. Decide who stays in the home or if you both leave. 2. If one person stays, decide how the mortgage, property tax, and maintenance get handled. 3. If both are leaving, plan the timeline — does one person move out immediately or do you both transition? 4. If renting, one or both of you will need a new lease or to be removed from the current one. 5. Get advice before you agree to anything — this shapes the property settlement and it's hard to unwind. If you don't have an attorney, this is a good use of a legal aid clinic or a single paid consult." },
  // ── After it's final ────────────────────────────────────────────
  { id: 'update-will-divorce', phase: 'AFTER', cat: 'finance', label: 'Update your will and estate documents', stakes: 'high', assistType: 'guidance_companies',
    why: "Old wills often still name your ex — most people don't think to change this until it's pointed out.",
    guidance: "1. Contact an attorney or use a service like LegalZoom or Nolo to update your will. 2. If your current will names your ex-spouse as executor, beneficiary, or guardian — change it. 3. Update your power of attorney and healthcare proxy documents — remove your ex. 4. File the new will with your attorney or keep it in a safe place and tell your executor where it is. 5. Some states automatically revoke bequests to an ex-spouse at divorce, but don't rely on that — update proactively." },
  { id: 'update-beneficiaries', phase: 'AFTER', cat: 'finance', label: 'Update beneficiaries (life insurance, retirement)', stakes: 'high', assistType: 'guidance',
    why: "These don't update automatically when a divorce is final — your ex may still be listed.",
    guidance: "1. Call your life insurance company (or check your policy) to see who's listed as beneficiary. 2. Request a beneficiary change form and submit it in writing. 3. Do the same for retirement accounts (401k, IRA, Roth IRA) — call the plan administrator. 4. Check any annuities or other investment accounts. 5. Ask your employer's benefits office for a list of any benefits with named beneficiaries. 6. Update your will too in case there's anything your will covers." },
  { id: 'update-emergency-contacts', phase: 'AFTER', cat: 'emergency', label: 'Update emergency contacts (school, doctor, work)', stakes: 'medium', assistType: 'guidance',
    why: "Schools, doctors, and workplaces still have your ex listed until you update it.",
    guidance: "1. Contact your kids' school and provide updated emergency contact information — remove your ex or clarify that both parents should be contacted. 2. Call your doctor's office and update records to remove your ex. 3. Email your HR department to update emergency contacts, beneficiaries on any company benefits, and your personal information. 4. Update any other regular contacts: dentist, childcare provider, kids' activities, pediatrician." },
  { id: 'update-tax-withholding', phase: 'AFTER', cat: 'finance', label: 'Update your tax withholding (W-4)', stakes: 'medium', assistType: 'guidance',
    why: "Your filing status changes, and withholding should match it.",
    guidance: `1. Get a new W-4 from your HR department, or download it from ${officialLink('irs-w4', 'the IRS Form W-4 page')}. 2. Update your filing status to Single (or Head of Household if you have dependents) and adjust the number of dependents. 3. Use the IRS Tax Withholding Estimator — linked from that same page — to check the amount makes sense for your new situation. 4. Submit the completed form to your payroll department; changes take effect on your next paycheck.` },
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
  const paths = REPRESENTATION_ONLY[t.id];
  if (paths && !paths.includes(answers?.representation ?? DEFAULT_REPRESENTATION)) return false;
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
  const rep = answers?.representation ?? DEFAULT_REPRESENTATION;
  return BUNDLE
    .filter(t => !alreadyDone.has(t.id) && passesGates(t, answers))
    // `guidanceFor` holds per-path rewrites for steps that read very differently
    // with and without a lawyer. Strip it — only the resolved string is stored.
    .map(({ guidanceFor, ...t }) => ({
      ...t,
      guidance: guidanceFor?.[rep] ?? t.guidance,
      dueDate: computeDueDate(anchor, offsets[t.phase]),
    }));
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
        type: 'choice',
        key:  'representation',
        question: 'How are you handling the legal side?',
        help: "Plenty of people do this without a lawyer. Mitzy shows different steps either way — you can change course later.",
        options: [
          { value: 'attorney',  label: 'Working with a lawyer' },
          { value: 'mediation', label: 'Mediation or collaborative divorce' },
          { value: 'self',      label: 'Representing myself' },
          { value: 'undecided', label: "Haven't decided yet" },
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
