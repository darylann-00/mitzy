import { useState } from "react";
import { CAT_META } from "../data/constants";
import { CAT_ICON_CONFIG } from "../components/CategoryIcons";
import { MonthCalendar } from "../components/MonthCalendar";
import { DateField } from "../components/DateField";
import { ScheduleSurface } from "../components/ScheduleSurface";
import { useProfileContext } from "../contexts/ProfileContext";
import { useTaskContext }    from "../contexts/TaskContext";
import { parseGuidanceBlocks, renderGuidanceBlocks } from "../utils/renderMarkdown";
import { GuidedSteps } from "../components/GuidedSteps";
import { SnoozeIcon, SNOOZE_BLUE } from "../components/SnoozeIcon";

function formatIntervalDays(days) {
  if (!days) return null;
  if (days < 14) return `every ${days} day${days !== 1 ? 's' : ''}`;
  if (days < 60) return `every ${Math.round(days / 7)} week${Math.round(days / 7) !== 1 ? 's' : ''}`;
  if (days < 365) return `every ${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? 's' : ''}`;
  const years = Math.round(days / 365);
  return `every ${years} year${years !== 1 ? 's' : ''}`;
}

const FREQ_CANDIDATES = [3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365, 548, 730, 1095, 1460, 1825, 2555, 3650];

function getFrequencyPresets(defaultDays) {
  const below = FREQ_CANDIDATES.filter(d => d < defaultDays).slice(-4);
  return [...new Set([...below, defaultDays])];
}

