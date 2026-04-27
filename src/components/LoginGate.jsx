import { useState, useEffect } from "react";

const RESEND_COOLDOWN_MS = 30000;

export function LoginGate({ sendMagicLink, signInWithGoogle, authError, welcomeChoice }) {
  const [email,        setEmail]        = useState("");
  const [sentEmail,    setSentEmail]    = useState("");
  const [sent,         setSent]         = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmail,    setShowEmail]    = useState(false);
  const [err,          setErr]          = useState(authError || "");
  const [cooldownEnds, setCooldownEnds] = useState(0);
  const [now,          setNow]          = useState(() => Date.now());
  const [resending,    setResending]    = useState(false);
  const [resendErr,    setResendErr]    = useState("");

  useEffect(() => {
    if (!sent) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sent]);

  const cooldownLeft = Math.max(0, Math.ceil((cooldownEnds - now) / 1000));
  const canResend = !resending && cooldownLeft === 0;

  const handleGoogle = async () => {
    setErr("");
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) { setErr("Google sign-in failed. Try again."); setGoogleLoading(false); }
      // on success, Supabase redirects — no need to reset state
    } catch {
      setErr("Google sign-in failed. Try again.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) { setErr("Enter a valid email address."); return; }
    setLoading(true);
    const { error } = await sendMagicLink(clean);
    setLoading(false);
    if (error) { setErr("Something went wrong. Try again."); return; }
    setSentEmail(clean);
    setCooldownEnds(Date.now() + RESEND_COOLDOWN_MS);
    setSent(true);
  };

  const handleResend = async () => {
    setResendErr("");
    setResending(true);
    const { error } = await sendMagicLink(sentEmail);
    setResending(false);
    if (error) { setResendErr("Couldn't resend. Try again."); return; }
    setCooldownEnds(Date.now() + RESEND_COOLDOWN_MS);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#1A5C3A",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "28px 24px", position: "relative", overflow: "hidden",
    }}>
      {/* Memphis shapes */}
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "#0F3D27", top: -40, right: -40 }} />
      <div style={{ position: "absolute", width: 60,  height: 60,  borderRadius: "50%", background: "#06A77D", top: 20, right: 60, opacity: 0.7 }} />
      <div style={{ position: "absolute", width: 20,  height: 20,  background: "#F77F00", transform: "rotate(45deg)", bottom: 60, right: 30 }} />
      <div style={{ position: "absolute", width: 80,  height: 80,  borderRadius: "50%", background: "#0F3D27", bottom: -30, left: -20 }} />
      <div style={{ position: "absolute", width: 14,  height: 14,  background: "#F4C430", transform: "rotate(45deg)", top: 80, left: 30, opacity: 0.7 }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#D62828" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F77F00" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#06A77D" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F4C430" }} />
          </div>
          <span style={{ fontFamily: "'Righteous', 'Trebuchet MS', cursive", fontSize: 38, color: "#E8F5EE", lineHeight: 1 }}>
            mitzy
          </span>
        </div>

        {sent ? (
          <>
            <h2 style={{ fontFamily: "'Righteous', cursive", color: "#E8F5EE", fontSize: 26, margin: "0 0 12px" }}>
              Check your email
            </h2>
            <p style={{ color: "#A8D5B8", fontSize: 16, lineHeight: 1.6, margin: "0 0 16px" }}>
              We sent a link to <strong style={{ color: "#E8F5EE" }}>{sentEmail}</strong>. Tap it to open Mitzy.
            </p>
            <p style={{ color: "#6BAF88", fontSize: 14, margin: "0 0 24px" }}>
              The link expires in 24 hours.
            </p>

            <button
              onClick={handleResend}
              disabled={!canResend}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                border: "1.5px solid #2D7A54",
                background: "transparent",
                color: canResend ? "#A8D5B8" : "#4A6256",
                fontSize: 15, fontWeight: 600,
                fontFamily: "DM Sans, sans-serif",
                cursor: canResend ? "pointer" : "default",
              }}
            >
              {resending
                ? "Sending…"
                : cooldownLeft > 0
                  ? `Resend in ${cooldownLeft}s`
                  : "Didn't get it? Resend"}
            </button>

            {resendErr && (
              <p style={{ color: "#F77F00", fontSize: 14, margin: "12px 0 0", fontFamily: "DM Sans, sans-serif" }}>
                {resendErr}
              </p>
            )}
          </>
        ) : (
          <>
            {authError && (
              <div style={{ background: '#7B1A1A', borderRadius: 10, padding: '12px 14px', marginBottom: 20, color: '#FFB3B3', fontSize: 13, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
                Sign-in failed: {authError}
              </div>
            )}
          <h2 style={{ fontFamily: "'Righteous', cursive", color: "#E8F5EE", fontSize: 26, margin: "0 0 8px" }}>
              {welcomeChoice === 'returning' ? 'Welcome back' : 'Save your setup'}
            </h2>
            <p style={{ color: "#A8D5B8", fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
              {welcomeChoice === 'returning'
                ? 'Sign in to load your Mitzy.'
                : 'It took a minute to build. Keep it safe across devices.'}
            </p>

            {/* Google SSO */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12, border: "none",
                background: "#fff", color: "#1C2B22",
                fontSize: 15, fontWeight: 700, fontFamily: "DM Sans, sans-serif",
                cursor: googleLoading ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                marginBottom: 16,
              }}
            >
              {!googleLoading && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </button>

            {err && !showEmail && (
              <p style={{ color: "#F77F00", fontSize: 14, margin: "-8px 0 14px", textAlign: "center", fontFamily: "DM Sans, sans-serif" }}>{err}</p>
            )}

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "#2D7A54" }} />
              <span style={{ color: "#6BAF88", fontSize: 13, fontFamily: "DM Sans, sans-serif" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#2D7A54" }} />
            </div>

            {/* Magic link (collapsed by default) */}
            {!showEmail ? (
              <button
                onClick={() => setShowEmail(true)}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  border: "1.5px solid #2D7A54", background: "transparent",
                  color: "#A8D5B8", fontSize: 15, fontWeight: 600,
                  fontFamily: "DM Sans, sans-serif", cursor: "pointer",
                }}
              >
                Sign in with email link
              </button>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErr(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "14px 16px", borderRadius: 12, border: "none",
                    fontSize: 16, fontFamily: "DM Sans, sans-serif",
                    background: "#fff", color: "#1C2B22",
                    marginBottom: err ? 8 : 12, outline: "none",
                  }}
                />
                {err && <p style={{ color: "#F77F00", fontSize: 14, margin: "0 0 12px" }}>{err}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "15px", borderRadius: 12, border: "none",
                    background: loading ? "#4A6256" : "#06A77D",
                    color: "#fff", fontSize: 16, fontWeight: 700,
                    fontFamily: "DM Sans, sans-serif",
                    cursor: loading ? "default" : "pointer",
                  }}
                >
                  {loading ? "Sending…" : "Send link"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
