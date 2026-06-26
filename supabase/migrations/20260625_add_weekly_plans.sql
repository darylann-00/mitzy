create table if not exists weekly_plans (
  id              bigint primary key generated always as identity,
  user_id         uuid not null references auth.users on delete cascade,
  week_start      date not null,
  task_ids        jsonb not null default '[]',
  scheduled_dates jsonb not null default '{}',
  user_input      text,
  confirmed_at    timestamptz,
  created_at      timestamptz default now(),
  unique(user_id, week_start)
);

create index if not exists weekly_plans_user_week_idx on weekly_plans (user_id, week_start);

alter table weekly_plans enable row level security;

create policy "weekly_plans_select_own" on weekly_plans for select to authenticated using (auth.uid() = user_id);
create policy "weekly_plans_insert_own" on weekly_plans for insert to authenticated with check (auth.uid() = user_id);
create policy "weekly_plans_update_own" on weekly_plans for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_plans_delete_own" on weekly_plans for delete to authenticated using (auth.uid() = user_id);
