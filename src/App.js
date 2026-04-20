import { useState } from "react";
import "./styles/app.css";

import { loadS, saveS, ONBOARDED_KEY, VISIT_COUNT_KEY } from "./utils/storage";
import { taskStatus, taskScore, nextDueStr, isWindowActive, isDependencySatisfied } from "./utils/taskLogic";
import { getClimateRegion } from "./utils/climateRegion";
import { buildTaskLibrary } from "./data/taskFactory";

import { supabase } from "./lib/supabase";
import { useAuth }     from "./hooks/useAuth";
import { useProfile }   from "./hooks/useProfile";
import { useTasks }     from "./hooks/useTasks";
import { useProviders } from "./hooks/useProviders";
import { useSession }   from "./hooks/useSession";

import { LoginGate }      from "./components/LoginGate";
import { SlimOnboarding } from "./onboarding/SlimOnboarding";
import { PrioritySetup }  from "./onboarding/PrioritySetup";

import { Celebration }    from "./components/Celebration";
import { AssistPanel }    from "./components/AssistPanel";
import { SchedulePanel }  from "./components/SchedulePanel";
import { MarkDoneModal }  from "./components/MarkDoneModal";
import { AddTaskPanel }   from "./components/AddTaskPanel";

import { HomeView }    from "./views/HomeView";
import { AllView }     from "./views/AllView";
import { ProfileView } from "./views/ProfileView";
import { TaskDetailView } from "./views/TaskDetailView";

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
        {/* Nav pill */}
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

        {/* Sparkle AI button */}
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

// ─── FAB (HomeView only: add task) ────────────────────────────────────────────
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

