import { supabase } from "../lib/supabase";

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
