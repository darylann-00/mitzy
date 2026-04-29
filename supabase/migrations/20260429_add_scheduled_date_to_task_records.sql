-- Add scheduled_date column to task_records for calendar integration.
-- When a user confirms a calendar event match, the event's date is saved here.
-- Status logic checks: if scheduledDate is in future → "scheduled" status;
-- if scheduledDate has passed → "confirm" status (task is due).

alter table task_records
  add column if not exists scheduled_date date default null;
