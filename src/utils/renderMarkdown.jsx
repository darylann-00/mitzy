import React from 'react';

// Only http(s) is allowed through. Guidance strings are ours, not user input,
// but a link renderer that will happily emit `javascript:` is a footgun left
// lying around for whoever adds AI-written guidance later.
const SAFE_HREF = /^https?:\/\//i;

// Renders inline **bold**, *italic*, and [label](url) within a text string.
// The split keeps one regex per pass so a link label can itself contain bold.
function renderInline(text) {
  return text.split(/(\[[^\]]+\]\([^)\s]+\))/).flatMap((chunk, ci) => {
    const link = chunk.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link && SAFE_HREF.test(link[2])) {
      return (
        <a
          key={`l${ci}`}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1A5C3A', textDecoration: 'underline', textDecorationColor: '#9BC4AC' }}
        >
          {renderEmphasis(link[1], `l${ci}`)}
        </a>
      );
    }
    return renderEmphasis(chunk, `t${ci}`);
  });
}

function renderEmphasis(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// Parses guidance markdown (## headers, - bullets, numbered lists) into blocks
export function parseGuidanceBlocks(guidance) {
  if (!guidance) return null;
  // Split inline numbered steps ("1. foo. 2. bar.") onto separate lines
  const normalized = guidance.replace(/(?<=[.!?)])\s+(?=\d+\.\s)/g, '\n');
  return normalized.split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed) return acc;
    if (trimmed.startsWith('## ')) {
      acc.push({ type: 'heading', text: trimmed.slice(3) });
    } else if (/^[-–•]\s+/.test(trimmed)) {
      acc.push({ type: 'bullet', text: trimmed.replace(/^[-–•]\s+/, '') });
    } else if (/^\d+\.\s+/.test(trimmed)) {
      acc.push({ type: 'bullet', text: trimmed.replace(/^\d+\.\s+/, '') });
    } else {
      acc.push({ type: 'text', text: trimmed });
    }
    return acc;
  }, []);
}

// Renders parsed guidance blocks as styled JSX
export function renderGuidanceBlocks(blocks) {
  if (!blocks) return null;
  let bulletIndex = 0;
  return blocks.map((block, i) => {
    if (block.type === 'heading') {
      bulletIndex = 0;
      return (
        <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#4A6256', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', marginTop: i > 0 ? 10 : 0, marginBottom: 6 }}>
          {renderInline(block.text)}
        </div>
      );
    }
    if (block.type === 'bullet') {
      bulletIndex++;
      const idx = bulletIndex;
      return (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E8F0EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#1A5C3A', fontFamily: 'DM Sans, sans-serif' }}>
            {idx}
          </div>
          <div style={{ fontSize: 13, color: '#1C2B22', lineHeight: 1.5, flex: 1, fontFamily: 'DM Sans, sans-serif' }}>
            {renderInline(block.text)}
          </div>
        </div>
      );
    }
    return (
      <div key={i} style={{ fontSize: 13, color: '#1C2B22', lineHeight: 1.5, fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>
        {renderInline(block.text)}
      </div>
    );
  });
}
