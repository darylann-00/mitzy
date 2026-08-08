import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Exported so `_quota.js` and `_entitlement.js` share one connection rather
// than opening their own.
export const redis = Redis.fromEnv();

export const assistLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  prefix: 'rl:assist',
});

export const providersLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'rl:providers',
});

// Lighter-weight: a single Places lookup with no Claude synthesis, used by
// live autocomplete-as-you-type, so it needs a much larger budget.
export const providerSearchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 h'),
  prefix: 'rl:providersearch',
});

export const generateTaskLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'rl:gentask',
});
