import { T, ALL_TASKS, EM_UNIVERSAL, EM_HAZARD } from "./tasks";

// ─── Per-car Task Generator ───────────────────────────────────────────────────

function parseCarParts(carString) {
  const parts = carString.trim().split(/\s+/);
  const slug  = parts.join("-").toLowerCase();
  const make  = parts[1] || "";
  const model = parts.slice(2).join(" "); // everything after year + make
  return { slug, make, model };
}

const EV_MAKES = new Set(["Tesla"]);
const EV_MODELS = new Set(["Ioniq 5", "EV6", "ID.4"]);

function isEV(make, model) {
  return EV_MAKES.has(make) || EV_MODELS.has(model);
}

export function carTasks(carString) {
  const { slug, make, model } = parseCarParts(carString);
  const ev = isEV(make, model);
  const n  = (label) => `${model}: ${label}`;
  const id = (base)  => `${base}-${slug}`;
  const t  = (fields) => ({ ...fields, requires: [], vehicle: carString });

  const tasks = [];

  // ── ICE-only ──
  if (!ev) {
    tasks.push(t({
      id: id("car-oil"), cat: "car", label: n("oil change"),
      intervalDays: 90, windowDays: 14, reminderLeadDays: 21,
      stakes: "high", hardDeadline: false, activeMonths: null, seasonalLabel: null,
      assistType: "providers", diyable: false, timeToComplete: "Tech visit",
      searchQuery: "oil change",
      minAge: null, maxAge: null, oneTime: false,
      note: "Every 3 months or per your vehicle manual.",
      why: "Engine oil breaks down over time and loses its ability to lubricate engine components. Running an engine on degraded oil causes accelerated wear.",
      guidance: "1. Check your owner's manual for your car's specific oil change interval — many newer cars go 5000-7500 miles. 2. Book at any oil change shop or dealership. 3. While you're there ask them to check your tire rotation, brake pad thickness, battery health, and cabin air filter — these are all quick checks most shops will do at the same visit. 4. Keep your service records.",
      lastGuidanceUpdate: "2025-01",
    }));
    tasks.push(t({
      id: id("car-trans"), cat: "car", label: n("transmission service"),
      intervalDays: 1095, windowDays: 30, reminderLeadDays: 45,
      stakes: "high", hardDeadline: false, activeMonths: null, seasonalLabel: null,
      assistType: "providers", diyable: false, timeToComplete: "Tech visit",
      searchQuery: "transmission service auto repair",
      minAge: null, maxAge: null, oneTime: false,
      note: "Every 2-3 years. Most people don't know to ask for this.",
      why: "Transmission fluid degrades over time and loses its ability to protect transmission components. Transmission repairs are among the most expensive automotive repairs.",
      guidance: "1. At your next service appointment ask your mechanic specifically to inspect the transmission fluid. 2. Do not assume it will be checked automatically — it often is not. 3. Ask them to describe the fluid condition — it should be red or pink and not smell burnt. 4. If service is needed ask for the fluid to be drained and refilled.",
      lastGuidanceUpdate: "2025-01",
    }));
    tasks.push(t({
      id: id("car-emiss"), cat: "car", label: n("emissions test"),
      intervalDays: 730, windowDays: 30, reminderLeadDays: 45,
      stakes: "high", hardDeadline: false, activeMonths: null, seasonalLabel: null,
      assistType: "deadline", diyable: false, timeToComplete: "30 minutes",
      minAge: null, maxAge: null, oneTime: false,
      note: "Varies by state — check your registration paperwork.",
      why: "Some states require emissions testing as part of the vehicle registration renewal process. Failing to test can block renewal.",
      guidance: "1. Check your registration renewal notice to see if emissions testing is required in your state. 2. Find a certified testing station — your state DMV website has a locator. 3. Bring your registration and insurance. 4. Most tests take 15-20 minutes and cost $20-40. 5. If your vehicle fails you'll receive a list of required repairs before you can retest.",
      lastGuidanceUpdate: "2025-01",
    }));
  }

  // ── EV-only ──
  if (ev) {
    tasks.push(t({
      id: id("car-ev-batt"), cat: "car", label: n("EV battery health check"),
      intervalDays: 365, windowDays: 30, reminderLeadDays: 45,
      stakes: "high", hardDeadline: false, activeMonths: null, seasonalLabel: null,
      assistType: "providers", diyable: false, timeToComplete: "Tech visit",
      searchQuery: "EV electric vehicle service center",
      minAge: null, maxAge: null, oneTime: false,
      note: "Annually. Catches early degradation before range is noticeably affected.",
      why: "EV battery packs degrade gradually. Annual health checks catch cells performing significantly below spec before they affect daily range.",
      guidance: "1. Most EV manufacturers provide battery health data through their app or onboard display — check your owner's manual for how to access it. 2. For a thorough check bring the vehicle to a dealership or EV-specialist shop. 3. Note your current range on a full charge and compare it to the original EPA-rated range — more than 20% loss warrants a service visit.",
      lastGuidanceUpdate: "2025-01",
    }));
  }

  // ── All vehicles ──
  tasks.push(t({
    id: id("car-tires"), cat: "car", label: n("tire rotation"),
    intervalDays: 180, windowDays: 14, reminderLeadDays: 21,
    stakes: "medium", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "providers", diyable: false, timeToComplete: "Tech visit",
    searchQuery: "tire rotation auto shop",
    minAge: null, maxAge: null, oneTime: false,
    note: "Every 5-7k miles. Extends tire life significantly.",
    why: "Tires wear unevenly depending on their position on the vehicle. Rotation evens out the wear and extends overall tire life.",
    guidance: "1. Ask for a rotation at your next service visit — most shops do it for $20-30. 2. Tell the technician if you've noticed any pulling to one side or vibration at highway speeds — these can indicate a balance issue.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-press"), cat: "car", label: n("check tire pressure"),
    intervalDays: 30, windowDays: 7, reminderLeadDays: 10,
    stakes: "medium", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "guidance", diyable: true, timeToComplete: "5 minutes",
    minAge: null, maxAge: null, oneTime: false,
    note: "Monthly. Tires lose about 1 PSI per month naturally.",
    why: "Tires lose approximately 1 PSI per month under normal conditions and more in cold weather. Underinflated tires wear faster and affect fuel economy.",
    guidance: "1. Find the correct tire pressure on the sticker inside your driver door jamb — not the number on the tire sidewall. 2. Use a pressure gauge at any gas station. 3. Press the gauge firmly onto the valve stem to get a reading. 4. Add air if needed. 5. Check all four tires and the spare.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-reg"), cat: "car", label: n("renew registration"),
    intervalDays: 365, windowDays: 45, reminderLeadDays: 60,
    stakes: "high", hardDeadline: true, activeMonths: null, seasonalLabel: null,
    assistType: "deadline", diyable: false, timeToComplete: "30 minutes",
    minAge: null, maxAge: null, oneTime: false,
    note: "Check your registration sticker for expiration date.",
    why: "Driving with an expired registration results in a traffic citation in most states.",
    guidance: "1. Find your expiration date on your current registration card or sticker. 2. Most states allow renewal online — check your state DMV website. 3. Have your license plate number and proof of insurance ready. 4. Allow up to 2 weeks for the new sticker to arrive by mail.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-ins"), cat: "car", label: n("review auto insurance"),
    intervalDays: 365, windowDays: 30, reminderLeadDays: 45,
    stakes: "medium", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "guidance", diyable: false, timeToComplete: "30 minutes",
    minAge: null, maxAge: null, oneTime: false,
    note: "At renewal time. Get at least one competing quote.",
    why: "Auto insurance rates change at renewal and competing quotes often differ significantly.",
    guidance: "1. Pull up your current policy and note your coverage levels and current premium. 2. Get one quote from a different insurer — use their website or call directly. 3. If you find a better rate contact your current insurer — they will sometimes match it. 4. Make sure you're comparing the same coverage levels not just the premium.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-wipers"), cat: "car", label: n("replace wiper blades"),
    intervalDays: 365, windowDays: 21, reminderLeadDays: 30,
    stakes: "medium", hardDeadline: false, activeMonths: null, seasonStart: 8, seasonalLabel: "Before rainy season",
    assistType: "guidance", diyable: true, timeToComplete: "15 minutes",
    minAge: null, maxAge: null, oneTime: false,
    note: "Before rainy season. Streaky wipers are a real safety issue.",
    why: "Wiper blades degrade from UV exposure and environmental wear. Worn blades streak or skip which reduces visibility in rain.",
    guidance: "1. Look up your car's wiper blade size at any auto parts store — they have a lookup tool. 2. Buy replacement blades ($15-30 each). 3. Lift the wiper arm away from the windshield. 4. Press the release tab where the blade meets the arm and slide the old blade off. 5. Slide the new blade on until it clicks. 6. Repeat on both sides.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-batt"), cat: "car", label: n("test 12V battery"),
    intervalDays: 365, windowDays: 21, reminderLeadDays: 30,
    stakes: "high", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "providers", diyable: false, timeToComplete: "15 minutes",
    searchQuery: "auto parts store battery test",
    minAge: null, maxAge: null, oneTime: false,
    note: ev ? "EVs have a 12V auxiliary battery separate from the main pack. Most auto parts stores test for free." : "Annually. Most auto parts stores test for free.",
    why: "Car batteries have a typical lifespan of 3-5 years. A battery that tests weak is likely to fail — often in cold weather.",
    guidance: "1. Drive to any auto parts store such as AutoZone or O'Reilly — they offer free battery testing. 2. Ask for a load test — this measures actual battery performance not just charge. 3. If the battery tests below 50% health consider replacing it before it fails.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-brakes"), cat: "car", label: n("brake inspection"),
    intervalDays: ev ? 730 : 365, windowDays: 21, reminderLeadDays: 30,
    stakes: "high", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "providers", diyable: false, timeToComplete: "Tech visit",
    searchQuery: "brake inspection auto repair",
    minAge: null, maxAge: null, oneTime: false,
    note: ev ? "Every 2 years. Regen braking reduces pad wear significantly — but calipers can still seize from infrequent use." : "Annually or immediately if you hear squealing.",
    why: "Brake pad thickness determines stopping distance. Worn pads damage rotors which turns a pad replacement into a more expensive repair.",
    guidance: "1. Ask for a brake inspection at your next service visit — most shops do this at no charge. 2. Ask the technician to give you the pad thickness measurement in millimeters. 3. Under 3mm means plan to replace soon. 4. If you hear squealing or grinding do not wait for a scheduled appointment.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-cabin"), cat: "car", label: n("check cabin air filter"),
    intervalDays: 365, windowDays: 21, reminderLeadDays: 30,
    stakes: "low", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "guidance", diyable: true, timeToComplete: "15 minutes",
    minAge: null, maxAge: null, oneTime: false,
    note: "Annually. Most people don't know this exists.",
    why: "Cabin air filters accumulate dust, pollen, and debris over time, which restricts airflow through the vehicle's ventilation system.",
    guidance: "1. If you want to DIY: look up your cabin air filter location in your owner's manual — usually behind the glove box or under the dashboard. Remove the old filter and hold it up to light. If it's visibly gray or clogged replace it. Filters cost $15-25 at any auto parts store. 2. If you'd rather not DIY ask your shop to check and replace it at your next service visit.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-spare"), cat: "car", label: n("check spare tire"),
    intervalDays: 365, windowDays: 21, reminderLeadDays: 30,
    stakes: "medium", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "guidance", diyable: true, timeToComplete: "10 minutes",
    minAge: null, maxAge: null, oneTime: false,
    note: "Annually. Most people discover their spare is flat when they need it.",
    why: "Spare tires lose pressure over time and are rarely checked until needed.",
    guidance: "1. Find your spare tire — usually under the trunk floor mat or mounted underneath the vehicle. 2. Check the pressure with a gauge. 3. The correct PSI is printed on the tire sidewall or in your owner's manual. 4. Inspect the tire for visible cracks or dry rot. 5. If it's a compact spare note that it has a 50mph speed limit and limited range — typically 50 miles.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-kit-build"), cat: "car", label: n("build emergency kit"),
    intervalDays: null, windowDays: null, reminderLeadDays: null,
    stakes: "medium", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "guidance", diyable: true, timeToComplete: "30 minutes",
    minAge: null, maxAge: null, oneTime: true,
    note: "One-time. Keep it in your trunk.",
    why: "A car emergency kit provides basic supplies for roadside situations.",
    guidance: "1. Get a bag or bin that fits in your trunk. 2. Add the following: jumper cables or a portable jump starter, a flashlight with extra batteries, a basic first aid kit, a blanket, a bottle of water, a phone charger, and reflective triangles or road flares. 3. In winter add an ice scraper and a small bag of sand or kitty litter for traction. 4. Store it in your trunk.",
    lastGuidanceUpdate: "2025-01",
  }));
  tasks.push(t({
    id: id("car-kit"), cat: "car", label: n("check emergency kit"),
    intervalDays: 365, windowDays: 14, reminderLeadDays: 21,
    stakes: "medium", hardDeadline: false, activeMonths: null, seasonalLabel: null,
    assistType: "guidance", diyable: true, timeToComplete: "10 minutes",
    minAge: null, maxAge: null, oneTime: false, dependsOn: id("car-kit-build"),
    note: "Annually. You discover it's incomplete when you need it most.",
    why: "Emergency kits in cars deteriorate over time — batteries die, food expires, and items get removed and not replaced.",
    guidance: "1. Open your trunk and take inventory. 2. Check that all items are present — jumper cables or jump starter, flashlight, first aid kit, blanket, water, phone charger, and reflective triangles. 3. Test the flashlight batteries. 4. Replace anything missing or expired. 5. In winter check that you have an ice scraper and sand or kitty litter.",
    lastGuidanceUpdate: "2025-01",
  }));

  return tasks;
}

