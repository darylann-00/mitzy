-- Life events: time-bounded admin clusters (new baby, move, etc.) that drop a
-- curated set of one-time tasks into the user's task list. The event row holds
-- the metadata + intake answers; the tasks themselves live in custom_tasks
-- tagged with life_event_id, so they hydrate through the existing pipeline.

create table if not exists life_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  type            text not null,                       -- 'new-baby' for v1
  status          text not null default 'active',      -- 'active' | 'completed' | 'dismissed'
  intake_answers  jsonb,
  started_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists life_events_user_id_idx       on life_events (user_id);
create index if not exists life_events_user_status_idx   on life_events (user_id, status);

alter table life_events enable row level security;

drop policy if exists "life_events_select_own" on life_events;
drop policy if exists "life_events_insert_own" on life_events;
drop policy if exists "life_events_update_own" on life_events;
drop policy if exists "life_events_delete_own" on life_events;

create policy "life_events_select_own"
  on life_events for select to authenticated
  using (auth.uid() = user_id);

create policy "life_events_insert_own"
  on life_events for insert to authenticated
  with check (auth.uid() = user_id);

create policy "life_events_update_own"
  on life_events for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "life_events_delete_own"
  on life_events for delete to authenticated
  using (auth.uid() = user_id);

-- Tag custom_tasks with the life event they belong to (nullable; non-event
-- tasks stay as before). suppress_celebration lets sad-event tasks skip
-- confetti when marked done; also reused by the AI task creator's safety tier.
alter table custom_tasks
  add column if not exists life_event_id        uuid references life_events(id) on delete set null,
  add column if not exists suppress_celebration boolean default false;

create index if not exists custom_tasks_life_event_idx on custom_tasks (life_event_id);
