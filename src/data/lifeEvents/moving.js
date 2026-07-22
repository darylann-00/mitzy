// Moving life event bundle. Covers the admin side of relocating — address
// changes, utilities, providers, legal paperwork — not packing tips or
// interior design. Two separate gates keep legal tasks (license, car reg,
// voter, state taxes) and provider tasks (PCP, dentist, pediatrician, vet)
// independent: someone moving across California needs new providers but not
// a new state license, while someone crossing a state line 10 miles away
// needs the license but keeps their doctors. Profile fields (hasKids,
// hasPets, hasCar) are seeded from the user's profile so intake never
// re-asks them. Moving is stressful but good news: confetti stays on.

import { computeDueDate, daysSince } from './eventDates';

export const MOVING_PHASES = ['BEFORE', 'AFTER'];

export const MOVING_PHASE_LABELS = {
  BEFORE: 'Before the move',
  AFTER:  "After you're settled",
};

// ── Gate sets ─────────────────────────────────────────────────────────
const OWNS_HOME_ONLY      = new Set(['list-home']);
const RENTING_ONLY         = new Set(['give-notice']);
const KIDS_ONLY            = new Set(['school-records', 'enroll-school', 'find-pediatrician']);
const PETS_ONLY            = new Set(['vet-records', 'find-vet', 'register-pets']);
const OUT_OF_STATE_ONLY    = new Set(['register-car', 'voter-registration', 'file-both-state-taxes']);
const NEEDS_PROVIDERS_ONLY = new Set(['find-pcp', 'find-dentist', 'find-pediatrician', 'find-vet']);
const HAS_CAR_ONLY         = new Set(['register-car']);

