// Task factory — args: id, cat, label, intervalDays, windowDays, stakes,
//   activeMonths, requires, assistType, note
// Schema fields not yet filled are set to null for forward compatibility.
export function T(id, cat, label, intervalDays, windowDays, stakes, activeMonths, requires, assistType, note) {
  return {
    id,
    cat,
    label,
    intervalDays,
    windowDays,
    stakes,
    activeMonths: activeMonths ?? null,
    requires:     requires ?? [],
    assistType,
    note,
    // Fields from the working schema — populate as library expands
    hardDeadline:       false,
    diyable:            null,
    timeToComplete:     null,
    why:                null,   // consequence of skipping, Mitzy's voice
    guidance:           null,   // numbered steps for free tier
    lastGuidanceUpdate: null,
    seasonalLabel:      null,
  };
}

// ─── Recurring Task Library ───────────────────────────────────────────────────

export const ALL_TASKS = [
  // Home
  T("hm-hvac",    "home", "Replace HVAC filter",           90,  21, "low",    null,      ["home"], "providers", "Every 3 months. Dirty filters raise energy bills and hurt air quality."),
  T("hm-smoke",   "home", "Test smoke & CO detectors",    180,  14, "high",   null,      ["home"], "guidance",  "Every 6 months. Do it when clocks change. Replace units every 10 years."),
  T("hm-gutters", "home", "Clean gutters",                180,  21, "medium", [3,4,9,10,11], ["home"], "providers", "Twice a year — spring and fall."),
  T("hm-dryer",   "home", "Clean dryer vent",             365,  21, "high",   null,      ["home"], "providers", "Annually. Leading cause of house fires."),
  T("hm-furnace", "home", "Furnace/HVAC inspection",      365,  30, "high",   [8,9,10],  ["home"], "providers", "Schedule before heating season."),
  T("hm-pest",    "home", "Schedule pest control",        365,  30, "medium", [2,3,4,5], ["home"], "providers", "Annually in spring before pest season."),
  T("hm-roof",    "home", "Inspect roof",                 365,  21, "medium", [3,4,5],   ["home"], "providers", "After winter — catch damage before next season."),
  T("hm-water",   "home", "Flush water heater",           365,  21, "low",    null,      ["home"], "guidance",  "Annually. Removes sediment, extends lifespan."),
  T("hm-caulk",   "home", "Inspect/replace caulk",        365,  21, "medium", null,      ["home"], "guidance",  "Check bathroom and kitchen seals annually."),
  T("hm-deck",    "home", "Inspect/seal deck or fence",   730,  30, "low",    [4,5,6],   ["home"], "guidance",  "Every 2 years in late spring."),
  T("hm-fire",    "home", "Check fire extinguisher",      365,  14, "high",   null,      ["home"], "guidance",  "Annually — gauge should be in the green zone."),
  T("hm-pipes",   "home", "Check under-sink pipes",       180,  14, "medium", null,      ["home"], "guidance",  "Twice a year. Slow leaks hide for months."),

  // Car
  T("car-oil",    "car", "Oil change",                     90,  14, "high",   null, ["car"], "providers", "Every 3 months or per your vehicle manual."),
  T("car-tires",  "car", "Tire rotation",                 180,  14, "medium", null, ["car"], "providers", "Every 5-7k miles. Extends tire life."),
  T("car-press",  "car", "Check tire pressure",            30,   7, "medium", null, ["car"], "guidance",  "Monthly. Tires lose ~1 PSI/month."),
  T("car-reg",    "car", "Renew vehicle registration",    365,  45, "high",   null, ["car"], "deadline",  "Check your registration sticker for expiration.", ),
  T("car-ins",    "car", "Review auto insurance",         365,  30, "medium", null, ["car"], "guidance",  "At renewal time, get at least one competing quote."),
  T("car-wipers", "car", "Replace wiper blades",          365,  21, "medium", [8,9,10], ["car"], "guidance", "Before rainy season. Streaky wipers are a safety issue."),
  T("car-batt",   "car", "Test car battery",              365,  21, "high",   null, ["car"], "providers", "Annually. Most auto parts stores test free."),
  T("car-brakes", "car", "Brake inspection",              365,  21, "high",   null, ["car"], "providers", "Annually, or immediately if you hear squealing."),
  T("car-emiss",  "car", "Vehicle emissions test",        730,  30, "high",   null, ["car"], "deadline",  "Varies by state — check your registration paperwork."),
  T("car-kit",    "car", "Check car emergency kit",       365,  14, "medium", null, ["car"], "guidance",  "Jumper cables, blanket, first aid, flashlight, water."),

  // Health
  T("h-phys",  "health", "Your annual physical",          365, 30, "high",   null,         [], "script",   "Most insurance covers this 100%."),
  T("h-dent",  "health", "Your dental cleaning",          180, 21, "medium", null,         [], "script",   "Every 6 months. Usually covered twice a year."),
  T("h-eye",   "health", "Your eye exam",                 365, 30, "medium", null,         [], "script",   "Annually if you wear correction, every 2 years otherwise."),
  T("h-derm",  "health", "Skin check / dermatologist",   365, 30, "high",   null,         [], "script",   "Annually. Catches things early when most treatable."),
  T("h-mammo", "health", "Mammogram",                     365, 30, "high",   null, ["40plus"], "script",   "Annually starting at 40 — check with your doctor."),
  T("h-scrip", "health", "Refill prescriptions",          90,  14, "high",   null,         [], "guidance", "Set up auto-refill if you haven't."),
  T("h-ins",   "health", "Review health insurance plan", 365, 45, "high",   [10,11,12,1], [], "guidance", "Open enrollment window varies by employer and state."),
  T("h-hsa",   "health", "Check FSA/HSA balance",         90,  14, "high",   null,         [], "guidance", "FSA funds can expire — check your use-it-or-lose-it deadline."),

  // Finance
  T("fin-tax",   "finance", "File taxes",                        365, 45, "high",   [1,2,3,4], [], "deadline", "Federal deadline is April 15. State deadlines vary."),
  T("fin-docs",  "finance", "Organize tax documents",           365, 60, "high",   [1,2],     [], "guidance", "W-2s and 1099s arrive by January 31."),
  T("fin-cred",  "finance", "Check credit report",              120, 14, "medium", null,      [], "deadline", "Every 4 months — rotate the 3 bureaus."),
  T("fin-hoi",   "finance", "Review homeowner's insurance",     365, 30, "high",   null, ["home"], "guidance", "At renewal — verify coverage matches replacement cost."),
  T("fin-life",  "finance", "Review life insurance",            365, 21, "high",   null,      [], "guidance", "Verify coverage amount and beneficiaries are current."),
  T("fin-will",  "finance", "Review will & estate docs",        365, 21, "high",   null,      [], "guidance", "Annually or after any major life change."),
  T("fin-pass",  "finance", "Audit passwords & 2FA",            180, 14, "medium", null,      [], "guidance", "Every 6 months. Enable 2FA on all financial accounts."),
  T("fin-subs",  "finance", "Audit subscriptions",              180, 14, "low",    null,      [], "guidance", "Every 6 months. Forgotten trials add up."),
  T("fin-benef", "finance", "Verify account beneficiaries",     365, 21, "high",   null,      [], "guidance", "401k and IRA beneficiaries override your will."),
  T("fin-inv",   "finance", "Rebalance investment portfolio",   365, 21, "medium", [1,7],     [], "guidance", "Annually. Check your target allocation."),
];

