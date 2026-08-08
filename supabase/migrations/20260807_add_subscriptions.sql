-- Mitzy Pro entitlement. Deliberately NOT a column on `profiles`: the
-- `profiles_update_own` policy (20260424_enable_rls.sql) lets a user UPDATE any
-- column on their own row, so a plan flag there would be forgeable from the
-- browser console. This table grants SELECT only — with RLS on and no insert /
-- update / delete policies, the `authenticated` role cannot write it at all.
-- Only the service role (which bypasses RLS) can, i.e. the Stripe webhook.

create table if not exists subscriptions (
  user_id                 uuid primary key references auth.users on delete cascade,
  plan                    text not null default 'free' check (plan in ('free', 'pro')),
  status                  text,          -- mirrors Stripe: active, past_due, canceled...
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);

-- The webhook looks rows up by Stripe customer id, not user id.
create index if not exists subscriptions_stripe_customer_idx
  on subscriptions (stripe_customer_id);

alter table subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on subscriptions;

create policy "subscriptions_select_own"
  on subscriptions for select to authenticated
  using (auth.uid() = user_id);