const BUNDLE = [
  // ── Before the move ─────────────────────────────────────────────
  { id: 'research-movers', phase: 'BEFORE', cat: 'home', label: 'Research moving companies or plan a DIY move', stakes: 'medium', assistType: 'guidance',
    why: "Booking early saves money and guarantees availability — last-minute moves cost significantly more.",
    guidance: "1. Search online for moving companies in your area and check reviews on Yelp, Better Business Bureau, or Google. 2. Get at least 3 quotes — most companies offer free in-home estimates. 3. Ask about insurance, hidden fees, and availability on your target dates. 4. If planning a DIY move, check Home Depot or U-Haul rental availability and pricing now. 5. Book your mover at least 4–6 weeks in advance." },
  { id: 'give-notice', phase: 'BEFORE', cat: 'home', label: 'Notify your landlord or give notice', stakes: 'high', assistType: 'guidance',
    why: "Most leases require 30–60 days' notice — missing the window can cost you an extra month's rent.",
    guidance: "1. Check your lease for the required notice period (usually 30–60 days). 2. Write a letter stating your move-out date and where to send your security deposit. 3. Send it certified mail with return receipt or deliver it in person and get a written confirmation. 4. Take dated photos of your apartment to protect against unfounded damage claims. 5. Keep a copy for your records." },
  { id: 'list-home', phase: 'BEFORE', cat: 'home', label: 'List your home or find a real estate agent', stakes: 'high', assistType: 'providers', searchQuery: 'real estate agent',
    why: "Selling a home takes time — the earlier you start, the less pressure you'll feel to accept a low offer.",
    guidance: "1. Interview 2–3 agents and ask for their marketing plan and recent comparable sales. 2. Ask about listing photos, virtual tours, and online exposure on major sites. 3. Discuss pricing strategy and staging — be realistic about your timeline and market. 4. Prepare to list within 2 weeks of signing — the first weeks are most critical. 5. Have a pre-listing inspection to surface any issues upfront." },
  { id: 'school-records', phase: 'BEFORE', cat: 'health', label: 'Request school records from current school', stakes: 'high', assistType: 'guidance',
    why: "Most schools need transcripts, immunization records, and IEPs before they'll enroll — requesting them early avoids a gap.",
    guidance: "1. Call or visit the school's main office and ask for the records request process. 2. Request transcripts, immunization records, IEPs, and any special education documentation. 3. Ask for digital copies if available — they're faster and easier to send to the new school. 4. Confirm the timeline for delivery (most schools send within 1–2 weeks). 5. Get a checklist from your new school so you request everything needed at once." },
  { id: 'vet-records', phase: 'BEFORE', cat: 'health', label: 'Get pet records from your current vet', stakes: 'medium', assistType: 'guidance',
    why: "A new vet will need vaccination history and any ongoing treatment records to pick up where yours left off.",
    guidance: "1. Call your current vet and request complete medical records — vaccination history, medications, ongoing treatments. 2. Ask for copies of any recent lab work, X-rays, or surgical records. 3. Request digital copies if available; otherwise, ask for printed records in a sealed envelope. 4. Mention your pet's microchip and ask if the new vet can access it. 5. Confirm your new vet has all records before the first appointment." },
  { id: 'insurance', phase: 'BEFORE', cat: 'finance', label: 'Get renters or homeowners insurance for the new place', stakes: 'high', assistType: 'guidance',
    why: "Coverage should start the day you move in — a gap leaves you exposed if something goes wrong on move-in day.",
    guidance: "1. Call your current insurance agent or get quotes online — prices vary based on location and coverage. 2. For homeowners, ask if you need an updated appraisal. 3. Confirm the effective date is the day you move in — no gaps. 4. Have proof of insurance ready for closing or move-in day. 5. Update beneficiaries and address on your policy once it's active." },
  { id: 'utilities', phase: 'BEFORE', cat: 'home', label: 'Transfer or set up utilities at the new place', stakes: 'high', assistType: 'guidance',
    why: "Scheduling transfers a week or two early means the lights are on when you arrive.",
    guidance: "1. Identify which utilities serve your new address — check the property listing or ask the seller or property manager. 2. Contact electric, gas, and water companies to schedule disconnection at your old place and connection at the new one. 3. Schedule connection for 1–2 days after move-in (moving day is chaotic). 4. Ask about deposits, billing frequency, and whether online auto-pay is available. 5. Take meter readings on your first day for your records." },
  { id: 'mail-forwarding', phase: 'BEFORE', cat: 'home', label: 'Set up mail forwarding with USPS', stakes: 'high', assistType: 'guidance',
    why: "Takes effect in about a week, and only lasts 12 months — important mail slips through the cracks fast without it.",
    guidance: "1. Go to USPS.com and select 'Mail Forwarding' or visit your local post office. 2. Fill out form PS Form 3575 with your old and new addresses. 3. Online forwarding costs about $1.10 and takes 1–2 weeks to activate. 4. Remember it only lasts 12 months — set a calendar reminder to renew or update addresses directly. 5. Still update critical addresses (banks, insurance, taxes) directly rather than relying only on mail forwarding." },
  { id: 'notify-employer', phase: 'BEFORE', cat: 'finance', label: 'Update your employer with your new address', stakes: 'medium', assistType: 'guidance',
    why: "Payroll, tax withholding, and benefits paperwork all key off your address — better to update it before the next pay cycle.",
    guidance: "1. Notify your HR or payroll department about your move once you have a confirmed address. 2. Update your address in the company's HR system or employee portal online. 3. Confirm your paycheck delivery method and address are correct. 4. If you're moving to a different state, notify HR so they can adjust tax withholding and check if benefits change. 5. Verify the address change took effect on your next pay stub." },
  // ── After the move ──────────────────────────────────────────────
  { id: 'update-license', phase: 'AFTER', cat: 'car', label: "Update your driver's license with your new address", stakes: 'high', assistType: 'guidance',
    why: "Most states require an address update within 30 days of moving — it's often needed for voter registration too.",
    guidance: "1. Visit your state's DMV website or a local office to see what you need — usually a proof of residency and your current license. 2. Acceptable proof of residency includes a utility bill, lease, or mortgage statement with your new address. 3. You can renew online, by mail, or in person — online is fastest. 4. Some states charge a fee and issue a new photo ID. 5. Allow 1–2 weeks for processing if you renew by mail or online." },
  { id: 'register-car', phase: 'AFTER', cat: 'car', label: 'Register your car in the new state', stakes: 'high', assistType: 'guidance',
    why: "States typically give you 30–90 days to re-register — after that you risk a ticket.",
    guidance: "1. Check your new state's DMV website for registration requirements and deadlines (typically 30–90 days). 2. Gather your current registration, proof of residency, vehicle title, and VIN (on your dashboard or title). 3. Ask the DMV if you need a vehicle inspection or emissions test — requirements vary by state. 4. Complete registration online, by mail, or in person — plates usually arrive by mail within 2 weeks. 5. Update your car insurance to reflect your new address and state before driving." },
  { id: 'voter-registration', phase: 'AFTER', cat: 'finance', label: 'Register to vote at your new address', stakes: 'medium', assistType: 'guidance',
    why: "You can't vote in your new district until you're registered there, and deadlines sneak up around elections.",
    guidance: "1. Visit Vote.org or your state's election office website — online registration takes about 5 minutes. 2. Register at least 15–30 days before Election Day (check your state's specific deadline). 3. You can usually register when renewing your driver's license at the DMV. 4. After registering, check your voter status online to confirm you're on the rolls. 5. Look up your new polling place — it may be different from your old address." },
  { id: 'enroll-school', phase: 'AFTER', cat: 'health', label: 'Enroll kids at their new school', stakes: 'high', assistType: 'guidance',
    why: "Enrollment often requires proof of address, immunization records, and transcripts — having those ready (from the earlier task) makes this smoother.",
    guidance: "1. Contact your new school's enrollment office and ask what documents they need — usually transcripts, proof of address, and immunization records. 2. Complete the enrollment form online or in person — most schools have links on their website. 3. Schedule a tour and meet the principal or administrator if possible. 4. Ask about the school start date, supply list, and any placement tests. 5. Confirm enrollment is complete and you know the first day and bus schedule." },
  { id: 'update-addresses', phase: 'AFTER', cat: 'finance', label: 'Update your address with banks, insurance, and subscriptions', stakes: 'medium', assistType: 'guidance',
    why: "Mail forwarding is temporary — anything you miss here starts bouncing after a year.",
    guidance: "1. Log into each bank account, credit card, and loan provider and update your address in settings. 2. Call your auto, health, home, and life insurance companies to update your address and confirm coverage. 3. Search for recurring subscriptions (streaming, apps, software, memberships) and update them. 4. Update Amazon, Apple ID, PayPal, and other accounts you use regularly. 5. Mail forwarding expires after 12 months — set a reminder to update any you haven't already." },
  { id: 'find-pcp', phase: 'AFTER', cat: 'health', label: 'Find a new primary care doctor', stakes: 'medium', assistType: 'providers', searchQuery: 'primary care doctor',
    why: "Better to have one lined up before you actually need one.",
    guidance: "1. Check your insurance provider's website for in-network doctors or call their customer service. 2. Search on Healthgrades, Zocdoc, or Google Maps and read reviews and ratings. 3. Call the doctor's office to confirm they're accepting new patients and ask about their hours. 4. Verify they take your insurance and ask what your copay is for a general visit. 5. Schedule a general check-up within a few months to establish care and transfer records from your previous doctor." },
  { id: 'find-dentist', phase: 'AFTER', cat: 'health', label: 'Find a new dentist', stakes: 'medium', assistType: 'providers', searchQuery: 'dentist',
    why: "Easy to let this slide, but a cleaning appointment is a low-pressure way to get established.",
    guidance: "1. Check your dental insurance for in-network dentists or search online reviews on Healthgrades or Google. 2. Call to confirm they're accepting new patients and ask about hours and insurance accepted. 3. Ask what your copay is for a cleaning and exam. 4. Schedule a cleaning appointment — it's a low-pressure way to get established. 5. Ask your previous dentist for a referral if you had one you liked." },
  { id: 'find-pediatrician', phase: 'AFTER', cat: 'health', label: 'Find a new pediatrician', stakes: 'high', assistType: 'providers', searchQuery: 'pediatrician',
    why: "Kids need a doctor on file for school forms, sick visits, and prescriptions — worth setting up before you need it urgently.",
    guidance: "1. Ask your new primary care doctor for a referral or check your insurance network online. 2. Search Zocdoc, Healthgrades, or Google Maps for reviews and ratings. 3. Call and confirm they're accepting new patients — ask about hours and whether they have urgent care for sick visits. 4. Verify they take your insurance and ask about preventive care visit and sick visit costs. 5. Schedule a well-child visit within the first month to establish records for school." },
  { id: 'find-vet', phase: 'AFTER', cat: 'health', label: 'Find a new vet', stakes: 'medium', assistType: 'providers', searchQuery: 'veterinarian',
    why: "An emergency vet visit is not when you want to be searching for one.",
    guidance: "1. Search Google Maps or Yelp for vets near your new address and read reviews. 2. Call to confirm they're accepting new patients and ask about hours and emergency procedures. 3. Ask if they take your pet's microchip brand and whether they offer online prescription refills. 4. Confirm they have appointment availability within your first week so you can transfer records. 5. Ask your previous vet for a referral if you had one you trusted." },
  { id: 'register-pets', phase: 'AFTER', cat: 'health', label: 'Register or license pets in your new city or county', stakes: 'medium', assistType: 'guidance',
    why: "Many cities require pet licenses — it's usually cheap and quick, and some shelters check for it.",
    guidance: "1. Visit your city or county website and search for 'pet licensing' or 'pet registration'. 2. Check what's required — some need proof of vaccination, microchip information, or vet records. 3. Most licenses cost $10–30 per year and come with a tag. 4. Some cities require a visit in person; others allow online registration. 5. Set a calendar reminder for annual renewal." },
  { id: 'update-emergency-contacts', phase: 'AFTER', cat: 'emergency', label: 'Update emergency contacts at work and school', stakes: 'medium', assistType: 'guidance',
    why: "Old contacts may not be nearby anymore — making sure the right person gets called matters.",
    guidance: "1. Log into your employee or payroll portal and update your emergency contact information. 2. Contact each child's school and update emergency contacts in their system. 3. Make sure the person you list is actually available and reachable — give them a heads-up. 4. Verify phone numbers are current and in the right format. 5. Update any medical forms (pediatrician, school health, sports physicals) with the same contacts." },
  { id: 'file-both-state-taxes', phase: 'AFTER', cat: 'finance', label: 'File state taxes in both states if you moved mid-year', stakes: 'high', assistType: 'guidance',
    why: "You owe each state for the portion of the year you lived there — missing one can trigger penalties.",
    guidance: "1. Calculate your move date and income for each portion of the year. 2. File the old state's tax return first — it's usually less complex. 3. Your new state may offer a credit for taxes paid to the old state — ask your accountant or check their tax guide. 4. Use separate W-2s or document income split if your employer issued one for the year. 5. File both returns before the April 15 deadline — penalties for missing a state return can be steep." },
  { id: 'check-hazards', phase: 'AFTER', cat: 'emergency', label: 'Check if your new area has specific hazards', stakes: 'medium', assistType: 'guidance',
    why: "Flood zones, wildfire areas, tornado alleys — knowing what to prepare for is half the battle.",
    guidance: "1. Search FEMA's Flood Maps (fema.gov/flood-maps) to see if your address is in a flood zone. 2. Check your state's emergency management website for wildfire risk, tornado alleys, or earthquake zones. 3. Visit the county assessor's or environmental health website for nearby industrial facilities or environmental concerns. 4. Ask your new neighbors about historical hazards — past floods, storms, or power outages. 5. Update your homeowners or renters insurance if needed and prepare an emergency kit appropriate to your area's risks." },
];