// ─── Per-kid Task Generator ───────────────────────────────────────────────────

export function kidTasks(kid) {
  const { name, age: ageStr } = kid;
  const age  = parseInt(ageStr, 10);
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const tasks = [];

  tasks.push(T(`k-health-${slug}`, "health", `${name}: annual health visit`, 365, 30, "high",   null,         [], "script",   "Annual well-child visit."));
  tasks.push(T(`k-dent-${slug}`,   "health", `${name}: dental cleaning`,     180, 21, "medium", null,         [], "script",   "Every 6 months."));
  tasks.push(T(`k-eye-${slug}`,    "health", `${name}: eye exam`,            365, 30, "medium", null,         [], "script",   "Annually."));

  if (age < 18) {
    tasks.push(T(`k-emerg-${slug}`,  "school", `${name}: update emergency contacts`, 365, 14, "high",   [7,8,9],   [], "script",    "Update at school start."));
    tasks.push(T(`k-hform-${slug}`,  "school", `${name}: submit health form`,        365, 21, "high",   [7,8,9],   [], "script",    "Required annually."));
    tasks.push(T(`k-supply-${slug}`, "school", `${name}: restock school supplies`,   365, 21, "low",    [7,8],     [], "guidance",  "Check school supply list."));
    tasks.push(T(`k-winter-${slug}`, "school", `${name}: plan winter break coverage`,365, 30, "high",   [10,11],   [], "providers", "Winter break is typically 2 weeks in December."));
  }

  if (age >= 4 && age < 16) {
    tasks.push(T(`k-camp-${slug}`,   "school", `${name}: summer camp signup`,       365, 90, "high",   [11,12,1,2], [], "deadline",  "Popular camps fill months in advance."));
    tasks.push(T(`k-spring-${slug}`, "school", `${name}: spring break coverage`,    365, 45, "high",   [1,2,3],     [], "providers", "Spring break is typically late March."));
  }

  if (age >= 5 && age < 18) {
    tasks.push(T(`k-sport-${slug}`, "school", `${name}: sports/activity registration`, 180, 45, "medium", null, [], "providers", "Youth leagues fill fast."));
  }

  if (age >= 16) {
    tasks.push(T(`k-col-${slug}`, "school", `${name}: college prep check-in`, 180, 30, "high", null, [], "guidance", "SAT/ACT, college visits, application deadlines."));
  }

  return tasks;
}

