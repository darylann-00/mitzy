// Maps US zip codes to broad climate regions, then provides per-region
// adjustments to task seasonStart and activeMonths values.

// ─── Zip → Region ─────────────────────────────────────────────────────────────

const ZIP_REGION_RANGES = [
  // Pacific Northwest (OR, WA, AK)
  { min: 97000, max: 97999, region: "pacific_nw" },  // OR
  { min: 98000, max: 99499, region: "pacific_nw" },  // WA
  { min: 99500, max: 99999, region: "pacific_nw" },  // AK
  // California (+ HI treated as tropical neighbor)
  { min: 90000, max: 96699, region: "california" },  // CA
  { min: 96700, max: 96899, region: "florida" },     // HI — no freeze, hurricane risk
  // Southwest (AZ, NM, NV)
  { min: 85000, max: 86999, region: "southwest" },   // AZ
  { min: 87000, max: 88999, region: "southwest" },   // NM
  { min: 89000, max: 89999, region: "southwest" },   // NV
  // Mountain (CO, WY, ID, UT, MT)
  { min: 59000, max: 59999, region: "mountain" },    // MT
  { min: 80000, max: 81999, region: "mountain" },    // CO
  { min: 82000, max: 82999, region: "mountain" },    // WY
  { min: 83000, max: 83999, region: "mountain" },    // ID
  { min: 84000, max: 84999, region: "mountain" },    // UT
  // Midwest (MN, WI, MI, OH, IN, IL, IA, MO, NE, KS, ND, SD, KY, OK)
  { min: 40000, max: 42999, region: "midwest" },     // KY
  { min: 43000, max: 45999, region: "midwest" },     // OH
  { min: 46000, max: 47999, region: "midwest" },     // IN
  { min: 48000, max: 49999, region: "midwest" },     // MI
  { min: 50000, max: 52999, region: "midwest" },     // IA
  { min: 53000, max: 54999, region: "midwest" },     // WI
  { min: 55000, max: 56999, region: "midwest" },     // MN
  { min: 57000, max: 58999, region: "midwest" },     // SD, ND
  { min: 60000, max: 62999, region: "midwest" },     // IL
  { min: 63000, max: 65999, region: "midwest" },     // MO
  { min: 66000, max: 67999, region: "midwest" },     // KS
  { min: 68000, max: 69999, region: "midwest" },     // NE
  { min: 73000, max: 74999, region: "midwest" },     // OK (tornado alley)
  // Gulf (TX main, LA, AR)
  { min: 70000, max: 71999, region: "gulf" },        // LA
  { min: 72000, max: 72999, region: "gulf" },        // AR (humid/gulf)
  { min: 75000, max: 78999, region: "gulf" },        // TX (Dallas, Houston, Austin)
  { min: 79000, max: 79999, region: "southwest" },   // TX west (El Paso — dry)
  // Southeast (NC, SC, GA, AL, TN, MS, VA/WV southern)
  { min: 24000, max: 26999, region: "southeast" },   // WV, VA mountains
  { min: 27000, max: 28999, region: "southeast" },   // NC
  { min: 29000, max: 29999, region: "southeast" },   // SC
  { min: 30000, max: 31999, region: "southeast" },   // GA
  { min: 35000, max: 36999, region: "southeast" },   // AL
  { min: 37000, max: 38999, region: "southeast" },   // TN
  { min: 39000, max: 39999, region: "southeast" },   // MS
  // Florida
  { min: 32000, max: 34999, region: "florida" },     // FL
  // Northeast (ME, NH, VT, MA, RI, CT, NY, NJ, PA, MD, DC, VA coastal)
  { min: 1000,  max: 2999,  region: "northeast" },   // MA, RI
  { min: 3000,  max: 4999,  region: "northeast" },   // NH, ME
  { min: 5000,  max: 5999,  region: "northeast" },   // VT
  { min: 6000,  max: 6999,  region: "northeast" },   // CT
  { min: 7000,  max: 8999,  region: "northeast" },   // NJ
  { min: 10000, max: 14999, region: "northeast" },   // NY
  { min: 15000, max: 19999, region: "northeast" },   // PA
  { min: 20000, max: 23999, region: "northeast" },   // DC, MD, VA (northern)
];

const DEFAULT_REGION = "midwest";

export function getClimateRegion(zip) {
  const zipNum = parseInt(zip, 10);
  if (isNaN(zipNum)) return DEFAULT_REGION;
  const match = ZIP_REGION_RANGES.find(r => zipNum >= r.min && zipNum <= r.max);
  return match ? match.region : DEFAULT_REGION;
}

// ─── Regional task adjustments ────────────────────────────────────────────────
// Maps region → { taskId → { seasonStart?, activeMonths? } }
// seasonStart: false  = task is never active in this region
// activeMonths: []    = task is never active in this region
// Omitting a key keeps the task's default value.

