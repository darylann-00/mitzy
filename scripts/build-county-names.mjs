// One-time/maintenance script — NOT part of the build pipeline.
// Run manually (`node scripts/build-county-names.mjs`) to generate county name lookup data.
// Downloads the Census ZCTA->county crosswalk (same data source as build-hazard-data.mjs),
// and writes a small static JSON file consumed at runtime by src/utils/geo.js.
//
// Source:
//   Census ZCTA->county map: https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ZCTA_COUNTY_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt";

const OUT_DIR = path.join(process.cwd(), "public", "data");

async function downloadFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return res.text();
}

async function buildCountyNames() {
  const text = await downloadFile(ZCTA_COUNTY_URL);
  const lines = text.split("\n").filter(Boolean);

  // Strip UTF-8 BOM from first column name (like build-hazard-data.mjs does).
  const header = lines[0].replace(/^﻿/, "").split("|");
  const fipsIdx = header.indexOf("GEOID_COUNTY_20");
  const nameIdx = header.indexOf("NAMELSAD_COUNTY_20");

  if (fipsIdx === -1) throw new Error("GEOID_COUNTY_20 column not found");
  if (nameIdx === -1) throw new Error("NAMELSAD_COUNTY_20 column not found");

  // A county FIPS can appear multiple times (once per zip it contains).
  // Use a Set to deduplicate, then build the final object.
  const result = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("|");
    const fips = cols[fipsIdx];
    const name = cols[nameIdx];
    if (!fips || !name) continue;
    result[fips] = name;
  }

  return result;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Downloading + parsing Census ZCTA->county crosswalk...");
  const countyNames = await buildCountyNames();
  console.log(`  ${Object.keys(countyNames).length} counties`);

  await writeFile(
    path.join(OUT_DIR, "fips-to-county.json"),
    JSON.stringify(countyNames),
  );

  console.log("Done. Wrote public/data/fips-to-county.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
