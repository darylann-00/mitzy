import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// _ratelimit.js calls Redis.fromEnv() at module load, which throws without
// Upstash credentials. Stub the whole module so the quota logic can be tested
// on its own.
const store = new Map();
vi.mock('./_ratelimit.js', () => ({
  redis: {
    incr:   async (k) => { const n = (store.get(k) ?? 0) + 1; store.set(k, n); return n; },
    decr:   async (k) => { const n = (store.get(k) ?? 0) - 1; store.set(k, n); return n; },
    get:    async (k) => store.get(k) ?? null,
    expire: async () => 1,
  },
}));

const { monthKey, resetAt, consume, peek, refund, FREE_MONTHLY_ASSISTS } =
  await import('./_quota.js');

beforeEach(() => store.clear());
afterEach(() => vi.useRealTimers());

describe("monthKey", () => {
  it("stamps the key with the calendar month, so a quota resets on the 1st", () => {
    const key = monthKey('assist', 'user-1', new Date('2026-08-07T12:00:00Z'));
    expect(key).toBe('q:assist:user-1:2026-08');
  });

  it("rolls over to a fresh key at the month boundary", () => {
    const aug = monthKey('assist', 'u', new Date('2026-08-31T23:59:59Z'));
    const sep = monthKey('assist', 'u', new Date('2026-09-01T00:00:00Z'));
    expect(aug).not.toBe(sep);
    expect(sep).toBe('q:assist:u:2026-09');
  });

  it("keeps separate counters per user and per feature", () => {
    const now = new Date('2026-08-07T00:00:00Z');
    expect(monthKey('assist', 'a', now)).not.toBe(monthKey('assist', 'b', now));
    expect(monthKey('assist', 'a', now)).not.toBe(monthKey('other', 'a', now));
  });
});

describe("resetAt", () => {
  it("points at the first instant of next month", () => {
    expect(resetAt(new Date('2026-08-07T12:00:00Z'))).toBe('2026-09-01T00:00:00.000Z');
  });

  it("rolls the year over in December", () => {
    expect(resetAt(new Date('2026-12-15T00:00:00Z'))).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe("consume", () => {
  it("allows exactly the monthly allowance, then stops", async () => {
    const results = [];
    for (let i = 0; i < FREE_MONTHLY_ASSISTS + 1; i++) {
      results.push((await consume('assist', 'u')).allowed);
    }
    expect(results.slice(0, FREE_MONTHLY_ASSISTS)).toEqual(Array(FREE_MONTHLY_ASSISTS).fill(true));
    expect(results[FREE_MONTHLY_ASSISTS]).toBe(false);
  });

  it("never reports more used than the limit, even once over", async () => {
    for (let i = 0; i < 6; i++) await consume('assist', 'u');
    const { used, limit } = await consume('assist', 'u');
    expect(used).toBe(limit);
  });

  it("counts each user separately", async () => {
    for (let i = 0; i < FREE_MONTHLY_ASSISTS; i++) await consume('assist', 'a');
    expect((await consume('assist', 'a')).allowed).toBe(false);
    expect((await consume('assist', 'b')).allowed).toBe(true);
  });
});

describe("refund", () => {
  it("gives a unit back so a server failure doesn't cost the user", async () => {
    for (let i = 0; i < FREE_MONTHLY_ASSISTS; i++) await consume('assist', 'u');
    expect((await peek('assist', 'u')).remaining).toBe(0);

    await refund('assist', 'u');
    expect((await peek('assist', 'u')).remaining).toBe(1);
    expect((await consume('assist', 'u')).allowed).toBe(true);
  });
});

describe("peek", () => {
  it("reports usage without spending one", async () => {
    await consume('assist', 'u');
    const before = await peek('assist', 'u');
    const after  = await peek('assist', 'u');
    expect(before.used).toBe(1);
    expect(after.used).toBe(1);
    expect(after.remaining).toBe(FREE_MONTHLY_ASSISTS - 1);
  });

  it("reports a full allowance for a user who has never called", async () => {
    expect((await peek('assist', 'nobody')).remaining).toBe(FREE_MONTHLY_ASSISTS);
  });
});
