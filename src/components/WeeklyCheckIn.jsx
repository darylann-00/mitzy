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

  // Custom tasks coming up this week (shown first)
  const [customDueTasks] = useState(() => {
    const customIds = new Set(customTasks.map(t => t.id));
    return scoredDue.filter(t => {
      if (!customIds.has(t.id)) return false;
      const s = getStatus(t);
      return s === 'due' || s === 'coming-up' || s === 'needed' || s === 'confirm';
    });
  });
  const [selectedCustomTasks, setSelectedCustomTasks] = useState(
    () => new Set(customDueTasks.map(t => t.id))
  );

  // Structured/built-in priority tasks — user picks which to add
  const [suggestedTasks] = useState(() => {
    const customIds = new Set(customTasks.map(t => t.id));
    return scoredDue.filter(t => {
      if (customIds.has(t.id)) return false;
      const s = getStatus(t);
      return s === 'due' || s === 'coming-up' || s === 'needed' || s === 'confirm';
    }).slice(0, 5);
  });
  const [selectedDueTasks, setSelectedDueTasks] = useState(new Set());
  const [structuredExpanded, setStructuredExpanded] = useState(() => customDueTasks.length < 3);

  // API response state
  const [matches, setMatches] = useState([]);
  const [newSuggestions, setNewSuggestions] = useState([]);
  const [gapFill, setGapFill] = useState([]);

  // Review state — which items are accepted
  const [acceptedMatches, setAcceptedMatches] = useState(new Set());
  const [acceptedGapFill, setAcceptedGapFill] = useState(new Set());
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

      const allSelectedIds = new Set([...selectedCustomTasks, ...selectedDueTasks]);
      const selectedDueArray = [
        ...customDueTasks.filter(t => selectedCustomTasks.has(t.id)),
        ...suggestedTasks.filter(t => selectedDueTasks.has(t.id)),
      ];
      const backlogTasks = scoredDue
        .filter(t => !allSelectedIds.has(t.id))
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
          autoDueTasks: selectedDueArray.map(t => ({ id: t.id, label: t.label })),
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

      setMatches(data.matches || []);
      setNewSuggestions(data.newTaskSuggestions || []);
      setGapFill(data.gapFill || []);

      // Auto-accept all matches
      setAcceptedMatches(new Set((data.matches || []).map(m => m.taskId)));
      setAcceptedGapFill(new Set((data.gapFill || []).map(g => g.taskId)));

      setStep('review');
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (!navigator.onLine) setErrorKind('offline');
      else setErrorKind('general');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    // Build final task ID list + scheduled dates
    const taskIds = [];
    const scheduledDates = {};

    // Selected custom tasks
    for (const t of customDueTasks) {
      if (!selectedCustomTasks.has(t.id)) continue;
      taskIds.push(t.id);
      if (taskState[t.id]?.scheduledDate) {
        scheduledDates[t.id] = taskState[t.id].scheduledDate;
      }
    }

    // Selected structured tasks
    for (const t of suggestedTasks) {
      if (!selectedDueTasks.has(t.id)) continue;
      taskIds.push(t.id);
      if (taskState[t.id]?.scheduledDate) {
        scheduledDates[t.id] = taskState[t.id].scheduledDate;
      }
    }

    // Accepted matches
    for (const m of matches) {
      if (!acceptedMatches.has(m.taskId)) continue;
      if (!taskIds.includes(m.taskId)) taskIds.push(m.taskId);
      if (m.scheduledDate) scheduledDates[m.taskId] = m.scheduledDate;
    }

    // Accepted gap fill
    for (const g of gapFill) {
      if (!acceptedGapFill.has(g.taskId)) continue;
      if (!taskIds.includes(g.taskId)) taskIds.push(g.taskId);
    }

    await savePlan(taskIds, scheduledDates, userInput);
    await confirmPlan();
    onClose();
  };

  const handleSkipToConfirm = async () => {
    const taskIds = [
      ...customDueTasks.filter(t => selectedCustomTasks.has(t.id)).map(t => t.id),
      ...suggestedTasks.filter(t => selectedDueTasks.has(t.id)).map(t => t.id),
    ];
    const scheduledDates = {};
    for (const id of taskIds) {
      if (taskState[id]?.scheduledDate) {
        scheduledDates[id] = taskState[id].scheduledDate;
      }
    }
    await savePlan(taskIds, scheduledDates, '');
    await confirmPlan();
    onClose();
  };

  const allSelectedCount = selectedCustomTasks.size + selectedDueTasks.size;
  const totalPlanCount = allSelectedCount
    + matches.filter(m => acceptedMatches.has(m.taskId) && !selectedCustomTasks.has(m.taskId) && !selectedDueTasks.has(m.taskId)).length
    + gapFill.filter(g => acceptedGapFill.has(g.taskId)).length;

  const ERROR_MESSAGES = {
    offline: "You're offline — try again when you have a connection.",
    rate_limit: "Too many requests. Give it a few minutes.",
    auth: "Session expired. Close and try again.",
    general: "Something went wrong. Try again?",
  };

  // ─── Step 1: Input ─────────────────────────────────────────────────────────
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
              Plan what matters this week
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
          {/* Custom tasks coming up this week */}
          {customDueTasks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 4,
              }}>
                Your tasks this week
              </div>
              <div style={{
                fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 12, lineHeight: 1.5,
              }}>
                These are tasks you've added — deselect any you want to skip
              </div>
              {customDueTasks.map(t => {
                const selected = selectedCustomTasks.has(t.id);
                const estimate = getTimeEstimate(t, taskState);
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedCustomTasks(prev => {
                        const next = new Set(prev);
                        if (next.has(t.id)) next.delete(t.id);
                        else next.add(t.id);
                        return next;
                      });
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      background: selected ? C.card : C.surface, borderRadius: 10,
                      border: `1px solid ${selected ? C.brand : C.cardBorder}`,
                      marginBottom: 6, cursor: 'pointer',
                      opacity: selected ? 1 : 0.7,
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
              })}
            </div>
          )}

          {/* Built-in priority tasks */}
          {suggestedTasks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                onClick={() => setStructuredExpanded(prev => !prev)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', marginBottom: structuredExpanded ? 4 : 0,
                }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: C.muted, fontFamily: 'DM Sans, sans-serif',
                }}>
                  {customDueTasks.length >= 3 ? 'Want to add more?' : 'Top priorities'}
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
                  transform: structuredExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  <polyline points="4,6 8,10 12,6" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {structuredExpanded && (
                <>
                  <div style={{
                    fontSize: 13, color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 12, lineHeight: 1.5,
                  }}>
                    {customDueTasks.length >= 3
                      ? "You've got plenty going on — no pressure, but these are coming up if you have the bandwidth"
                      : 'Pick 2–3 to focus on this week'}
                  </div>
                  {suggestedTasks.map(t => {
                    const selected = selectedDueTasks.has(t.id);
                    const estimate = getTimeEstimate(t, taskState);
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedDueTasks(prev => {
                            const next = new Set(prev);
                            if (next.has(t.id)) next.delete(t.id);
                            else next.add(t.id);
                            return next;
                          });
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          background: selected ? C.card : C.surface, borderRadius: 10,
                          border: `1px solid ${selected ? C.brand : C.cardBorder}`,
                          marginBottom: 6, cursor: 'pointer',
                          opacity: selected ? 1 : 0.7,
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
                  })}
                </>
              )}
            </div>
          )}

          {/* Free-text input */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
            }}>
              Anything else this week?
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
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={userInput.trim() ? handleSubmit : handleSkipToConfirm}
                style={{
                  flex: 1, padding: '14px', fontSize: 15, fontWeight: 700,
                  background: C.brand, color: C.brandLight, border: 'none', borderRadius: 12,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {userInput.trim() ? 'Plan my week' : allSelectedCount > 0 ? 'Use these tasks' : 'Skip this week'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Step 2: Review ────────────────────────────────────────────────────────
  if (step === 'review') {
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
              {totalPlanCount} task{totalPlanCount !== 1 ? 's' : ''} for this week
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
          {/* Selected custom tasks */}
          {selectedCustomTasks.size > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
              }}>
                Your tasks
              </div>
              {customDueTasks.filter(t => selectedCustomTasks.has(t.id)).map(t => (
                <TaskRow key={t.id} task={t} taskState={taskState} scheduledDate={taskState[t.id]?.scheduledDate} />
              ))}
            </div>
          )}

          {/* Selected structured tasks */}
          {selectedDueTasks.size > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
              }}>
                {selectedCustomTasks.size > 0 ? 'Plus these' : 'Your picks'}
              </div>
              {suggestedTasks.filter(t => selectedDueTasks.has(t.id)).map(t => (
                <TaskRow key={t.id} task={t} taskState={taskState} scheduledDate={taskState[t.id]?.scheduledDate} />
              ))}
            </div>
          )}

          {/* Matched from user input */}
          {matches.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
              }}>
                From what you told us
              </div>
              {matches.map(m => {
                const task = taskMap.get(m.taskId);
                if (!task) return null;
                const accepted = acceptedMatches.has(m.taskId);
                const estimate = getTimeEstimate(task, taskState);
                return (
                  <div key={m.taskId} style={{ marginBottom: 6 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      background: accepted ? C.card : C.surface, borderRadius: 10,
                      border: `1px solid ${C.cardBorder}`,
                      opacity: accepted ? 1 : 0.6,
                    }}>
                      <CategoryDot cat={task.cat} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
                          {task.label}
                        </div>
                        {m.scheduledDate && (
                          <div style={{ fontSize: 12, color: C.yellow, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                            {dayLabel(m.scheduledDate)}
                          </div>
                        )}
                        <TimeChip estimate={estimate} />
                      </div>
                      <button
                        onClick={() => {
                          setAcceptedMatches(prev => {
                            const next = new Set(prev);
                            if (next.has(m.taskId)) next.delete(m.taskId);
                            else next.add(m.taskId);
                            return next;
                          });
                        }}
                        style={{
                          background: accepted ? C.green : C.surface,
                          color: accepted ? '#fff' : C.muted,
                          border: 'none', borderRadius: 8, padding: '6px 12px',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {accepted ? '✓' : 'Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* New task suggestions */}
          {newSuggestions.filter(s => !dismissedNewSuggestions.has(s.label)).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
              }}>
                Not in your tasks yet
              </div>
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

          {/* Gap fill suggestions */}
          {gapFill.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.muted, fontFamily: 'DM Sans, sans-serif', marginBottom: 10,
              }}>
                Mitzy also suggests
              </div>
              {gapFill.map(g => {
                const task = taskMap.get(g.taskId);
                if (!task) return null;
                const accepted = acceptedGapFill.has(g.taskId);
                const estimate = getTimeEstimate(task, taskState);
                return (
                  <div key={g.taskId} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: accepted ? C.card : C.surface, borderRadius: 10,
                    border: `1px solid ${C.cardBorder}`,
                    marginBottom: 6, opacity: accepted ? 1 : 0.6,
                  }}>
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
                    <button
                      onClick={() => {
                        setAcceptedGapFill(prev => {
                          const next = new Set(prev);
                          if (next.has(g.taskId)) next.delete(g.taskId);
                          else next.add(g.taskId);
                          return next;
                        });
                      }}
                      style={{
                        background: accepted ? C.green : C.surface,
                        color: accepted ? '#fff' : C.muted,
                        border: 'none', borderRadius: 8, padding: '6px 12px',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {accepted ? '✓' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            style={{
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
              background: C.brand, color: C.brandLight, border: 'none', borderRadius: 12,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
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

function TaskRow({ task, taskState, scheduledDate }) {
  const estimate = taskState ? getTimeEstimate(task, taskState) : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: C.card, borderRadius: 10, border: `1px solid ${C.cardBorder}`,
      marginBottom: 6,
    }}>
      <CategoryDot cat={task.cat} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontFamily: "'Righteous', cursive", color: C.ink }}>
          {task.label}
        </span>
        {scheduledDate && (
          <div style={{ fontSize: 12, color: C.yellow, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
            {dayLabel(scheduledDate)}
          </div>
        )}
        <TimeChip estimate={estimate} />
      </div>
    </div>
  );
}
