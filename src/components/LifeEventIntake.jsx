import { useState, useMemo } from "react";
import { Sheet } from "./Sheet";
import { MonthCalendar } from "./MonthCalendar";
import { C } from "../data/constants";
import {
  retroactiveCandidates,
  isPostBirth,
} from "../data/lifeEvents/newBaby";
import { NEW_BABY_PHASE_LABELS } from "../data/lifeEvents/newBaby";

// Multi-step intake sheet for the New Baby life event. v1 only — when we add
// more events, generalize step config off the event def. Until then, keeping
// this concrete and readable beats premature abstraction.

const LABEL_STYLE = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
  color: '#9B9B9B', fontFamily: 'DM Sans, sans-serif', marginBottom: 8,
};

const QUESTION_STYLE = {
  fontFamily: "'Righteous', 'Trebuchet MS', cursive",
  fontSize: 18, color: C.ink, marginBottom: 14, lineHeight: 1.3,
};

const HELP_STYLE = {
  fontSize: 12, color: C.muted, fontFamily: 'DM Sans, sans-serif',
  lineHeight: 1.5, marginBottom: 18,
};

function ChipButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
        border: 'none', borderRadius: 20, padding: '9px 16px', cursor: 'pointer',
        background: active ? '#1A5C3A' : '#F0EDE4',
        color: active ? '#fff' : '#4A6256',
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ disabled, onClick, children }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%', fontSize: 15, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
        background: disabled ? '#C4D8CC' : '#1A5C3A',
        color: '#fff', border: 'none', borderRadius: 14,
        padding: '13px 0', cursor: disabled ? 'default' : 'pointer',
        marginTop: 18,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryLink({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color: C.muted,
        fontFamily: 'DM Sans, sans-serif', marginTop: 10,
        textDecoration: 'underline',
      }}
    >
      {children}
    </button>
  );
}

// ─── Step: due / birth date ─────────────────────────────────────────
function StepDueDate({ value, onNext }) {
  const [date, setDate] = useState(value || '');
  return (
    <>
      <div style={LABEL_STYLE}>Step 1 of 4</div>
      <div style={QUESTION_STYLE}>When is the baby due — or when did they arrive?</div>
      <div style={HELP_STYLE}>
        We use this to schedule the right tasks at the right time. A rough estimate is fine.
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <MonthCalendar value={date} onChange={setDate} />
      </div>
      <PrimaryButton disabled={!date} onClick={() => onNext(date)}>
        Continue
      </PrimaryButton>
    </>
  );
}

// ─── Step: how is baby joining ──────────────────────────────────────
function StepConceptionPath({ onNext }) {
  return (
    <>
      <div style={LABEL_STYLE}>Step 2 of 4</div>
      <div style={QUESTION_STYLE}>How is baby joining the family?</div>
      <div style={HELP_STYLE}>
        This helps Mitzy skip tasks that don't apply.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ChipButton onClick={() => onNext('pregnancy')}>Pregnancy</ChipButton>
        <ChipButton onClick={() => onNext('adoption')}>Adoption</ChipButton>
        <ChipButton onClick={() => onNext('surrogacy')}>Surrogacy</ChipButton>
      </div>
    </>
  );
}

// ─── Step: insurance + retirement ───────────────────────────────────
function StepAccounts({ onNext }) {
  const [hasLifeInsurance, setHasLifeInsurance] = useState(null);
  const [hasRetirement,    setHasRetirement]    = useState(null);
  const ready = hasLifeInsurance != null && hasRetirement != null;

  return (
    <>
      <div style={LABEL_STYLE}>Step 3 of 4</div>
      <div style={QUESTION_STYLE}>A couple quick account questions.</div>
      <div style={HELP_STYLE}>
        Some tasks only apply if you have these. We'll skip them if not.
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'DM Sans, sans-serif', marginBottom: 8 }}>
          Do you have life insurance?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ChipButton active={hasLifeInsurance === true}  onClick={() => setHasLifeInsurance(true)}>Yes</ChipButton>
          <ChipButton active={hasLifeInsurance === false} onClick={() => setHasLifeInsurance(false)}>No</ChipButton>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: 'DM Sans, sans-serif', marginBottom: 8 }}>
          Do you have a retirement account (401k, IRA, etc.)?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ChipButton active={hasRetirement === true}  onClick={() => setHasRetirement(true)}>Yes</ChipButton>
          <ChipButton active={hasRetirement === false} onClick={() => setHasRetirement(false)}>No</ChipButton>
        </div>
      </div>

      <PrimaryButton disabled={!ready} onClick={() => onNext({ hasLifeInsurance, hasRetirement })}>
        Continue
      </PrimaryButton>
    </>
  );
}

