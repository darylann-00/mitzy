import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCurrentWeekStart, toLocalISO } from './useWeeklyPlan';

// Regression tests for the UTC-drift bug: getCurrentWeekStart used to mix
// local getDay() with toISOString() (UTC), so for US-evening users the saved
// week_start shifted a day and a plan locked in the evening couldn't be found
// the next morning. All date math must stay in the user's local timezone.
describe('getCurrentWeekStart', () => {
  const realTZ = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = 'America/New_York';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = realTZ;
  });

  it('returns the local Monday even late in the evening when UTC is already tomorrow', () => {
    // Monday 2026-07-13 23:30 EDT == Tuesday 03:30 UTC
    vi.setSystemTime(new Date('2026-07-13T23:30:00-04:00'));
    expect(getCurrentWeekStart()).toBe('2026-07-13');
  });

  it('returns the same week_start the following morning', () => {
    // Tuesday 2026-07-14 09:00 EDT
    vi.setSystemTime(new Date('2026-07-14T09:00:00-04:00'));
    expect(getCurrentWeekStart()).toBe('2026-07-13');
  });

  it('maps Sunday to the previous Monday', () => {
    // Sunday 2026-07-19 20:00 EDT
    vi.setSystemTime(new Date('2026-07-19T20:00:00-04:00'));
    expect(getCurrentWeekStart()).toBe('2026-07-13');
  });
});

describe('toLocalISO', () => {
  const realTZ = process.env.TZ;

  afterEach(() => {
    process.env.TZ = realTZ;
  });

  it('formats using local date parts, not UTC', () => {
    process.env.TZ = 'America/New_York';
    // 23:30 EDT on the 13th is 03:30 UTC on the 14th
    expect(toLocalISO(new Date('2026-07-13T23:30:00-04:00'))).toBe('2026-07-13');
  });
});