// Due-date offsets from the move date (negative = before).
const PHASE_DUE_OFFSETS = { BEFORE: -14, AFTER: 30 };
const DUE_OFFSET_OVERRIDES = {
  'research-movers':          -45,
  'list-home':                -90,
  'give-notice':              -30,
  'school-records':           -30,
  'vet-records':              -21,
  'insurance':                -14,
  'utilities':                 -7,
  'mail-forwarding':          -14,
  'notify-employer':           -7,
  'update-license':            14,
  'register-car':              30,
  'voter-registration':        30,
  'enroll-school':             14,
  'update-addresses':          14,
  'find-pcp':                  30,
  'find-dentist':              45,
  'find-pediatrician':         30,
  'find-vet':                  45,
  'register-pets':             30,
  'update-emergency-contacts': 14,
  'file-both-state-taxes':     90,
  'check-hazards':             14,
};

// Retro phases by stage — users who already moved may have handled the
// before-the-move tasks; offer them as "already handled?" checklist.
const RETRO_PHASES = {
  looking: [],
  found:   [],
  moved:   ['BEFORE'],
};

function passesGates(t, answers) {
  if (OWNS_HOME_ONLY.has(t.id) && !answers?.ownsHome)                  return false;
  if (RENTING_ONLY.has(t.id) && answers?.ownsHome)                     return false;
  if (KIDS_ONLY.has(t.id) && !answers?.hasKids)                        return false;
  if (PETS_ONLY.has(t.id) && !answers?.hasPets)                        return false;
  if (OUT_OF_STATE_ONLY.has(t.id) && !answers?.outOfState)             return false;
  if (NEEDS_PROVIDERS_ONLY.has(t.id) && !answers?.needNewProviders)    return false;
  if (HAS_CAR_ONLY.has(t.id) && !answers?.hasCar)                     return false;
  return true;
}

