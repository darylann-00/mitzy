import { useState, useEffect, useMemo, memo, useRef } from "react";
import { resolveStepVars } from "../utils/resolveStepVars";
import { useProfileContext } from "../contexts/ProfileContext";
import { supabase } from "../lib/supabase";
import { INSURANCE_PROVIDERS } from "../data/insuranceProviders";

const C = {
  brand: '#1A5C3A', brandDark: '#0F3D27', brandLight: '#E8F5EE',
  green: '#06A77D', ink: '#1C2B22', muted: '#4A6256',
  bg: '#FDFAF2', card: '#FFFFFF', cardBorder: '#EAE4DA',
  orange: '#F77F00', red: '#D62828',
};

function parseProviders(text) {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return null;
}

// ─── Mini provider search (reuses /api/providers) ────────────────────────────
function ProviderSearch({ query, zip, onSelect, onSaveProvider, nameSearchOnly }) {
  const [status, setStatus] = useState('idle');
  const [providers, setProviders] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');

  const resetToIdle = () => {
    setStatus('idle');
    setProviders(null);
    setManualName('');
    setManualMode(false);
  };

  const fetchProviders = async () => {
    setStatus('loading');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': `Bearer ${token}` },
        body: JSON.stringify({ taskLabel: query, taskCat: 'health', taskNote: '', zip, searchQuery: query }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const { text } = await res.json();
      const parsed = parseProviders(text);
      setProviders(parsed);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const searchByName = async () => {
    if (!manualName.trim()) return;
    setStatus('loading');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const nameQuery = `${manualName.trim()} ${query}`;
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': `Bearer ${token}` },
        body: JSON.stringify({ taskLabel: nameQuery, taskCat: 'health', taskNote: '', zip, searchQuery: nameQuery, skipBlurbs: true }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const { text } = await res.json();
      const parsed = parseProviders(text);
      setProviders(parsed);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if ((manualMode || nameSearchOnly) && status === 'idle') {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
          {nameSearchOnly ? 'Look up your provider to save their info' : 'Search for your provider by name'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            placeholder="e.g. Dr. Chen, Aspen Dental"
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') searchByName(); }}
            style={{
              flex: 1, padding: '9px 11px', borderRadius: 8, border: `1px solid ${C.cardBorder}`,
              fontSize: 13, fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={searchByName}
            disabled={!manualName.trim()}
            style={{
              padding: '9px 14px', background: manualName.trim() ? C.brand : '#D0C8C0',
              color: C.brandLight, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: manualName.trim() ? 'pointer' : 'default', fontFamily: 'DM Sans, sans-serif',
              flexShrink: 0,
            }}
          >
            Search
          </button>
        </div>
        {!nameSearchOnly && (
          <button
            onClick={() => { setManualMode(false); setManualName(''); }}
            style={{
              width: '100%', padding: '8px 0', background: 'none', border: 'none',
              fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              marginTop: 4,
            }}
          >
            Back to find providers
          </button>
        )}
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div style={{ marginTop: 8 }}>
        <button onClick={fetchProviders} style={{
          width: '100%', padding: '11px 14px', background: C.brand, color: C.brandLight,
          border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Find providers near you
        </button>
        <button
          onClick={() => setManualMode(true)}
          style={{
            width: '100%', padding: '8px 0', background: 'none', border: 'none',
            fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            marginTop: 4,
          }}
        >
          I already have one
        </button>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          {['#D62828','#F77F00','#06A77D','#F4C430'].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, animation: `mitzyPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        Searching for providers...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '12px 0', fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>
        Couldn't load providers right now.{' '}
        <button onClick={manualMode ? searchByName : fetchProviders} style={{ background: 'none', border: 'none', color: C.brand, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          Try again
        </button>
        {' · '}
        <button onClick={resetToIdle} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          Back
        </button>
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div style={{ padding: '12px 0', fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>
        No providers found nearby.{' '}
        <button onClick={resetToIdle} style={{ background: 'none', border: 'none', color: C.brand, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          Try a different search
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      {providers.slice(0, 4).map((p, i) => (
        <MiniProviderCard key={i} provider={p} onSelect={() => { onSaveProvider(p); onSelect(p, providers); }} />
      ))}
      <button
        onClick={resetToIdle}
        style={{
          width: '100%', padding: '8px 0', background: 'none', border: 'none',
          fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          marginTop: 2,
        }}
      >
        Not what you're looking for? Try again
      </button>
    </div>
  );
}

function MiniProviderCard({ provider: p, onSelect }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${C.cardBorder}`, borderRadius: 10,
      padding: '11px 13px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontWeight: 700, color: C.ink, fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>{p.name}</div>
        {p.rating && (
          <div style={{ fontSize: 12, color: C.orange, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', flexShrink: 0, marginLeft: 8 }}>
            <svg width="10" height="10" viewBox="0 0 11 11" fill="#F77F00" style={{ verticalAlign: 'middle', marginRight: 2 }}>
              <polygon points="5.5,1 7,4.5 11,4.5 8,7 9,10.5 5.5,8.5 2,10.5 3,7 0,4.5 4,4.5" />
            </svg>
            {p.rating}
            {p.reviewCount > 0 && <span style={{ color: '#7A9490', fontWeight: 400, marginLeft: 4 }}>{p.reviewCount.toLocaleString()}</span>}
          </div>
        )}
      </div>
      {p.address && <div style={{ fontSize: 11, color: '#7A9490', marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>{p.address}</div>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6, fontSize: 12, color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>
        {p.hours && <span>{p.hours}</span>}
        {p.phone && <span>{p.phone}</span>}
      </div>
      <button onClick={onSelect} style={{
        width: '100%', padding: '9px 0', background: C.brandLight, color: C.brand,
        border: `1.5px solid ${C.brand}`, borderRadius: 8, fontSize: 12, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
      }}>
        Use this provider
      </button>
    </div>
  );
}

// ─── Decision card ──────────────────────────────────────────────────────────
function DecisionCard({ step, index, isDone, isActive, isFuture, chosenPath, onChoose, onUndo }) {
  const circleSize = 26;

  return (
    <div style={{
      background: isDone ? '#F8F6F0' : '#fff',
      border: `1px solid ${isActive ? C.brand : C.cardBorder}`,
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 8,
      opacity: isFuture ? 0.6 : 1,
      transition: 'opacity 0.2s, border-color 0.2s',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {isDone ? (
          <button
            onClick={onUndo}
            style={{
              width: circleSize, height: circleSize, borderRadius: '50%', flexShrink: 0,
              background: C.green, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
            }}
            aria-label="Undo step"
          >
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <polyline points="4,9 7.5,12.5 14,5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div style={{
            width: circleSize, height: circleSize, borderRadius: '50%', flexShrink: 0,
            background: isActive ? C.brandLight : '#F0EDE4',
            border: `2px solid ${isActive ? C.brand : '#D0C8C0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? C.brand : '#9A9080', fontFamily: 'DM Sans, sans-serif' }}>
              {index + 1}
            </span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
            color: isDone ? C.muted : C.ink,
            textDecoration: isDone ? 'line-through' : 'none',
            marginBottom: 3,
          }}>
            {step.label}
          </div>

          <div style={{
            fontSize: 13, color: isDone ? '#8A9A90' : C.muted, lineHeight: 1.55,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {step.body}
          </div>

          {isDone && chosenPath && (
            <div style={{
              marginTop: 6, display: 'inline-block', padding: '4px 10px',
              background: C.brandLight, borderRadius: 6, fontSize: 12,
              fontWeight: 600, color: C.brand, fontFamily: 'DM Sans, sans-serif',
            }}>
              {step.options.find(o => o.value === chosenPath)?.label}
            </div>
          )}

          {isActive && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {step.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onChoose(opt.value)}
                  style={{
                    width: '100%', padding: '12px 14px', background: '#fff',
                    border: `1.5px solid ${C.brand}`, borderRadius: 10, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.brand, fontFamily: 'DM Sans, sans-serif' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ step, index, isDone, isActive, isFuture, context, onComplete, onUndo, onSelectProvider, onSaveProvider, cachedResults, onChangeProvider }) {
  const resolvedBody = resolveStepVars(step.body, context);
  const resolvedPhone = resolveStepVars(step.phone, context);
  const resolvedScript = resolveStepVars(step.callScript, context);
  const resolvedLinkUrl = resolveStepVars(step.linkUrl, context);
  const [copied, setCopied] = useState(false);
  const [showingAlternates, setShowingAlternates] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const circleSize = 26;

  return (
    <div style={{
      background: isDone ? '#F8F6F0' : '#fff',
      border: `1px solid ${isActive ? C.brand : C.cardBorder}`,
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 8,
      opacity: isFuture ? 0.6 : 1,
      transition: 'opacity 0.2s, border-color 0.2s',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Circle / checkbox */}
        {isDone ? (
          <button
            onClick={onUndo}
            style={{
              width: circleSize, height: circleSize, borderRadius: '50%', flexShrink: 0,
              background: C.green, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
            }}
            aria-label="Undo step"
          >
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <polyline points="4,9 7.5,12.5 14,5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div style={{
            width: circleSize, height: circleSize, borderRadius: '50%', flexShrink: 0,
            background: isActive ? C.brandLight : '#F0EDE4',
            border: `2px solid ${isActive ? C.brand : '#D0C8C0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? C.brand : '#9A9080', fontFamily: 'DM Sans, sans-serif' }}>
              {index + 1}
            </span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Label */}
          <div style={{
            fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
            color: isDone ? C.muted : C.ink,
            textDecoration: isDone ? 'line-through' : 'none',
            marginBottom: 3,
          }}>
            {step.label}
          </div>

          {/* Body text */}
          <div style={{
            fontSize: 13, color: isDone ? '#8A9A90' : C.muted, lineHeight: 1.55,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {resolvedBody}
          </div>

          {/* Type-specific content (only for active step) */}
          {isActive && step.type === 'provider_search' && (
            <>
              <ProviderSearch
                query={step.providerSearchQuery || step.label}
                zip={context.zip}
                onSelect={(provider, results) => onSelectProvider(provider, results)}
                onSaveProvider={onSaveProvider}
                nameSearchOnly={!!step.nameSearchOnly}
              />
            </>
          )}

          {isActive && step.type === 'call' && resolvedPhone && !resolvedPhone.includes('{{') && (
            <div style={{ marginTop: 8 }}>
              <a href={`tel:${resolvedPhone}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', background: C.red, color: '#fff', borderRadius: 8,
                fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Call {resolvedPhone}
              </a>
              {context.provider?.hours && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>
                  Office hours: {context.provider.hours}
                </div>
              )}
            </div>
          )}

          {isActive && step.type === 'call' && resolvedScript && !resolvedScript.includes('{{') && (
            <div style={{
              marginTop: 8, padding: '10px 12px', background: '#FFF8ED',
              border: '1px solid #F4C430', borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: 5, fontFamily: 'DM Sans, sans-serif' }}>
                Say this
              </div>
              <div style={{ fontSize: 13, fontStyle: 'italic', color: C.ink, lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif' }}>
                "{resolvedScript}"
              </div>
              {context.insurance && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontFamily: 'DM Sans, sans-serif' }}>
                  If they ask, your insurance is <strong style={{ color: C.ink }}>{context.insurance}</strong>
                </div>
              )}
              <button
                onClick={() => handleCopy(resolvedScript)}
                style={{
                  marginTop: 6, background: 'none', border: '1px solid #EAE4DA', borderRadius: 6,
                  padding: '5px 10px', fontSize: 11, color: C.muted, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {copied ? 'Copied!' : 'Copy script'}
              </button>
            </div>
          )}

          {/* Try a different provider — on call steps with cached results */}
          {isActive && step.type === 'call' && step.dependsOnProvider && cachedResults?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => setShowingAlternates(!showingAlternates)}
                style={{
                  background: 'none', border: 'none', fontSize: 12, color: C.muted,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0,
                }}
              >
                {showingAlternates ? 'Hide other options' : "Didn't work out? Try a different provider"}
              </button>
              {showingAlternates && (
                <div style={{ marginTop: 8 }}>
                  {cachedResults.filter(r => r.name !== context.provider?.name).map((p, i) => (
                    <MiniProviderCard key={i} provider={p} onSelect={() => onChangeProvider(p)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {isActive && step.type === 'link' && resolvedLinkUrl && (
            <a href={resolvedLinkUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
              padding: '9px 14px', background: C.brandLight, color: C.brand,
              border: `1.5px solid ${C.brand}`, borderRadius: 8,
              fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
            }}>
              {step.linkLabel || 'Open link'}
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M3 11L11 3M11 3H5M11 3v6" stroke={C.brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}

          {/* Complete button for active non-provider steps */}
          {isActive && step.type !== 'provider_search' && (
            <button
              onClick={onComplete}
              style={{
                marginTop: 10, padding: '8px 16px', background: C.brandLight, color: C.brand,
                border: `1.5px solid ${C.brand}`, borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GuidedSteps (main export) ────────────────────────────────────────────────
function InsurancePrompt({ onSave }) {
  const [value,  setValue]  = useState('');
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const [rect,   setRect]   = useState(null);
  const [saved,  setSaved]  = useState(false);
  const anchorRef = useRef(null);

  const filtered = query.trim()
    ? INSURANCE_PROVIDERS.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : INSURANCE_PROVIDERS;

  const select = (label) => { setValue(label); setQuery(''); setOpen(false); };
  const clear  = () => { setValue(''); setQuery(''); setOpen(false); };

  const openDropdown = () => {
    if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    setOpen(true);
  };

  const handleSave = () => {
    if (!value.trim()) return;
    onSave(value.trim());
    setSaved(true);
  };

  if (saved) return null;

  return (
    <div style={{ padding: '10px 12px', background: '#FFF8ED', border: '1px solid #F4C430', borderRadius: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
        What's your insurance? <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
        Mitzy will remind you of your plan name when you're on the phone so you don't have to dig for your card.
      </div>
      <div style={{ marginBottom: 8 }}>
        <div ref={anchorRef} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: '7px 10px', background: '#fff' }}>
          <input
            style={{ flex: 1, fontSize: 13, fontFamily: 'DM Sans, sans-serif', border: 'none', outline: 'none', background: 'transparent', color: C.ink }}
            placeholder={value || 'Search providers…'}
            value={query}
            onFocus={openDropdown}
            onChange={e => { setQuery(e.target.value); openDropdown(); }}
          />
          {value && !query && (
            <button onClick={clear} style={{ fontSize: 16, lineHeight: 1, border: 'none', background: 'none', cursor: 'pointer', color: '#9B9B9B', padding: '0 2px' }}>×</button>
          )}
        </div>
        {open && rect && (filtered.length > 0 || query.trim()) && (
          <div style={{ position: 'fixed', zIndex: 1000, top: rect.bottom + 4, left: rect.left, width: rect.width, background: '#fff', border: `1px solid ${C.cardBorder}`, borderRadius: 10, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
            {filtered.map(({ label }) => (
              <button
                key={label}
                onMouseDown={e => { e.preventDefault(); select(label); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', border: 'none', borderBottom: `1px solid ${C.cardBorder}`, cursor: 'pointer', background: label === value ? '#E8F5EE' : '#fff', color: label === value ? C.brand : C.ink, fontWeight: label === value ? 700 : 400 }}
              >
                {label}
              </button>
            ))}
            {query.trim() && !INSURANCE_PROVIDERS.some(p => p.label.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                onMouseDown={e => { e.preventDefault(); select(query.trim()); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', border: 'none', cursor: 'pointer', background: '#F0EDE4', color: C.brand, fontWeight: 700 }}
              >
                Add "{query.trim()}"
              </button>
            )}
          </div>
        )}
        {open && <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onMouseDown={() => setOpen(false)} />}
      </div>
      <button
        onClick={handleSave}
        disabled={!value.trim()}
        style={{ width: '100%', padding: '8px 0', background: value.trim() ? C.brand : '#D0C8C0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: value.trim() ? 'pointer' : 'default', fontFamily: 'DM Sans, sans-serif' }}
      >
        Save
      </button>
    </div>
  );
}

export const GuidedSteps = memo(function GuidedSteps({ steps, taskId, taskCat, stepProgress, onSetStepProgress }) {
  const { profile, providerHistory, saveProvider, updateProfile } = useProfileContext();

  const goodProviders = (providerHistory[taskId] || []).filter(p => p.vote === 'good');
  const savedProvider = goodProviders[goodProviders.length - 1] || null;

  const chosenPath = useMemo(() => {
    if (!stepProgress) return null;
    const decisionStep = steps.find(s => s.type === 'decision');
    return decisionStep ? stepProgress[decisionStep.key]?.choice ?? null : null;
  }, [stepProgress, steps]);

  const visibleSteps = useMemo(() => {
    return steps.filter(s => !s.path || s.path === chosenPath);
  }, [steps, chosenPath]);

  const selectedProvider = useMemo(() => {
    if (!stepProgress) return savedProvider || null;
    for (const step of visibleSteps) {
      const entry = stepProgress[step.key];
      if (entry?.provider) return entry.provider;
    }
    return savedProvider || null;
  }, [stepProgress, visibleSteps, savedProvider]);

  const context = useMemo(() => ({
    ...profile,
    provider: selectedProvider,
  }), [profile, selectedProvider]);

  const completedCount = visibleSteps.filter(s => stepProgress?.[s.key]?.done).length;
  const allDone = completedCount === visibleSteps.length;

  const handleComplete = (step) => {
    onSetStepProgress(step.key, { done: true, completedAt: new Date().toISOString() });
  };

  const handleUndo = (step) => {
    if (step.type === 'decision') {
      onSetStepProgress(step.key, { done: false, choice: null });
      const pathStepKeys = steps.filter(s => s.path).map(s => s.key);
      pathStepKeys.forEach(key => onSetStepProgress(key, { done: false }));
    } else {
      onSetStepProgress(step.key, { done: false });
    }
  };

  const handleDecision = (step, value) => {
    onSetStepProgress(step.key, { done: true, choice: value, completedAt: new Date().toISOString() });
  };

  const handleSelectProvider = (step, provider, results) => {
    onSetStepProgress(step.key, {
      done: true, completedAt: new Date().toISOString(),
      provider: { name: provider.name, phone: provider.phone, hours: provider.hours, address: provider.address, website: provider.website },
      results: results?.map(r => ({ name: r.name, phone: r.phone, hours: r.hours, address: r.address, website: r.website, rating: r.rating, reviewCount: r.reviewCount })),
    });
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '13px 15px', border: '1px solid #EAE4DA', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A6256', fontFamily: "'Righteous', cursive" }}>
          How to knock this out
        </div>
        {completedCount > 0 && !allDone && (
          <div style={{ fontSize: 11, color: C.green, fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
            {completedCount} of {visibleSteps.length} done
          </div>
        )}
        {allDone && (
          <div style={{ fontSize: 11, color: C.green, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
            All steps done!
          </div>
        )}
      </div>

      {/* Insurance prompt — only for health tasks with a call step */}
      {!profile?.insurance && taskCat === 'health' && visibleSteps.some(s => s.type === 'call') && (
        <InsurancePrompt onSave={(val) => updateProfile({ insurance: val })} />
      )}

      {/* Saved provider callout */}
      {savedProvider && !stepProgress && (
        <div style={{
          padding: '8px 11px', background: C.brandLight, borderRadius: 8,
          marginBottom: 10, fontSize: 12, color: C.brand, fontFamily: 'DM Sans, sans-serif',
        }}>
          <span style={{ fontWeight: 700 }}>Last used:</span> {savedProvider.name}
        </div>
      )}

      {visibleSteps.map((step, i) => {
        const isDone = !!stepProgress?.[step.key]?.done;
        const firstIncomplete = visibleSteps.findIndex(s => !stepProgress?.[s.key]?.done);
        const isActive = i === firstIncomplete;
        const isFuture = !isDone && !isActive;

        if (step.type === 'decision') {
          return (
            <DecisionCard
              key={step.key}
              step={step}
              index={i}
              isDone={isDone}
              isActive={isActive}
              isFuture={isFuture}
              chosenPath={chosenPath}
              onChoose={(value) => handleDecision(step, value)}
              onUndo={() => handleUndo(step)}
            />
          );
        }

        const providerStepEntry = step.dependsOnProvider
          ? visibleSteps.map(s => stepProgress?.[s.key]).find(e => e?.results)
          : null;

        return (
          <StepCard
            key={step.key}
            step={step}
            index={i}
            isDone={isDone}
            isActive={isActive}
            isFuture={isFuture}
            context={context}
            onComplete={() => handleComplete(step)}
            onUndo={() => handleUndo(step)}
            onSelectProvider={(provider, results) => handleSelectProvider(step, provider, results)}
            onSaveProvider={(provider) => saveProvider(taskId, provider)}
            cachedResults={providerStepEntry?.results}
            onChangeProvider={(newProvider) => {
              const providerStep = visibleSteps.find(s => s.type === 'provider_search');
              if (providerStep) {
                handleSelectProvider(providerStep, newProvider, providerStepEntry?.results);
                saveProvider(taskId, newProvider);
              }
            }}
          />
        );
      })}
    </div>
  );
});
