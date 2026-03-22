// ─── Deterministic card tilt ──────────────────────────────────────────────────

export function stableTiltDeg(id, max = 1.8) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const n = ((h >>> 0) % 1000) / 1000; // 0..0.999
  const t = (n * 2 - 1) * max;         // -max..max
  return Math.round(t * 10) / 10;
}

// ─── Seasonal visibility ──────────────────────────────────────────────────────

export function isActiveMonth(task) {
  if (!task.activeMonths) return true;
  return task.activeMonths.includes(new Date().getMonth() + 1);
}

// ─── Task status ──────────────────────────────────────────────────────────────

export function taskStatus(task, taskState) {
  const entry = taskState[task.id];

  if (entry?.scheduledDate && new Date(entry.scheduledDate) > new Date()) return "scheduled";
  if (entry?.scheduledDate && new Date(entry.scheduledDate) <= new Date()) return "confirm";
  if (!entry?.lastDone) return "due";

  const daysSinceDone = Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
  const daysRemaining = task.intervalDays - daysSinceDone;

  if (daysRemaining <= 0)                return "due";
  if (daysRemaining <= task.windowDays)  return "coming-up";
  return "ok";
}

// ─── Task scoring (higher = more urgent) ─────────────────────────────────────

export function taskScore(task, lastDone) {
  const stakeWeight = { high: 3, medium: 2, low: 1 }[task.stakes] || 1;
  const daysSince   = lastDone
    ? Math.floor((Date.now() - new Date(lastDone)) / 86400000)
    : task.intervalDays * 2;
  return stakeWeight * Math.min(daysSince / task.intervalDays, 2);
}

// ─── Next due date display ────────────────────────────────────────────────────

export function nextDueStr(task, lastDone) {
  if (!lastDone) return "anytime";
  const due = new Date(new Date(lastDone).getTime() + task.intervalDays * 86400000);
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
