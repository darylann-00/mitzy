// Shared due-date math for life event bundles. Each bundle task gets a due
// date computed from the event's anchor date (baby due date, date of passing,
// or "today" for events with no fixed date) plus a per-phase or per-task
// offset in days.

const DAY_MS = 86400000;

// Never schedule a computed due date closer than this. Users who join an
// event mid-stream (mid-pregnancy, months after a loss) would otherwise see
// a wall of overdue red on day one — clamping keeps catch-up tasks in the
// gentler "coming up" state instead.
export const MIN_LEAD_DAYS = 7;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function computeDueDate(anchorIso, offsetDays) {
  if (!anchorIso || offsetDays == null) return null;
  const t = new Date(anchorIso).getTime() + offsetDays * DAY_MS;
  const min = Date.now() + MIN_LEAD_DAYS * DAY_MS;
  return new Date(Math.max(t, min)).toISOString().slice(0, 10);
}

export function daysSince(dateIso) {
  if (!dateIso) return null;
  return Math.floor((Date.now() - new Date(dateIso).getTime()) / DAY_MS);
}
