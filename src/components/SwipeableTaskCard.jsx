import { useRef, useState, useCallback } from "react";
import { TaskCard } from "./TaskCard";
import { SnoozeIcon, SNOOZE_BLUE } from "./SnoozeIcon";

const THRESHOLD = 80;
const SNAP_BACK_MS = 200;

export function SwipeableTaskCard({ task, onSnooze, ...cardProps }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isTracking = useRef(false);
  const directionLocked = useRef(false);
  const isHorizontal = useRef(false);
  const cardRef = useRef(null);
  const [offsetX, setOffsetX] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const pastThreshold = offsetX < -THRESHOLD;

  const onTouchStart = useCallback((e) => {
    if (transitioning) return;
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentX.current = 0;
    isTracking.current = true;
    directionLocked.current = false;
    isHorizontal.current = false;
  }, [transitioning]);

  const onTouchMove = useCallback((e) => {
    if (!isTracking.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    if (!directionLocked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      directionLocked.current = true;
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      if (!isHorizontal.current) {
        isTracking.current = false;
        return;
      }
    }

    if (!isHorizontal.current) return;

    e.preventDefault();
    const clamped = Math.min(0, dx);
    currentX.current = clamped;
    setOffsetX(clamped);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isTracking.current && !isHorizontal.current) return;
    isTracking.current = false;

    if (currentX.current < -THRESHOLD) {
      onSnooze(task);
    }

    setTransitioning(true);
    setOffsetX(0);
    setTimeout(() => setTransitioning(false), SNAP_BACK_MS);
  }, [task, onSnooze]);

  const stripOpacity = Math.min(1, Math.abs(offsetX) / THRESHOLD);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, marginBottom: 7 }}>
      {/* Reveal strip behind the card */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: THRESHOLD + 20,
        background: `rgba(107, 141, 214, ${0.12 + stripOpacity * 0.08})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        opacity: stripOpacity,
        borderRadius: '0 14px 14px 0',
      }}>
        <SnoozeIcon size={22} color={pastThreshold ? SNOOZE_BLUE : '#9BAFC4'} />
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: pastThreshold ? SNOOZE_BLUE : '#9BAFC4',
          fontFamily: 'DM Sans, sans-serif',
          letterSpacing: '0.03em',
        }}>
          Snooze
        </span>
      </div>

      {/* Card layer */}
      <div
        ref={cardRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: transitioning ? `transform ${SNAP_BACK_MS}ms ease-out` : 'none',
          position: 'relative',
          zIndex: 1,
          touchAction: 'pan-y',
        }}
      >
        <TaskCard task={task} {...cardProps} onSnooze={onSnooze} noMargin />
      </div>
    </div>
  );
}
