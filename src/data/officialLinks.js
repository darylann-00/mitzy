// Verified official links.
//
// Assist answers run on a model with no web access for every type except
// `jurisdiction` and `deadline`. Asked for a URL, that model will happily
// invent a plausible-looking .gov deep link that 404s — which is the worst
// failure mode we have on a divorce, death, or name-change task. So instead of
// letting it write URLs, we hand it a short allowlist and forbid everything
// else (see `buildAssistPrompt`).
//
// Rules for this file:
//   1. Every URL was opened and confirmed to be the official page it claims to
//      be. Nothing goes in here from memory.
//   2. Nothing state-specific — unless the page is itself a 50-state directory
//      (vital records, DMV, voter registration, legal aid, unclaimed property).
//      Those directories are what make this work without a live search.
//   3. Prefer a stable landing page over a deep link into a form flow. Agencies
//      reorganize; landing pages survive it.
//
// Re-check these once a year. `scripts/check-official-links.mjs` pings each one
// and reports anything that stopped returning 200.

export const OFFICIAL_LINKS = {
  // ── Social Security ──
  'ssa-name-change': {
    label: 'Change your name with Social Security',
    url: 'https://www.ssa.gov/life-events/change-name',
  },
  'ssa-child-ssn': {
    label: "Social Security numbers for children (SSA, PDF)",
    url: 'https://www.ssa.gov/pubs/EN-05-10023.pdf',
  },
  'ssa-when-someone-dies': {
    label: 'What to do when someone dies (SSA)',
    url: 'https://www.ssa.gov/personal-record/when-someone-dies',
  },
  'ssa-survivor': {
    label: 'Social Security survivor benefits',
    url: 'https://www.ssa.gov/survivor',
  },

  // ── Records and ID ──
  // The single most useful link in this file: a federal directory of every
  // state's vital records office, which is otherwise a per-state lookup.
  'vital-records': {
    label: 'Where to write for vital records — birth, death, marriage, divorce (CDC)',
    url: 'https://www.cdc.gov/nchs/w2w/index.htm',
  },
  'dmv-directory': {
    label: 'Find your state motor vehicle agency (USAGov)',
    url: 'https://www.usa.gov/state-motor-vehicle-services',
  },
  'passport-change': {
    label: 'Change or correct a passport (U.S. State Department)',
    url: 'https://travel.state.gov/content/travel/en/passports/have-passport/change-correct.html',
  },
  'vote-register': {
    label: 'Register to vote or update your registration (Vote.gov)',
    url: 'https://vote.gov/register',
  },
  'usps-change-of-address': {
    label: 'Official USPS change-of-address form',
    url: 'https://www.usps.com/umove/',
  },

  // ── Money and taxes ──
  'irs-w4': {
    label: 'About Form W-4, Employee’s Withholding Certificate (IRS)',
    url: 'https://www.irs.gov/forms-pubs/about-form-w-4',
  },
  'irs-free-file': {
    label: 'File your taxes for free (IRS)',
    url: 'https://www.irs.gov/file-your-taxes-for-free',
  },
  'annual-credit-report': {
    label: 'AnnualCreditReport.com — the federally authorized free report',
    url: 'https://www.annualcreditreport.com',
  },
  'ftc-credit-freeze': {
    label: 'Credit freezes and fraud alerts (FTC)',
    url: 'https://consumer.ftc.gov/articles/credit-freezes-and-fraud-alerts',
  },
  'identity-theft': {
    label: 'Report identity theft and get a recovery plan (FTC)',
    url: 'https://www.identitytheft.gov',
  },
  'unclaimed-property': {
    label: 'Search your state’s unclaimed property (NAUPA)',
    url: 'https://unclaimed.org/search/',
  },

  // ── Health coverage ──
  'healthcare-sep': {
    label: 'Special Enrollment Period after a life change (HealthCare.gov)',
    url: 'https://www.healthcare.gov/coverage-outside-open-enrollment/special-enrollment-period/',
  },
  'cdc-vaccine-schedule': {
    label: 'Vaccine schedules for you and your family (CDC)',
    url: 'https://www.cdc.gov/vaccines/imz-schedules/index.html',
  },

  // ── Legal help ──
  // Divorce and estate tasks are `jurisdiction` type, so a live search usually
  // finds the county's own page. These are the floor when it doesn't.
  'legal-aid': {
    label: 'Find free or low-cost legal aid near you (Legal Services Corporation)',
    url: 'https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help',
  },
  'lawhelp-forms': {
    label: 'Free court forms and self-help guides by state (LawHelp.org)',
    url: 'https://www.lawhelp.org/findforms',
  },

  // ── Emergency and safety ──
  'ready-kit': {
    label: 'Build an emergency kit (Ready.gov)',
    url: 'https://www.ready.gov/kit',
  },
  'ready-plan': {
    label: 'Make an emergency plan (Ready.gov)',
    url: 'https://www.ready.gov/plan',
  },
  'nhtsa-recalls': {
    label: 'Check for recalls — vehicle, car seat, tire (NHTSA)',
    url: 'https://www.nhtsa.gov/recalls',
  },
};

