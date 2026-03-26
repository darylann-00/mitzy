import { useState } from "react";
import "./styles/app.css";

import { loadS, saveS, ONBOARDED_KEY, VISIT_COUNT_KEY, TASK_STATE_KEY, DISABLED_KEY, PROFILE_KEY, PROVIDER_HISTORY_KEY, ASSIST_CACHE_PREFIX, HAZARD_DONE_KEY, KNOWLEDGE_REFRESH_KEY, PROFILE_QUESTIONS_KEY } from "./utils/storage";
import { taskStatus, taskScore, nextDueStr, isActiveMonth } from "./utils/taskLogic";
import { buildTaskLibrary } from "./data/taskFactory";

import { useProfile }   from "./hooks/useProfile";
import { useTasks }     from "./hooks/useTasks";
import { useProviders } from "./hooks/useProviders";
import { useSession }   from "./hooks/useSession";

import { SlimOnboarding } from "./onboarding/SlimOnboarding";
import { PrioritySetup }  from "./onboarding/PrioritySetup";

import { Celebration }    from "./components/Celebration";
import { BottomNav }      from "./components/BottomNav";
import { AssistPanel }    from "./components/AssistPanel";
import { SchedulePanel }  from "./components/SchedulePanel";
import { MarkDoneModal }  from "./components/MarkDoneModal";
import { AddTaskPanel }   from "./components/AddTaskPanel";

import { HomeView }    from "./views/HomeView";
import { AllView }     from "./views/AllView";
import { ProfileView } from "./views/ProfileView";
import { TaskDetailView } from "./views/TaskDetailView";

// ─── Mitzy Prompt Bar ──────────────────────────────────────────────────────────
function MitzyPromptBar({ onOpen }) {
  return (
    <div style={{ padding:'10px 14px', background:'#FDFAF2', borderTop:'1px solid #E0D8CC' }}>
      <div
        onClick={onOpen}
        style={{
          display:'flex', alignItems:'center', gap:10,
          background:'#fff', border:'2px solid #1A5C3A',
          borderRadius:14, padding:'10px 14px', cursor:'pointer',
          maxWidth:680, margin:'0 auto',
        }}
      >
        {/* Four dot mark */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, flexShrink:0 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#D62828' }} />
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#F77F00' }} />
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#06A77D' }} />
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#F4C430' }} />
        </div>
        <span style={{ flex:1, fontSize:13, fontWeight:500, color:'#4A6256', fontFamily:'DM Sans, sans-serif' }}>
          What do you need to get done?
        </span>
        <div style={{ width:28, height:28, borderRadius:8, background:'#1A5C3A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="#E8F5EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Mitzy() {
  // ─── Onboarding state ────────────────────────────────────────────────────────
  const [profileDone, setProfileDone] = useState(() => loadS(ONBOARDED_KEY + "-p", false));
  const [onboarded,   setOnboarded]   = useState(() => loadS(ONBOARDED_KEY, false));

  // ─── Domain state ────────────────────────────────────────────────────────────
  const { profile, taskLibrary, setTaskLibrary, updateProfile, addCustomTask } = useProfile();
  const { taskState, setTaskState, disabledTasks, setDisabledTasks, markDone, markScheduled } = useTasks();
  const { providerHistory, saveProvider } = useProviders();
  const { trickleQ, dismissTrickle, answerTrickle, pendingHazards, setPendingHazards } = useSession({ onboarded, profile });

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
  const activeTasks = taskLibrary.filter(t => !disabledTasks[t.id]);

  const isVisible = (t) => {
    if (!isActiveMonth(t)) return false;
    const entry = taskState[t.id];
    if (!entry?.lastDone) return true;
    const daysSince = Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
    return daysSince >= (t.intervalDays - t.windowDays);
  };

  const getStatus = (t) => taskStatus(t, taskState);
  const getDays   = (t) => {
    const entry = taskState[t.id];
    if (!entry?.lastDone) return 0;
    return t.intervalDays - Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
  };
  const getNext  = (t) => nextDueStr(t, taskState[t.id]?.lastDone);
  const getScore = (t) => taskScore(t, taskState[t.id]?.lastDone);

  // ─── Action handlers ──────────────────────────────────────────────────────────
  const handleMarkDone = (id, dateStr) => {
    markDone(id, dateStr);
    setCelebration(true);
    // Don't close modal — PostDoneFlow in MarkDoneModal handles "Back to my list"
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

  const handleReset = () => {
    [ONBOARDED_KEY, ONBOARDED_KEY + "-p", TASK_STATE_KEY, DISABLED_KEY,
     PROFILE_KEY, PROVIDER_HISTORY_KEY, ASSIST_CACHE_PREFIX,
     HAZARD_DONE_KEY, KNOWLEDGE_REFRESH_KEY, PROFILE_QUESTIONS_KEY, VISIT_COUNT_KEY,
    ].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  // ─── Derived task lists ───────────────────────────────────────────────────────
  const visibleTasks  = activeTasks.filter(isVisible);
  const scoredDue     = [...visibleTasks].filter(t => getStatus(t) !== "ok").sort((a, b) => getScore(b) - getScore(a));
  const urgentTasks   = scoredDue.filter(t => getStatus(t) === "due" || getStatus(t) === "confirm").slice(0, 3);
  const upcomingTasks = scoredDue.filter(t => getStatus(t) === "coming-up" || getStatus(t) === "scheduled").slice(0, 3);

  // ─── Onboarding gates ─────────────────────────────────────────────────────────
  if (!profileDone) return <SlimOnboarding onComplete={handleSlimOnboardingComplete} />;
  if (!onboarded)   return <PrioritySetup taskLib={taskLibrary} onComplete={handlePrioritySetupComplete} />;

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
          trickleQ={trickleQ}
          profile={profile}
          pendingHazards={pendingHazards}
          urgentTasks={urgentTasks}
          upcomingTasks={upcomingTasks}
          providerHistory={providerHistory}
          getStatus={getStatus}
          getDays={getDays}
          onSelectTask={setSelectedTask}
          onDoneTask={setMarkDoneModal}
          onTrickleAnswer={(updates) => answerTrickle(updates, updateProfile)}
          onTrickleDismiss={dismissTrickle}
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
        />
      )}

      {view === "you" && (
        <ProfileView
          profile={profile}
          providerHistory={providerHistory}
          onReset={handleReset}
        />
      )}

      <MitzyPromptBar onOpen={() => setAddingTask(true)} />
      <BottomNav view={view} setView={setView} />
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
          providerHistory={providerHistory}
          onSaveProvider={onSaveProvider}
        />
      )}
      {assistTask   && <AssistPanel task={assistTask} profile={profile} providerHistory={providerHistory} onSaveProvider={onSaveProvider} onClose={onAssistClose} />}
      {scheduleTask && <SchedulePanel task={scheduleTask} onSchedule={onSchedule} onClose={onScheduleClose} />}
      {addingTask   && <AddTaskPanel onAdd={onAddTask} onClose={onAddClose} />}
    </>
  );
}