// ─── Per-pet Task Generator ───────────────────────────────────────────────────

export function petTasks(pet) {
  const { name, age: ageStr, type, longCoat } = pet;
  const age    = parseInt(ageStr, 10);
  const slug   = name.toLowerCase().replace(/\s+/g, "-");
  const senior = age >= 7;
  const tasks  = [];

  tasks.push({ ...T(`p-vet-${slug}`,     "pet", `${name}: vet wellness visit`,         senior ? 180 : 365, 21, "high",   null, [], "providers", senior ? `${name} is a senior pet — twice-yearly visits recommended.` : "Annual wellness exam."),    searchQuery: `${type} veterinary clinic` });
  tasks.push(T(`p-flea-${slug}`,    "pet", `${name}: flea/tick prevention refill`, 90,  14, "medium", null, [], "guidance",  "Every 3 months. Don't let this lapse."));
  tasks.push(T(`p-license-${slug}`, "pet", `${name}: pet license renewal`,         365, 30, "medium", null, [], "deadline",  "Most municipalities require annual pet licensing."));
  tasks.push({ ...T(`p-dental-${slug}`,  "pet", `${name}: dental cleaning`,             365, 30, "medium", null, [], "providers", "Annual dental cleaning."),                                                                                                                                                                                                              searchQuery: `${type} dental cleaning veterinarian` });

  if (type === "dog") {
    tasks.push(T(`p-hw-${slug}`,    "pet", `${name}: heartworm prevention refill`, 90, 14, "high",   null, [], "guidance",  "Monthly or quarterly. Missing doses creates real risk."));
    tasks.push({ ...T(`p-vax-${slug}`,   "pet", `${name}: rabies/booster vaccines`,    365, 30, "high",   null, [], "providers", "Rabies legally required in most states."),  searchQuery: "dog veterinary clinic vaccines" });
    tasks.push({ ...T(`p-nails-${slug}`, "pet", `${name}: nail trim`,                   60, 10, "low",    null, [], "providers", "Every 6-8 weeks."),                           searchQuery: "dog groomer nail trim" });
    if (longCoat) {
      tasks.push({ ...T(`p-groom-${slug}`, "pet", `${name}: grooming appointment`, 60, 14, "low", null, [], "providers", "Every 6-8 weeks for long-coat breeds."),              searchQuery: "dog groomer" });
    }
  }

  if (type === "cat") {
    tasks.push(T(`p-nails-${slug}`,  "pet", `${name}: nail trim`,             30, 7, "low", null, [], "guidance", "Monthly."));
    tasks.push(T(`p-litter-${slug}`, "pet", `${name}: litter box deep clean`, 30, 7, "low", null, [], "guidance", "Monthly deep clean beyond daily scooping."));
  }

  return tasks;
}

