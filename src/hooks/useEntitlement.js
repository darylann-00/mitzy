import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// Mitzy Pro entitlement, read from the `subscriptions` table.
//
// This is for UI only — showing the upgrade prompt, hiding it once someone
// pays. It is never the thing that grants access: the server re-checks the
// same row on every gated request. That split is deliberate. The table grants
// SELECT and nothing else, so the client can read its plan but cannot write it.
//
// Deliberately NOT part of `useProfile`: adding a field there would put it in
// PROFILE_FIELDS (which drives the sign-in conflict modal) and would cache it
// in localStorage, where a hand-edited `plan: 'pro'` would survive reloads.
//
// Fails closed to 'free' and stays silent about it. A missing table, a network
// blip, or a signed-out user all just mean "no Pro" — never an error banner.
// Every e2e spec triggers this select, so it must not break unrelated tests.
async function fetchPlan(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle();
  return (!error && data?.plan === 'pro') ? 'pro' : 'free';
}

export function useEntitlement(user) {
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(!!user);

  // Exposed so the post-checkout return can poll until the Stripe webhook lands.
  const refetch = useCallback(async () => {
    if (!user) { setPlan('free'); setLoading(false); return 'free'; }
    const next = await fetchPlan(user.id);
    setPlan(next);
    setLoading(false);
    return next;
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) { setPlan('free'); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetchPlan(user.id).then(next => {
      if (cancelled) return;
      setPlan(next);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { plan, isPro: plan === 'pro', loading, refetch };
}
