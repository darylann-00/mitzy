// Pings every URL in src/data/officialLinks.js and reports what broke.
//
// The registry only earns its keep if the links still work — a dead .gov link
// in guidance copy is worse than no link, since the user trusts it enough to
// tap. Run this once a year, or whenever an agency announces a site migration.
//
//   node scripts/check-official-links.mjs
//
// Deliberately not wired into CI: these are third-party sites, several sit
// behind bot protection that 403s any non-browser request, and a flaky
// government site should never be able to block a deploy. A 403 here means
// "couldn't check" — open it in a browser before concluding anything.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src/data/officialLinks.js'), 'utf8');

// Parsed rather than imported: officialLinks.js is ESM with extensionless
// imports elsewhere in the data layer, and this script shouldn't need Vite.
const entries = [...source.matchAll(/'([\w-]+)':\s*\{\s*label:\s*(['"`])(.*?)\2,\s*url:\s*'([^']+)'/gs)]
  .map(([, id, , label, url]) => ({ id, label, url }));

if (!entries.length) {
  console.error('No links parsed — did the shape of OFFICIAL_LINKS change?');
  process.exit(1);
}

console.log(`Checking ${entries.length} links...\n`);

const results = await Promise.all(entries.map(async (entry) => {
  try {
    // Some agency sites reject HEAD outright, so GET with a browser-ish UA and
    // abandon the body as soon as the status line is in.
    const res = await fetch(entry.url, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; mitzy-link-check/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    return { ...entry, status: res.status, finalUrl: res.url };
  } catch (err) {
    return { ...entry, status: 0, error: err.message };
  }
}));

const bad = [];
for (const r of results) {
  if (r.status === 200) {
    const moved = r.finalUrl && r.finalUrl.replace(/\/$/, '') !== r.url.replace(/\/$/, '');
    console.log(`  ok   ${r.id}${moved ? `  → redirects to ${r.finalUrl}` : ''}`);
  } else if (r.status === 403 || r.status === 429) {
    console.log(`  ?    ${r.id}  ${r.status} — bot protection, check by hand: ${r.url}`);
  } else {
    console.log(`  FAIL ${r.id}  ${r.error || r.status}: ${r.url}`);
    bad.push(r);
  }
}

console.log(bad.length ? `\n${bad.length} link(s) need attention.` : '\nAll reachable.');
process.exit(bad.length ? 1 : 0);
