import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

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
