-- Add per-task frequency override column to task_records.
-- Previously stored in localStorage only (taskState[id].intervalDays).
-- Now synced to Supabase so overrides survive device changes and localStorage clears.
alter table task_records
  add column if not exists interval_days integer default null;
