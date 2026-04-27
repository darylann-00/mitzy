-- Add `needed` flag column to task_records.
-- Previously updated only in local React state by markNeeded — flag was lost
-- on browser clear or device change. Now persisted via Supabase upsert.
alter table task_records
  add column if not exists needed boolean default false;