// ─── Library Builder ──────────────────────────────────────────────────────────

export function buildTaskLibrary(profile) {
  const flags = [];
  if (profile.hasHome) flags.push("home");
  if (profile.hasCar)  flags.push("car");
  if (parseInt(profile.age, 10) >= 40) flags.push("40plus");

  const usePerCarTasks = profile.hasCar && profile.cars?.length > 0;

  const lib = [
    ...ALL_TASKS.filter(t => {
      if (t.requires.length === 0) return true;
      if (usePerCarTasks && t.requires.includes("car")) return false;
      return t.requires.every(r => flags.includes(r));
    }),
  ];

  if (usePerCarTasks) {
    profile.cars.forEach(car => lib.push(...carTasks(car)));
  }

  if (profile.hasKids && profile.kids?.length > 0) {
    profile.kids.forEach(k => lib.push(...kidTasks(k)));
  }

  if (profile.hasPets && profile.pets?.length > 0) {
    profile.pets.forEach(p => lib.push(...petTasks(p)));
  }

  if (profile.hazards?.length > 0) {
    const em   = [...EM_UNIVERSAL];
    const seen = new Set(lib.map(t => t.id));
    profile.hazards.forEach(h => {
      if (EM_HAZARD[h]) em.push(...EM_HAZARD[h]);
    });
    em.filter(t => !seen.has(t.id)).forEach(t => lib.push(t));
  }

  return lib;
}

// ─── Priority Tasks ───────────────────────────────────────────────────────────

export const PRIORITY_IDS = [
  "fin-will", "fin-life", "fin-benef", "h-ins", "h-phys",
  "h-mammo", "hm-smoke", "hm-fire", "hm-dryer", "car-brakes", "car-batt", "car-reg",
];
const PRIORITY_KID_PREFIXES = ["k-health-", "k-camp-", "k-winter-"];
const PRIORITY_PET_PREFIXES = ["p-vet-", "p-hw-", "p-vax-"];
const PRIORITY_CAR_PREFIXES = ["car-brakes-", "car-batt-", "car-reg-"];

export function isPriority(id) {
  return (
    PRIORITY_IDS.includes(id) ||
    PRIORITY_KID_PREFIXES.some(p => id.startsWith(p)) ||
    PRIORITY_PET_PREFIXES.some(p => id.startsWith(p)) ||
    PRIORITY_CAR_PREFIXES.some(p => id.startsWith(p))
  );
}
