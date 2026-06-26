import { useState, useEffect } from "react";
import "./styles/app.css";

import { loadS, saveS, ONBOARDED_KEY, PROFILE_DONE_KEY, VISIT_COUNT_KEY, WELCOME_CHOICE_KEY, LIFE_EVENTS_NUDGE_KEY } from "./utils/storage";
import { LIFE_EVENT_DEFS } from "./data/lifeEvents";
import { detectHazards } from "./utils/hazards";
import { EM_UNIVERSAL, EM_HAZARD } from "./data/tasks";
import { supabase } from "./lib/supabase";

import { useAuth }    from "./hooks/useAuth";
import { useSession } from "./hooks/useSession";

import { ProfileProvider, useProfileContext } from "./contexts/ProfileContext";
import { TaskProvider,   useTaskContext }    from "./contexts/TaskContext";
import { CalendarProvider, useCalendarContext } from "./contexts/CalendarContext";

import { LoginGate }      from "./components/LoginGate";
import { BrandSplash }    from "./components/BrandSplash";
import { WelcomeGate }    from "./components/WelcomeGate";
import { SlimOnboarding } from "./onboarding/SlimOnboarding";
import { PrioritySetup }  from "./onboarding/PrioritySetup";

import { Celebration }   from "./components/Celebration";
import { AssistPanel }   from "./components/AssistPanel";
import { MarkDoneModal } from "./components/MarkDoneModal";
import { TaskCreator }   from "./components/TaskCreator";
import { WeeklyCheckIn } from "./components/WeeklyCheckIn";
import { ProfileConflictModal } from "./components/ProfileConflictModal";
import { NewBabyIntake } from "./components/LifeEventIntake";
import { tasksForIntake as newBabyTasksForIntake } from "./data/lifeEvents/newBaby";
import { SnoozePicker } from "./components/SnoozePicker";
import { SnoozeTooltip } from "./components/SnoozeTooltip";

import { HomeView }       from "./views/HomeView";
import { AllView }        from "./views/AllView";
import { ProfileView }    from "./views/ProfileView";
import { TaskDetailView } from "./views/TaskDetailView";

// ─── Sync status banner ────────────────────────────────────────────────────────
function SyncBanner({ loading, error }) {
  if (!loading && !error) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
      background: error ? '#D62828' : '#1A5C3A',
      color: '#E8F5EE', fontSize: 12, fontFamily: 'DM Sans, sans-serif',
      fontWeight: 600, textAlign: 'center', padding: '7px 16px',
    }}>
      {loading ? 'Syncing your tasks…' : "Couldn't reach the server — showing local data"}
    </div>
  );
}

