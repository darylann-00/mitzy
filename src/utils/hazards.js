// Maps FEMA NRI hazard codes to our internal hazard keys.
// Data source: FEMA's National Risk Index (NRI) no longer offers a live per-zip API
// (the old hazards.fema.gov/nri/api endpoint was retired). Current NRI data is only
// distributed as bulk downloads, so we pre-process it into two small static JSON
// files at build/maintenance time (see scripts/build-hazard-data.mjs) and look them
// up client-side, same-origin, at runtime:
//   /data/zip-to-fips.json     — zip -> county FIPS (Census ZCTA crosswalk)
//   /data/nri-county-risk.json — county FIPS -> { HAZARD_CODE: rating }
// Re-run scripts/build-hazard-data.mjs whenever FEMA publishes a new NRI vintage.
//
// Rating values in the current (v1.20) NRI schema: "Very Low" | "Relatively Low" |
// "Relatively Moderate" | "Relatively High" | "Very High" | "Not Applicable" |
// "No Rating" | "Insufficient Data".

// FEMA NRI code → our EM_HAZARD key
// NOTE: current NRI schema uses CFLD (Coastal Flooding) + IFLD (Inland Flooding) —
// there's no "RFLD" code in current data (an older NRI version used that code for
// riverine flooding before it was split/renamed).
const FEMA_TO_HAZARD = {
  ERQK: "earthquake",
  HRCN: "hurricane",
  CFLD: "flood",
  IFLD: "flood",
  TRND: "tornado",
  WFIR: "wildfire",
  CWAV: "winter",
  ISTM: "winter",
};

const HIGH_RISK = new Set(["Relatively Moderate", "Relatively High", "Very High"]);

const DEFAULT_HAZARDS = ["winter"];

let dataPromise = null;

function loadData() {
  if (!dataPromise) {
    dataPromise = Promise.all([
      fetch("/data/zip-to-fips.json").then((r) => r.json()),
      fetch("/data/nri-county-risk.json").then((r) => r.json()),
    ]);
  }
  return dataPromise;
}

export async function detectHazards(zip) {
  if (!zip || !/^\d{5}$/.test(zip)) return DEFAULT_HAZARDS;

  try {
    const [zipToFips, countyRisk] = await loadData();
    const fips = zipToFips[zip];
    const ratings = fips ? countyRisk[fips] : null;
    if (!ratings) return DEFAULT_HAZARDS;

    const found = new Set();
    for (const [code, hazardKey] of Object.entries(FEMA_TO_HAZARD)) {
      const rating = ratings[code];
      if (rating && HIGH_RISK.has(rating)) found.add(hazardKey);
    }

    return found.size > 0 ? [...found] : DEFAULT_HAZARDS;
  } catch (err) {
    console.warn(`detectHazards: failed to load hazard data for zip ${zip}`, err);
    return DEFAULT_HAZARDS;
  }
}
