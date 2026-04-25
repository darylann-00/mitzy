-- Enable Row Level Security on profiles and task_records.
-- Without RLS, the public anon key in src/lib/supabase.js lets any
-- authenticated user read or write any other user's row. Each policy
-- below restricts access to rows the requester owns.

alter table profiles      enable row level security;
alter table task_records  enable row level security;

-- profiles: row owner is the auth user whose id matches profiles.id

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_delete_own" on profiles;

create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on profiles for delete
  to authenticated
  using (auth.uid() = id);

-- task_records: row owner is the auth user whose id matches task_records.user_id

drop policy if exists "task_records_select_own" on task_records;
drop policy if exists "task_records_insert_own" on task_records;
drop policy if exists "task_records_update_own" on task_records;
drop policy if exists "task_records_delete_own" on task_records;

create policy "task_records_select_own"
  on task_records for select
  to authenticated
  using (auth.uid() = user_id);

create policy "task_records_insert_own"
  on task_records for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "task_records_update_own"
  on task_records for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "task_records_delete_own"
  on task_records for delete
  to authenticated
  using (auth.uid() = user_id);