// ─── Bottom nav ────────────────────────────────────────────────────────────────
function BottomDock({ view, setView, onAdd }) {
  const TodayIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <polygon points="11,1 13.5,8.5 21,8.5 15,13.5 17,21 11,16.5 5,21 7,13.5 1,8.5 8.5,8.5"
        fill={active ? '#F4C430' : '#4A6256'} opacity={active ? 1 : 0.5} />
    </svg>
  );
  const AllIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="6"  cy="6"  r="3.5" fill="#D62828" opacity={active ? 1 : 0.4} />
      <circle cx="16" cy="6"  r="3.5" fill="#F77F00" opacity={active ? 1 : 0.4} />
      <circle cx="6"  cy="16" r="3.5" fill="#06A77D" opacity={active ? 1 : 0.4} />
      <circle cx="16" cy="16" r="3.5" fill="#F4C430" opacity={active ? 1 : 0.4} />
    </svg>
  );
  const ProfileIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="5" r="3" fill={active ? '#06A77D' : '#4A6256'} opacity={active ? 1 : 0.5} />
      <line x1="11" y1="8"  x2="11" y2="15" stroke={active ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={active ? 1 : 0.5} />
      <line x1="11" y1="10" x2="5"  y2="8"  stroke={active ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={active ? 1 : 0.5} />
      <line x1="11" y1="10" x2="17" y2="8"  stroke={active ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={active ? 1 : 0.5} />
      <line x1="11" y1="15" x2="7"  y2="21" stroke={active ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={active ? 1 : 0.5} />
      <line x1="11" y1="15" x2="15" y2="21" stroke={active ? '#06A77D' : '#4A6256'} strokeWidth="2.5" strokeLinecap="round" opacity={active ? 1 : 0.5} />
    </svg>
  );
  const TABS = [
    { id: 'home', label: 'Today',   Icon: TodayIcon   },
    { id: 'all',  label: 'All',     Icon: AllIcon     },
    { id: 'you',  label: 'Profile', Icon: ProfileIcon },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#FDFAF2', padding: '8px 10px 14px', borderTop: '1px solid #E0D8CC',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 680, margin: '0 auto' }}>
        <div style={{ flex: 1, background: '#E8F0EC', borderRadius: 14, padding: 4, display: 'flex', gap: 2 }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = view === id;
            return (
              <div key={id} onClick={() => setView(id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 0 6px', borderRadius: 10, gap: 5, cursor: 'pointer',
                background: active ? '#1A5C3A' : 'transparent', transition: 'background 0.15s',
              }}>
                <Icon active={active} />
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  fontFamily: 'DM Sans, sans-serif', color: active ? '#E8F5EE' : '#4A6256',
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onAdd}
          aria-label="Add a task"
          style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: '#1A5C3A', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill="#E8F5EE" />
            <circle cx="5"  cy="5"  r="1.2" fill="#E8F5EE" opacity="0.6" />
            <circle cx="19" cy="5"  r="0.9" fill="#E8F5EE" opacity="0.5" />
            <circle cx="19" cy="19" r="1.1" fill="#E8F5EE" opacity="0.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Overlay stack ─────────────────────────────────────────────────────────────
function Overlays({
  celebration, onCelebrationDone,
  markDoneModal, onMarkDone, onMarkDoneClose,
  assistTask, onAssistClose,
  creatorOpen, onCreatorClose,
  weeklyCheckInOpen, onWeeklyCheckInClose,
  lifeEventIntake, onLifeEventIntakeClose, onStartLifeEventConfirm,
}) {
  const { pendingConflict, resolveConflict } = useProfileContext();

  return (
    <>
      {celebration   && <Celebration onDone={onCelebrationDone} />}
      {markDoneModal && <MarkDoneModal task={markDoneModal} onDone={onMarkDone} onClose={onMarkDoneClose} />}
      {assistTask    && <AssistPanel task={assistTask} onClose={onAssistClose} />}
      {creatorOpen   && <TaskCreator onClose={onCreatorClose} />}
      {weeklyCheckInOpen && <WeeklyCheckIn onClose={onWeeklyCheckInClose} />}
      {pendingConflict && <ProfileConflictModal onResolve={resolveConflict} />}
      {lifeEventIntake === 'new-baby' && (
        <NewBabyIntake
          onClose={onLifeEventIntakeClose}
          onStart={(answers) => onStartLifeEventConfirm('new-baby', answers)}
          generateTaskList={newBabyTasksForIntake}
        />
      )}
    </>
  );
}

// ─── Root — wires up providers then delegates ──────────────────────────────────
export default function Mitzy() {
  const { user, loading: authLoading, authError, sendMagicLink, signInWithGoogle, signInWithPassword, signOut } = useAuth();
  const [welcomeChoice, setWelcomeChoice] = useState(() => loadS(WELCOME_CHOICE_KEY, null));

  if (authLoading) return <BrandSplash />;

  return (
    <ProfileProvider user={user} welcomeChoice={welcomeChoice}>
      <TaskProvider user={user}>
        <CalendarProvider user={user}>
        <MitzyApp
          user={user}
          authError={authError}
          signOut={signOut}
          sendMagicLink={sendMagicLink}
          signInWithGoogle={signInWithGoogle}
          signInWithPassword={signInWithPassword}
          welcomeChoice={welcomeChoice}
          setWelcomeChoice={setWelcomeChoice}
        />
        </CalendarProvider>
      </TaskProvider>
    </ProfileProvider>
  );
}

// ─── Inner app — consumes contexts ─────────────────────────────────────────────
function MitzyApp({ user, authError, signOut, sendMagicLink, signInWithGoogle, signInWithPassword, welcomeChoice, setWelcomeChoice }) {
  const { profile, taskLibrary, updateProfile, removeCustomTask, region, loading: profileLoading, syncError: profileSyncError, serverProfileChecked, serverProfileExists, lifeEvents } = useProfileContext();
  const { activeTasks, taskState, setTaskState, setDisabledTasks, markDone, markNotApplicable, markNeeded, setIntervalOverride, setOneTimeOverride, setDueDate, setStepProgress, markScheduled, snoozeTask, unsnoozeTask, nextUpcomingTask, loading: tasksLoading, syncError: tasksSyncError } = useTaskContext();
  const { pendingCalendarMatches, dismissMatch } = useCalendarContext();

  // ─── Onboarding state ──────────────────────────────────────────────────────
  const [profileDone, setProfileDone] = useState(() => loadS(PROFILE_DONE_KEY, false));
  const [onboarded,   setOnboarded]   = useState(() => loadS(ONBOARDED_KEY, false));

  // ─── UI state ──────────────────────────────────────────────────────────────
  const [view,            setView]            = useState("home");
  const [selectedTask,    setSelectedTask]    = useState(null);
  const [celebration,     setCelebration]     = useState(false);
  const [assistTask,      setAssistTask]      = useState(null);
  const [markDoneModal,   setMarkDoneModal]   = useState(null);
  const [creatorOpen,     setCreatorOpen]     = useState(false);
  const [weeklyCheckInOpen, setWeeklyCheckInOpen] = useState(false);
  const [activeCategory,  setActiveCategory]  = useState('all');
  const [dueOnly,         setDueOnly]         = useState(false);
  const [lifeEventIntake, setLifeEventIntake] = useState(null); // null | 'new-baby'
  const [snoozePickerTask, setSnoozePickerTask] = useState(null);
  const [nudgeState, setNudgeState] = useState(() => loadS(LIFE_EVENTS_NUDGE_KEY, { discoveryDismissed: false, wrapupDismissed: {} }));

  // ─── Session (trickle + hazards) ───────────────────────────────────────────
  const { trickleTask, dismissTrickle, answerTrickle, pendingHazards, setPendingHazards } = useSession({ onboarded, profile, activeTasks, taskState, tasksLoading });

  // ─── Returning user with no server profile → drop into new-user onboarding ─
  useEffect(() => {
    if (welcomeChoice === 'returning' && user && serverProfileChecked && !serverProfileExists) {
      saveS(WELCOME_CHOICE_KEY, 'new');
      setWelcomeChoice('new');
    }
  }, [welcomeChoice, user, serverProfileChecked, serverProfileExists, setWelcomeChoice]);

  // ─── Heal stale localStorage if server confirms user is already set up ──────
  useEffect(() => {
    if (user && serverProfileChecked && serverProfileExists) {
      if (!profileDone) { saveS(PROFILE_DONE_KEY, true); setProfileDone(true); }
      if (!onboarded)   { saveS(ONBOARDED_KEY,    true); setOnboarded(true);   }
    }
  }, [user, serverProfileChecked, serverProfileExists, profileDone, onboarded]);

  // ─── Onboarding handlers ───────────────────────────────────────────────────
  const handleSlimOnboardingComplete = (p) => {
    updateProfile(p);
    saveS(PROFILE_DONE_KEY, true);
    setProfileDone(true);
  };

  const handlePrioritySetupComplete = (initialTaskState, initialDisabled) => {
    setTaskState(initialTaskState);
    setDisabledTasks(initialDisabled);
    setOnboarded(true);
    saveS(ONBOARDED_KEY, true);
    saveS(VISIT_COUNT_KEY, 1);
  };

  // ─── Action handlers ───────────────────────────────────────────────────────
  const handleMarkDone = async (id, dateStr) => {
    const result = await markDone(id, dateStr);
    if (result?.error) return { error: true };
    // Suppress confetti for tasks tagged as sad/sensitive (sourced from life
    // event defs and from the AI task creator's safety classifier).
    const task = taskLibrary.find(t => t.id === id);
    if (!task?.suppressCelebration) setCelebration(true);
    setMarkDoneModal(null);
    return {};
  };

  const handleStartLifeEventConfirm = async (type, answers) => {
    await lifeEvents.startEvent(type, answers);
  };

  // ─── Life event nudge ──────────────────────────────────────────────────────
  // Pick which (if any) nudge to show on HomeView. Wrap-up wins over discovery
  // because it's only relevant when the user has fully engaged with an event.
  const visitCount = loadS(VISIT_COUNT_KEY, 0);
  const computeNudge = () => {
    const active = lifeEvents?.activeEvent;
    if (active) {
      const eventTasks = lifeEvents.activeEventTasks || [];
      const allDone = eventTasks.length > 0 && eventTasks.every(t => taskState[t.id]?.lastDone);
      const dismissedForThisEvent = nudgeState.wrapupDismissed?.[active.id];
      if (allDone && !dismissedForThisEvent) {
        return { variant: 'wrapup', eventLabel: LIFE_EVENT_DEFS[active.type]?.label ?? 'this event', activeId: active.id };
      }
      return null;
    }
    if (!nudgeState.discoveryDismissed && visitCount >= 2) {
      return { variant: 'discovery' };
    }
    return null;
  };
  const lifeEventNudge = computeNudge();

  const handleNudgePrimary = () => {
    if (!lifeEventNudge) return;
    if (lifeEventNudge.variant === 'discovery') {
      const next = { ...nudgeState, discoveryDismissed: true };
      setNudgeState(next); saveS(LIFE_EVENTS_NUDGE_KEY, next);
      setView('you');
    } else if (lifeEventNudge.variant === 'wrapup') {
      lifeEvents.completeEvent(lifeEventNudge.activeId);
      const next = {
        ...nudgeState,
        wrapupDismissed: { ...(nudgeState.wrapupDismissed || {}), [lifeEventNudge.activeId]: true },
      };
      setNudgeState(next); saveS(LIFE_EVENTS_NUDGE_KEY, next);
    }
  };

  const handleNudgeDismiss = () => {
    if (!lifeEventNudge) return;
    if (lifeEventNudge.variant === 'discovery') {
      const next = { ...nudgeState, discoveryDismissed: true };
      setNudgeState(next); saveS(LIFE_EVENTS_NUDGE_KEY, next);
    } else if (lifeEventNudge.variant === 'wrapup') {
      const next = {
        ...nudgeState,
        wrapupDismissed: { ...(nudgeState.wrapupDismissed || {}), [lifeEventNudge.activeId]: true },
      };
      setNudgeState(next); saveS(LIFE_EVENTS_NUDGE_KEY, next);
    }
  };

  const handleMarkDoneClose = () => {
    setMarkDoneModal(null);
    setSelectedTask(null);
  };

  const handleHazardAccept = () => {
    updateProfile({ ...profile, hazards: pendingHazards });
    setPendingHazards(null);
  };

  const handlePreviewHazardTasks = async () => {
    if (!profile?.zip) return null;
    const hazards = await detectHazards(profile.zip);
    const tasks = [...EM_UNIVERSAL];
    hazards.forEach(h => { if (EM_HAZARD[h]) tasks.push(...EM_HAZARD[h]); });
    return { hazards, tasks };
  };

  const handleConfirmHazardTasks = (hazards) => {
    updateProfile({ ...profile, hazards });
  };

  const handleReset = async () => {
    if (user) {
      const [{ error: te }, { error: pe }, { error: ce }, { error: we }] = await Promise.all([
        supabase.from("task_records").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("id", user.id),
        supabase.from("custom_tasks").delete().eq("user_id", user.id),
        supabase.from("weekly_plans").delete().eq("user_id", user.id),
      ]);
      if (te || pe || ce || we) return { error: "Couldn't delete your data from the server. Try again." };
    }
    await signOut();
    // signOut triggers SIGNED_OUT → clearLocalUserData() + reload in useAuth
  };

  // ─── Calendar match handlers ───────────────────────────────────────────────
  const handleMatchConfirm = async (taskId, eventDate) => {
    await markScheduled(taskId, eventDate);
    dismissMatch(taskId);
  };

  const handleMatchDismiss = (taskId) => {
    dismissMatch(taskId);
  };

  // ─── Shared overlay props ──────────────────────────────────────────────────
  const overlayProps = {
    celebration, onCelebrationDone: () => setCelebration(false),
    markDoneModal, onMarkDone: handleMarkDone, onMarkDoneClose: handleMarkDoneClose,
    assistTask, onAssistClose: () => setAssistTask(null),
    creatorOpen, onCreatorClose: () => setCreatorOpen(false),
    weeklyCheckInOpen, onWeeklyCheckInClose: () => setWeeklyCheckInOpen(false),
    lifeEventIntake,
    onLifeEventIntakeClose: () => setLifeEventIntake(null),
    onStartLifeEventConfirm: handleStartLifeEventConfirm,
  };

  // ─── Onboarding gates ──────────────────────────────────────────────────────
  const serverConfirmsOnboarded = !!(user && serverProfileChecked && serverProfileExists);

  // Hold on splash until the server profile check resolves — prevents flashing
  // onboarding screens for returning users whose localStorage is empty/stale.
  if (user && !serverProfileChecked) return <BrandSplash />;

  if (!welcomeChoice) {
    return <WelcomeGate onChoose={(choice) => {
      saveS(WELCOME_CHOICE_KEY, choice);
      setWelcomeChoice(choice);
    }} />;
  }
  if (welcomeChoice === 'returning' && !user) {
    return <LoginGate sendMagicLink={sendMagicLink} signInWithGoogle={signInWithGoogle} signInWithPassword={signInWithPassword} authError={authError} welcomeChoice={welcomeChoice} />;
  }
  if (!profileDone && !serverConfirmsOnboarded) return <SlimOnboarding onComplete={handleSlimOnboardingComplete} onBack={() => { saveS(WELCOME_CHOICE_KEY, 'returning'); setWelcomeChoice('returning'); }} />;
  if (!onboarded   && !serverConfirmsOnboarded) return <PrioritySetup taskLib={taskLibrary} region={region} onComplete={handlePrioritySetupComplete} />;
  if (!user)        return <LoginGate sendMagicLink={sendMagicLink} signInWithGoogle={signInWithGoogle} signInWithPassword={signInWithPassword} authError={authError} welcomeChoice={welcomeChoice} />;

  // ─── Task detail screen ────────────────────────────────────────────────────
  if (selectedTask) {
    return (
      <>
        <Overlays {...overlayProps} />
        <TaskDetailView
          task={selectedTask}
          taskState={taskState}
          onAssist={setAssistTask}
          onDone={(task) => {
            const entry = taskState[task.id];
            const effectiveTask = entry?.oneTime !== undefined ? { ...task, oneTime: entry.oneTime } : task;
            setMarkDoneModal(effectiveTask);
          }}
          onMarkDone={(task, dateStr) => markDone(task.id, dateStr)}
          onSetIntervalOverride={(id, days) => setIntervalOverride(id, days)}
          onSetOneTimeOverride={(id, oneTime) => setOneTimeOverride(id, oneTime)}
          onSetDueDate={(id, date) => setDueDate(id, date)}
          onSetStepProgress={(stepKey, entry) => setStepProgress(selectedTask.id, stepKey, entry)}
          onMarkNotApplicable={(id) => { markNotApplicable(id); setSelectedTask(null); }}
          onRemove={(id) => { removeCustomTask(id); setSelectedTask(null); }}
          onBack={() => setSelectedTask(null)}
          onUnsnooze={(id) => { unsnoozeTask(id); }}
        />
      </>
    );
  }

  // ─── Main app ──────────────────────────────────────────────────────────────
  const syncLoading = profileLoading || tasksLoading;
  const syncError   = profileSyncError || tasksSyncError;

  return (
    <div style={{ background: '#FDFAF2', minHeight: '100vh' }}>
      <SyncBanner loading={syncLoading} error={syncError} />
      <Overlays {...overlayProps} />

      {view === "home" && (
        <HomeView
          trickleTask={trickleTask}
          pendingHazards={pendingHazards}
          nextUpcomingTask={nextUpcomingTask}
          lifeEventNudge={lifeEventNudge}
          onLifeEventNudgePrimary={handleNudgePrimary}
          onLifeEventNudgeDismiss={handleNudgeDismiss}
          onGoToAll={() => setView('all')}
          onSelectTask={setSelectedTask}
          onDoneTask={setMarkDoneModal}
          onSnooze={setSnoozePickerTask}
          onTrickleAnswer={(answer) => {
            if (answer.needed)             markNeeded(answer.taskId);
            else if (answer.notApplicable) markNotApplicable(answer.taskId);
            else                           markDone(answer.taskId, answer.lastDone, answer.intervalDays);
            answerTrickle();
          }}
          onTrickleDismiss={dismissTrickle}
          onTrickleAssist={setAssistTask}
          onHazardAccept={handleHazardAccept}
          onHazardDismiss={() => setPendingHazards(null)}
          onMatchConfirm={handleMatchConfirm}
          onMatchDismiss={handleMatchDismiss}
          onOpenWeeklyCheckIn={() => setWeeklyCheckInOpen(true)}
        />
      )}

      {view === "all" && (
        <AllView
          onSelectTask={setSelectedTask}
          onDoneTask={setMarkDoneModal}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          dueOnly={dueOnly}
          setDueOnly={setDueOnly}
          onMatchConfirm={handleMatchConfirm}
          onMatchDismiss={handleMatchDismiss}
          onSnooze={setSnoozePickerTask}
        />
      )}

      {view === "you" && (
        <ProfileView
          onReset={handleReset}
          onPreviewHazardTasks={handlePreviewHazardTasks}
          onConfirmHazardTasks={handleConfirmHazardTasks}
          user={user}
          onSignOut={signOut}
          onStartLifeEvent={(type) => setLifeEventIntake(type)}
        />
      )}

      {snoozePickerTask && (
        <SnoozePicker
          task={snoozePickerTask}
          onSnooze={(id, date) => { snoozeTask(id, date); setSnoozePickerTask(null); }}
          onClose={() => setSnoozePickerTask(null)}
        />
      )}

      <BottomDock view={view} setView={setView} onAdd={() => setCreatorOpen(true)} />
    </div>
  );
}