// ─── HistoryCard component ─────────────────────────────────────────────────────
function OneTimeCard({ task, entry, onSetDueDate }) {
  const [open, setOpen] = useState(false);
  const dueDateStr = entry?.dueDate
    ? new Date(entry.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #EAE4DA',
      borderTop: 'none',
      borderRadius: '0 0 14px 14px',
      marginBottom: 10,
    }}>
      <div
        data-testid="history-card-toggle"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: open ? '#F8F5EE' : '#FFFFFF',
          justifyContent: 'space-between',
        }}
      >
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: dueDateStr ? '#1C2B22' : '#4A6256',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {dueDateStr ? `Due ${dueDateStr}` : 'No due date set'}
        </span>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="2,4.5 6.5,8.5 11,4.5" stroke="#4A6256" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #EAE4DA', padding: '12px 14px 14px', background: '#F8F5EE' }}>
          <DateField
            value={entry?.dueDate ? entry.dueDate.slice(0, 10) : ''}
            onChange={iso => { onSetDueDate(task.id, iso || null); }}
          />
          {dueDateStr && (
            <button
              onClick={() => { onSetDueDate(task.id, null); setOpen(false); }}
              style={{
                marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#4A6256', fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'underline', textDecorationColor: '#C8D9D1', padding: 0,
              }}
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ task, entry, effectiveInterval, lastDoneDate, dueNextDate, isOverdue, status, onMarkDone, onSetIntervalOverride, onSetOneTimeOverride }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [customNum, setCustomNum] = useState('');
  const [customUnit, setCustomUnit] = useState('months');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Base one-time tasks use OneTimeCard instead (handled by parent)
  if (task.oneTime && entry?.oneTime !== false) return null;

  const effectiveOneTime = entry?.oneTime !== undefined ? entry.oneTime : false;

  const frequencyStr = formatIntervalDays(effectiveInterval);

  const handleToggle = () => {
    setOpen(!open);
    if (open) setEditing(null);
  };

  const handleEditingChange = (field) => {
    if (editing === field) {
      setEditing(null);
    } else {
      setEditing(field);
      setShowCustomInput(false);
      setCustomNum('');
    }
  };

  let collapsedText = 'Due — not set yet';
  if (effectiveOneTime) {
    collapsedText = lastDoneDate ? 'Done — one time' : 'One time — not done yet';
  } else if (status === 'scheduled' && entry?.scheduledDate) {
    const scheduledDate = new Date(entry.scheduledDate);
    collapsedText = `Scheduled ${scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (dueNextDate) {
    collapsedText = `Due ${dueNextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #EAE4DA',
      borderTop: 'none',
      borderRadius: '0 0 14px 14px',
      marginBottom: 10,
    }}>
      {/* Collapsed trigger row */}
      <div
        data-testid="history-card-toggle"
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: open ? '#F8F5EE' : '#FFFFFF',
          justifyContent: 'space-between',
        }}
      >
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: isOverdue ? '#D62828' : '#1C2B22',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {collapsedText}
        </span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        >
          <polyline
            points="2,4.5 6.5,8.5 11,4.5"
            stroke="#4A6256"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Expanded content */}
      {open && (
        <>
          {/* Last done row */}
          <div style={{ borderTop: '1px solid #EAE4DA' }}>
            <div
              data-testid="last-done-cell"
              onClick={() => handleEditingChange('last')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                gap: 10,
                cursor: 'pointer',
                backgroundColor: editing === 'last' ? '#F8F5EE' : '#FFFFFF',
              }}
            >
              <span style={{
                fontSize: 12,
                color: '#4A6256',
                fontWeight: 500,
                minWidth: 88,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                Last done
              </span>
              <span style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 500,
                color: '#1C2B22',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {lastDoneDate ? lastDoneDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
              </span>
              <div style={{
                fontSize: 12,
                color: '#1A5C3A',
                fontWeight: 600,
                background: '#E8F5EE',
                borderRadius: 6,
                padding: '2px 8px',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {editing === 'last' ? 'Cancel' : 'Edit'}
              </div>
            </div>
            {editing === 'last' && (
              <div style={{
                padding: '10px 12px',
                background: '#F8F5EE',
                borderTop: '1px solid #EAE4DA',
              }}>
                <DateField
                  value={lastDoneDate ? lastDoneDate.toISOString().slice(0, 10) : ''}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={iso => {
                    if (iso) { onMarkDone(task, iso); setEditing(null); }
                  }}
                />
              </div>
            )}
          </div>

          {/* Frequency row */}
          {(frequencyStr || effectiveOneTime) && (
            <div style={{ borderTop: '1px solid #EAE4DA' }}>
              <div
                onClick={() => handleEditingChange('freq')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  gap: 10,
                  cursor: 'pointer',
                  backgroundColor: editing === 'freq' ? '#F8F5EE' : '#FFFFFF',
                }}
              >
                <span style={{
                  fontSize: 12,
                  color: '#4A6256',
                  fontWeight: 500,
                  minWidth: 88,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  Frequency
                </span>
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  color: (entry?.intervalDays || effectiveOneTime) ? '#1A5C3A' : '#1C2B22',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {effectiveOneTime ? 'Once' : frequencyStr}
                </span>
                <div style={{
                  fontSize: 12,
                  color: '#1A5C3A',
                  fontWeight: 600,
                  background: '#E8F5EE',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {editing === 'freq' ? 'Cancel' : 'Edit'}
                </div>
              </div>
              {editing === 'freq' && (task.intervalDays || effectiveOneTime) && (
                <div style={{
                  padding: '10px 12px',
                  background: '#F8F5EE',
                  borderTop: '1px solid #EAE4DA',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#4A6256',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      Change frequency
                    </div>
                    <button
                      onClick={() => {
                        setEditing(null);
                        setShowCustomInput(false);
                        setCustomNum('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        fontSize: 16,
                        color: '#4A6256',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                  {effectiveOneTime ? (
                    <div style={{ marginBottom: 8 }}>
                      <button
                        onClick={() => {
                          onSetOneTimeOverride(task.id, false);
                          setEditing(null);
                        }}
                        style={{
                          padding: '5px 11px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'DM Sans, sans-serif',
                          cursor: 'pointer',
                          border: '1.5px solid #EAE4DA',
                          background: '#fff',
                          color: '#1C2B22',
                        }}
                      >
                        Switch to recurring
                      </button>
                    </div>
                  ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {getFrequencyPresets(task.intervalDays).map(days => {
                      const isDefault = days === task.intervalDays;
                      const isCurrent = days === effectiveInterval && !showCustomInput;
                      return (
                        <button
                          key={days}
                          onClick={() => {
                            setShowCustomInput(false);
                            onSetIntervalOverride(task.id, days);
                            setEditing(null);
                          }}
                          style={{
                            padding: '5px 11px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: 'DM Sans, sans-serif',
                            cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: isCurrent ? '#1A5C3A' : '#EAE4DA',
                            background: isCurrent ? '#1A5C3A' : '#fff',
                            color: isCurrent ? '#E8F5EE' : '#1C2B22',
                          }}
                        >
                          {formatIntervalDays(days)}{isDefault ? ' ✓' : ''}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        setShowCustomInput(v => !v);
                      }}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'DM Sans, sans-serif',
                        cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: showCustomInput ? '#1A5C3A' : '#EAE4DA',
                        background: showCustomInput ? '#E8F5EE' : '#fff',
                        color: '#1C2B22',
                      }}
                    >
                      Custom
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        onSetOneTimeOverride(task.id, true);
                        setEditing(null);
                      }}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'DM Sans, sans-serif',
                        cursor: 'pointer',
                        border: '1.5px solid #EAE4DA',
                        background: '#fff',
                        color: '#1C2B22',
                      }}
                    >
                      Once
                    </button>
                  </div>
                  )}
                  {!effectiveOneTime && showCustomInput && (
                    <>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                        <span style={{
                          fontSize: 12,
                          color: '#4A6256',
                          fontFamily: 'DM Sans, sans-serif',
                          flexShrink: 0,
                        }}>
                          Every
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={customNum}
                          onChange={e => setCustomNum(e.target.value)}
                          placeholder="e.g. 3"
                          autoFocus
                          style={{
                            width: 64,
                            padding: '6px 8px',
                            fontSize: 13,
                            fontFamily: 'DM Sans, sans-serif',
                            border: '1.5px solid #1A5C3A',
                            borderRadius: 8,
                            background: '#fff',
                            color: '#1C2B22',
                            textAlign: 'center',
                          }}
                        />
                        <select
                          value={customUnit}
                          onChange={e => setCustomUnit(e.target.value)}
                          style={{
                            padding: '6px 8px',
                            fontSize: 13,
                            fontFamily: 'DM Sans, sans-serif',
                            border: '1.5px solid #EAE4DA',
                            borderRadius: 8,
                            background: '#fff',
                            color: '#1C2B22',
                            width: 'auto',
                          }}
                        >
                          <option value="days">days</option>
                          <option value="months">months</option>
                          <option value="years">years</option>
                        </select>
                        <button
                          disabled={!customNum || parseInt(customNum, 10) < 1}
                          onClick={() => {
                            const n = parseInt(customNum, 10);
                            if (!n || n < 1) return;
                            const mult = { days: 1, months: 30, years: 365 }[customUnit];
                            onSetIntervalOverride(task.id, n * mult);
                            setShowCustomInput(false);
                            setCustomNum('');
                            setEditing(null);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: 'DM Sans, sans-serif',
                            flexShrink: 0,
                            border: 'none',
                            background: (!customNum || parseInt(customNum, 10) < 1) ? '#C8D9D1' : '#1A5C3A',
                            color: (!customNum || parseInt(customNum, 10) < 1) ? '#7A9B8E' : '#E8F5EE',
                            cursor: (!customNum || parseInt(customNum, 10) < 1) ? 'default' : 'pointer',
                          }}
                        >
                          Set
                        </button>
                      </div>
                      {customNum !== '' && parseInt(customNum, 10) < 1 && (
                        <div style={{
                          fontSize: 11,
                          color: '#D62828',
                          fontFamily: 'DM Sans, sans-serif',
                          marginBottom: 4,
                        }}>
                          Enter a number greater than 0
                        </div>
                      )}
                    </>
                  )}
                  {!effectiveOneTime && (
                  <div style={{
                    fontSize: 10,
                    color: '#4A6256',
                    fontFamily: 'DM Sans, sans-serif',
                    marginTop: 6,
                  }}>
                    ✓ marks the default recommendation
                  </div>
                  )}
                  {!effectiveOneTime && !task.oneTime && task.intervalDays && effectiveInterval > task.intervalDays && (
                    <div style={{
                      background: '#FFF8E1',
                      border: '1px solid #F4C430',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      color: '#1C2B22',
                      fontFamily: 'DM Sans, sans-serif',
                      lineHeight: 1.5,
                      marginTop: 10,
                    }}>
                      <strong>Heads up:</strong> the standard recommendation is {formatIntervalDays(task.intervalDays)}.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}


const ASSIST_SUBTITLES = {
  providers: (task) => {
    return task.providerLabel
      ? `Find a local ${task.providerLabel} near you`
      : 'Find local help near you';
  },
  script:   () => 'Help me make the call',
  deadline: () => 'Show me the key dates and links',
  guidance: () => null,
};

// ─── Calendar SVG ──────────────────────────────────────────────────────────────
function CalSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="2" fill="#4A6256" />
      <line x1="2" y1="7" x2="16" y2="7" stroke="#FDFAF2" strokeWidth="1.5" />
      <line x1="6" y1="3" x2="6" y2="7" stroke="#FDFAF2" strokeWidth="1.5" />
      <line x1="12" y1="3" x2="12" y2="7" stroke="#FDFAF2" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Four dot mark ─────────────────────────────────────────────────────────────
function FourDots({ size = 7 }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', background:'#D62828' }} />
      <div style={{ width:size, height:size, borderRadius:'50%', background:'#F77F00' }} />
      <div style={{ width:size, height:size, borderRadius:'50%', background:'#06A77D' }} />
      <div style={{ width:size, height:size, borderRadius:'50%', background:'#F4C430' }} />
    </div>
  );
}

export function TaskDetailView({ task, taskState: taskStateProp, onAssist, onDone, onBack, onMarkDone, onSetIntervalOverride, onSetOneTimeOverride, onSetDueDate, onSetStepProgress, onMarkNotApplicable, onRemove, onUnsnooze }) {
  const { providerHistory } = useProfileContext();
  const { taskState, getStatus } = useTaskContext();
  const savedProvider = providerHistory[task.id];
  const status = getStatus(task);
  const entry    = taskState[task.id];
  const meta     = CAT_META[task.cat] || CAT_META.home;
  const iconCfg  = CAT_ICON_CONFIG[task.cat] || CAT_ICON_CONFIG.home;
  const isOverdue = status === 'due' || status === 'confirm';
  const scheduledDate = entry?.scheduledDate ? new Date(entry.scheduledDate) : null;
  const scheduledStr = scheduledDate
    ? scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const [confirmDismiss, setConfirmDismiss] = useState(false);

  // Last done / frequency / due next
  const effectiveInterval = entry?.intervalDays ?? task.intervalDays;
  const lastDoneDate = entry?.lastDone ? new Date(entry.lastDone) : null;
  const dueNextDate = lastDoneDate && effectiveInterval
    ? new Date(lastDoneDate.getTime() + effectiveInterval * 86400000)
    : null;

  // Assist subtitle
  const getSubtitle = ASSIST_SUBTITLES[task.assistType];
  const assistSubtitle = getSubtitle ? getSubtitle(task) : null;

  const guidanceBlocks = parseGuidanceBlocks(task.guidance);

  return (
    <div style={{ background:'#FDFAF2', minHeight:'100vh' }}>

      {/* Green header */}
      <div style={{
        background: '#1A5C3A',
        padding: '16px 18px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Scatter shapes */}
        <div style={{ position:'absolute', width:50, height:50, borderRadius:'50%', background:'#0F3D27', top:-14, right:-12 }} />
        <div style={{ position:'absolute', width:24, height:24, borderRadius:'50%', background:'#06A77D', top:8, right:24 }} />
        <div style={{ position:'absolute', width:10, height:10, background:'#F77F00', transform:'rotate(45deg)', bottom:8, right:18 }} />
        <div style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:'#F4C430', top:5, right:58 }} />
        <div style={{ position:'absolute', width:18, height:18, borderRadius:'50%', border:'2px solid #06A77D', opacity:0.5, bottom:-4, right:72 }} />

        {/* Back button + category */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, position:'relative' }}>
          <button
            onClick={onBack}
            style={{
              width:32, height:32, borderRadius:8, background:'#0F3D27',
              border:'none', cursor:'pointer', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:22, height:22, borderRadius:6, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <iconCfg.Icon color="#E8F5EE" bg="transparent" size={13} />
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:'#B8DCC8', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'DM Sans, sans-serif' }}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Task name */}
        <div style={{ fontFamily:"'Righteous', 'Trebuchet MS', cursive", fontSize:24, color:'#E8F5EE', lineHeight:1.2, marginBottom:12, position:'relative' }}>
          {task.label}
        </div>

      </div>

      <div style={{ padding:'16px 18px 32px', maxWidth:680, margin:'0 auto' }}>

        {/* Saved provider callout */}
        {savedProvider && (
          <div style={{ background:'#E8F5EE', border:'1.5px solid #1A5C3A', borderRadius:14, padding:'11px 14px', marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:'#1A5C3A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="#E8F5EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>Last used</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1C2B22', fontFamily:'DM Sans, sans-serif' }}>{savedProvider.name}</div>
              {savedProvider.notes && <div style={{ fontSize:12, color:'#4A6256', fontStyle:'italic', fontFamily:'DM Sans, sans-serif' }}>{savedProvider.notes}</div>}
            </div>
          </div>
        )}

        {/* Snoozed chip + wake up button */}
        {status === 'snoozed' && entry?.snoozedUntil && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(107,141,214,0.12)',
              border: '1px solid #6B8DD6',
              borderRadius: 8, padding: '5px 10px',
              fontSize: 12, fontWeight: 600, color: '#1C2B22',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <SnoozeIcon size={14} />
              <span>Snoozed until {new Date(entry.snoozedUntil + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <button
              onClick={() => onUnsnooze?.(task.id)}
              style={{
                fontSize: 12, fontWeight: 700, color: SNOOZE_BLUE,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'underline', textDecorationColor: 'rgba(107,141,214,0.4)',
                padding: 0,
              }}
            >
              Wake up early
            </button>
          </div>
        )}

        {/* Scheduled chip — hidden for one-time tasks since OneTimeCard shows the date */}
        {scheduledStr && !(task.oneTime && entry?.oneTime !== false) && (
          <div data-testid="scheduled-chip" style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'rgba(244, 196, 48, 0.15)',
            border:'1px solid #F4C430',
            borderRadius:8, padding:'5px 10px', marginBottom:10,
            fontSize:12, fontWeight:600, color:'#1C2B22',
            fontFamily:'DM Sans, sans-serif',
          }}>
            <span>📅 Scheduled: {scheduledStr}</span>
          </div>
        )}

        {/* History Card */}
        {(task.oneTime && entry?.oneTime !== false) ? (
          <OneTimeCard
            task={task}
            entry={entry}
            onSetDueDate={onSetDueDate}
          />
        ) : (
          <HistoryCard
            task={task}
            entry={entry}
            effectiveInterval={effectiveInterval}
            lastDoneDate={lastDoneDate}
            dueNextDate={dueNextDate}
            isOverdue={isOverdue}
            status={status}
            onMarkDone={onMarkDone}
            onSetIntervalOverride={onSetIntervalOverride}
            onSetOneTimeOverride={onSetOneTimeOverride}
          />
        )}

        {/* Why it matters */}
        <div style={{ background:'#fff', borderRadius:14, padding:'13px 15px', border:'1px solid #EAE4DA', marginBottom:10 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4A6256', marginBottom:7, fontFamily:"'Righteous', cursive" }}>
            Why it matters
          </div>
          <div style={{ fontSize:13, color:'#1C2B22', lineHeight:1.6, fontFamily:'DM Sans, sans-serif' }}>
            {task.why || task.note || 'This keeps your home running smoothly and helps avoid bigger problems down the line.'}
          </div>
        </div>

        {/* What to expect / Guided steps */}
        {task.steps && task.steps.length > 0 ? (
          <GuidedSteps
            steps={task.steps}
            taskId={task.id}
            stepProgress={entry?.stepProgress}
            onSetStepProgress={onSetStepProgress}
          />
        ) : (
          <div style={{ background:'#fff', borderRadius:14, padding:'13px 15px', border:'1px solid #EAE4DA', marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4A6256', marginBottom:8, fontFamily:"'Righteous', cursive" }}>
              What to expect
            </div>
            {guidanceBlocks ? renderGuidanceBlocks(guidanceBlocks) : (
              <div style={{ fontSize:13, color:'#4A6256', lineHeight:1.6, fontFamily:'DM Sans, sans-serif' }}>
                {task.note
                  ? 'Follow standard procedures or tap below to let Mitzy walk you through it.'
                  : 'Tap "Want Mitzy to help?" below and get step-by-step guidance.'}
              </div>
            )}
          </div>
        )}

        {/* Assist button */}
        {(task.assistType || task.isCustom) && (
          <button
            onClick={() => onAssist(task)}
            style={{
              width:'100%', background:'#1A5C3A', border:'none', borderRadius:14,
              padding:'15px 16px', display:'flex', alignItems:'center', gap:12,
              cursor:'pointer', marginBottom:8, boxSizing:'border-box',
            }}
          >
            <FourDots size={7} />
            <div style={{ flex:1, textAlign:'left' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#E8F5EE', fontFamily:'DM Sans, sans-serif' }}>Want Mitzy to help?</div>
              {assistSubtitle && <div style={{ fontSize:11, color:'#7DD8B0', marginTop:2, fontFamily:'DM Sans, sans-serif' }}>{assistSubtitle}</div>}
            </div>
            <div style={{ width:30, height:30, borderRadius:8, background:'#0F3D27', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="#B8DCC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        )}

        {/* Schedule Surface */}
        <ScheduleSurface task={task} />

        {/* Bottom row */}
        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={() => onDone(task)}
            style={{
              flex:1, background:'#06A77D', border:'none', borderRadius:14,
              height:52, display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <polyline points="3,9 7,13 15,4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize:15, fontWeight:700, color:'#fff', fontFamily:'DM Sans, sans-serif' }}>Mark as done</span>
          </button>
        </div>

        {/* Dismiss / remove row */}
        {!confirmDismiss ? (
          <button
            onClick={() => setConfirmDismiss(true)}
            style={{
              marginTop:10, width:'100%', background:'none', border:'none',
              padding:'6px 0', cursor:'pointer', textAlign:'center',
            }}
          >
            <span style={{ fontSize:12, color:'#4A6256', fontFamily:'DM Sans, sans-serif', textDecoration:'underline', textDecorationColor:'#C8D9D1' }}>
              {task.isCustom ? 'Remove this task' : 'Not applicable for me'}
            </span>
          </button>
        ) : (
          <div style={{
            marginTop:10, background:'#FFF8E1', border:'1px solid #F4C430',
            borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
          }}>
            <span style={{ fontSize:12, color:'#1C2B22', fontFamily:'DM Sans, sans-serif', flex:1, lineHeight:1.4 }}>
              {task.isCustom
                ? 'This task will be deleted.'
                : "This task will be hidden. You can reset it from Profile if needed."}
            </span>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button
                onClick={() => setConfirmDismiss(false)}
                style={{
                  padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:700,
                  fontFamily:'DM Sans, sans-serif', border:'1.5px solid #EAE4DA',
                  background:'#fff', color:'#4A6256', cursor:'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (task.isCustom) onRemove?.(task.id);
                  else onMarkNotApplicable?.(task.id);
                }}
                style={{
                  padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:700,
                  fontFamily:'DM Sans, sans-serif', border:'none',
                  background:'#D62828', color:'#fff', cursor:'pointer',
                }}
              >
                {task.isCustom ? 'Delete' : 'Hide'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
