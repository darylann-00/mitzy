// Resolves a US zip code to its county and state.
// Data sources:
//   /data/zip-to-fips.json   — zip -> county FIPS (Census ZCTA crosswalk, shared with hazards.js)
//   /data/fips-to-county.json — county FIPS -> county name (see scripts/build-county-names.mjs)
// Zip-to-FIPS is also fetched by hazards.js; the duplicate request is served from the
// browser HTTP cache. This is deliberate, to avoid coupling the two modules.

// State FIPS codes (5-digit FIPS code format: first 2 digits = state).
// Includes all 50 states, DC, and the territories present in Census data.
const STATE_FIPS = {
  "01": { name: "Alabama", code: "AL" },
  "02": { name: "Alaska", code: "AK" },
  "04": { name: "Arizona", code: "AZ" },
  "05": { name: "Arkansas", code: "AR" },
  "06": { name: "California", code: "CA" },
  "08": { name: "Colorado", code: "CO" },
  "09": { name: "Connecticut", code: "CT" },
  "10": { name: "Delaware", code: "DE" },
  "12": { name: "Florida", code: "FL" },
  "13": { name: "Georgia", code: "GA" },
  "15": { name: "Hawaii", code: "HI" },
  "16": { name: "Idaho", code: "ID" },
  "17": { name: "Illinois", code: "IL" },
  "18": { name: "Indiana", code: "IN" },
  "19": { name: "Iowa", code: "IA" },
  "20": { name: "Kansas", code: "KS" },
  "21": { name: "Kentucky", code: "KY" },
  "22": { name: "Louisiana", code: "LA" },
  "23": { name: "Maine", code: "ME" },
  "24": { name: "Maryland", code: "MD" },
  "25": { name: "Massachusetts", code: "MA" },
  "26": { name: "Michigan", code: "MI" },
  "27": { name: "Minnesota", code: "MN" },
  "28": { name: "Mississippi", code: "MS" },
  "29": { name: "Missouri", code: "MO" },
  "30": { name: "Montana", code: "MT" },
  "31": { name: "Nebraska", code: "NE" },
  "32": { name: "Nevada", code: "NV" },
  "33": { name: "New Hampshire", code: "NH" },
  "34": { name: "New Jersey", code: "NJ" },
  "35": { name: "New Mexico", code: "NM" },
  "36": { name: "New York", code: "NY" },
  "37": { name: "North Carolina", code: "NC" },
  "38": { name: "North Dakota", code: "ND" },
  "39": { name: "Ohio", code: "OH" },
  "40": { name: "Oklahoma", code: "OK" },
  "41": { name: "Oregon", code: "OR" },
  "42": { name: "Pennsylvania", code: "PA" },
  "44": { name: "Rhode Island", code: "RI" },
  "45": { name: "South Carolina", code: "SC" },
  "46": { name: "South Dakota", code: "SD" },
  "47": { name: "Tennessee", code: "TN" },
  "48": { name: "Texas", code: "TX" },
  "49": { name: "Utah", code: "UT" },
  "50": { name: "Vermont", code: "VT" },
  "51": { name: "Virginia", code: "VA" },
  "53": { name: "Washington", code: "WA" },
  "54": { name: "West Virginia", code: "WV" },
  "55": { name: "Wisconsin", code: "WI" },
  "56": { name: "Wyoming", code: "WY" },
  "11": { name: "District of Columbia", code: "DC" },
  "60": { name: "American Samoa", code: "AS" },
  "66": { name: "Guam", code: "GU" },
  "69": { name: "Northern Mariana Islands", code: "MP" },
  "72": { name: "Puerto Rico", code: "PR" },
  "78": { name: "Virgin Islands", code: "VI" },
};

let dataPromise = null;

function loadData() {
  if (!dataPromise) {
    dataPromise = Promise.all([
      fetch("/data/zip-to-fips.json").then((r) => r.json()),
      fetch("/data/fips-to-county.json").then((r) => r.json()),
    ]).catch((err) => {
      // Drop the cached promise so a transient network failure doesn't disable
      // location resolution for the rest of the session — the next call retries.
      dataPromise = null;
      throw err;
    });
  }
  return dataPromise;
}

export async function resolveLocation(zip) {
  // Validate zip format.
  if (!zip || !/^\d{5}$/.test(zip)) return null;

  try {
    const [zipToFips, fipsToCounty] = await loadData();
    const fips = zipToFips[zip];
    if (!fips) return null;

    const countyName = fipsToCounty[fips];
    if (!countyName) return null;

    // Extract state FIPS code from first 2 digits of county FIPS.
    const stateFips = fips.substring(0, 2);
    const stateInfo = STATE_FIPS[stateFips];
    if (!stateInfo) return null;

    return {
      county: countyName,
      state: stateInfo.name,
      stateCode: stateInfo.code,
    };
  } catch (err) {
    console.warn(`resolveLocation: failed to resolve zip ${zip}`, err);
    return null;
  }
}
