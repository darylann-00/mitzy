import { useState } from "react";
import { C } from "../data/constants";
import { Sheet } from "./Sheet";
import { startCheckout } from "../utils/billing";

// Always "Mitzy Pro", never bare "Pro" — TaskConfirmCard already uses "Pro
// required" to mean a qualified tradesperson, and the two must not blur.
const PRO_FEATURES = [
  "Unlimited AI assist on any task",
  "Live lookups for local fees and deadlines",
  "Smart provider search near you",
  "Brain dump — turn a messy note into tasks",
];

function Bullet({ children }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green, flexShrink: 0, marginTop: 7 }} />
      <span style={{ fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{children}</span>
    </li>
  );
}

// `reason` comes from the server's 402 body:
//   'quota_exhausted' — free monthly allowance is spent
//   'pro_only'        — a web-search-backed answer, which the allowance never covers
export function UpgradeSheet({ reason, used, limit, resetAt, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const proOnly = reason === 'pro_only';

  const handleUpgrade = async () => {
    setBusy(true);
    setError(null);
    // Resolves to a message on failure; on success the browser has already
    // left for Stripe.
    const message = await startCheckout();
    if (message) { setError(message); setBusy(false); }
  };

  const resetLabel = resetAt
    ? new Date(resetAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : null;

  const headline = proOnly
    ? "This one needs a live lookup"
    : "You've used your free assists";

  const body = proOnly
    ? "Fees, deadlines, and filing rules change by county. Mitzy Pro looks them up on the official site and shows you where the answer came from."
    : `That's ${used ?? limit} of ${limit} this month${resetLabel ? `, back on ${resetLabel}` : ''}. Mitzy Pro removes the cap.`;

  return (
    <Sheet title="Mitzy Pro" onClose={onClose}>
      <div style={{ fontSize: 17, fontFamily: "Righteous, sans-serif", color: C.ink, marginBottom: 8 }}>
        {headline}
      </div>
      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 18 }}>
        {body}
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px" }}>
        {PRO_FEATURES.map(f => <Bullet key={f}>{f}</Bullet>)}
      </ul>

      <button
        className="pb"
        onClick={handleUpgrade}
        disabled={busy}
        style={{
          width: "100%", padding: "14px 20px", background: C.brand, color: C.brandLight,
          border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
          cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
          marginBottom: error ? 8 : 10,
        }}
      >
        {busy ? "Opening checkout…" : "Get Mitzy Pro — $4.99/month"}
      </button>

      {error && (
        <div style={{ fontSize: 13, color: C.red, lineHeight: 1.5, marginBottom: 10, textAlign: "center" }}>
          {error}
        </div>
      )}

      <button
        className="pb"
        onClick={onClose}
        style={{
          width: "100%", padding: "12px 20px", background: "transparent", color: C.muted,
          border: `1.5px solid ${C.cardBorder}`, borderRadius: 12, fontSize: 14, fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Maybe later
      </button>
    </Sheet>
  );
}
