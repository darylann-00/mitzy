import { describe, it, expect } from 'vitest';
import { OFFICIAL_LINKS, linksForTask, officialLink } from './officialLinks.js';
import { LIFE_EVENT_DEFS } from './lifeEvents/index.js';
import { ALL_TASKS } from './tasks.js';

describe('OFFICIAL_LINKS registry', () => {
  it('only holds https URLs — these end up as tappable links in guidance copy', () => {
    for (const [id, link] of Object.entries(OFFICIAL_LINKS)) {
      expect(link.url, id).toMatch(/^https:\/\//);
      expect(link.label, id).toBeTruthy();
    }
  });

  it('has no duplicate URLs under different ids', () => {
    const urls = Object.values(OFFICIAL_LINKS).map(l => l.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe('linksForTask', () => {
  it('matches a base task on its id', () => {
    expect(linksForTask({ id: 'fin-cred' })).toContainEqual(OFFICIAL_LINKS['annual-credit-report']);
  });

  it('matches a life event task on its bundle key, not its prefixed instance id', () => {
    const links = linksForTask({ id: 'lf-namechange-9-update-passport', eventBundleKey: 'update-passport' });
    expect(links).toEqual([OFFICIAL_LINKS['passport-change']]);
  });

  // Per-car, per-kid, and per-pet tasks get a slug appended to the base id.
  it('matches generated per-car tasks through the slug suffix', () => {
    expect(linksForTask({ id: 'car-reg-2016-subaru-outback' })).toEqual([OFFICIAL_LINKS['dmv-directory']]);
  });

  it('prefers the longer key when one id prefixes another', () => {
    // `car-kit-build` and `car-kit` both exist; the build task must not fall
    // through to the check task's entry by accident.
    expect(linksForTask({ id: 'car-kit-build-2016-subaru-outback' })).toEqual([OFFICIAL_LINKS['ready-kit']]);
  });

  it('returns an empty array for anything unmapped', () => {
    expect(linksForTask({ id: 'hm-gutters' })).toEqual([]);
    expect(linksForTask({})).toEqual([]);
    expect(linksForTask(null)).toEqual([]);
  });

  it('never points a task at a link id that was renamed out of the registry', () => {
    // Guards the one silent failure mode: TASK_LINKS holding a stale id, which
    // would drop links with no error anywhere.
    const mapped = [
      'fin-cred', 'fin-tax', 'fin-unclaimed', 'em-kit', 'em-evac', 'update-ssn-card',
      'update-passport', 'death-certificates', 'notify-ssa', 'court-forms', 'ssn',
    ];
    for (const id of mapped) {
      expect(linksForTask({ id }).length, id).toBeGreaterThan(0);
    }
  });
});

describe('officialLink', () => {
  it('renders markdown with the registry label by default', () => {
    expect(officialLink('irs-w4')).toBe(`[${OFFICIAL_LINKS['irs-w4'].label}](${OFFICIAL_LINKS['irs-w4'].url})`);
  });

  it('accepts inline link text that fits the sentence', () => {
    expect(officialLink('irs-w4', 'the IRS W-4 page')).toBe(
      `[the IRS W-4 page](${OFFICIAL_LINKS['irs-w4'].url})`
    );
  });

  it('degrades to plain text rather than emitting a broken link', () => {
    expect(officialLink('does-not-exist', 'somewhere')).toBe('somewhere');
    expect(officialLink('does-not-exist')).toBe('');
  });
});

describe('guidance copy that uses the registry', () => {
  const allGuidance = [
    ...ALL_TASKS.map(t => t.guidance),
    ...Object.values(LIFE_EVENT_DEFS).flatMap(e => (e.bundle ?? []).map(t => t.guidance)),
  ].filter(Boolean);

  it('never leaves an unresolved link — officialLink() returning empty is silent otherwise', () => {
    for (const g of allGuidance) {
      expect(g, g.slice(0, 60)).not.toMatch(/\[\s*\]\(/);
      expect(g, g.slice(0, 60)).not.toMatch(/\]\(\s*\)/);
    }
  });

  it('writes every URL through the registry rather than inline', () => {
    const known = new Set(Object.values(OFFICIAL_LINKS).map(l => l.url));
    for (const g of allGuidance) {
      for (const [, url] of g.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
        expect(known, `${url} is hardcoded in guidance copy`).toContain(url);
      }
    }
  });
});