// ─── Emergency Tasks ──────────────────────────────────────────────────────────

export const EM_UNIVERSAL = [
  T("em-kit",      "emergency", "Emergency kit inventory check",    180, 21, "high",   null, [], "guidance",  "Every 6 months. Check food/water expiry, replace batteries, update meds."),
  T("em-docs",     "emergency", "Back up important documents",      365, 21, "high",   null, [], "guidance",  "Annually. Physical copies in a fireproof location or safe deposit box."),
  T("em-contacts", "emergency", "Review emergency contact list",    365, 21, "medium", null, [], "guidance",  "Annually. Verify numbers are current."),
  T("em-evac",     "emergency", "Review household evacuation plan", 365, 21, "medium", null, [], "guidance",  "Annually. Make sure everyone knows the meeting point."),
  T("em-cash",     "emergency", "Check emergency cash reserve",     180, 14, "medium", null, [], "guidance",  "ATMs don't work when power is out — keep $200-300 in small bills."),
  T("em-firstaid", "emergency", "Restock first aid kit",            365, 21, "medium", null, [], "providers", "Annually. Check expiry dates on medications."),
];

export const EM_HAZARD = {
  earthquake: [
    T("em-eq-furn",  "emergency", "Secure tall furniture to walls",       730, 30, "high", null,   [], "guidance", "Every 2 years."),
    T("em-eq-gas",   "emergency", "Know how to shut off gas/water/power", 365, 21, "high", null,   [], "guidance", "Walk through locations with everyone in the household."),
    T("em-eq-water", "emergency", "Rotate emergency water supply",        180, 14, "high", null,   [], "guidance", "1 gallon per person per day for minimum 3 days."),
  ],
  wildfire: [
    T("em-wf-space", "emergency", "Defensible space maintenance", 365, 30, "high", [3,4,5], ["home"], "guidance", "Clear vegetation 30ft around home before fire season."),
    T("em-wf-bag",   "emergency", "Review go-bag",                180, 14, "high", null,    [],       "guidance", "Documents, medications, chargers, 3 days of clothes."),
  ],
  hurricane: [
    T("em-hu-shut",  "emergency", "Check storm shutters/plywood", 365, 30, "high", [4,5],  ["home"], "guidance", "Before season. Verify shutters work."),
    T("em-hu-flood", "emergency", "Review flood insurance",        365, 30, "high", [3,4],  ["home"], "guidance", "Standard homeowner's doesn't cover flooding."),
  ],
  tornado: [
    T("em-to-room", "emergency", "Identify/prep shelter room", 365, 21, "high", [3,4], [], "guidance", "Lowest floor, interior room, away from windows."),
  ],
  winter: [
    T("em-wi-heat",  "emergency", "Check heating backup",    365, 30, "high",   [9,10], ["home"], "guidance", "Before winter. Have a backup plan."),
    T("em-wi-pipes", "emergency", "Check pipe insulation",   365, 21, "high",   [9,10], ["home"], "guidance", "Insulate pipes in unheated spaces."),
    T("em-wi-car",   "emergency", "Winter kit in car",       365, 21, "medium", [9,10], ["car"],  "guidance", "Blanket, ice scraper, sand, jumper cables."),
  ],
  flood: [
    T("em-fl-sump",  "emergency", "Test sump pump",          365, 21, "high", [2,3], ["home"], "guidance", "Pour water in the pit — it should activate."),
    T("em-fl-flood", "emergency", "Review flood insurance",  365, 30, "high", [2,3], ["home"], "guidance", "Standard homeowner's doesn't cover flooding."),
  ],
};
