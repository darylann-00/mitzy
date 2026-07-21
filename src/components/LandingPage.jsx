import { useState } from "react";
import "../styles/landing.css";

const C = {
  brand: '#1A5C3A',
  brandDark: '#0F3D27',
  brandLight: '#E8F5EE',
  brandTint: '#E8F0EC',
  red: '#D62828',
  orange: '#F77F00',
  green: '#06A77D',
  yellow: '#F4C430',
  ink: '#1C2B22',
  muted: '#4A6256',
  bg: '#FDFAF2',
  card: '#FFFFFF',
  cardBorder: '#EAE4DA',
};

function Logo({ size = 'default' }) {
  const dotSize = size === 'small' ? 9 : 12;
  const gap = size === 'small' ? 3 : 4;
  const fontSize = size === 'small' ? 22 : 32;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'small' ? 8 : 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `${dotSize}px ${dotSize}px`, gap }}>
        <span style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: C.red, display: 'block' }} />
        <span style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: C.orange, display: 'block' }} />
        <span style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: C.green, display: 'block' }} />
        <span style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: C.yellow, display: 'block' }} />
      </div>
      <span style={{ fontFamily: "'Righteous', cursive", fontSize, color: C.brand, lineHeight: 1 }}>
        mitzy
      </span>
    </div>
  );
}

function MemphisShapes({ style }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }} viewBox="0 0 600 300" fill="none" preserveAspectRatio="xMidYMid slice">
      <circle cx="520" cy="50" r="28" fill={C.brandLight} />
      <circle cx="560" cy="160" r="12" stroke={C.brandLight} strokeWidth="2" fill="none" />
      <rect x="440" cy="200" width="16" height="16" rx="2" transform="rotate(30 440 200)" fill={C.brandLight} />
      <circle cx="380" cy="35" r="7" fill={C.brandLight} />
      <rect x="320" y="240" width="11" height="11" transform="rotate(45 325 245)" fill={C.brandLight} />
      <circle cx="580" cy="250" r="18" stroke={C.brandLight} strokeWidth="2" fill="none" />
      <circle cx="80" cy="260" r="9" stroke={C.brandLight} strokeWidth="2" fill="none" />
      <rect x="40" y="35" width="12" height="12" rx="2" transform="rotate(20 46 41)" fill={C.brandLight} />
      <circle cx="160" cy="270" r="5" fill={C.brandLight} />
    </svg>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '48px 0' }}>
      <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, display: 'block' }} />
        <span style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: C.yellow, display: 'block' }} />
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'block' }} />
      </div>
      <div style={{ flex: 1, height: 1, background: C.cardBorder }} />
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="lp-phone" style={{ background: C.ink, borderRadius: 32, padding: 10, maxWidth: 280, margin: '0 auto' }}>
      <div style={{ background: C.bg, borderRadius: 24, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: C.brand, padding: '20px 18px 14px', position: 'relative', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.12 }} viewBox="0 0 280 70" fill="none">
            <circle cx="230" cy="18" r="16" fill={C.brandLight} />
            <rect x="35" y="48" width="9" height="9" transform="rotate(45 39 52)" fill={C.brandLight} />
            <circle cx="250" cy="58" r="7" stroke={C.brandLight} strokeWidth="1.5" fill="none" />
          </svg>
          <p style={{ fontFamily: "'Righteous', cursive", fontSize: 18, color: '#fff', margin: 0 }}>Hey, Sarah</p>
          <p style={{ fontSize: 12, color: C.brandLight, opacity: 0.7, margin: '4px 0 0' }}>2 things this week</p>
        </div>
        {/* Cards */}
        <div style={{ padding: 14 }}>
          <TaskCard dot={C.red} label="Replace HVAC filter" meta="Due 3 days ago" pill="Due" pillBg="#FCEAEA" pillColor={C.red} />
          <TaskCard dot={C.orange} label="Vet visit — Luna" meta="Due in 5 days" pill="Soon" pillBg="#FFF3E0" pillColor="#C65100" />
          <div style={{
            background: '#FFFDF5', border: `1px solid ${C.yellow}`, borderRadius: 12,
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.yellow, flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: C.muted, margin: 0, flex: 1 }}>
              Found: "Luna checkup" on your calendar — yours?
            </p>
            <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 20, background: C.yellow, color: C.ink, fontWeight: 600 }}>Yes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ dot, label, meta, pill, pillBg, pillColor }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12,
      padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.ink, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 10, color: C.muted, margin: '2px 0 0' }}>{meta}</p>
      </div>
      <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 20, background: pillBg, color: pillColor, fontWeight: 600 }}>{pill}</span>
    </div>
  );
}

