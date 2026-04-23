import { useState, useEffect, useMemo, memo } from "react";
import { saveS, ASSIST_CACHE_PREFIX, ASSIST_CACHE_TTL } from "../utils/storage";
import { buildAssistPrompt } from "../utils/assistPrompt";
import { useProfileContext } from "../contexts/ProfileContext";

// ─── Pulsing dot loader ────────────────────────────────────────────────────────
function PulseLoader({ label }) {
  const dots = ['#D62828', '#F77F00', '#06A77D', '#F4C430'];
  return (
    <div style={{ textAlign:'center', padding:'48px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:18 }}>
        {dots.map((color, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: color,
              animation: `mitzyPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize:13, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>{label}</div>
    </div>
  );
}

// ─── Render inline markdown (bold + auto-linked URLs) ─────────────────────────
function inlineMarkdown(text) {
  if (!text) return '';
  // Escape HTML tags first to block injection from Claude output
  const escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s&<>"]+)/g, (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#1A5C3A;text-decoration:underline">${url}</a>`
    );
}

// Keep old name as alias so blurb rendering still works
const boldMarkdown = inlineMarkdown;

// ─── Render markdown blocks (headers, bullets, numbered lists, tables, hr) ────
function MarkdownBlock({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { i++; continue; }

    // Horizontal rule --- or ===
    if (/^[-=]{3,}\s*$/.test(line)) {
      elements.push(<hr key={i} style={{ border:'none', borderTop:'1px solid #EAE4DA', margin:'12px 0' }} />);
      i++; continue;
    }

    // ## Heading
    if (/^#{1,3}\s/.test(line)) {
      const content = line.replace(/^#{1,3}\s+/, '');
      elements.push(
        <div key={i} style={{ fontWeight:700, color:'#1C2B22', fontSize:14, fontFamily:'DM Sans, sans-serif', marginTop:14, marginBottom:4 }}
          dangerouslySetInnerHTML={{ __html: boldMarkdown(content) }} />
      );
      i++; continue;
    }

    // Table — collect header + separator + rows
    if (/^\|.+\|/.test(line) && i + 1 < lines.length && /^\|[-| :]+\|/.test(lines[i + 1])) {
      const headers = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(h => h.trim());
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && /^\|.+\|/.test(lines[i])) {
        rows.push(lines[i].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim()));
        i++;
      }
      elements.push(
        <div key={`table-${i}`} style={{ overflowX:'auto', marginBottom:10 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:'DM Sans, sans-serif' }}>
            <thead>
              <tr>
                {headers.map((h, j) => (
                  <th key={j} style={{ textAlign:'left', padding:'6px 8px', borderBottom:'2px solid #EAE4DA', color:'#1C2B22', fontWeight:700, whiteSpace:'nowrap' }}
                    dangerouslySetInnerHTML={{ __html: boldMarkdown(h) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom:'1px solid #F0EDE4' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding:'6px 8px', color:'#4A6256', verticalAlign:'top' }}
                      dangerouslySetInnerHTML={{ __html: boldMarkdown(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet list — collect consecutive bullet lines (hyphen, em-dash, en-dash, asterisk)
    if (/^[\s]*[-–—*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\s]*[-–—*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*[-–—*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin:'4px 0 8px 0', paddingLeft:18 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize:13, color:'#1C2B22', lineHeight:1.7, fontFamily:'DM Sans, sans-serif', marginBottom:2 }}
              dangerouslySetInnerHTML={{ __html: boldMarkdown(item) }} />
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list — collect items and any dash sub-bullets that follow each
    if (/^\s*\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        i++;
        const subItems = [];
        while (i < lines.length && (lines[i].trim() === '' || /^\s*[-–—*]\s/.test(lines[i]))) {
          if (lines[i].trim() !== '') subItems.push(lines[i].replace(/^\s*[-–—*]\s+/, ''));
          i++;
        }
        items.push({ text: itemText, subItems });
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin:'4px 0 8px 0', paddingLeft:20 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize:13, color:'#1C2B22', lineHeight:1.7, fontFamily:'DM Sans, sans-serif', marginBottom: item.subItems.length ? 6 : 2 }}>
              <span dangerouslySetInnerHTML={{ __html: boldMarkdown(item.text) }} />
              {item.subItems.length > 0 && (
                <ul style={{ margin:'2px 0 0 0', paddingLeft:16 }}>
                  {item.subItems.map((sub, k) => (
                    <li key={k} style={{ fontSize:12, color:'#4A6256', lineHeight:1.6, fontFamily:'DM Sans, sans-serif', marginBottom:1 }}
                      dangerouslySetInnerHTML={{ __html: boldMarkdown(sub) }} />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ fontSize:13, color:'#1C2B22', lineHeight:1.7, fontFamily:'DM Sans, sans-serif', margin:'0 0 14px 0' }}
        dangerouslySetInnerHTML={{ __html: boldMarkdown(line) }} />
    );
    i++;
  }

  return <div>{elements}</div>;
}

// ─── Company card (national services — no address/phone/hours) ────────────────
function CompanyCard({ company: c }) {
  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #EAE4DA',
      borderRadius: 14,
      padding: '14px 15px',
      marginBottom: 10,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: c.blurb ? 6 : 0 }}>
        <div style={{ fontWeight:700, color:'#1C2B22', fontSize:15, fontFamily:'DM Sans, sans-serif' }}>{c.name}</div>
        {c.website && (
          <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ flexShrink:0, marginLeft:10, color:'#1A5C3A', display:'flex', alignItems:'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3h5v5" /><path d="M15 3L8 10" /><path d="M13 11v4H3V5h4" />
            </svg>
          </a>
        )}
      </div>
      {c.blurb && <div style={{ fontSize:13, color:'#4A6256', lineHeight:1.5, fontFamily:'DM Sans, sans-serif' }} dangerouslySetInnerHTML={{ __html: boldMarkdown(c.blurb) }} />}
    </div>
  );
}

// ─── Provider card ─────────────────────────────────────────────────────────────
function ProviderCard({ provider: p, isSaved, onSave }) {
  const [saving, setSaving] = useState(false);
  const [vote, setVote]     = useState(null);
  const [note, setNote]     = useState('');
  const [saved, setSaved]   = useState(false);

  const handleSave = () => {
    onSave(p, vote, note);
    setSaved(true);
    setSaving(false);
  };

  return (
    <div style={{
      background: isSaved ? '#E8F5EE' : '#fff',
      border: `1.5px solid ${isSaved ? '#1A5C3A' : '#EAE4DA'}`,
      borderRadius: 14,
      padding: '14px 15px',
      marginBottom: 10,
    }}>
      {isSaved && (
        <div style={{ fontSize:10, fontWeight:700, color:'#1A5C3A', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Sans, sans-serif' }}>
          Last used
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div style={{ fontWeight:700, color:'#1C2B22', fontSize:15, fontFamily:'DM Sans, sans-serif' }}>{p.name}</div>
        {p.rating && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', flexShrink:0, marginLeft:8 }}>
            <div style={{ fontSize:12, color:'#F77F00', fontWeight:700, fontFamily:'DM Sans, sans-serif' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="#F77F00" style={{ verticalAlign:'middle', marginRight:3 }}>
                <polygon points="5.5,1 7,4.5 11,4.5 8,7 9,10.5 5.5,8.5 2,10.5 3,7 0,4.5 4,4.5" />
              </svg>
              {p.rating}
            </div>
            {p.reviewCount > 0 && <div style={{ fontSize:11, color:'#7A9490', fontFamily:'DM Sans, sans-serif', marginTop:2 }}>{p.reviewCount.toLocaleString()} reviews</div>}
          </div>
        )}
      </div>
      {p.blurb && <div style={{ fontSize:13, color:'#4A6256', marginBottom:8, lineHeight:1.5, fontFamily:'DM Sans, sans-serif' }} dangerouslySetInnerHTML={{ __html: boldMarkdown(p.blurb) }} />}
      {isSaved && p.notes && <div style={{ fontSize:12, color:'#4A6256', fontStyle:'italic', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>{p.notes}</div>}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
        {p.priceRange && <span style={{ fontSize:12, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>{p.priceRange}</span>}
        {p.hours && <span style={{ fontSize:12, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>{p.hours}</span>}
      </div>
      {p.address && (
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer" style={{ display:'block', fontSize:11, color:'#7A9490', marginBottom:8, fontFamily:'DM Sans, sans-serif', textDecoration:'underline', textDecorationColor:'#C8D8D0' }}>
          {p.address}
        </a>
      )}

      <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
        {p.phone && (
          <a href={`tel:${p.phone}`} style={{ padding:'7px 12px', background:'#D62828', color:'#fff', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:'DM Sans, sans-serif' }}>
            Call
          </a>
        )}
        {p.hasOnlineBooking && p.bookingUrl && (
          <a href={p.bookingUrl} target="_blank" rel="noopener noreferrer" style={{ padding:'7px 12px', background:'#06A77D', color:'#fff', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:'DM Sans, sans-serif' }}>
            Book online
          </a>
        )}
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ padding:'7px 12px', background:'#F0EDE4', color:'#1C2B22', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:'DM Sans, sans-serif' }}>
            Website
          </a>
        )}
        {!isSaved && !saved && (
          <button
            onClick={() => setSaving(x => !x)}
            style={{ padding:'7px 12px', background:saving ? '#E8F5EE' : '#F0EDE4', color:saving ? '#1A5C3A' : '#4A6256', border:'1.5px solid #C8E8D4', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
          >
            Save this one
          </button>
        )}
        {saved && <span style={{ fontSize:12, fontWeight:700, color:'#06A77D', padding:'7px 0', fontFamily:'DM Sans, sans-serif' }}>Saved</span>}
      </div>

      {/* Inline save flow */}
      {saving && !saved && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #EAE4DA' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#1C2B22', marginBottom:8, fontFamily:'DM Sans, sans-serif' }}>How was it?</div>
          <div style={{ display:'flex', gap:7, marginBottom:8 }}>
            <button
              onClick={() => setVote('good')}
              style={{ flex:1, borderRadius:9, padding:'8px 0', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif', border:'1.5px solid #C8E8D4', background: vote==='good' ? '#1A5C3A' : '#E8F5EE', color: vote==='good' ? '#E8F5EE' : '#1A5C3A' }}
            >
              Use again
            </button>
            <button
              onClick={() => setVote('bad')}
              style={{ flex:1, borderRadius:9, padding:'8px 0', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans, sans-serif', border:'1.5px solid #F5C4C4', background: vote==='bad' ? '#D62828' : '#FDE8E8', color: vote==='bad' ? '#fff' : '#D62828' }}
            >
              Would avoid
            </button>
          </div>
          <input
            placeholder="Any notes? (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ marginBottom:8 }}
          />
          <button
            onClick={handleSave}
            disabled={!vote}
            style={{ width:'100%', padding:'10px', fontSize:13, fontWeight:700, cursor: vote ? 'pointer' : 'default', border:'none', borderRadius:9, background: vote ? '#1A5C3A' : '#D0C8C0', color:'#E8F5EE', fontFamily:'DM Sans, sans-serif' }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, marginTop:4 }}>
      <span style={{ fontFamily:"'Righteous', cursive", fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4A6256' }}>
        {label}
      </span>
      <div style={{ flex:1, height:1, background:'#EAE4DA' }} />
    </div>
  );
}

// ─── Parse providers JSON from result text ────────────────────────────────────
function parseProviders(text) {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return null;
}

// ─── AssistPanel ───────────────────────────────────────────────────────────────
export const AssistPanel = memo(function AssistPanel({ task, onClose }) {
  const { profile, providerHistory, saveProvider } = useProfileContext();
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [cached, setCached] = useState(null);

  const cacheKey = `${ASSIST_CACHE_PREFIX}-${task.id}`;

  const parsedProviders = useMemo(() => {
    if (task.assistType !== 'providers' || !result) return null;
    return parseProviders(result);
  }, [task.assistType, result]);

  const parsedGuidanceCompanies = useMemo(() => {
    if (task.assistType !== 'guidance_companies' || !result) return null;
    try {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { guidance: parsed.guidance ?? result, companies: parsed.companies ?? [] };
      }
    } catch {}
    return { guidance: result, companies: [] };
  }, [task.assistType, result]);

  const loadCache = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.ts < ASSIST_CACHE_TTL) return parsed;
      }
    } catch {}
    return null;
  };

  const saveCache = (data) => {
    try { saveS(cacheKey, { data, ts: Date.now() }); } catch {}
  };

  const fetchResult = async (force = false) => {
    if (!force) {
      const hit = loadCache();
      if (hit) { setCached(hit); setResult(hit.data); setStatus('done'); return; }
    }
    setStatus('loading');
    try {
      let text;
      if (task.assistType === 'providers') {
        const res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            taskLabel:   task.label,
            taskCat:     task.cat,
            taskNote:    task.note,
            zip:         profile.zip,
            searchQuery: task.searchQuery,
          }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        ({ text } = await res.json());
      } else {
        const prompt = buildAssistPrompt(task, profile);
        const res = await fetch('/api/assist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        ({ text } = await res.json());
      }
      saveCache(text);
      setResult(text);
      setStatus('done');
      setCached({ data: text, ts: Date.now() });
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => { fetchResult(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cacheAgeHours = cached ? Math.floor((Date.now() - cached.ts) / (1000 * 60 * 60)) : null;
  const savedProvider = providerHistory[task.id];

  const handleSave = (provider, vote, notes) => {
    saveProvider(task.id, { ...provider, vote, notes });
  };

  const getLoadingLabel = () => {
    if (task.assistType === 'providers') return `Finding ${task.cat} services near you...`;
    if (task.assistType === 'script')    return 'Drafting your script...';
    if (task.assistType === 'deadline')  return 'Looking up key dates...';
    return 'Mitzy is looking this up...';
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,30,20,0.75)', zIndex:500, display:'flex', flexDirection:'column' }}>
      {/* Green header */}
      <div style={{ background:'#1A5C3A', padding:'18px 18px 16px', position:'relative', overflow:'hidden', flexShrink:0 }}>
        <div style={{ position:'absolute', width:50, height:50, borderRadius:'50%', background:'#0F3D27', top:-14, right:-12 }} />
        <div style={{ position:'absolute', width:22, height:22, borderRadius:'50%', background:'#06A77D', top:8, right:22 }} />
        <div style={{ position:'absolute', width:10, height:10, background:'#F77F00', transform:'rotate(45deg)', bottom:8, right:16 }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#D62828' }} />
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#F77F00' }} />
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#06A77D' }} />
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#F4C430' }} />
            </div>
            <span style={{ fontFamily:"'Righteous', cursive", fontSize:20, color:'#E8F5EE' }}>mitzy assist</span>
          </div>
          <button
            onClick={onClose}
            style={{ width:32, height:32, borderRadius:8, background:'#0F3D27', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#B8DCC8', fontSize:18 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="3" y1="3" x2="11" y2="11" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" />
              <line x1="11" y1="3" x2="3" y2="11" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize:12, color:'#7DD8B0', marginTop:6, fontFamily:'DM Sans, sans-serif', position:'relative' }}>
          {task.label}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', background:'#FDFAF2' }}>
        <div style={{ padding:'16px 18px 32px', maxWidth:640, margin:'0 auto' }}>

          {/* Cache info */}
          {cacheAgeHours !== null && status === 'done' && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, padding:'8px 12px', background:'#F0EDE4', borderRadius:10 }}>
              <div style={{ fontSize:11, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>
                {cacheAgeHours < 1 ? 'Just fetched' : `Fetched ${cacheAgeHours}h ago`}
              </div>
              <button
                onClick={() => fetchResult(true)}
                style={{ fontSize:11, fontWeight:700, background:'#E8F0EC', color:'#1A5C3A', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                Refresh
              </button>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && <PulseLoader label={getLoadingLabel()} />}

          {/* Error */}
          {status === 'error' && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:14, color:'#4A6256', marginBottom:16, fontFamily:'DM Sans, sans-serif' }}>Something went wrong. Try again?</div>
              <button
                onClick={() => fetchResult(true)}
                style={{ fontSize:13, fontWeight:700, background:'#D62828', color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Done — providers */}
          {status === 'done' && task.assistType === 'providers' && (
            !parsedProviders?.length
              ? <div style={{ fontSize:14, lineHeight:1.8, color:'#1C2B22', whiteSpace:'pre-wrap', fontFamily:'DM Sans, sans-serif' }}>{result}</div>
              : <>
                  {savedProvider && (
                    <>
                      <SectionLabel label={`${task.label} — saved provider`} />
                      <ProviderCard provider={savedProvider} isSaved onSave={handleSave} />
                    </>
                  )}
                  <SectionLabel label={savedProvider ? 'Other options nearby' : 'Services near you'} />
                  {parsedProviders.map((p, i) => (
                    <ProviderCard key={i} provider={p} isSaved={false} onSave={handleSave} />
                  ))}
                </>
          )}

          {/* Done — script */}
          {status === 'done' && task.assistType === 'script' && (
            <>
              <div style={{
                background:'#fff', borderRadius:14, padding:'14px 16px',
                borderLeft:'4px solid #1A5C3A', marginBottom:12,
                boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize:13, color:'#1C2B22', lineHeight:1.7, fontStyle:'italic', fontFamily:'DM Sans, sans-serif', whiteSpace:'pre-wrap' }}>{result}</div>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(result)}
                style={{ width:'100%', padding:'11px', fontSize:13, fontWeight:700, background:'#E8F0EC', color:'#1A5C3A', border:'none', borderRadius:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}
              >
                Copy script
              </button>
            </>
          )}

          {/* Done — deadline or guidance */}
          {status === 'done' && (task.assistType === 'deadline' || task.assistType === 'guidance' || !task.assistType) && (
            <MarkdownBlock text={result} />
          )}

          {/* Done — guidance + companies */}
          {status === 'done' && task.assistType === 'guidance_companies' && parsedGuidanceCompanies && (
            <>
              <MarkdownBlock text={parsedGuidanceCompanies.guidance} />
              {parsedGuidanceCompanies.companies.length > 0 && (
                <>
                  <SectionLabel label="Top options" />
                  {parsedGuidanceCompanies.companies.map((c, i) => <CompanyCard key={i} company={c} />)}
                </>
              )}
            </>
          )}

        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes mitzyPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1); }
        }
      `}</style>
    </div>
  );
});