// Which links belong to which task.
//
// Keys are matched against a life event task's `eventBundleKey` (the stable id
// inside a bundle, e.g. `update-ssn-card`) or a base task's `id` from
// `tasks.js`. Per-car, per-kid, and per-pet tasks carry a slug suffix
// (`car-reg-2016-subaru-outback`), so a key also matches any id that starts
// with `key + '-'`.
//
// Bundle keys repeat across events on purpose — `update-tax-withholding` is in
// both marriage and divorce, and the same IRS page serves both.
const TASK_LINKS = {
  // Name change
  'update-ssn-card':           ['ssa-name-change'],
  'update-drivers-license':    ['dmv-directory'],
  'update-license':            ['dmv-directory'],
  'register-car':              ['dmv-directory'],
  'car-reg':                   ['dmv-directory'],
  'update-passport':           ['passport-change'],
  'update-voter-registration': ['vote-register'],
  'voter-registration':        ['vote-register'],

  // Certificates and records
  'birth-cert':             ['vital-records'],
  'death-certificates':     ['vital-records'],
  'marriage-certificates':  ['vital-records'],

  // Moving
  'forward-mail':     ['usps-change-of-address'],
  'mail-forwarding':  ['usps-change-of-address'],
  'update-addresses': ['usps-change-of-address'],

  // Taxes and withholding
  'update-tax-withholding': ['irs-w4'],
  'fin-tax':                ['irs-free-file'],
  'file-both-state-taxes':  ['irs-free-file'],
  'final-tax-return':       ['irs-free-file'],

  // Credit and identity
  'fin-cred':              ['annual-credit-report', 'ftc-credit-freeze'],
  'check-credit':          ['annual-credit-report', 'ftc-credit-freeze'],
  'notify-credit-bureaus': ['ftc-credit-freeze', 'identity-theft'],
  'fin-unclaimed':         ['unclaimed-property'],

  // Health coverage
  'add-spouse-insurance':   ['healthcare-sep'],
  'add-baby-insurance':     ['healthcare-sep'],
  'update-health-insurance':['healthcare-sep'],
  'choose-pediatrician':    ['cdc-vaccine-schedule'],
  'first-pediatrician':     ['cdc-vaccine-schedule'],

  // Social Security life events
  'ssn':        ['ssa-child-ssn'],
  'notify-ssa': ['ssa-when-someone-dies', 'ssa-survivor'],

  // Legal
  'legal-aid-check':         ['legal-aid', 'lawhelp-forms'],
  'court-forms':             ['lawhelp-forms', 'legal-aid'],
  'check-uncontested':       ['lawhelp-forms'],
  'file-respond-petition':   ['lawhelp-forms'],
  'serve-papers':            ['lawhelp-forms'],
  'final-hearing':           ['lawhelp-forms'],
  'file-mediation-agreement':['lawhelp-forms'],

  // Emergency and safety
  'em-kit':          ['ready-kit'],
  'em-kit-check':    ['ready-kit'],
  'car-kit-build':   ['ready-kit'],
  'car-kit':         ['ready-kit'],
  'em-evac':         ['ready-plan'],
  'check-hazards':   ['ready-plan'],
  'install-car-seat':['nhtsa-recalls'],
};

// Longest key first, so `car-kit-build` wins over `car-kit` on a prefix match.
const PREFIX_KEYS = Object.keys(TASK_LINKS).sort((a, b) => b.length - a.length);

// Returns the verified links for a task, or [] when we have none. Life event
// tasks are matched on their bundle key so every instance of an event — and any
// future event that reuses the key — picks the links up for free.
export function linksForTask(task) {
  if (!task) return [];

  const key = task.eventBundleKey || task.id;
  if (!key) return [];

  let ids = TASK_LINKS[key];
  if (!ids) {
    const prefix = PREFIX_KEYS.find(k => key.startsWith(`${k}-`));
    ids = prefix ? TASK_LINKS[prefix] : null;
  }
  if (!ids) return [];

  return ids.map(id => OFFICIAL_LINKS[id]).filter(Boolean);
}

// Markdown for a single registry entry, for use in static task guidance copy.
// Guidance strings live in `tasks.js` and the life event bundles, so this keeps
// the URL itself in exactly one place. Pass `text` to fit the link into a
// sentence — the registry label is written to stand alone in a list, which
// reads badly mid-step.
export function officialLink(id, text) {
  const link = OFFICIAL_LINKS[id];
  if (!link) return text || '';
  return `[${text || link.label}](${link.url})`;
}
