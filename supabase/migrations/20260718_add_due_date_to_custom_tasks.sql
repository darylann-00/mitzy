-- Life event tasks get a computed due date (event date + phase offset) so they
-- flow through the normal due / coming-up pipeline instead of sitting dateless.
-- Nullable: non-event custom tasks and pre-existing rows are unaffected. A
-- user-set date on task_records.due_date still overrides this default.

alter table custom_tasks
  add column if not exists due_date date;
