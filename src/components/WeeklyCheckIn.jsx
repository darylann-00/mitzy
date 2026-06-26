import { useState, useEffect, useRef } from "react";
import { C, CAT_META } from "../data/constants";
import { useTaskContext } from "../contexts/TaskContext";
import { useProfileContext } from "../contexts/ProfileContext";
import { supabase } from "../lib/supabase";

const LOADING_MESSAGES = [
  "Reading your week…",
  "Matching tasks…",
  "Filling in the gaps…",
];

function PulseLoader({ messages }) {
  const [idx, setIdx] = useState(0);
  const dots = ['#D62828', '#F77F00', '#06A77D', '#F4C430'];
  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % messages.length), 2500);
    return () => clearInterval(id);
  }, [messages.length]);
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
        {dots.map((color, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%', background: color,
            animation: `mitzyPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>{messages[idx]}</div>
    </div>
  );
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function CategoryDot({ cat }) {
  const color = CAT_META[cat]?.color || C.muted;
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

function getTimeEstimate(task, taskState) {
  const entry = taskState[task.id];
  if (task.steps?.length && entry?.stepProgress) {
    const nextStep = task.steps.find(s => !entry.stepProgress[s.key]);
    if (nextStep) {
      return { text: task.timeToComplete, nextStep: nextStep.label };
    }
  }
  return task.timeToComplete ? { text: task.timeToComplete } : null;
}

function TimeChip({ estimate }) {
  if (!estimate) return null;
  return (
    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 3 }}>
      <span style={{ opacity: 0.8 }}>~{estimate.text}</span>
      {estimate.nextStep && (
        <span style={{ fontStyle: 'italic' }}> · next: {estimate.nextStep}</span>
      )}
    </div>
  );
}

function ToggleCard({ selected, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: selected ? C.card : C.surface, borderRadius: 10,
        border: `1px solid ${selected ? C.brand : C.cardBorder}`,
        marginBottom: 6, cursor: 'pointer',
        opacity: selected ? 1 : 0.7,
        transition: 'all 0.15s',
      }}
    >
      {children}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        background: selected ? C.brand : 'transparent',
        border: `2px solid ${selected ? C.brand : C.cardBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

export function WeeklyCheckIn({ onClose }) {
  const {
    activeTasks, scoredDue, taskState, getStatus,
    savePlan, confirmPlan, weekStart,
  } = useTaskContext();
  const { customTasks } = useProfileContext();

  const [step, setStep] = useState('input');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState(null);

  // Custom tasks coming up this week
  const [customDueTasks] = useState(() => {
    const customIds = new Set(customTasks.map(t => t.id));
    return scoredDue.filter(t => {
      if (!customIds.has(t.id)) return false;
      const s = getStatus(t);
      return s === 'due' || s === 'coming-up' || s === 'needed' || s === 'confirm';
    });
  });

  // Structured/built-in priority tasks
  const [suggestedTasks] = useState(() => {
    const customIds = new Set(customTasks.map(t => t.id));
    return scoredDue.filter(t => {
      if (customIds.has(t.id)) return false;
      const s = getStatus(t);
      return s === 'due' || s === 'coming-up' || s === 'needed' || s === 'confirm';
    }).slice(0, 5);
  });

  // Review screen state — unified plan items
  const [planItems, setPlanItems] = useState(new Set());
  const [scheduledDates, setScheduledDates] = useState({});
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);

  // API response state
  const [matches, setMatches] = useState([]);
  const [newSuggestions, setNewSuggestions] = useState([]);
  const [gapFill, setGapFill] = useState([]);
  const [dismissedNewSuggestions, setDismissedNewSuggestions] = useState(new Set());

  const abortRef = useRef(null);

  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const taskMap = new Map(activeTasks.map(t => [t.id, t]));

  const handleSubmit = async () => {
    setLoading(true);
    setErrorKind(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setErrorKind('auth'); setLoading(false); return; }

      const backlogTasks = scoredDue
        .slice(0, 30)
        .map(t => ({ id: t.id, label: t.label, category: t.cat }));

      const res = await fetch('/api/weekly-checkin', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userInput: userInput.trim(),
          tasks: activeTasks.slice(0, 200).map(t => ({ id: t.id, label: t.label, category: t.cat })),
          autoDueTasks: customDueTasks.map(t => ({ id: t.id, label: t.label })),
          capacity: 'normal',
          weekStart,
          backlogTasks,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 429) setErrorKind('rate_limit');
        else setErrorKind('general');
        setLoading(false);
        return;
      }

      const data = await res.json();

      const apiMatches = data.matches || [];
      const apiGapFill = data.gapFill || [];
      setMatches(apiMatches);
      setNewSuggestions(data.newTaskSuggestions || []);
      setGapFill(apiGapFill);

      // Build initial plan: custom tasks + matched tasks (all pre-selected)
      const initialPlan = new Set(customDueTasks.map(t => t.id));
      const dates = {};
      for (const t of customDueTasks) {
        if (taskState[t.id]?.scheduledDate) dates[t.id] = taskState[t.id].scheduledDate;
      }
      for (const m of apiMatches) {
        initialPlan.add(m.taskId);
        if (m.scheduledDate) dates[m.taskId] = m.scheduledDate;
      }

      setPlanItems(initialPlan);
      setScheduledDates(dates);
      setStep('review');
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (!navigator.onLine) setErrorKind('offline');
      else setErrorKind('general');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToReview = () => {
    const initialPlan = new Set(customDueTasks.map(t => t.id));
    const dates = {};
    for (const t of customDueTasks) {
      if (taskState[t.id]?.scheduledDate) dates[t.id] = taskState[t.id].scheduledDate;
    }
    setPlanItems(initialPlan);
    setScheduledDates(dates);
    setStep('review');
  };

  const togglePlanItem = (id) => {
    setPlanItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    const taskIds = [...planItems];
    await savePlan(taskIds, scheduledDates, userInput);
    await confirmPlan();
    onClose();
  };

  const ERROR_MESSAGES = {
    offline: "You're offline — try again when you have a connection.",
    rate_limit: "Too many requests. Give it a few minutes.",
    auth: "Session expired. Close and try again.",
    general: "Something went wrong. Try again?",
  };

  // ─── Screen 1: What's on your plate + brain dump ─────────────────────────
  if (step === 'input') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: C.bg, overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: C.brand, padding: '22px 22px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: "'Righteous', cursive", fontSize: 22, color: C.brandLight,
              marginBottom: 4,
            }}>
              Weekly check-in
            </div>
            <div style={{ fontSize: 13, color: '#B8DCC8', fontFamily: 'DM Sans, sans-serif' }}>
              Let's see what your week looks like
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 28, color: C.brandLight, lineHeight: 1, padding: 4,
          }}>
            ×
          </button>
        </div>

        <div style={{ padding: '20px 20px 160px' }}>
          {/* Custom tasks — read-only context */}
          {customDueTasks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader>Already on your plate</SectionHeader>
              {customDueTasks.map(t => {
                const estimate = getTimeEstimate(t, taskState);
                const date = taskState[t.id]?.scheduledDate;
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: C.card, borderRadius: 10, border: `1px solid ${C.cardBorder}`,
                    marginBottom: 6,
                  }}>
                    <CategoryDot cat={t.cat} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                        {t.label}
                      </span>
                      {date && (
                        <div style={{ fontSize: 12, color: C.yellow, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                          {dayLabel(date)}
                        </div>
                      )}
                      <TimeChip estimate={estimate} />
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke={C.green} strokeWidth="1.5" />
                      <polyline points="4.5,8 7,10.5 11.5,5.5" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}

          {/* Brain dump */}
          <div style={{ marginBottom: 24 }}>
            <SectionHeader>What else is happening this week?</SectionHeader>
            <div style={{
              fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 12, lineHeight: 1.5,
            }}>
              Brain dump anything — appointments, errands, things on your mind
            </div>
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="e.g. Taking Max to the vet Thursday, PCP appointment Wednesday, need to change the air filter…"
              maxLength={2000}
              style={{
                width: '100%', minHeight: 100, padding: 14, fontSize: 14,
                fontFamily: 'DM Sans, sans-serif', color: C.ink,
                background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12,
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {loading && <PulseLoader messages={LOADING_MESSAGES} />}

          {errorKind && (
            <div style={{
              background: '#FEF0F0', border: '1px solid #F5C6C6', borderRadius: 10,
              padding: '12px 16px', fontSize: 13, color: '#8B2020',
              fontFamily: 'DM Sans, sans-serif', marginBottom: 16,
            }}>
              {ERROR_MESSAGES[errorKind]}
            </div>
          )}

          {!loading && (
            <button
              onClick={userInput.trim() ? handleSubmit : handleSkipToReview}
              style={{
                width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
                background: C.brand, color: C.brandLight, border: 'none', borderRadius: 12,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {userInput.trim() ? 'Plan my week' : customDueTasks.length > 0 ? 'Next' : 'Skip to suggestions'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Screen 2: Unified plan review ───────────────────────────────────────
  if (step === 'review') {
    // Split plan items into categories for rendering, but they're all one list
    const customInPlan = customDueTasks.filter(t => planItems.has(t.id));
    const matchedInPlan = matches.filter(m => {
      const isCustom = customDueTasks.some(ct => ct.id === m.taskId);
      return !isCustom && taskMap.has(m.taskId);
    });
    const unmatchedCustom = customDueTasks.filter(t => !planItems.has(t.id));

    // Suggestions the user hasn't already added
    const availableSuggestions = suggestedTasks.filter(t => !planItems.has(t.id));
    const addedSuggestions = suggestedTasks.filter(t => planItems.has(t.id));

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: C.bg, overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: C.brand, padding: '22px 22px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: "'Righteous', cursive", fontSize: 22, color: C.brandLight,
              marginBottom: 4,
            }}>
              Your week
            </div>
            <div style={{ fontSize: 13, color: '#B8DCC8', fontFamily: 'DM Sans, sans-serif' }}>
              {planItems.size} task{planItems.size !== 1 ? 's' : ''} planned
            </div>
          </div>
          <button onClick={() => setStep('input')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: C.brandLight, fontFamily: 'DM Sans, sans-serif',
            textDecoration: 'underline',
          }}>
            Back
          </button>
        </div>

        <div style={{ padding: '20px 20px 160px' }}>
          {/* Unified plan list — all selectable */}
          {(customInPlan.length > 0 || matchedInPlan.length > 0 || addedSuggestions.length > 0) && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader>This week's plan</SectionHeader>

              {/* Custom tasks in plan */}
              {customInPlan.map(t => {
                const estimate = getTimeEstimate(t, taskState);
                return (
                  <ToggleCard key={t.id} selected={true} onClick={() => togglePlanItem(t.id)}>
                    <CategoryDot cat={t.cat} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                        {t.label}
                      </span>
                      {scheduledDates[t.id] && (
                        <div style={{ fontSize: 12, color: C.yellow, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                          {dayLabel(scheduledDates[t.id])}
                        </div>
                      )}
                      <TimeChip estimate={estimate} />
                    </div>
                  </ToggleCard>
                );
              })}

              {/* Matched tasks from brain dump */}
              {matchedInPlan.map(m => {
                const task = taskMap.get(m.taskId);
                if (!task) return null;
                const inPlan = planItems.has(m.taskId);
                const estimate = getTimeEstimate(task, taskState);
                return (
                  <ToggleCard key={m.taskId} selected={inPlan} onClick={() => togglePlanItem(m.taskId)}>
                    <CategoryDot cat={task.cat} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                        {task.label}
                      </div>
                      {scheduledDates[m.taskId] && (
                        <div style={{ fontSize: 12, color: C.yellow, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                          {dayLabel(scheduledDates[m.taskId])}
                        </div>
                      )}
                      {m.mentionText && (
                        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic', marginTop: 2 }}>
                          from: "{m.mentionText}"
                        </div>
                      )}
                      <TimeChip estimate={estimate} />
                    </div>
                  </ToggleCard>
                );
              })}

              {/* Structured suggestions that have been added to the plan */}
              {addedSuggestions.map(t => {
                const estimate = getTimeEstimate(t, taskState);
                return (
                  <ToggleCard key={t.id} selected={true} onClick={() => togglePlanItem(t.id)}>
                    <CategoryDot cat={t.cat} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                        {t.label}
                      </span>
                      <TimeChip estimate={estimate} />
                    </div>
                  </ToggleCard>
                );
              })}

              {/* Removed custom tasks — shown faded so they can re-add */}
              {unmatchedCustom.map(t => {
                const estimate = getTimeEstimate(t, taskState);
                return (
                  <ToggleCard key={t.id} selected={false} onClick={() => togglePlanItem(t.id)}>
                    <CategoryDot cat={t.cat} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                        {t.label}
                      </span>
                      <TimeChip estimate={estimate} />
                    </div>
                  </ToggleCard>
                );
              })}
            </div>
          )}

          {/* Unmatched brain dump items — not in task library */}
          {newSuggestions.filter(s => !dismissedNewSuggestions.has(s.label)).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader>Not in your tasks yet</SectionHeader>
              {newSuggestions.filter(s => !dismissedNewSuggestions.has(s.label)).map(s => (
                <div key={s.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  background: '#FFFDE7', borderRadius: 10, border: `1px solid ${C.cardBorder}`,
                  marginBottom: 6,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                      {s.reason}
                    </div>
                  </div>
                  <button
                    onClick={() => setDismissedNewSuggestions(prev => new Set(prev).add(s.label))}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 18, color: C.muted, padding: 4, lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div style={{ fontSize: 11, color: C.muted, fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic', marginTop: 4 }}>
                You can add these as tasks later from the sparkle button.
              </div>
            </div>
          )}

          {/* Mitzy suggestions — collapsible at bottom */}
          {availableSuggestions.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                onClick={() => setSuggestionsExpanded(prev => !prev)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', marginBottom: suggestionsExpanded ? 4 : 0,
                }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: C.muted, fontFamily: 'DM Sans, sans-serif',
                }}>
                  Mitzy suggestions
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
                  transform: suggestionsExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  <polyline points="4,6 8,10 12,6" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {suggestionsExpanded && (
                <>
                  <div style={{
                    fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 12, lineHeight: 1.5,
                  }}>
                    {planItems.size >= 3
                      ? "You've got plenty going on — no pressure, but these are coming up if you have bandwidth"
                      : 'These are coming up soon — tap to add any to your plan'}
                  </div>
                  {availableSuggestions.map(t => {
                    const estimate = getTimeEstimate(t, taskState);
                    return (
                      <div
                        key={t.id}
                        onClick={() => togglePlanItem(t.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          background: C.surface, borderRadius: 10,
                          border: `1px solid ${C.cardBorder}`,
                          marginBottom: 6, cursor: 'pointer',
                          opacity: 0.7,
                          transition: 'all 0.15s',
                        }}
                      >
                        <CategoryDot cat={t.cat} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                            {t.label}
                          </span>
                          <TimeChip estimate={estimate} />
                        </div>
                        <div style={{
                          background: C.surface, color: C.muted,
                          border: 'none', borderRadius: 8, padding: '4px 10px',
                          fontSize: 12, fontWeight: 600,
                          fontFamily: 'DM Sans, sans-serif',
                        }}>
                          + Add
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Gap fill from API */}
          {gapFill.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader>Mitzy also noticed</SectionHeader>
              {gapFill.map(g => {
                const task = taskMap.get(g.taskId);
                if (!task) return null;
                const inPlan = planItems.has(g.taskId);
                const estimate = getTimeEstimate(task, taskState);
                return (
                  <ToggleCard key={g.taskId} selected={inPlan} onClick={() => togglePlanItem(g.taskId)}>
                    <CategoryDot cat={task.cat} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                        {task.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                        {g.reason}
                      </div>
                      <TimeChip estimate={estimate} />
                    </div>
                  </ToggleCard>
                );
              })}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={planItems.size === 0}
            style={{
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
              background: planItems.size > 0 ? C.brand : C.surface,
              color: planItems.size > 0 ? C.brandLight : C.muted,
              border: 'none', borderRadius: 12,
              cursor: planItems.size > 0 ? 'pointer' : 'default',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Lock in my week
          </button>
        </div>
      </div>
    );
  }

  return null;
}
