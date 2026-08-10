import { supabase } from "../lib/supabase";

// Whether the client should show paywall UI *before* the server says no — the
// "use one of your free assists?" confirm and the pre-emptive Mitzy Pro screen.
//
// These must never appear while the server's PAYWALL_ENABLED kill switch is
// off, or creating the subscriptions table alone would start nagging everyone.
// The browser can't read a server env var, so it's mirrored here and the two
// get flipped together. The window hook mirrors the existing
// __MITZY_FAKE_CAL_TOKEN__ pattern so e2e can drive this without a rebuild.
//
// Reacting to a 402 is deliberately NOT gated on this: that response only
// arrives when the server is genuinely enforcing.
export const paywallActive = () =>
  import.meta.env.VITE_PAYWALL_ENABLED === 'true' ||
  (typeof window !== 'undefined' && window.__MITZY_PAYWALL__ === true);

// Kicks off a hosted Stripe Checkout session and hands the browser over to it.
//
// Hosted Checkout (rather than Stripe Elements) is a deliberate choice: it's a
// plain navigation to Stripe's own domain, so it needs no CSP changes, keeps
// card data entirely out of this app, and is a fraction of the code.
//
// The `/api/checkout` endpoint lands with the Stripe work; until then this
// resolves to an error string that the caller renders inline.
export async function startCheckout() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return 'Sign in first to upgrade.';

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    });
    if (!res.ok) return "Couldn't start checkout just now — try again in a moment.";
    const { url } = await res.json();
    if (!url) return "Couldn't start checkout just now — try again in a moment.";
    window.location.assign(url);
    return null;
  } catch {
    return "Couldn't start checkout just now — try again in a moment.";
  }
}

// Opens the Stripe Billing Portal so a Mitzy Pro subscriber can update their
// card or cancel. Same shape as startCheckout: resolves to an error string on
// failure, or hands the browser to Stripe and resolves null.
export async function openBillingPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return 'Sign in first to manage your subscription.';

  try {
    const res = await fetch('/api/billing-portal', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    });
    if (!res.ok) return "Couldn't open billing settings just now — try again in a moment.";
    const { url } = await res.json();
    if (!url) return "Couldn't open billing settings just now — try again in a moment.";
    window.location.assign(url);
    return null;
  } catch {
    return "Couldn't open billing settings just now — try again in a moment.";
  }
}
