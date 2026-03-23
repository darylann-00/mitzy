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

import { HomeView }       from "./views/HomeView";
import { AllView }        from "./views/AllView";
import { YouView }        from "./views/YouView";
import { TaskDetailView } from "./views/TaskDetailView";

import { C } from "./data/constants";

export default function Mitzy() {
  // ─── Onboarding state ───────────────────────────────────────────────────────
  const [profileDone, setProfileDone] = useState(() => loadS(ONBOARDED_KEY + "-p", false));
  const [onboarded,   setOnboarded]   = useState(() => loadS(ONBOARDED_KEY, false));

  // ─── Domain state (via hooks) ────────────────────────────────────────────────
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
  const needsConfirm  = activeTasks.filter(t => getStatus(t) === "confirm");

  // ─── Onboarding gates ─────────────────────────────────────────────────────────
  if (!profileDone) return <SlimOnboarding onComplete={handleSlimOnboardingComplete} />;
  if (!onboarded)   return <PrioritySetup taskLib={taskLibrary} onComplete={handlePrioritySetupComplete} />;

  // ─── Task detail screen ───────────────────────────────────────────────────────
  if (selectedTask) {
    return (
      <>
        <Overlays
          celebration={celebration}  onCelebrationDone={() => setCelebration(false)}
          markDoneModal={markDoneModal} onMarkDone={handleMarkDone} onMarkDoneClose={() => setMarkDoneModal(null)}
          assistTask={assistTask}    onAssistClose={() => setAssistTask(null)}
          scheduleTask={scheduleTask} onSchedule={(d) => markScheduled(scheduleTask.id, d)} onScheduleClose={() => setScheduleTask(null)}
          addingTask={addingTask}    onAddTask={addCustomTask} onAddClose={() => setAddingTask(false)}
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
    <div className="mr paper">
      <Overlays
        celebration={celebration}  onCelebrationDone={() => setCelebration(false)}
        markDoneModal={markDoneModal} onMarkDone={handleMarkDone} onMarkDoneClose={() => setMarkDoneModal(null)}
        assistTask={assistTask}    onAssistClose={() => setAssistTask(null)}
        scheduleTask={scheduleTask} onSchedule={(d) => markScheduled(scheduleTask.id, d)} onScheduleClose={() => setScheduleTask(null)}
        addingTask={addingTask}    onAddTask={addCustomTask} onAddClose={() => setAddingTask(false)}
        profile={profile} providerHistory={providerHistory} onSaveProvider={saveProvider}
      />

      {/* Header */}
      <div className="paper" style={{ borderBottom: "4px solid rgba(255,92,92,0.16)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="mf" style={{ fontSize: 28, color: C.coral, letterSpacing: 0.2 }}>mitzy ✦</div>
      </div>

      {view === "home" && (
        <HomeView
          trickleQ={trickleQ}
          profile={profile}
          pendingHazards={pendingHazards}
          needsConfirm={needsConfirm}
          urgentTasks={urgentTasks}
          upcomingTasks={upcomingTasks}
          providerHistory={providerHistory}
          taskState={taskState}
          getStatus={getStatus}
          getDays={getDays}
          getNext={getNext}
          onSelectTask={setSelectedTask}
          onDoneTask={setMarkDoneModal}
          onScheduleTask={setScheduleTask}
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
          onAddTask={() => setAddingTask(true)}
        />
      )}

      {view === "you" && (
        <YouView profile={profile} onReset={handleReset} />
      )}

      <BottomNav view={view} setView={setView} />
    </div>
  );
}

// ─── Overlay stack ────────────────────────────────────────────────────────────
function Overlays({ celebration, onCelebrationDone, markDoneModal, onMarkDone, onMarkDoneClose, assistTask, onAssistClose, scheduleTask, onSchedule, onScheduleClose, addingTask, onAddTask, onAddClose, profile, providerHistory, onSaveProvider }) {
  return (
    <>
      {celebration  && <Celebration onDone={onCelebrationDone} />}
      {markDoneModal && <MarkDoneModal task={markDoneModal} onDone={onMarkDone} onClose={onMarkDoneClose} />}
      {assistTask   && <AssistPanel task={assistTask} profile={profile} providerHistory={providerHistory} onSaveProvider={onSaveProvider} onClose={onAssistClose} />}
      {scheduleTask && <SchedulePanel task={scheduleTask} onSchedule={onSchedule} onClose={onScheduleClose} />}
      {addingTask   && <AddTaskPanel onAdd={onAddTask} onClose={onAddClose} />}
    </>
  );
}
