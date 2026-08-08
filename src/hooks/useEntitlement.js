import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// Mitzy Pro entitlement, read from the `subscriptions` table.
//
// This is for UI only — showing the upgrade prompt, deciding whether to ask
// before spending an assist. It is never what grants access: the server
// re-checks the same row on every gated request. That split is deliberate. The
// table grants SELECT and nothing else, so the client can read its plan but
// cannot write it.
//
// Deliberately NOT part of `useProfile`: adding a field there would put it in
// PROFILE_FIELDS (which drives the sign-in conflict modal) and would cache it
// in localStorage, where a hand-edited `plan: 'pro'` would survive reloads.
//
// `known` is the important half. Until the migration is applied the table does
// not exist, and every environment — including CI — is in that state. So a
// failed read must be inert: `known: false` means "we have no idea", and the
// UI must then behave exactly as it did before the paywall existed rather than
// assume 'free' and start blocking people. Server-side enforcement is
// unaffected either way, so guessing here buys nothing and costs correctness.
async function fetchPlan(userId) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .maybeSingle();
    // A missing table, an RLS refusal, or a network blip all land here.
    if (error) return { plan: 'free', known: false };
    return { plan: data?.plan === 'pro' ? 'pro' : 'free', known: true };
  } catch {
    return { plan: 'free', known: false };
  }
}

export function useEntitlement(user) {
  const [state, setState] = useState({ plan: 'free', known: false });
  const [loading, setLoading] = useState(!!user);

  // Exposed so the post-checkout return can poll until the Stripe webhook lands.
  const refetch = useCallback(async () => {
    if (!user) { setState({ plan: 'free', known: false }); setLoading(false); return 'free'; }
    const next = await fetchPlan(user.id);
    setState(next);
    setLoading(false);
    return next.plan;
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) { setState({ plan: 'free', known: false }); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetchPlan(user.id)
      .then(next => {
        if (cancelled) return;
        setState(next);
        setLoading(false);
      })
      // fetchPlan already swallows everything, but an unhandled rejection here
      // would surface as a page error, so never leave the chain open.
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    plan: state.plan,
    isPro: state.plan === 'pro',
    // Only true when we actually read a row. Gate UI on this, never on `!isPro`.
    knownFree: state.known && state.plan !== 'pro',
    known: state.known,
    loading,
    refetch,
  };
}
