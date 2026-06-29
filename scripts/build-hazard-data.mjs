// One-time/maintenance script — NOT part of the build pipeline.
// Run manually (`node scripts/build-hazard-data.mjs`) whenever FEMA publishes a new NRI vintage.
// Downloads FEMA's National Risk Index county table + the Census ZCTA->county crosswalk,
// and writes two small static JSON files consumed at runtime by src/utils/hazards.js.
//
// Sources:
//   FEMA NRI county table:   https://www.fema.gov/about/openfema/data-sets/national-risk-index-data
//   Census ZCTA->county map: https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/

import { mkdir, writeFile, rm } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const NRI_ZIP_URL =
  "https://www.fema.gov/about/reports-and-data/openfema/nri/v120/NRI_Table_Counties.zip";
const ZCTA_COUNTY_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt";

const TMP_DIR = path.join(process.cwd(), ".tmp-hazard-build");
const OUT_DIR = path.join(process.cwd(), "public", "data");

// Hazard codes we care about (matches FEMA_TO_HAZARD in src/utils/hazards.js).
// NOTE: FEMA's current NRI schema (v1.20) uses CFLD (Coastal Flooding) + IFLD
// (Inland Flooding) — there is no "RFLD" code in current data (older NRI
// versions used RFLD for riverine flooding; it was split/renamed).
const RISK_CODES = ["ERQK", "HRCN", "CFLD", "IFLD", "TRND", "WFIR", "CWAV", "ISTM"];

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
}

function parseCsvLine(line) {
  // NRI county CSV has no embedded commas in the columns we read; simple split is safe here.
  return line.split(",");
}

async function buildCountyRisk() {
  const zipPath = path.join(TMP_DIR, "NRI_Table_Counties.zip");
  await downloadFile(NRI_ZIP_URL, zipPath);
  await execFileAsync("unzip", ["-o", "-q", zipPath, "-d", TMP_DIR]);

  const csvPath = path.join(TMP_DIR, "NRI_Table_Counties.csv");
  const csvText = await (await import("node:fs/promises")).readFile(csvPath, "utf-8");
  const lines = csvText.split("\n").filter(Boolean);
  const header = parseCsvLine(lines[0]);

  const fipsIdx = header.indexOf("STCOFIPS");
  const codeIdx = {};
  for (const code of RISK_CODES) {
    const idx = header.indexOf(`${code}_RISKR`);
    if (idx === -1) throw new Error(`Column ${code}_RISKR not found in NRI county CSV`);
    codeIdx[code] = idx;
  }

  const result = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const fips = cols[fipsIdx];
    if (!fips) continue;
    const ratings = {};
    for (const code of RISK_CODES) ratings[code] = cols[codeIdx[code]];
    result[fips] = ratings;
  }
  return result;
}

async function buildZipToFips() {
  const txtPath = path.join(TMP_DIR, "tab20_zcta520_county20_natl.txt");
  await downloadFile(ZCTA_COUNTY_URL, txtPath);

  const text = await (await import("node:fs/promises")).readFile(txtPath, "utf-8");
  const lines = text.split("\n").filter(Boolean);
  const header = lines[0].replace(/^﻿/, "").split("|");
  const zipIdx = header.indexOf("GEOID_ZCTA5_20");
  const fipsIdx = header.indexOf("GEOID_COUNTY_20");
  const landAreaIdx = header.indexOf("AREALAND_PART");

  // A ZCTA can span multiple counties; keep the county with the largest land-area overlap.
  const best = new Map(); // zip -> { fips, area }
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("|");
    const zip = cols[zipIdx];
    const fips = cols[fipsIdx];
    const area = Number(cols[landAreaIdx]) || 0;
    if (!zip || !fips) continue;
    const current = best.get(zip);
    if (!current || area > current.area) best.set(zip, { fips, area });
  }

  const result = {};
  for (const [zip, { fips }] of best) result[zip] = fips;
  return result;
}

async function main() {
  await mkdir(TMP_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Downloading + parsing FEMA NRI county risk table...");
  const countyRisk = await buildCountyRisk();
  console.log(`  ${Object.keys(countyRisk).length} counties`);

  console.log("Downloading + parsing Census ZCTA->county crosswalk...");
  const zipToFips = await buildZipToFips();
  console.log(`  ${Object.keys(zipToFips).length} zip codes`);

  await writeFile(
    path.join(OUT_DIR, "nri-county-risk.json"),
    JSON.stringify(countyRisk),
  );
  await writeFile(
    path.join(OUT_DIR, "zip-to-fips.json"),
    JSON.stringify(zipToFips),
  );

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log("Done. Wrote public/data/nri-county-risk.json and public/data/zip-to-fips.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