export default function Mitzy() {
  // ─── Auth ────────────────────────────────────────────────────────────────────
  const { user, loading: authLoading, sendMagicLink, signInWithGoogle, signOut } = useAuth();

  // ─── Onboarding state ────────────────────────────────────────────────────────
  const [profileDone, setProfileDone] = useState(() => loadS(ONBOARDED_KEY + "-p", false));
  const [onboarded,   setOnboarded]   = useState(() => loadS(ONBOARDED_KEY, false));

  // ─── Domain state ────────────────────────────────────────────────────────────
  const { profile, taskLibrary, setTaskLibrary, updateProfile, addCustomTask } = useProfile(user);
  const { taskState, setTaskState, disabledTasks, setDisabledTasks, markDone, markScheduled, markNotApplicable, markNeeded, setIntervalOverride } = useTasks(user);
  const { providerHistory, saveProvider } = useProviders();

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [view,          setView]          = useState("home");
  const [selectedTask,  setSelectedTask]  = useState(null);
  const [celebration,   setCelebration]   = useState(false);
  const [assistTask,    setAssistTask]    = useState(null);
  const [scheduleTask,  setScheduleTask]  = useState(null);
  const [markDoneModal, setMarkDoneModal] = useState(null);
  const [addingTask,    setAddingTask]    = useState(false);

  // ─── Onboarding handlers ─────────────────────────────────────────────────────
  const handleSlimOnboardingComplete = (p) => {
    setTaskLibrary(buildTaskLibrary(p));
    updateProfile(p);
    saveS(ONBOARDED_KEY + "-p", true);
    setProfileDone(true);
  };

  const handlePrioritySetupComplete = (initialTaskState, initialDisabled) => {
    setTaskState(initialTaskState);
    setDisabledTasks(initialDisabled);
    setOnboarded(true);
    saveS(ONBOARDED_KEY, true);
    saveS(VISIT_COUNT_KEY, 1);
  };

  // ─── Task helpers ─────────────────────────────────────────────────────────────
  const activeTasks = taskLibrary.filter(t => !disabledTasks[t.id] && isDependencySatisfied(t, taskState));

  const { trickleTask, dismissTrickle, answerTrickle, pendingHazards, setPendingHazards } = useSession({ onboarded, profile, activeTasks, taskState });

  const region = getClimateRegion(profile?.zip);

  const isVisible = (t) => {
    if (!isWindowActive(t, region)) return false;
    const entry = taskState[t.id];
    if (!entry?.lastDone) return true;
    const daysSince = Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
    return daysSince >= (t.intervalDays - t.windowDays);
  };

  const getStatus = (t) => taskStatus(t, taskState);
  const getDays   = (t) => {
    const entry = taskState[t.id];
    if (!entry?.lastDone) return 0;
    const intervalDays = entry?.intervalDays ?? t.intervalDays;
    return intervalDays - Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
  };
  const getNext  = (t) => nextDueStr(t, taskState[t.id]?.lastDone, taskState[t.id]?.intervalDays);
  const getScore = (t) => taskScore(t, taskState[t.id]?.lastDone, taskState[t.id]?.intervalDays);

  // ─── Action handlers ──────────────────────────────────────────────────────────
  const handleMarkDone = (id, dateStr) => {
    markDone(id, dateStr);
    setCelebration(true);
    setMarkDoneModal(null);
  };

  const handleMarkDoneClose = () => {
    setMarkDoneModal(null);
    setSelectedTask(null);
  };

  const handleHazardAccept = () => {
    const next = { ...profile, hazards: pendingHazards };
    updateProfile(next);
    setPendingHazards(null);
  };

  const handleReset = async () => {
    if (user) {
      await Promise.all([
        supabase.from("task_records").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("id", user.id),
      ]);
    }
    localStorage.clear();
    await signOut();
    window.location.reload();
  };

  // ─── Derived task lists ───────────────────────────────────────────────────────
  const visibleTasks  = activeTasks.filter(isVisible);
  const scoredDue     = [...visibleTasks].filter(t => getStatus(t) !== "ok").sort((a, b) => getScore(b) - getScore(a));
  const focusTasks    = scoredDue.filter(t => getStatus(t) !== "unknown").slice(0, 3);
  const doneThisWeek  = Object.values(taskState).filter(entry => {
    if (!entry?.lastDone) return false;
    return (Date.now() - new Date(entry.lastDone)) <= 7 * 86400000;
  }).length;

  // ─── Onboarding gates ─────────────────────────────────────────────────────────
  if (authLoading)  return null;
  if (!profileDone) return <SlimOnboarding onComplete={handleSlimOnboardingComplete} />;
  if (!onboarded)   return <PrioritySetup taskLib={taskLibrary} onComplete={handlePrioritySetupComplete} />;
  if (!user)        return <LoginGate sendMagicLink={sendMagicLink} signInWithGoogle={signInWithGoogle} />;

  // ─── Task detail screen ───────────────────────────────────────────────────────
  if (selectedTask) {
    return (
      <>
        <Overlays
          celebration={celebration}     onCelebrationDone={() => setCelebration(false)}
          markDoneModal={markDoneModal}  onMarkDone={handleMarkDone} onMarkDoneClose={handleMarkDoneClose}
          assistTask={assistTask}        onAssistClose={() => setAssistTask(null)}
          scheduleTask={scheduleTask}    onSchedule={(d) => markScheduled(scheduleTask.id, d)} onScheduleClose={() => setScheduleTask(null)}
          addingTask={addingTask}        onAddTask={addCustomTask} onAddClose={() => setAddingTask(false)}
          profile={profile} providerHistory={providerHistory} onSaveProvider={saveProvider}
        />
        <TaskDetailView
          task={selectedTask}
          status={getStatus(selectedTask)}
          taskState={taskState}
          savedProvider={providerHistory[selectedTask.id]}
          getNext={getNext}
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

  // ─── Main app ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:'#FDFAF2', minHeight:'100vh' }}>
      <Overlays
        celebration={celebration}     onCelebrationDone={() => setCelebration(false)}
        markDoneModal={markDoneModal}  onMarkDone={handleMarkDone} onMarkDoneClose={handleMarkDoneClose}
        assistTask={assistTask}        onAssistClose={() => setAssistTask(null)}
        scheduleTask={scheduleTask}    onSchedule={(d) => markScheduled(scheduleTask.id, d)} onScheduleClose={() => setScheduleTask(null)}
        addingTask={addingTask}        onAddTask={addCustomTask} onAddClose={() => setAddingTask(false)}
        profile={profile} providerHistory={providerHistory} onSaveProvider={saveProvider}
      />

      {view === "home" && (
        <HomeView
          trickleTask={trickleTask}
          profile={profile}
          pendingHazards={pendingHazards}
          focusTasks={focusTasks}
          doneThisWeek={doneThisWeek}
          providerHistory={providerHistory}
          getStatus={getStatus}
          getDays={getDays}
          onSelectTask={setSelectedTask}
          onDoneTask={setMarkDoneModal}
          onTrickleAnswer={(answer) => {
            if (answer.needed) {
              markNeeded(answer.taskId);
            } else if (answer.notApplicable) {
              markNotApplicable(answer.taskId);
            } else {
              markDone(answer.taskId, answer.lastDone, answer.intervalDays);
            }
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
          activeTasks={activeTasks}
          getStatus={getStatus}
          getDays={getDays}
          providerHistory={providerHistory}
          onSelectTask={setSelectedTask}
          onDoneTask={setMarkDoneModal}
          markDone={markDone}
          markNeeded={markNeeded}
        />
      )}

      {view === "you" && (
        <ProfileView
          profile={profile}
          providerHistory={providerHistory}
          onReset={handleReset}
          onUpdateProfile={updateProfile}
          user={user}
          onSignOut={signOut}
        />
      )}

      <FABGroup showAdd={view === 'home' || view === 'all'} onAdd={() => setAddingTask(true)} />
      <BottomDock view={view} setView={setView} onAI={() => console.log('AI input')} />
    </div>
  );
}

// ─── Overlay stack ────────────────────────────────────────────────────────────
function Overlays({ celebration, onCelebrationDone, markDoneModal, onMarkDone, onMarkDoneClose, assistTask, onAssistClose, scheduleTask, onSchedule, onScheduleClose, addingTask, onAddTask, onAddClose, profile, providerHistory, onSaveProvider }) {
  return (
    <>
      {celebration   && <Celebration onDone={onCelebrationDone} />}
      {markDoneModal && (
        <MarkDoneModal
          task={markDoneModal}
          onDone={onMarkDone}
          onClose={onMarkDoneClose}
        />
      )}
      {assistTask   && <AssistPanel task={assistTask} profile={profile} providerHistory={providerHistory} onSaveProvider={onSaveProvider} onClose={onAssistClose} />}
      {scheduleTask && <SchedulePanel task={scheduleTask} onSchedule={onSchedule} onClose={onScheduleClose} />}
      {addingTask   && <AddTaskPanel onAdd={onAddTask} onClose={onAddClose} />}
    </>
  );
}
