import { T, ALL_TASKS, EM_UNIVERSAL, EM_HAZARD } from "./tasks";

// ─── Per-kid Task Generator ───────────────────────────────────────────────────

export function kidTasks(kid) {
  const { name, age: ageStr, needsEnrollment } = kid;
  const age  = parseInt(ageStr, 10);
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const tasks = [];

  tasks.push(T(`k-health-${slug}`, "health", `${name}: annual health visit`, 365, 30, "high",   null,         [], "script",   "Annual well-child visit."));
  tasks.push(T(`k-dent-${slug}`,   "health", `${name}: dental cleaning`,     180, 21, "medium", null,         [], "script",   "Every 6 months."));
  tasks.push(T(`k-eye-${slug}`,    "health", `${name}: eye exam`,            365, 30, "medium", null,         [], "script",   "Annually."));

  if (age < 18 && needsEnrollment) {
    tasks.push(T(`k-enroll-${slug}`, "school", `${name}: school re-enrollment`, 365, 60, "high", [1,2,3], [], "deadline", "Check your school district's enrollment window."));
  }

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

  tasks.push(T(`p-vet-${slug}`,     "health",  `${name}: vet wellness visit`,         senior ? 180 : 365, 21, "high",   null, [], "providers", senior ? `${name} is a senior pet — twice-yearly visits recommended.` : "Annual wellness exam."));
  tasks.push(T(`p-flea-${slug}`,    "health",  `${name}: flea/tick prevention refill`, 90,  14, "medium", null, [], "guidance",  "Every 3 months. Don't let this lapse."));
  tasks.push(T(`p-license-${slug}`, "finance", `${name}: pet license renewal`,         365, 30, "medium", null, [], "deadline",  "Most municipalities require annual pet licensing."));
  tasks.push(T(`p-dental-${slug}`,  "health",  `${name}: dental cleaning`,             365, 30, "medium", null, [], "providers", "Annual dental cleaning."));

  if (type === "dog") {
    tasks.push(T(`p-hw-${slug}`,    "health", `${name}: heartworm prevention refill`, 90, 14, "high",   null, [], "guidance",  "Monthly or quarterly. Missing doses creates real risk."));
    tasks.push(T(`p-vax-${slug}`,   "health", `${name}: rabies/booster vaccines`,    365, 30, "high",   null, [], "providers", "Rabies legally required in most states."));
    tasks.push(T(`p-nails-${slug}`, "health", `${name}: nail trim`,                   60, 10, "low",    null, [], "providers", "Every 6-8 weeks."));
    if (longCoat) {
      tasks.push(T(`p-groom-${slug}`, "health", `${name}: grooming appointment`, 60, 14, "low", null, [], "providers", "Every 6-8 weeks for long-coat breeds."));
    }
  }

  if (type === "cat") {
    tasks.push(T(`p-nails-${slug}`,  "health", `${name}: nail trim`,             30, 7, "low", null, [], "guidance", "Monthly."));
    tasks.push(T(`p-litter-${slug}`, "health", `${name}: litter box deep clean`, 30, 7, "low", null, [], "guidance", "Monthly deep clean beyond daily scooping."));
  }

  return tasks;
}

// ─── Library Builder ──────────────────────────────────────────────────────────

export function buildTaskLibrary(profile) {
  const flags = [];
  if (profile.hasHome) flags.push("home");
  if (profile.hasCar)  flags.push("car");
  if (parseInt(profile.age, 10) >= 40) flags.push("40plus");

  const lib = [
    ...ALL_TASKS.filter(t => t.requires.length === 0 || t.requires.every(r => flags.includes(r))),
  ];

  if (profile.hasKids && profile.kids?.length > 0) {
    profile.kids.forEach(k => lib.push(...kidTasks({ ...k, needsEnrollment: profile.needsEnrollment })));
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
const PRIORITY_KID_PREFIXES = ["k-health-", "k-camp-", "k-winter-", "k-enroll-"];
const PRIORITY_PET_PREFIXES = ["p-vet-", "p-hw-", "p-vax-"];

export function isPriority(id) {
  return (
    PRIORITY_IDS.includes(id) ||
    PRIORITY_KID_PREFIXES.some(p => id.startsWith(p)) ||
    PRIORITY_PET_PREFIXES.some(p => id.startsWith(p))
  );
}
