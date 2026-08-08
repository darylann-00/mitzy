import { redis } from './_ratelimit.js';

export const config = { runtime: "edge" };

// How many AI assists a free account gets per calendar month.
export const FREE_MONTHLY_ASSISTS = 3;

// Deliberately a plain counter rather than `Ratelimit.slidingWindow`. A sliding
// window hands tokens back fractionally as the window slides and its `reset` is
// epoch-aligned, so we could not honestly tell a user "resets on the 1st". A
// key stamped with the calendar month can.
//
// The month is computed in UTC, so rollover happens at midnight UTC rather than
// in the user's local time. For a monthly allowance that's close enough, and it
// keeps the key stable no matter which region the function runs in.
export const monthKey = (feature, userId, now = new Date()) =>
  `q:${feature}:${userId}:${now.toISOString().slice(0, 7)}`;

// First instant of next month, UTC — what the UI shows as "resets on".
export function resetAt(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

const TTL_SECONDS = 60 * 60 * 24 * 40; // ~40d: outlives the month, self-cleans.

// Consume one unit. Returns `allowed: false` when the caller is already at the
// limit — note the counter still increments past it, which is harmless because
// every check is `> limit` and the key expires anyway.
export async function consume(feature, userId, limit = FREE_MONTHLY_ASSISTS) {
  const key = monthKey(feature, userId);
  const used = await redis.incr(key);
  if (used === 1) await redis.expire(key, TTL_SECONDS);
  return { allowed: used <= limit, used: Math.min(used, limit), limit, resetAt: resetAt() };
}

// Non-consuming read, so the UI can show "1 of 3 left" without spending one.
export async function peek(feature, userId, limit = FREE_MONTHLY_ASSISTS) {
  const used = Number(await redis.get(monthKey(feature, userId))) || 0;
  return { used: Math.min(used, limit), limit, remaining: Math.max(0, limit - used), resetAt: resetAt() };
}

// Give the unit back when the work we charged for never happened — an upstream
// 502, an aborted stream, a refusal. A free user must not lose a third of their
// month to our own failure.
export async function refund(feature, userId) {
  try {
    await redis.decr(monthKey(feature, userId));
  } catch (err) {
    // Best-effort: a failed refund must never turn into a failed request.
    console.error(`Quota refund failed for ${feature}: ${err}`);
  }
}
