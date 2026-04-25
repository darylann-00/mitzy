import { useState } from "react";
import "./styles/app.css";

import { loadS, saveS, ONBOARDED_KEY, PROFILE_DONE_KEY, VISIT_COUNT_KEY, WELCOME_CHOICE_KEY } from "./utils/storage";
import { detectHazards } from "./utils/hazards";
import { supabase } from "./lib/supabase";

import { useAuth }    from "./hooks/useAuth";
import { useSession } from "./hooks/useSession";

import { ProfileProvider, useProfileContext } from "./contexts/ProfileContext";
import { TaskProvider,   useTaskContext }    from "./contexts/TaskContext";

import { LoginGate }      from "./components/LoginGate";
import { BrandSplash }    from "./components/BrandSplash";
import { WelcomeGate }    from "./components/WelcomeGate";
import { SlimOnboarding } from "./onboarding/SlimOnboarding";
import { PrioritySetup }  from "./onboarding/PrioritySetup";

import { Celebration }   from "./components/Celebration";
import { AssistPanel }   from "./components/AssistPanel";
import { SchedulePanel } from "./components/SchedulePanel";
import { MarkDoneModal } from "./components/MarkDoneModal";
import { AddTaskPanel }  from "./components/AddTaskPanel";
import { ProfileConflictModal } from "./components/ProfileConflictModal";

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
function BottomDock({ view, setView, onAI }) {
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
          onClick={onAI}
          aria-label="AI assistant"
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

// ─── FAB ───────────────────────────────────────────────────────────────────────
function FABGroup({ showAdd, onAdd }) {
  if (!showAdd) return null;
  return (
    <button
      onClick={onAdd}
      aria-label="Add a task"
      style={{
        position: 'fixed', bottom: 96, right: 20, zIndex: 190,
        width: 56, height: 56, borderRadius: '50%',
        background: '#fff', border: '1.5px solid #1A5C3A',
        cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <line x1="11" y1="3" x2="11" y2="19" stroke="#1A5C3A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="3"  y1="11" x2="19" y2="11" stroke="#1A5C3A" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── Overlay stack ─────────────────────────────────────────────────────────────
function Overlays({
  celebration, onCelebrationDone,
  markDoneModal, onMarkDone, onMarkDoneClose,
  assistTask, onAssistClose,
  scheduleTask, onScheduleClose,
  addingTask, onAddClose,
}) {
  const { addCustomTask, pendingConflict, resolveConflict } = useProfileContext();
  const { markScheduled } = useTaskContext();

  return (
    <>
      {celebration   && <Celebration onDone={onCelebrationDone} />}
      {markDoneModal && <MarkDoneModal task={markDoneModal} onDone={onMarkDone} onClose={onMarkDoneClose} />}
      {assistTask    && <AssistPanel task={assistTask} onClose={onAssistClose} />}
      {scheduleTask  && <SchedulePanel task={scheduleTask} onSchedule={(d) => markScheduled(scheduleTask.id, d)} onClose={onScheduleClose} />}
      {addingTask    && <AddTaskPanel onAdd={addCustomTask} onClose={onAddClose} />}
      {pendingConflict && <ProfileConflictModal onResolve={resolveConflict} />}
    </>
  );
}

// ─── Root — wires up providers then delegates ──────────────────────────────────
export default function Mitzy() {
  const { user, loading: authLoading, authError, sendMagicLink, signInWithGoogle, signOut } = useAuth();
  const [welcomeChoice, setWelcomeChoice] = useState(() => loadS(WELCOME_CHOICE_KEY, null));

  if (authLoading) return <BrandSplash />;

  return (
    <ProfileProvider user={user} welcomeChoice={welcomeChoice}>
      <TaskProvider user={user}>
        <MitzyApp
          user={user}
          authError={authError}
          signOut={signOut}
          sendMagicLink={sendMagicLink}
          signInWithGoogle={signInWithGoogle}
          welcomeChoice={welcomeChoice}
          setWelcomeChoice={setWelcomeChoice}
        />
      </TaskProvider>
    </ProfileProvider>
  );
}

// ─── Inner app — consumes contexts ─────────────────────────────────────────────
function MitzyApp({ user, authError, signOut, sendMagicLink, signInWithGoogle, welcomeChoice, setWelcomeChoice }) {
  const { profile, taskLibrary, updateProfile, region, loading: profileLoading, syncError: profileSyncError } = useProfileContext();
  const { activeTasks, taskState, setTaskState, setDisabledTasks, markDone, markNotApplicable, markNeeded, setIntervalOverride, nextUpcomingTask, loading: tasksLoading, syncError: tasksSyncError } = useTaskContext();

  // ─── Onboarding state ──────────────────────────────────────────────────────
  const [profileDone, setProfileDone] = useState(() => loadS(PROFILE_DONE_KEY, false));
  const [onboarded,   setOnboarded]   = useState(() => loadS(ONBOARDED_KEY, false));

  // ─── UI state ──────────────────────────────────────────────────────────────
  const [view,            setView]            = useState("home");
  const [selectedTask,    setSelectedTask]    = useState(null);
  const [celebration,     setCelebration]     = useState(false);
  const [assistTask,      setAssistTask]      = useState(null);
  const [scheduleTask,    setScheduleTask]    = useState(null);
  const [markDoneModal,   setMarkDoneModal]   = useState(null);
  const [addingTask,      setAddingTask]      = useState(false);
  const [activeCategory,  setActiveCategory]  = useState('all');
  const [dueOnly,         setDueOnly]         = useState(false);

  // ─── Session (trickle + hazards) ───────────────────────────────────────────
  const { trickleTask, dismissTrickle, answerTrickle, pendingHazards, setPendingHazards } = useSession({ onboarded, profile, activeTasks, taskState });

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
    setCelebration(true);
    setMarkDoneModal(null);
    return {};
  };

  const handleMarkDoneClose = () => {
    setMarkDoneModal(null);
    setSelectedTask(null);
  };

  const handleHazardAccept = () => {
    updateProfile({ ...profile, hazards: pendingHazards });
    setPendingHazards(null);
  };

  const handleAddHazardTasks = async () => {
    if (!profile?.zip) return;
    const hazards = await detectHazards(profile.zip);
    if (hazards.length > 0) updateProfile({ ...profile, hazards });
  };

  const handleReset = async () => {
    if (user) {
      const [{ error: te }, { error: pe }] = await Promise.all([
        supabase.from("task_records").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("id", user.id),
      ]);
      if (te || pe) return { error: "Couldn't delete your data from the server. Try again." };
    }
    await signOut();
    // signOut triggers SIGNED_OUT → clearLocalUserData() + reload in useAuth
  };

  // ─── Shared overlay props ──────────────────────────────────────────────────
  const overlayProps = {
    celebration, onCelebrationDone: () => setCelebration(false),
    markDoneModal, onMarkDone: handleMarkDone, onMarkDoneClose: handleMarkDoneClose,
    assistTask, onAssistClose: () => setAssistTask(null),
    scheduleTask, onScheduleClose: () => setScheduleTask(null),
    addingTask, onAddClose: () => setAddingTask(false),
  };

  // ─── Onboarding gates ──────────────────────────────────────────────────────
  if (!welcomeChoice) {
    return <WelcomeGate onChoose={(choice) => {
      saveS(WELCOME_CHOICE_KEY, choice);
      setWelcomeChoice(choice);
    }} />;
  }
  if (welcomeChoice === 'returning' && !user) {
    return <LoginGate sendMagicLink={sendMagicLink} signInWithGoogle={signInWithGoogle} authError={authError} />;
  }
  if (!profileDone) return <SlimOnboarding onComplete={handleSlimOnboardingComplete} />;
  if (!onboarded)   return <PrioritySetup taskLib={taskLibrary} region={region} onComplete={handlePrioritySetupComplete} />;
  if (!user)        return <LoginGate sendMagicLink={sendMagicLink} signInWithGoogle={signInWithGoogle} authError={authError} />;

  // ─── Task detail screen ────────────────────────────────────────────────────
  if (selectedTask) {
    return (
      <>
        <Overlays {...overlayProps} />
        <TaskDetailView
          task={selectedTask}
          onAssist={setAssistTask}
          onSchedule={setScheduleTask}
          onDone={setMarkDoneModal}
          onMarkDone={(task, dateStr) => markDone(task.id, dateStr)}
          onSetIntervalOverride={(id, days) => setIntervalOverride(id, days)}
          onBack={() => setSelectedTask(null)}
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
          onGoToAll={() => setView('all')}
          onSelectTask={setSelectedTask}
          onDoneTask={setMarkDoneModal}
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
        />
      )}

      {view === "you" && (
        <ProfileView
          onReset={handleReset}
          onAddHazardTasks={handleAddHazardTasks}
          user={user}
          onSignOut={signOut}
        />
      )}

      <FABGroup showAdd={view === 'home' || view === 'all'} onAdd={() => setAddingTask(true)} />
      <BottomDock view={view} setView={setView} onAI={() => {}} />
    </div>
  );
}
