// Maps FEMA NRI hazard codes to our internal hazard keys.
// FEMA NRI API: https://hazards.fema.gov/nri/api/county?zip={zip}
// Ratings: "Very Low" | "Low" | "Medium" | "High" | "Very High" | "Not Applicable" | ...

const FEMA_NRI_URL = "https://hazards.fema.gov/nri/api/county";

// FEMA NRI code → our EM_HAZARD key
const FEMA_TO_HAZARD = {
  ERQK: "earthquake",
  HRCN: "hurricane",
  RFLD: "flood",
  CFLD: "flood",
  TRND: "tornado",
  WFIR: "wildfire",
  CWAV: "winter",
  ISTM: "winter",
};

const HIGH_RISK = new Set(["Medium", "High", "Very High"]);

const DEFAULT_HAZARDS = ["winter"];

export async function detectHazards(zip) {
  if (!zip || !/^\d{5}$/.test(zip)) return DEFAULT_HAZARDS;

  try {
    const res = await fetch(`${FEMA_NRI_URL}?zip=${zip}`);
    if (!res.ok) return DEFAULT_HAZARDS;

    const data = await res.json();
    const counties = Array.isArray(data) ? data : [data];
    if (!counties.length) return DEFAULT_HAZARDS;

    const found = new Set();
    for (const county of counties) {
      for (const [code, hazardKey] of Object.entries(FEMA_TO_HAZARD)) {
        const rating = county[`${code}_RISKR`];
        if (rating && HIGH_RISK.has(rating)) found.add(hazardKey);
      }
    }

    return found.size > 0 ? [...found] : DEFAULT_HAZARDS;
  } catch {
    return DEFAULT_HAZARDS;
  }
}
