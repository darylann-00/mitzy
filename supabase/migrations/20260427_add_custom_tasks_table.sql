-- Custom tasks created by users (manual via AddTaskPanel or AI via AITaskCreator).
-- Mirrors the in-memory task shape from src/data/tasks.js so rows can hydrate
-- the same task pipeline as built-ins. is_ai_generated distinguishes the two
-- creation paths; risk_tier is null for manual tasks.

create table if not exists custom_tasks (
  id              bigint primary key generated always as identity,
  user_id         uuid not null references auth.users on delete cascade,
  task_id         text not null,
  cat             text not null,
  label           text not null,
  interval_days   integer,
  window_days     integer,
  stakes          text,
  active_months   jsonb,
  assist_type     text,
  search_query    text,
  why             text,
  guidance        text,
  one_time        boolean default false,
  is_ai_generated boolean default false,
  risk_tier       numeric,
  assumptions     jsonb,
  prompt_text     text,
  created_at      timestamptz default now(),
  unique(user_id, task_id)
);

create index if not exists custom_tasks_user_id_idx on custom_tasks (user_id);

alter table custom_tasks enable row level security;

drop policy if exists "custom_tasks_select_own" on custom_tasks;
drop policy if exists "custom_tasks_insert_own" on custom_tasks;
drop policy if exists "custom_tasks_update_own" on custom_tasks;
drop policy if exists "custom_tasks_delete_own" on custom_tasks;

create policy "custom_tasks_select_own"
  on custom_tasks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "custom_tasks_insert_own"
  on custom_tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "custom_tasks_update_own"
  on custom_tasks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "custom_tasks_delete_own"
  on custom_tasks for delete
  to authenticated
  using (auth.uid() = user_id);
