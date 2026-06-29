import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

// ─── Provider name search (live Google Places lookup, debounced) ───────────────
export function ProviderNameSearch({ value, onChange, zip, onSelectPlace }) {
  const [query, setQuery]     = useState(value || '');
  const [open, setOpen]       = useState(false);
  const [rect, setRect]       = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const anchorRef = useRef(null);
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    const q = query.trim();
    if (!open || q.length < 3 || !zip) { setResults([]); setLoading(false); setError(null); return; }
    setLoading(true);
    setError(null);
    timerRef.current = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { setError('Not signed in'); return; }
        const res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({ taskLabel: q, zip, skipBlurbs: true, maxResults: 5 }),
        });
        if (!res.ok) {
          setError(res.status === 429 ? 'Too many searches — wait a moment and try again' : `Search failed (${res.status})`);
          setResults([]);
          return;
        }
        const { text } = await res.json();
        setResults(JSON.parse(text || '[]'));
      } catch {
        setError('Search failed — check your connection');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timerRef.current);
  }, [query, zip, open]);

  const openDropdown = () => {
    if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const updateRect = () => { if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect()); };
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open]);

  const select = (place) => {
    setQuery(place.name);
    onChange(place.name);
    onSelectPlace?.(place);
    setOpen(false);
    inputRef.current?.blur();
  };

  const showDropdown = open && query.trim().length >= 3 && zip && rect;

  return (
    <div>
      <div ref={anchorRef} style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid #D4CFC6', borderRadius:10, padding:'7px 11px', background:'#FDFAF2' }}>
        <input
          ref={inputRef}
          style={{ flex:1, fontSize:14, fontFamily:'DM Sans, sans-serif', border:'none', outline:'none', background:'transparent', color:'#1C2B22' }}
          type="text"
          placeholder="e.g. Dr. Smith, Joe's Plumbing"
          value={query}
          onFocus={openDropdown}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); openDropdown(); }}
        />
      </div>
      {showDropdown && (
        <div style={{ position:'fixed', zIndex:1000, top: rect.bottom + 4, left: rect.left, width: rect.width, background:'#fff', border:'1px solid #D4CFC6', borderRadius:10, maxHeight:240, overflowY:'auto', boxShadow:'0 4px 12px rgba(0,0,0,0.12)' }}>
          {loading && <div style={{ padding:'10px 14px', fontSize:12, color:'#9B9B9B', fontFamily:'DM Sans, sans-serif' }}>Searching…</div>}
          {!loading && error && (
            <div style={{ padding:'10px 14px', fontSize:12, color:'#D62828', fontFamily:'DM Sans, sans-serif' }}>{error}</div>
          )}
          {!loading && !error && results.length === 0 && (
            <div style={{ padding:'10px 14px', fontSize:12, color:'#9B9B9B', fontFamily:'DM Sans, sans-serif' }}>No matches found — you can still enter the name manually.</div>
          )}
          {!loading && results.map((r, i) => (
            <button
              key={i}
              onMouseDown={e => { e.preventDefault(); select(r); }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 14px', border:'none', borderBottom:'1px solid #F5F0E8', cursor:'pointer', background:'#fff', fontFamily:'DM Sans, sans-serif' }}
            >
              <div style={{ fontSize:13, fontWeight:700, color:'#1C2B22' }}>{r.name}</div>
              {(r.address || r.phone) && <div style={{ fontSize:11, color:'#7A8A80', marginTop:2 }}>{[r.address, r.phone].filter(Boolean).join(' · ')}</div>}
            </button>
          ))}
        </div>
      )}
      {open && <div style={{ position:'fixed', inset:0, zIndex:999 }} onMouseDown={() => setOpen(false)} />}
      {!zip && <div style={{ fontSize:11, color:'#9B9B9B', marginTop:4, fontFamily:'DM Sans, sans-serif' }}>Add your zip code above to search real businesses near you.</div>}
    </div>
  );
}