export const REGION_TASK_ADJUSTMENTS = {
  pacific_nw: {
    // Rainy season Oct, freeze Nov–Feb — furnace/chimney wakes Aug like default
    "hm-furnace":   { seasonStart: 8 },
    "hm-chimney":   { seasonStart: 8 },
    "hm-sump":      { seasonStart: 9 },            // rainy starts Oct, prep Sep
    "hm-weather":   { activeMonths: [9,10,11] },   // prep before Nov rains
    "hm-faucets":   { activeMonths: [10,11,12,1] },// freeze window Nov–Feb
    "car-wipers":   { seasonStart: 9 },            // rainy Oct, prep Sep
    "em-wf-space":  { seasonStart: 6 },            // fire Jul–Oct, prep Jun
    "em-hu-shut":   { seasonStart: false },        // no hurricane risk
    "em-hu-flood":  { seasonStart: false },
    "em-fl-sump":   { seasonStart: 9 },
    "em-fl-flood":  { seasonStart: 9 },
    "em-wi-heat":   { activeMonths: [10,11,12,1] },
    "em-wi-pipes":  { activeMonths: [10,11,12,1] },
    "em-wi-car":    { activeMonths: [10,11,12,1,2] },
  },
  california: {
    // Rainy Nov–Mar, fire Aug–Oct, freeze rare (coastal)
    "hm-furnace":   { seasonStart: 10 },           // heating season late
    "hm-chimney":   { seasonStart: 10 },
    "hm-sump":      { seasonStart: 10 },           // rainy Nov, prep Oct
    "hm-weather":   { activeMonths: [10,11,12] },
    "hm-faucets":   { activeMonths: [11,12] },     // coastal freeze is rare/brief
    "car-wipers":   { seasonStart: 10 },           // rainy Nov, prep Oct
    "em-wf-space":  { seasonStart: 6 },            // fire Aug–Oct, prep Jun
    "em-hu-shut":   { seasonStart: false },
    "em-hu-flood":  { seasonStart: false },
    "em-fl-sump":   { seasonStart: 10 },
    "em-fl-flood":  { seasonStart: 10 },
    "em-wi-heat":   { activeMonths: [11,12,1] },
    "em-wi-pipes":  { activeMonths: [11,12,1] },
    "em-wi-car":    { activeMonths: [11,12,1] },
  },
  southeast: {
    // Freeze rare (brief Dec–Feb), heavy rain Jun–Sep, hurricane Jun–Oct
    "hm-furnace":   { seasonStart: 9 },            // mild heating season starts Oct
    "hm-chimney":   { seasonStart: 9 },
    "hm-sump":      { seasonStart: 4 },            // heavy rain Jun, prep Apr
    "hm-weather":   { activeMonths: [10,11,12] },
    "hm-faucets":   { activeMonths: [11,12,1] },   // brief freeze window
    "car-wipers":   { seasonStart: 5 },            // rain Jun, prep May
    "em-hu-shut":   { seasonStart: 4 },            // hurricane Jun, prep Apr
    "em-hu-flood":  { seasonStart: 4 },
    "em-fl-sump":   { seasonStart: 4 },
    "em-fl-flood":  { seasonStart: 4 },
    "em-wi-heat":   { activeMonths: [11,12,1] },
    "em-wi-pipes":  { activeMonths: [11,12,1] },
    "em-wi-car":    { activeMonths: [11,12,1,2] },
  },
  florida: {
    // Hurricane Jun–Oct, rain Jun–Sep, no freeze
    "hm-furnace":   { seasonStart: 9 },            // HVAC check after summer
    "hm-chimney":   { seasonStart: 10 },           // rare use, brief winter window
    "hm-sump":      { seasonStart: 4 },            // rain Jun, prep Apr
    "hm-weather":   { activeMonths: [] },          // no winter draft concern
    "hm-faucets":   { activeMonths: [] },          // no freeze
    "car-wipers":   { seasonStart: 5 },            // rain Jun, prep May
    "em-wf-space":  { seasonStart: 3 },            // dry season wildfires
    "em-hu-shut":   { seasonStart: 4 },            // hurricane Jun, prep Apr
    "em-hu-flood":  { seasonStart: 4 },
    "em-fl-sump":   { seasonStart: 4 },
    "em-fl-flood":  { seasonStart: 4 },
    "em-wi-heat":   { activeMonths: [] },
    "em-wi-pipes":  { activeMonths: [] },
    "em-wi-car":    { activeMonths: [] },
  },
  northeast: {
    // Freeze Oct–Mar, rainy Apr–May — defaults already tuned for NE, minor shifts
    "hm-furnace":   { seasonStart: 8 },
    "hm-chimney":   { seasonStart: 8 },
    "hm-sump":      { seasonStart: 2 },
    "hm-weather":   { activeMonths: [8,9,10,11] }, // earlier prep for harsh winters
    "hm-faucets":   { activeMonths: [9,10,11,12,1,2] },
    "car-wipers":   { seasonStart: 8 },
    "em-hu-shut":   { seasonStart: 5 },            // occasional Atlantic storms
    "em-hu-flood":  { seasonStart: 5 },
    "em-fl-sump":   { seasonStart: 2 },
    "em-fl-flood":  { seasonStart: 2 },
    "em-wi-heat":   { activeMonths: [8,9,10,11,12,1,2] },
    "em-wi-pipes":  { activeMonths: [8,9,10,11,12,1,2] },
    "em-wi-car":    { activeMonths: [9,10,11,12,1,2,3] },
  },
  midwest: {
    // Freeze Oct–Mar, rainy Apr–May, tornado spring — harshest winter prep
    "hm-furnace":   { seasonStart: 8 },
    "hm-chimney":   { seasonStart: 8 },
    "hm-sump":      { seasonStart: 2 },
    "hm-weather":   { activeMonths: [8,9,10,11] },
    "hm-faucets":   { activeMonths: [9,10,11,12,1,2] },
    "car-wipers":   { seasonStart: 8 },
    "em-hu-shut":   { seasonStart: false },        // no hurricane risk
    "em-hu-flood":  { seasonStart: false },
    "em-fl-sump":   { seasonStart: 2 },
    "em-fl-flood":  { seasonStart: 2 },
    "em-wi-heat":   { activeMonths: [8,9,10,11,12,1,2,3] },
    "em-wi-pipes":  { activeMonths: [8,9,10,11,12,1,2,3] },
    "em-wi-car":    { activeMonths: [9,10,11,12,1,2,3] },
  },
  southwest: {
    // Dry, fire Jun–Sep, monsoon Jul–Sep, mild freeze Dec–Feb
    "hm-furnace":   { seasonStart: 10 },           // mild heating season
    "hm-chimney":   { seasonStart: 10 },
    "hm-sump":      { seasonStart: 6 },            // monsoon Jul, prep Jun
    "hm-weather":   { activeMonths: [10,11,12] },
    "hm-faucets":   { activeMonths: [11,12,1] },   // brief freeze window
    "car-wipers":   { seasonStart: 6 },            // monsoon Jul, prep Jun
    "em-wf-space":  { seasonStart: 5 },            // fire Jun–Sep, prep May
    "em-hu-shut":   { seasonStart: false },
    "em-hu-flood":  { seasonStart: false },
    "em-fl-sump":   { seasonStart: 6 },
    "em-fl-flood":  { seasonStart: 6 },
    "em-wi-heat":   { activeMonths: [10,11,12,1] },
    "em-wi-pipes":  { activeMonths: [11,12,1] },
    "em-wi-car":    { activeMonths: [11,12,1] },
  },
  mountain: {
    // Freeze Sep–Apr, fire Jul–Sep — earliest winter, longest freeze window
    "hm-furnace":   { seasonStart: 7 },            // heating season starts Sep
    "hm-chimney":   { seasonStart: 7 },
    "hm-sump":      { seasonStart: 3 },            // spring melt Apr
    "hm-weather":   { activeMonths: [8,9,10,11] },
    "hm-faucets":   { activeMonths: [9,10,11,12,1,2,3] }, // long freeze window
    "car-wipers":   { seasonStart: 8 },
    "em-wf-space":  { seasonStart: 6 },            // fire Jul–Sep, prep Jun
    "em-hu-shut":   { seasonStart: false },
    "em-hu-flood":  { seasonStart: false },
    "em-fl-sump":   { seasonStart: 3 },
    "em-fl-flood":  { seasonStart: 3 },
    "em-wi-heat":   { activeMonths: [8,9,10,11,12,1,2,3] },
    "em-wi-pipes":  { activeMonths: [8,9,10,11,12,1,2,3] },
    "em-wi-car":    { activeMonths: [8,9,10,11,12,1,2,3] },
  },
  gulf: {
    // Hurricane Jun–Oct, freeze Dec–Feb only (brief)
    "hm-furnace":   { seasonStart: 9 },
    "hm-chimney":   { seasonStart: 9 },
    "hm-sump":      { seasonStart: 4 },            // rain/hurricane Jun, prep Apr
    "hm-weather":   { activeMonths: [10,11,12] },
    "hm-faucets":   { activeMonths: [11,12,1] },   // brief freeze Dec–Feb
    "car-wipers":   { seasonStart: 5 },            // rain Jun, prep May
    "em-hu-shut":   { seasonStart: 4 },            // hurricane Jun, prep Apr
    "em-hu-flood":  { seasonStart: 4 },
    "em-fl-sump":   { seasonStart: 4 },
    "em-fl-flood":  { seasonStart: 4 },
    "em-wi-heat":   { activeMonths: [11,12,1] },
    "em-wi-pipes":  { activeMonths: [11,12,1] },
    "em-wi-car":    { activeMonths: [11,12] },
  },
};