// ─── Step: retroactive checklist ────────────────────────────────────
// Asks the user which already-relevant tasks they've already handled. For
// post-birth users we show a single un-labeled list. For mid-pregnancy users
// we group by trimester so the framing matches their mental model.
function StepRetroactive({ candidates, post, onNext }) {
  const [checked, setChecked] = useState(new Set());

  const toggle = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const grouped = useMemo(() => {
    if (post) return [{ phase: null, items: candidates }];
    const byPhase = {};
    candidates.forEach(t => {
      (byPhase[t.phase] ??= []).push(t);
    });
    return Object.entries(byPhase).map(([phase, items]) => ({ phase, items }));
  }, [candidates, post]);

  return (
    <>
      <div style={LABEL_STYLE}>Step 4 of 4</div>
      <div style={QUESTION_STYLE}>
        {post
          ? "Mark anything you've already handled."
          : "You're already a bit further along — anything below already done?"}
      </div>
      <div style={HELP_STYLE}>
        We'll skip these so they don't clutter your list.
      </div>

      {grouped.map(({ phase, items }) => (
        <div key={phase ?? 'all'} style={{ marginBottom: 14 }}>
          {phase && (
            <div style={{ ...LABEL_STYLE, marginBottom: 6, color: C.muted }}>
              {NEW_BABY_PHASE_LABELS[phase]}
            </div>
          )}
          {items.map(t => {
            const on = checked.has(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 12px', marginBottom: 6, cursor: 'pointer',
                  background: on ? '#E8F5EE' : '#fff',
                  border: on ? '1.5px solid #1A5C3A' : '1.5px solid #EAE4DA',
                  borderRadius: 10, textAlign: 'left',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: on ? '#1A5C3A' : '#fff',
                  border: on ? 'none' : '1.5px solid #C4C0B8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, flex: 1 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      ))}

      <PrimaryButton onClick={() => onNext([...checked])}>
        {checked.size > 0 ? `Skip ${checked.size} & finish` : 'Finish'}
      </PrimaryButton>
    </>
  );
}

// ─── Step: confirmation ─────────────────────────────────────────────
function StepConfirm({ taskCount, busy, error, onConfirm, onCancel }) {
  return (
    <>
      <div style={QUESTION_STYLE}>Ready to add {taskCount} task{taskCount === 1 ? '' : 's'}?</div>
      <div style={HELP_STYLE}>
        Mitzy will add these to your task list. You can mark them done as you go, or remove the whole event later.
      </div>
      {error && (
        <div style={{ background: '#FDE8E8', borderRadius: 10, padding: '10px 12px', color: '#D62828', fontSize: 12, fontFamily: 'DM Sans, sans-serif', marginBottom: 12 }}>
          {error}
        </div>
      )}
      <PrimaryButton disabled={busy} onClick={onConfirm}>
        {busy ? 'Adding…' : `Add ${taskCount} task${taskCount === 1 ? '' : 's'}`}
      </PrimaryButton>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <SecondaryLink onClick={onCancel}>Back</SecondaryLink>
      </div>
    </>
  );
}

// ─── Container ──────────────────────────────────────────────────────
export function NewBabyIntake({ onClose, onStart, generateTaskList }) {
  // step: 'date' | 'path' | 'accounts' | 'retro' | 'confirm'
  const [step, setStep]       = useState('date');
  const [answers, setAnswers] = useState({});
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);

  const goToRetroOrConfirm = (nextAnswers) => {
    const cands = retroactiveCandidates(nextAnswers);
    if (cands.length === 0) setStep('confirm');
    else                    setStep('retro');
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onStart(answers);
      onClose();
    } catch (e) {
      setError(e?.message || "Couldn't save — please try again.");
      setBusy(false);
    }
  };

  // Need this to compute "tasks to add" count on the confirm screen
  const finalTasks = useMemo(
    () => (step === 'confirm' ? generateTaskList(answers) : []),
    [step, answers, generateTaskList]
  );

  return (
    <Sheet title="New baby" onClose={onClose}>
      {step === 'date' && (
        <StepDueDate
          value={answers.dueDate}
          onNext={(dueDate) => {
            setAnswers(a => ({ ...a, dueDate }));
            setStep('path');
          }}
        />
      )}

      {step === 'path' && (
        <StepConceptionPath
          onNext={(conceptionPath) => {
            const next = { ...answers, conceptionPath };
            // Adoption/surrogacy: ask whether baby has arrived (drives post-birth gating)
            if (conceptionPath !== 'pregnancy') {
              const dueDays = answers.dueDate
                ? Math.floor((new Date(answers.dueDate).getTime() - Date.now()) / 86400000)
                : null;
              next.babyHome = dueDays != null && dueDays < 0;
            }
            setAnswers(next);
            setStep('accounts');
          }}
        />
      )}

      {step === 'accounts' && (
        <StepAccounts
          onNext={(updates) => {
            const next = { ...answers, ...updates };
            setAnswers(next);
            goToRetroOrConfirm(next);
          }}
        />
      )}

      {step === 'retro' && (
        <StepRetroactive
          candidates={retroactiveCandidates(answers)}
          post={isPostBirth(answers)}
          onNext={(alreadyDone) => {
            setAnswers(a => ({ ...a, alreadyDone }));
            setStep('confirm');
          }}
        />
      )}

      {step === 'confirm' && (
        <StepConfirm
          taskCount={finalTasks.length}
          busy={busy}
          error={error}
          onConfirm={handleConfirm}
          onCancel={() => {
            const cands = retroactiveCandidates(answers);
            setStep(cands.length > 0 ? 'retro' : 'accounts');
          }}
        />
      )}
    </Sheet>
  );
}