export function retroactiveCandidates(answers) {
  const phases = new Set(RETRO_PHASES[answers?.stage] ?? []);
  if (phases.size === 0) return [];
  return BUNDLE.filter(t => phases.has(t.phase) && passesGates(t, answers));
}

export function tasksForIntake(answers) {
  const alreadyDone = new Set(answers?.alreadyDone || []);
  const anchor = answers?.date;
  return BUNDLE
    .filter(t => !alreadyDone.has(t.id) && passesGates(t, answers))
    .map(t => {
      const task = { ...t, dueDate: computeDueDate(anchor, DUE_OFFSET_OVERRIDES[t.id] ?? PHASE_DUE_OFFSETS[t.phase]) };
      if (t.id === 'update-license' && answers?.outOfState) {
        task.label = "Get your new state driver’s license";
        task.why = "Most states require a new license within 30–90 days of establishing residency — your old state’s license won’t be valid much longer.";
      }
      return task;
    });
}

export const MOVING = {
  id:    'moving',
  label: 'Moving',
  bundle: BUNDLE,
  phases: MOVING_PHASES,
  phaseLabels: MOVING_PHASE_LABELS,
  retroactiveCandidates,
  tasksForIntake,
  intake: {
    steps: [
      {
        type: 'choice',
        key:  'stage',
        question: 'Where are you in the process?',
        help: "Helps Mitzy pace things and skip what’s behind you.",
        options: [
          { value: 'looking', label: 'Still looking' },
          { value: 'found',   label: 'Found a place' },
          { value: 'moved',   label: 'Already moved' },
        ],
      },
      {
        type: 'date',
        key:  'date',
        question: "When’s the move — or when was it?",
        help: 'An estimate is fine — Mitzy will pace things around it.',
      },
      {
        type: 'booleans',
        question: 'A few quick questions.',
        help: 'Some tasks only apply if these do — Mitzy will skip the rest.',
        fields: [
          { key: 'ownsHome',          label: 'Do you own your current home?' },
          { key: 'outOfState',        label: 'Are you moving to a different state?' },
          { key: 'needNewProviders',  label: 'Will you need to find new doctors and local services?' },
        ],
      },
    ],
  },
};
