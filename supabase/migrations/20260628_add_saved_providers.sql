-- Saved providers: a user's "good"/"bad" votes on providers surfaced by
-- AssistPanel, keyed by task_id so multiple providers per task type can be
-- kept (e.g. different vets tried over time). Previously this only lived in
-- localStorage and was wiped on sign-out, device switch, or cache clear.

create table if not exists saved_providers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  task_id     text not null,
  vote        text not null check (vote in ('good', 'bad')),
  notes       text,
  data        jsonb not null default '{}'::jsonb,  -- name, rating, address, phone, etc.
  created_at  timestamptz default now()
);

create index if not exists saved_providers_user_id_idx      on saved_providers (user_id);
create index if not exists saved_providers_user_task_idx    on saved_providers (user_id, task_id);

alter table saved_providers enable row level security;

drop policy if exists "saved_providers_select_own" on saved_providers;
drop policy if exists "saved_providers_insert_own" on saved_providers;
drop policy if exists "saved_providers_update_own" on saved_providers;
drop policy if exists "saved_providers_delete_own" on saved_providers;

create policy "saved_providers_select_own"
  on saved_providers for select to authenticated
  using (auth.uid() = user_id);

create policy "saved_providers_insert_own"
  on saved_providers for insert to authenticated
  with check (auth.uid() = user_id);

create policy "saved_providers_update_own"
  on saved_providers for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_providers_delete_own"
  on saved_providers for delete to authenticated
  using (auth.uid() = user_id);
