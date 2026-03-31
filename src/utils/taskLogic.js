// ─── Deterministic card tilt ──────────────────────────────────────────────────

export function stableTiltDeg(id, max = 1.8) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const n = ((h >>> 0) % 1000) / 1000; // 0..0.999
  const t = (n * 2 - 1) * max;         // -max..max
  return Math.round(t * 10) / 10;
}

// ─── Seasonal visibility ──────────────────────────────────────────────────────

// seasonStart: task wakes up at this month and stays visible until done (taxes, etc.)
// activeMonths: hard window — task is only visible during these months (health insurance, etc.)
export function isWindowActive(task) {
  const month = new Date().getMonth() + 1;
  if (task.seasonStart) {
    // Spring/summer start (e.g. Feb) → show from that month onward.
    // Fall start (e.g. Oct) → show from that month through end of Q1 next year.
    return task.seasonStart <= 6
      ? month >= task.seasonStart
      : month >= task.seasonStart || month <= 3;
  }
  if (!task.activeMonths) return true;
  return task.activeMonths.includes(month);
}

// ─── Task status ──────────────────────────────────────────────────────────────

export function taskStatus(task, taskState) {
  const entry = taskState[task.id];

  if (entry?.scheduledDate && new Date(entry.scheduledDate) > new Date()) return "scheduled";
  if (entry?.scheduledDate && new Date(entry.scheduledDate) <= new Date()) return "confirm";
  if (task.oneTime) {
    if (entry?.lastDone) return "ok";
    if (entry?.needed)   return "needed";
    return "unknown";
  }

  if (entry?.needed && !entry?.lastDone) return "due";
  if (!entry?.lastDone) return "unknown";

  const daysSinceDone = Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
  const daysRemaining = task.intervalDays - daysSinceDone;

  if (daysRemaining <= 0)                return "due";
  if (daysRemaining <= task.windowDays)  return "coming-up";
  return "ok";
}

// ─── Task scoring (higher = more urgent) ─────────────────────────────────────

export function taskScore(task, lastDone) {
  const stakeWeight = { high: 3, medium: 2, low: 1 }[task.stakes] || 1;
  if (task.oneTime) return lastDone ? 0 : stakeWeight * 3;
  const daysSince   = lastDone
    ? Math.floor((Date.now() - new Date(lastDone)) / 86400000)
    : task.intervalDays * 2;
  return stakeWeight * Math.min(daysSince / task.intervalDays, 2);
}

// ─── Dependency check ─────────────────────────────────────────────────────────

export function isDependencySatisfied(task, taskState) {
  if (!task.dependsOn) return true;
  return !!taskState[task.dependsOn]?.lastDone;
}

// ─── Next due date display ────────────────────────────────────────────────────

export function nextDueStr(task, lastDone) {
  if (task.oneTime) return "once";
  if (!lastDone) return "anytime";
  const due = new Date(new Date(lastDone).getTime() + task.intervalDays * 86400000);
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
