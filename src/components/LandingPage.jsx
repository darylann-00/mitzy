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

function MemphisShapes() {
  // Corner-anchored shapes (not a scaled SVG) so nothing gets cropped or
  // squashed at different container widths — same technique as GreenScreen
  // in SlimOnboarding.
  return (
    <>
      <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', background: C.brandDark, top: -30, right: -30 }} />
      <div style={{ position: 'absolute', width: 50, height: 50, borderRadius: '50%', background: C.green, top: 16, right: 70, opacity: 0.6 }} />
      <div style={{ position: 'absolute', width: 18, height: 18, background: C.orange, transform: 'rotate(45deg)', bottom: 44, right: 36 }} />
      <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: C.yellow, top: 36, right: 150 }} />
      <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: C.red, bottom: 80, right: 90 }} />
      <div style={{ position: 'absolute', width: 36, height: 36, borderRadius: '50%', border: `3px solid ${C.green}`, opacity: 0.35, bottom: 20, right: 150 }} />
      <div style={{ position: 'absolute', width: 84, height: 84, borderRadius: '50%', background: C.brandDark, bottom: -26, left: -18 }} />
      <div style={{ position: 'absolute', width: 24, height: 24, borderRadius: '50%', border: `2px solid ${C.orange}`, opacity: 0.3, top: 20, left: '28%' }} />
      <div style={{ position: 'absolute', width: 13, height: 13, background: C.yellow, transform: 'rotate(45deg)', top: 56, left: 28, opacity: 0.7 }} />
      <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: C.red, top: '50%', left: '46%', opacity: 0.5 }} />
    </>
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
  const [hoveredSignIn, setHoveredSignIn] = useState(false);

  const ctaStyle = {
    display: 'inline-block', background: C.brand, color: C.brandLight,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16,
    padding: '14px 36px', borderRadius: 50, border: 'none', cursor: 'pointer',
    transition: 'background 0.15s',
    ...(hoveredCta ? { background: C.brandDark } : {}),
  };

  const signInStyle = {
    fontSize: 14, color: C.brand, background: hoveredSignIn ? C.brandTint : 'transparent',
    border: `1.5px solid ${C.brand}`, borderRadius: 50, padding: '8px 20px',
    cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.15s',
  };

  return (
    <div className="lp-wrap" style={{ fontFamily: "'DM Sans', sans-serif", color: C.ink }}>
      <div className="lp-inner">
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 56px' }}>
          <Logo size="small" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a
              href="/privacy.html"
              style={{
                fontSize: 14, color: C.muted, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif", textDecoration: 'none',
              }}
            >
              Privacy
            </a>
            <button
              onClick={onSignIn}
              onMouseEnter={() => setHoveredSignIn(true)}
              onMouseLeave={() => setHoveredSignIn(false)}
              style={signInStyle}
            >
              Sign in
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div className="lp-hero">
          <div className="lp-hero-copy">
            <h1 className="lp-h1">
              Stop carrying your household{' '}
              <span style={{ color: C.brand }}>in your head</span>
            </h1>
            <p className="lp-hero-sub">
              <strong style={{ color: C.ink, fontWeight: 600 }}>Mitzy is a household task manager.</strong>{' '}
              It keeps track of the recurring things a home needs — HVAC filters, car registration,
              kids' checkups, pet vaccines, tax deadlines — and tells you what's due before it slips.
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

        {/* What the app actually does — plain language, no metaphors. */}
        <div style={{ margin: '56px 0' }}>
          <h2 style={{
            fontFamily: "'Righteous', cursive", fontSize: 22, textAlign: 'center',
            color: C.ink, margin: '0 0 8px', fontWeight: 400,
          }}>
            What Mitzy does
          </h2>
          <p style={{ fontSize: 15, color: C.muted, textAlign: 'center', margin: '0 auto 32px', maxWidth: 480, lineHeight: 1.6 }}>
            Mitzy is a personal to-do list for running a household. You don't build the list —
            Mitzy already knows what a home like yours needs and surfaces each task at the right time.
          </p>
          <div className="lp-does-grid">
            <DoesCard
              n="1"
              title="Builds your task list for you"
              desc="Answer a few questions about your home, cars, kids, and pets. Mitzy pulls from a library of 60+ household tasks and keeps only the ones that apply to you."
            />
            <DoesCard
              n="2"
              title="Tells you what's due now"
              desc="Every task has its own schedule — every 3 months, once a year, once ever. Mitzy sorts them by what matters most today so you're not staring at a wall of 60 things."
            />
            <DoesCard
              n="3"
              title="Plans your week with you"
              desc="An optional weekly check-in. Type out whatever's on your mind, and Mitzy turns it into a short, realistic plan for the week — sized to how much you can actually take on."
            />
            <DoesCard
              n="4"
              title="Matches tasks to your calendar"
              desc="Connect Google Calendar and Mitzy spots appointments you've already booked — a vet visit, a dentist appointment — and marks those tasks as scheduled instead of reminding you again."
            />
            <DoesCard
              n="5"
              title="Helps you finish, not just track"
              desc="Open any task for why it matters and how to do it. Ask Mitzy for the local rules, the deadline, what to say on the phone, or nearby providers who can do it for you."
            />
            <DoesCard
              n="6"
              title="Handles the big stuff too"
              desc="Moving, a new baby, a marriage, a divorce, a death in the family — pick the life event and Mitzy lays out the paperwork and deadlines in the order they need doing."
            />
          </div>
        </div>

        {/* Google account + calendar — what data is used and why. */}
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20,
          padding: '32px 28px', margin: '56px 0',
        }}>
          <h2 style={{
            fontFamily: "'Righteous', cursive", fontSize: 20, color: C.ink,
            margin: '0 0 16px', fontWeight: 400,
          }}>
            Mitzy and your Google account
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted, margin: '0 0 12px' }}>
            You can sign in to Mitzy with your Google account. Mitzy uses your name and email
            address to create and load your account — nothing else.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted, margin: '0 0 12px' }}>
            You can also connect Google Calendar. Mitzy reads your upcoming events and compares
            them against your task list, so an appointment you've already booked shows up as
            scheduled instead of as something still hanging over you.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted, margin: '0 0 12px' }}>
            <strong style={{ color: C.ink, fontWeight: 600 }}>Mitzy only reads your calendar.</strong>{' '}
            It never creates, edits, or deletes events, and it never sells or shares your data.
            Calendar access is optional — everything else in Mitzy works without it.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted, margin: 0 }}>
            Full details in the{' '}
            <a href="/privacy.html" style={{ color: C.brand, fontWeight: 500 }}>Privacy Policy</a>.
          </p>
        </div>

        {/* Benefits */}
        <div className="lp-benefits" style={{ background: C.brandTint, borderRadius: 20, padding: '40px 28px', margin: '56px 0' }}>
          <h2 style={{
            fontFamily: "'Righteous', cursive", fontSize: 22, textAlign: 'center',
            color: C.ink, margin: '0 0 32px', fontWeight: 400,
          }}>
            Why Mitzy
          </h2>
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
          <MemphisShapes />
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

function DoesCard({ n, title, desc }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14,
      padding: '20px 18px', display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <span style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: C.brandTint,
        color: C.brand, fontFamily: "'Righteous', cursive", fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {n}
      </span>
      <div>
        <h3 style={{ fontFamily: "'Righteous', cursive", fontSize: 15, color: C.ink, margin: '2px 0 6px', fontWeight: 400 }}>{title}</h3>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: C.muted, margin: 0 }}>{desc}</p>
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
