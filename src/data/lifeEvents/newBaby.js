// New-baby life event bundle. Phases (T1/T2/T3/POST) are used for ordering and
// to drive the "already done?" intake screen for users joining mid-pregnancy.
// All bundle tasks become one-time custom_tasks with life_event_id set; the
// existing task pipeline handles status, scheduling, and completion.

import { computeDueDate } from './eventDates';
import { officialLink } from '../officialLinks';

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
    why: "Your OB or midwife is with you for every appointment from here on, so it's worth choosing early.",
    guidance: "1. Ask your primary doctor for referrals — they know who's accepting new patients in your network. 2. Call the offices to check insurance coverage and appointment availability. 3. Ask about their approach to pain management, interventions, and high-risk pregnancies. 4. Confirm they have privileges at the hospital or birth center where you'd like to deliver. 5. Schedule a meet-and-greet appointment to see if you click with them." },
  { id: 'first-prenatal', phase: 'T1', cat: 'health', label: 'Schedule first prenatal appointment', stakes: 'high', assistType: 'guidance', windowDays: 21,
    why: "Early prenatal visits are when the first key screenings happen.",
    guidance: "1. Call your chosen OB or midwife as soon as you know you're pregnant — ideally by 8 weeks. 2. Ask what to bring: insurance card, ID, list of current medications, and prior medical records. 3. The office will ask about family medical history, any prior pregnancies, and lifestyle questions. 4. Expect blood work, urine tests, and likely a dating ultrasound to confirm how far along you are. 5. Ask about any symptoms you've noticed and what changes are normal for early pregnancy." },
  { id: 'choose-hospital', phase: 'T1', cat: 'health', label: 'Research and choose a birth hospital or birth center', stakes: 'high', assistType: 'providers', searchQuery: 'birth hospital or birth center', windowDays: 21,
    why: "Insurance and provider networks narrow this down — easier to sort out early than while you're in labor.",
    guidance: "1. Check which hospitals and birth centers are in your insurance network. 2. Ask your OB or midwife which facilities they have privileges at — this narrows your options significantly. 3. Look up reviews on hospital websites and third-party sites for NICU capabilities, C-section rates, and patient satisfaction. 4. Call a few hospitals and ask about their policies on labor support, movement during labor, and emergency procedures. 5. Consider distance from your home, whether they allow family or a doula, and what their postpartum rooms look like." },
  // ── Second trimester ────────────────────────────────────────────
  { id: 'tour-hospital', phase: 'T2', cat: 'health', label: 'Tour the birth hospital or birth center', stakes: 'medium', assistType: 'guidance', windowDays: 14,
    why: "Seeing the maternity ward ahead of time makes the day itself feel less unfamiliar.",
    guidance: "1. Call the hospital's labor and delivery department to schedule a tour — they often run them on specific days or times. 2. Go during daylight hours when it's less chaotic so you can see the space clearly. 3. Ask to see labor rooms, delivery areas, NICU, recovery areas, and where a support person can sleep overnight. 4. Clarify their policies on continuous monitoring, position changes, eating during labor, and what happens if you need an emergency C-section. 5. Note what matters to you — shower setups, dim lighting options, or whether they have a tub or birthing ball available." },
  { id: 'pre-register-hospital', phase: 'T2', cat: 'health', label: 'Pre-register at the hospital', stakes: 'medium', assistType: 'guidance',
    why: "Less paperwork to fill out later, while you're in labor.",
    guidance: "1. Call the hospital's admissions or labor and delivery department and ask about their pre-registration process. 2. Some hospitals do this online, others mail forms, and some do it in person — ask which applies to you. 3. Bring your insurance card, ID, and a copy of your medical records if available. 4. Fill out your medical history, emergency contact information, and insurance details accurately. 5. Ask if the registration can be linked to your OB or midwife's account so your information is in the system when you arrive." },
  { id: 'choose-pediatrician', phase: 'T2', cat: 'health', label: 'Choose a pediatrician', stakes: 'high', assistType: 'providers', searchQuery: 'pediatrician', windowDays: 21,
    why: "Baby's first visit happens within days of birth, so it helps to have someone chosen already.",
    guidance: "1. Ask your OB, friends, family, or your employer's benefits department for pediatrician referrals. 2. Call the office and ask if they're accepting new patients and their earliest newborn visit — many have specific windows. 3. Ask about their approach to vaccines, sick-child visits, after-hours access, and whether they work with urgent care or have a nurse hotline. 4. Check if they're in your insurance network and ask about copays for well-child visits. 5. Consider scheduling a pre-birth office visit or phone call so the pediatrician can review your birth plan and any concerns." },
  { id: 'childbirth-class', phase: 'T2', cat: 'health', label: 'Sign up for a childbirth class', stakes: 'medium', assistType: 'guidance', windowDays: 30,
    why: "Classes fill up, and it's easier to fit in before the third trimester gets busy.",
    guidance: "1. Search for classes near you through your hospital, local birthing centers, independent instructors, or online platforms. 2. Classes run 4–6 weeks or can be one-day intensives — pick a format that fits your schedule. 3. Ask what topics are covered — labor positions, pain management options, what to expect, how a support person can help, early infant care. 4. Costs vary: many hospitals offer free classes; independent instructors charge $100–400. 5. Sign up early — popular classes fill up 8–12 weeks before your due date." },
  { id: 'cpr-class', phase: 'T2', cat: 'health', label: 'Sign up for an infant CPR class', stakes: 'medium', assistType: 'guidance', windowDays: 14,
    why: "A skill you hope to never need, but good to have before baby arrives.",
    guidance: "1. Search for infant CPR classes through the Red Cross, American Heart Association, local hospitals, or community centers. 2. Online classes teach the theory but hands-on practice with a manikin is worth the in-person fee for this skill. 3. Classes typically run 2–4 hours and cost $50–100. 4. You'll learn to recognize choking and airway obstruction, how to clear an airway, and infant CPR technique. 5. Take it in the third trimester — you want the skills fresh but not so early that you forget details." },
  { id: 'research-childcare', phase: 'T2', cat: 'home', label: 'Research childcare or daycare options', stakes: 'high', assistType: 'guidance', windowDays: 21,
    why: "Waitlists at many daycares run six months or longer — getting on a list now keeps your options open.",
    guidance: "1. Start by deciding what type of care you want — daycare center, in-home daycare, nanny, or nanny share — each has different costs, availability, and flexibility. 2. Ask friends, neighbors, your pediatrician, and local parent groups for recommendations. 3. Call or visit your top choices and ask about waitlist length, infant-to-caregiver ratios, hours, sick-child policies, and what a typical day looks like. 4. Get on waitlists early — many centers let you join a list before the baby is born, and popular ones fill up 6–12 months out. 5. Compare costs against your budget and check whether your employer offers dependent care FSA or childcare subsidies." },
  { id: 'review-leave', phase: 'T2', cat: 'finance', label: 'Review parental leave policy with your employer', stakes: 'high', assistType: 'guidance',
    why: "Knowing your leave and pay ahead of time gives you room to actually plan around it.",
    guidance: "1. Find your employee handbook or HR benefits guide and locate the parental leave section. 2. Call or email HR to clarify: do you get paid leave, unpaid FMLA, or both — and for how many weeks? 3. Ask about flexibility — can you return part-time, take leave in phases, or delay your return date? 4. Confirm when you need to notify HR (often 30 days before your due date) and what forms to file. 5. If coverage is weak or you're not eligible, ask HR about short-term disability insurance or supplemental leave options." },
  { id: 'update-will', phase: 'T2', cat: 'finance', label: 'Create or update your will', stakes: 'high', assistType: 'guidance_companies',
    why: "A will names who cares for your child if something happens to you — most people don't have one until this point.",
    guidance: "1. Decide who you want as guardian for your child if something happens to you — if there's a second parent, settle on it together, and ask the person you pick before you name them. 2. Decide who will manage the money (executor) and in what way (lump sum, trust, staggered payments). 3. You can draft a will online using services like LegalZoom, Nolo, or Rocket Lawyer ($50–200) or hire a lawyer ($500–1,500). 4. Sign it in front of two adult witnesses who aren't named in the will and, in some states, have it notarized. 5. Store the original in a safe place (home safe, safe deposit box, lawyer's office) and tell your executor where it is." },
  // ── Third trimester ─────────────────────────────────────────────
  { id: 'birth-plan', phase: 'T3', cat: 'health', label: 'Write your birth plan', stakes: 'medium', assistType: 'guidance',
    why: "Writing down your preferences means your care team knows them even if you can't say so in the moment.",
    guidance: "1. Use a birth plan template from your hospital or childbirth class to organize your preferences. 2. Include your goals for labor — natural labor, epidural, or open to circumstances — and pain management preferences. 3. Write your preferences on continuous monitoring, movement during labor, eating and drinking, timing of water breaking, episiotomy, and skin-to-skin immediately after birth. 4. Note who you want in the room, what support you want from them, and what should happen if baby needs extra care or you need a C-section. 5. Print multiple copies to bring to the hospital and give to your care team when you arrive in labor." },
  { id: 'install-car-seat', phase: 'T3', cat: 'home', label: 'Install and inspect the car seat', stakes: 'high', assistType: 'guidance',
    why: "Many hospitals won't discharge you without a properly installed car seat.",
    guidance: "1. Buy or register your car seat early — hospitals may ask for a photo or serial number before discharge. 2. Most fire departments, hospitals, and car seat retailers offer free installation checks — schedule an appointment. 3. Read your car seat manual and your car's owner manual to understand the correct installation method (LATCH system vs. seat belt). 4. Install the seat yourself following the manual exactly — common mistakes are loose straps or incorrect angle. 5. Go to the inspection appointment with your installed seat, car, and the base to ensure everything is secure and level." },
  { id: 'set-up-crib', phase: 'T3', cat: 'home', label: 'Set up the crib or bassinet', stakes: 'medium', assistType: 'guidance',
    why: "Easier to put together now than during the sleep-deprived days right after birth.",
    guidance: "1. Assemble the crib or bassinet according to the manufacturer's instructions — check that all bolts and screws are tight and secure. 2. Use only a firm mattress and fitted sheets — no pillows, blankets, bumpers, or toys inside. 3. Follow safe sleep guidelines: place the crib in your room for at least the first 6 months. 4. Test that you can lower and raise the side rails smoothly and quietly so you're not fumbling at 3 AM. 5. Set up a small table or cart nearby with diapers, wipes, and a change pad so you have supplies within arm's reach." },
  { id: 'hospital-bag', phase: 'T3', cat: 'home', label: 'Pack your hospital bag', stakes: 'medium', assistType: 'guidance',
    why: "Labor can start with little warning — better to have this ready than to scramble.",
    guidance: "1. Start packing around week 36 and use a checklist from your hospital or a parenting app as a guide. 2. Pack loose, comfortable clothes for recovery, a front-opening robe for easy nursing, slippers with grip, and going-home outfits for you and baby. 3. Bring copies of your insurance card, ID, and birth plan — ask your OB if they'll send medical records directly to the hospital. 4. Pack comfort items — phone charger, music or birth affirmations, snacks for you and anyone coming with you, entertainment for early labor. 5. Have a second small bag ready in your car with essentials so you can leave quickly if labor starts when you're away from home." },
  { id: 'add-baby-insurance', phase: 'T3', cat: 'finance', label: 'Add baby to your health insurance plan', stakes: 'high', assistType: 'guidance',
    why: "Most plans have a short window after birth to add a new dependent.",
    guidance: `1. Most insurance plans give you 30–60 days after birth to add a new dependent without needing a qualifying event — check your plan documents for the exact deadline. 2. Call your insurance company or employer HR the day after baby arrives to ask how to add them — many can do it over the phone. 3. You'll need baby's full legal name, date of birth, and Social Security number if you have it — if not, provide name and DOB and update later when the SSN arrives. 4. Ask about the effective date of coverage and what copays and deductibles apply to pediatric visits. 5. Confirm coverage is active before the first pediatrician visit so you don't receive surprise bills. 6. If you buy your own plan rather than getting it through work, a new baby opens a ${officialLink('healthcare-sep', 'Special Enrollment Period')} — coverage can be backdated to the birth.` },
  { id: 'postpartum-help', phase: 'T3', cat: 'home', label: 'Arrange postpartum help (family, meals, etc.)', stakes: 'medium', assistType: 'guidance',
    why: "The first weeks go easier with help lined up in advance, not scrambled together after the fact.",
    guidance: "1. Ask close family members or friends in advance if they can stay with you for the first week or two — discuss specific roles like cooking, laundry, or sibling care. 2. Coordinate a meal train using apps like Meal Train, Feeding Friends, or a shared Google Calendar — aim for 4–5 meals per week for the first month. 3. Consider hiring a postpartum doula, house cleaner, or laundry service for a few weeks if your budget allows — they handle cooking, laundry, and light cleaning so you can focus on recovery and baby. 4. Create a contact list with all helper names, phone numbers, and what they've offered to do — send it to helpers along with your due date and hospital. 5. Be specific about what you actually need: 'Freezer-friendly casseroles only, please' or 'Please don't stay longer than 2 hours so I can nap.'" },
  // ── After birth ─────────────────────────────────────────────────
  { id: 'birth-cert', phase: 'POST', cat: 'finance', label: 'Register the birth / apply for birth certificate', stakes: 'high', assistType: 'guidance',
    why: "Almost everything else — the SSN, insurance, a passport later — needs this first.",
    guidance: `1. Before leaving the hospital, fill out the birth certificate application with the hospital's vital records department — they'll ask for baby's name, your information, and who to list as parents. 2. Double-check that the baby's name and all details are spelled correctly on the form because fixing errors later takes months and costs extra. 3. Ask the hospital which state office processes the certificate and how long it takes — typically 2–4 weeks for the first certified copy. 4. You can pick up certified copies at the local vital records office once processing is complete, or request them by mail — ${officialLink('vital-records', 'the CDC directory')} lists your state's office and what it charges. 5. Order at least 3–5 extra certified copies when you request the first one — you'll need them for Social Security, passport, school enrollment, and other documents.` },
  { id: 'ssn', phase: 'POST', cat: 'finance', label: 'Apply for Social Security number', stakes: 'high', assistType: 'guidance',
    why: "You'll need it to add baby to insurance, claim tax credits, and open accounts down the line.",
    guidance: `1. Applying at the hospital is much easier — the birth registration paperwork has an SSN box, and going that route skips a separate trip and document check later. ${officialLink('ssa-child-ssn', "SSA's guide to Social Security numbers for children")} covers both routes. 2. If applying at the hospital, ask the hospital's vital records department for the SSN application form (they submit it with the birth certificate). 3. If applying after the fact, visit your local Social Security office with baby's certified birth certificate, your ID, and proof of your relationship — they'll often give you a temporary SSN number on the spot. 4. By mail takes 2–6 weeks; in-person processing is faster. 5. Once the SSN arrives, record it and update your health insurance enrollment, open a 529 plan if desired, and be ready to claim baby on your taxes.` },
  { id: 'first-pediatrician', phase: 'POST', cat: 'health', label: 'Schedule first pediatrician visit (3–5 days)', stakes: 'high', assistType: 'guidance',
    why: "This first visit checks weight, feeding, and jaundice in the days right after birth.",
    guidance: "1. Call your pediatrician's office from the hospital or immediately after birth and schedule the visit for 3–5 days after discharge. 2. Bring baby's birth certificate, your insurance card, and any hospital discharge papers with weight and feeding notes. 3. At this visit, the pediatrician will weigh baby, check for jaundice (yellowing of the skin), look for signs of infection, and assess feeding — breast or formula. 4. Ask about weight gain expectations, what's normal for spit-up and bowel movements, sleeping patterns, and when to call the office. 5. If the hospital didn't do a newborn screening (heel-prick test for metabolic disorders), the pediatrician will order it — ask how and when you'll get results." },
  { id: 'update-life-insurance-bene', phase: 'POST', cat: 'finance', label: 'Update life insurance beneficiaries', stakes: 'high', assistType: 'guidance',
    why: "A new dependent usually means updating who's covered if something happens to you.",
    guidance: "1. Pull up your life insurance policy documents or log into your insurer's online portal to find the beneficiary section. 2. Review who's currently listed as primary and contingent beneficiary and decide what should change now that baby's here. 3. Know your options — a minor can't receive a payout directly, so naming baby alone usually means a court appoints someone to manage it. Most people name another adult they trust or set up a trust instead; a lawyer is worth it if the estate is complicated. 4. Contact your insurance company or log into their website to download a beneficiary change form — submit it signed and, if required, notarized. 5. Keep a copy of the confirmation and tell your executor where all your life insurance policies are." },
  { id: 'update-retirement-bene', phase: 'POST', cat: 'finance', label: 'Update retirement account beneficiaries', stakes: 'high', assistType: 'guidance',
    why: "Worth double-checking who's listed now that your family's grown.",
    guidance: "1. Log into each retirement account (401(k), IRA, Roth IRA, SEP-IRA, etc.) to check the current beneficiary designations. 2. Decide what should change — you can name baby directly (a custodian manages the money until they're an adult), name another adult you trust, or name a trust. 3. Ask your plan administrator about custodial options — some plans allow you to name a custodian to manage money until the child reaches adulthood. 4. Download and submit the beneficiary change form signed and notarized (requirements vary by institution). 5. Keep confirmations and tell your executor where all your retirement accounts are and how the beneficiaries are set up." },
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
