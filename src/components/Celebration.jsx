import { useEffect } from "react";
import { C, RAD_WORDS } from "../data/constants";

export function Celebration({ onDone }) {
  const word    = RAD_WORDS[Math.floor(Math.random() * RAD_WORDS.length)];
  const cols    = [C.coral, C.yellow, C.mint, C.sky, C.lav, C.orange];
  const outline = cols[Math.floor(Math.random() * cols.length)];
  const pieces  = Array.from({ length: 56 }, (_, i) => ({
    left:  `${Math.random() * 100}%`,
    color: cols[i % cols.length],
    delay: `${Math.random() * 0.35}s`,
    dur:   `${0.9 + Math.random() * 0.8}s`,
    size:  `${7 + Math.random() * 13}px`,
    rot:   `${Math.random() * 360}deg`,
  }));

  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 8888, overflow: "hidden" }}>
        {pieces.map((p, i) => (
          <div
            key={i}
            style={{
              position:     "absolute",
              top:          "-10px",
              left:         p.left,
              width:        p.size,
              height:       p.size,
              background:   p.color,
              borderRadius: Math.random() > 0.45 ? "50%" : "6px",
              transform:    `rotate(${p.rot})`,
              animation:    `cf ${p.dur} ${p.delay} ease-in forwards`,
            }}
          />
        ))}
        <div className="radt" style={{ top: "26%", left: "50%", color: C.coral, WebkitTextStroke: `10px ${outline}` }}>
          {word}!!!
        </div>
      </div>
      <div className="kitty">~(=^..^)</div>
    </>
  );
}
