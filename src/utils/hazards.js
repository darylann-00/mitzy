// Maps zip code ranges to relevant natural hazards.
// Mocked — real implementation will query FEMA API.

const ZIP_HAZARD_MAP = [
  { min: 90000, max: 99999, hazards: ["earthquake", "wildfire"] },
  { min: 97000, max: 97999, hazards: ["earthquake", "wildfire"] },
  { min: 77000, max: 79999, hazards: ["hurricane", "flood", "tornado"] },
  { min: 70000, max: 71999, hazards: ["hurricane", "flood"] },
  { min: 34000, max: 34999, hazards: ["hurricane", "flood"] },
  { min: 50000, max: 52999, hazards: ["tornado", "winter"] },
];

const DEFAULT_HAZARDS = ["winter"];

export async function detectHazards(zip) {
  // Simulates async API call
  await new Promise(r => setTimeout(r, 800));

  const zipNum = parseInt(zip, 10);
  if (isNaN(zipNum)) return DEFAULT_HAZARDS;

  const match = ZIP_HAZARD_MAP.find(r => zipNum >= r.min && zipNum <= r.max);
  return match ? match.hazards : DEFAULT_HAZARDS;
}