export function LandingPage({ onGetStarted, onSignIn }) {
  const [hoveredCta, setHoveredCta] = useState(false);

  const ctaStyle = {
    display: 'inline-block', background: C.brand, color: C.brandLight,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: '14px 36px', borderRadius: 50, border: 'none', cursor: 'pointer',
    transition: 'background 0.15s',
    ...(hoveredCta ? { background: C.brandDark } : {}),
  };

  return (
    <div className="lp-wrap" style={{ fontFamily: "'DM Sans', sans-serif", color: C.ink }}>
      <div className="lp-inner">
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 56px' }}>
          <Logo size="small" />
          <button
            onClick={onSignIn}
            style={{
              fontSize: 14, color: C.brand, background: 'none', border: 'none',
              cursor: 'pointer', fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Sign in
          </button>
        </nav>

        {/* Hero */}
        <div className="lp-hero">
          <div className="lp-hero-copy">
            <h1 className="lp-h1">
              Stop carrying your household{' '}
              <span style={{ color: C.brand }}>in your head</span>
            </h1>
            <p className="lp-hero-sub">
              Mitzy knows what needs doing — filters, checkups, renewals, deadlines — and nudges you before things slip.
            </p>
            <button
              onClick={onGetStarted}
              onMouseEnter={() => setHoveredCta(true)}
              onMouseLeave={() => setHoveredCta(false)}
              style={ctaStyle}
            >
              Start my free trial
            </button>
            <span style={{ display: 'block', fontSize: 13, color: C.muted, marginTop: 12 }}>
              No credit card required
            </span>
          </div>

          {/* Phone mockup */}
          <PhoneMockup />
        </div>

        {/* Benefits */}
        <div className="lp-benefits" style={{ background: C.brandTint, borderRadius: 20, padding: '40px 28px', margin: '56px 0' }}>
          <p style={{
            fontFamily: "'Righteous', cursive", fontSize: 12, textAlign: 'center',
            color: C.brand, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 32px', opacity: 0.7,
          }}>
            Why Mitzy
          </p>
          <div className="lp-benefits-grid">
            <Benefit icon="🧠" title="Already knows" desc="60+ tasks built in, personalized to your home, cars, kids, and pets." />
            <Benefit icon="📋" title="Plans your week" desc="Optional weekly check-in. Brain dump what's on your mind and go." />
            <Benefit icon="💚" title="No guilt trips" desc="Snooze anything. Mitzy doesn't shame you — she gets it." />
          </div>
        </div>

        <Divider />

        {/* Pricing */}
        <div style={{ textAlign: 'center', margin: '48px 0' }}>
          <h2 style={{ fontFamily: "'Righteous', cursive", fontSize: 22, color: C.ink, margin: '0 0 8px' }}>
            Simple pricing
          </h2>
          <p style={{ fontSize: 15, color: C.muted, margin: '0 0 28px' }}>
            Start free. Upgrade when you want the magic.
          </p>
          <div className="lp-pricing-grid">
            {/* Free tier */}
            <div style={{ border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: '24px 20px', textAlign: 'left', background: C.card }}>
              <h3 style={{ fontFamily: "'Righteous', cursive", fontSize: 18, color: C.ink, margin: '0 0 4px', fontWeight: 400 }}>Free</h3>
              <p style={{ fontSize: 14, color: C.muted, margin: '0 0 16px' }}>$0 / forever</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <PricingItem>Full task library</PricingItem>
                <PricingItem>Weekly planning</PricingItem>
                <PricingItem>Calendar matching</PricingItem>
                <PricingItem>Snooze and schedule</PricingItem>
              </ul>
            </div>
            {/* Pro tier */}
            <div style={{ border: `2px solid ${C.brand}`, borderRadius: 14, padding: '24px 20px', textAlign: 'left', background: C.card }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: C.brand, background: C.brandLight,
                padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 10,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                Most popular
              </span>
              <h3 style={{ fontFamily: "'Righteous', cursive", fontSize: 18, color: C.ink, margin: '0 0 4px', fontWeight: 400 }}>Mitzy Pro</h3>
              <p style={{ fontSize: 14, color: C.muted, margin: '0 0 16px' }}>$4.99 / month</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <PricingItem>Everything in Free</PricingItem>
                <PricingItem>AI task assistant</PricingItem>
                <PricingItem>Smart provider search</PricingItem>
                <PricingItem>Brain dump task creator</PricingItem>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="lp-bottom-cta" style={{
          background: C.brand, borderRadius: 20, padding: '48px 32px',
          textAlign: 'center', margin: '48px 0 32px', position: 'relative', overflow: 'hidden',
        }}>
          <MemphisShapes style={{ opacity: 0.1 }} />
          <h3 style={{ fontFamily: "'Righteous', cursive", fontSize: 24, color: '#fff', margin: '0 0 12px', fontWeight: 400, position: 'relative' }}>
            Your household, handled.
          </h3>
          <p style={{ fontSize: 15, color: C.brandLight, opacity: 0.75, margin: '0 0 28px', position: 'relative' }}>
            Set up in 3 minutes. No credit card needed.
          </p>
          <button
            onClick={onGetStarted}
            style={{
              display: 'inline-block', background: C.yellow, color: C.ink,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16,
              padding: '14px 36px', borderRadius: 50, border: 'none', cursor: 'pointer',
              position: 'relative',
            }}
          >
            Start my free trial
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '0 0 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <Logo size="small" />
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
            <a href="/privacy.html" style={{ color: C.muted, textDecoration: 'none' }}>Privacy</a>
            {' · '}
            <a href="/terms.html" style={{ color: C.muted, textDecoration: 'none' }}>Terms</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon, title, desc }) {
  return (
    <div>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Righteous', cursive", fontSize: 15, color: C.ink, margin: '0 0 6px', fontWeight: 400 }}>{title}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, margin: 0 }}>{desc}</p>
    </div>
  );
}

function PricingItem({ children }) {
  return (
    <li style={{ fontSize: 13, color: C.muted, padding: '5px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, flexShrink: 0, position: 'relative', top: -1 }} />
      {children}
    </li>
  );
}
