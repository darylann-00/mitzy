import { useState } from "react";
import { CalendarIcon, LightningIcon, HeartIcon, MovingBoxIcon } from "./CategoryIcons";
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

// A sample of the real task library, dot-colored by category. Showing actual
// task names lands faster than any sentence describing the library.
const TRACKED = [
  ['HVAC filter', C.orange],
  ['Car registration', C.red],
  ['Kids’ checkup', C.green],
  ['Smoke detector batteries', C.red],
  ['Pet vaccines', C.green],
  ['Tax deadline', C.yellow],
  ['Oil change', C.orange],
  ['Gutter cleaning', C.orange],
  ['Dentist', C.green],
  ['Passport renewal', C.yellow],
];

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
            {/* Names the category above the fold — the first thing a new visitor
                (or a Google branding reviewer) needs to know. */}
            <span className="lp-eyebrow">Household task manager</span>
            <h1 className="lp-h1">
              Stop carrying your household{' '}
              <span style={{ color: C.brand }}>in your head</span>
            </h1>
            <p className="lp-hero-sub">
              Mitzy already knows what your home, car, kids, and pets need — and tells
              you what's due before anything slips.
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

        {/* Shows the task library instead of describing it — reads in two
            seconds and proves the product better than a paragraph. */}
        <div style={{ margin: '64px 0' }}>
          <h2 className="lp-h2">The stuff you're supposed to remember</h2>
          <p className="lp-sub">
            Mitzy is a household task manager. It knows 60+ of these and shows you
            only the ones your household actually has.
          </p>
          <div className="lp-chips">
            {TRACKED.map(([label, color]) => (
              <span key={label} className="lp-chip">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {label}
              </span>
            ))}
            <span className="lp-chip lp-chip-more">+ 50 more</span>
          </div>
        </div>

        {/* How it works */}
        <div className="lp-steps-wrap" style={{ background: C.brandTint, borderRadius: 20, padding: '44px 28px', margin: '64px 0' }}>
          <h2 className="lp-h2">How it works</h2>
          <div className="lp-steps">
            <Step n="1" title="Answer a few questions" desc="Your home, cars, kids, pets, zip. Three minutes, once." />
            <Step n="2" title="Get a list you didn't write" desc="Sorted so the top of it is what actually matters today." />
            <Step n="3" title="Mitzy helps you close it" desc="The local rules, the deadline, who to call, what to say." />
          </div>
        </div>

        {/* Benefits */}
        <div style={{ margin: '64px 0' }}>
          <h2 className="lp-h2">Why people stick with it</h2>
          <div className="lp-benefits-grid">
            <Benefit
              icon={<CalendarIcon size={20} />}
              tint="#FFF3E0"
              title="Reads your calendar"
              desc="Already booked the vet? Mitzy sees it and stops asking."
            />
            <Benefit
              icon={<LightningIcon size={20} />}
              tint="#FFFBEE"
              title="Plans your week"
              desc="Brain dump what's on your mind. Mitzy turns it into a doable week."
            />
            <Benefit
              icon={<HeartIcon size={20} />}
              tint={C.brandLight}
              title="Never guilt-trips you"
              desc="Snooze anything to a date that works. No pile of red badges."
            />
            <Benefit
              icon={<MovingBoxIcon size={20} color={C.brand} bg={C.brandTint} />}
              tint={C.brandTint}
              title="Handles the big stuff"
              desc="Moving, a new baby, a divorce, a death in the family. Mitzy knows the paperwork."
            />
          </div>
        </div>

        {/* Google account + calendar — what data is used and why. Kept short and
            quiet, but explicit: this is what OAuth branding review looks for. */}
        <div style={{
          background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16,
          padding: '24px 24px 20px', margin: '64px auto', maxWidth: 780,
        }}>
          <h2 style={{
            fontFamily: "'Righteous', cursive", fontSize: 16, color: C.ink,
            margin: '0 0 14px', fontWeight: 400,
          }}>
            Mitzy and your Google account
          </h2>
          <DataLine>
            <strong style={{ color: C.ink, fontWeight: 600 }}>Sign in with Google</strong> — Mitzy uses
            your name and email to load your account. Nothing else.
          </DataLine>
          <DataLine>
            <strong style={{ color: C.ink, fontWeight: 600 }}>Google Calendar (optional)</strong> — Mitzy
            reads your upcoming events to spot appointments you've already booked, so it stops
            reminding you about them.
          </DataLine>
          <DataLine>
            <strong style={{ color: C.ink, fontWeight: 600 }}>Read-only, always</strong> — Mitzy never
            creates, edits, or deletes events, and never sells or shares your data.
          </DataLine>
          <p style={{ fontSize: 13, color: C.muted, margin: '14px 0 0' }}>
            <a href="/privacy.html" style={{ color: C.brand, fontWeight: 500 }}>Read the Privacy Policy</a>
          </p>
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

function Step({ n, title, desc }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{
        fontFamily: "'Righteous', cursive", fontSize: 28, color: C.brand,
        opacity: 0.45, display: 'block', lineHeight: 1, marginBottom: 10,
      }}>
        {n}
      </span>
      <h3 style={{ fontFamily: "'Righteous', cursive", fontSize: 16, color: C.ink, margin: '0 0 6px', fontWeight: 400 }}>{title}</h3>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, margin: 0 }}>{desc}</p>
    </div>
  );
}

function DataLine({ children }) {
  return (
    <p style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, margin: '0 0 10px', display: 'flex', gap: 10 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, flexShrink: 0, marginTop: 7 }} />
      <span>{children}</span>
    </p>
  );
}

function Benefit({ icon, tint, title, desc }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14,
      padding: '20px 20px 22px',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, background: tint,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      }}>
        {icon}
      </div>
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
