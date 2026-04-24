import { REGION_TASK_ADJUSTMENTS } from "./climateRegion";

// ─── Deterministic card tilt ──────────────────────────────────────────────────

// Max rotation keeps cards visually playful without obscuring content
const MAX_CARD_TILT_DEG = 1.8;

export function stableTiltDeg(id, max = MAX_CARD_TILT_DEG) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const n = ((h >>> 0) % 1000) / 1000; // 0..0.999
  const t = (n * 2 - 1) * max;         // -max..max
  return Math.round(t * 10) / 10;
}

// ─── Seasonal visibility ──────────────────────────────────────────────────────

// seasonStart: task wakes up at this month and stays visible until done (taxes, etc.)
// activeMonths: hard window — task is only visible during these months (health insurance, etc.)
// region: optional climate region string from getClimateRegion(zip) — adjusts windows per locale.
//   Regional adjustment of seasonStart: false → task never active in this region.
//   Regional adjustment of activeMonths: [] → task never active in this region.
export function isWindowActive(task, region) {
  const month = new Date().getMonth() + 1;

  // Apply regional adjustment if available
  const adj = region ? REGION_TASK_ADJUSTMENTS[region]?.[task.id] : null;
  const seasonStart  = adj && "seasonStart"  in adj ? adj.seasonStart  : task.seasonStart;
  const activeMonths = adj && "activeMonths" in adj ? adj.activeMonths : task.activeMonths;

  // false means "never active in this region"
  if (seasonStart === false) return false;

  if (seasonStart) {
    // Spring/summer start (e.g. Feb) → show from that month onward.
    // Fall start (e.g. Oct) → show from that month through end of Q1 next year.
    return seasonStart <= 6
      ? month >= seasonStart
      : month >= seasonStart || month <= 3;
  }

  // [] means "never active in this region"
  if (activeMonths !== null && activeMonths !== undefined) {
    return activeMonths.length > 0 && activeMonths.includes(month);
  }

  return true;
}

// ─── Task status ──────────────────────────────────────────────────────────────

export function taskStatus(task, taskState) {
  const entry = taskState[task.id];

  if (entry?.scheduledDate && new Date(entry.scheduledDate) > new Date()) return "scheduled";
  if (entry?.scheduledDate && new Date(entry.scheduledDate) <= new Date()) return "confirm";
  if (task.oneTime) {
    if (entry?.needed)   return "needed";
    if (entry?.lastDone) return "ok";
    return "unknown";
  }

  if (entry?.needed && !entry?.lastDone) return "due";
  if (!entry?.lastDone) return "unknown";

  const intervalDays  = entry?.intervalDays ?? task.intervalDays;
  const daysSinceDone = Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
  const daysRemaining = intervalDays - daysSinceDone;

  if (daysRemaining <= 0)                return "due";
  if (daysRemaining <= task.windowDays)  return "coming-up";
  return "ok";
}

// ─── Task scoring (higher = more urgent) ─────────────────────────────────────

export function taskScore(task, lastDone, intervalDaysOverride) {
  const stakeWeight  = { high: 3, medium: 2, low: 1 }[task.stakes] || 1;
  const intervalDays = intervalDaysOverride ?? task.intervalDays;
  if (task.oneTime) return lastDone ? 0 : stakeWeight * 3;
  const daysSince = lastDone
    ? Math.floor((Date.now() - new Date(lastDone)) / 86400000)
    : intervalDays * 2;
  return stakeWeight * Math.min(daysSince / intervalDays, 2);
}

// ─── Dependency check ─────────────────────────────────────────────────────────

export function isDependencySatisfied(task, taskState) {
  if (!task.dependsOn) return true;
  return !!taskState[task.dependsOn]?.lastDone;
}

// ─── Next due date display ────────────────────────────────────────────────────

export function nextDueStr(task, lastDone, intervalDaysOverride) {
  if (task.oneTime) return "once";
  if (!lastDone) return "anytime";
  const intervalDays = intervalDaysOverride ?? task.intervalDays;
  const due = new Date(new Date(lastDone).getTime() + intervalDays * 86400000);
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
