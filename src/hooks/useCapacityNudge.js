import { useMemo } from "react";
import { loadS, saveS, CAPACITY_STATS_KEY } from "../utils/storage";

const WEEK_MS = 7 * 86400000;
const MIN_WEEKS = 2;

export function recordWeeklyStats(focusCount, doneThisWeek) {
  const stats = loadS(CAPACITY_STATS_KEY, { weeks: [] });
  const now = Date.now();
  const weekId = Math.floor(now / WEEK_MS);

  const existing = stats.weeks.find(w => w.id === weekId);
  if (existing) {
    existing.focus = focusCount;
    existing.done = Math.max(existing.done, doneThisWeek);
  } else {
    stats.weeks.push({ id: weekId, focus: focusCount, done: doneThisWeek });
  }

  // Keep last 8 weeks max
  if (stats.weeks.length > 8) stats.weeks = stats.weeks.slice(-8);
  saveS(CAPACITY_STATS_KEY, stats);
}

export function dismissCapacityNudge() {
  const stats = loadS(CAPACITY_STATS_KEY, { weeks: [] });
  stats.dismissedAt = Date.now();
  saveS(CAPACITY_STATS_KEY, stats);
}

export function useCapacityNudge(capacity, focusTasksLength, doneThisWeek) {
  return useMemo(() => {
    const current = capacity || 'normal';
    const stats = loadS(CAPACITY_STATS_KEY, { weeks: [] });

    // Don't re-nudge within 3 weeks of dismissal
    if (stats.dismissedAt && (Date.now() - stats.dismissedAt) < 3 * WEEK_MS) return null;

    const recentWeeks = stats.weeks.slice(-MIN_WEEKS);
    if (recentWeeks.length < MIN_WEEKS) return null;

    // Nudge UP: consistently clearing all focus tasks for 2+ weeks
    if (current !== 'high') {
      const allCleared = recentWeeks.every(w => w.done >= w.focus && w.focus > 0);
      if (allCleared) {
        return {
          direction: 'up',
          suggestion: current === 'low' ? 'normal' : 'high',
          message: current === 'low'
            ? "You've been knocking out everything Mitzy's showing you — want to see a few more tasks?"
            : "You're crushing it — want Mitzy to show you everything you can get ahead on?",
        };
      }
    }

    // Nudge DOWN: very few completions relative to focus for 2+ weeks
    if (current !== 'low') {
      const struggling = recentWeeks.every(w => w.focus > 0 && w.done <= 1);
      if (struggling) {
        return {
          direction: 'down',
          suggestion: current === 'high' ? 'normal' : 'low',
          message: current === 'high'
            ? "Looks like things have been busy — want Mitzy to dial it back a bit?"
            : "A lot on your plate? Mitzy can focus on just the critical stuff for now.",
        };
      }
    }

    return null;
  }, [capacity, focusTasksLength, doneThisWeek]); // eslint-disable-line react-hooks/exhaustive-deps
}
