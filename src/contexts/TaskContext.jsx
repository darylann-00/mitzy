import { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react";
import { useTasks } from "../hooks/useTasks";
import { useWeeklyPlan } from "../hooks/useWeeklyPlan";
import { useProfileContext } from "./ProfileContext";
import { taskStatus, taskScore, nextDueStr, isWindowActive, isDependencySatisfied } from "../utils/taskLogic";
import { loadS, saveS, FOCUS_SEEN_KEY } from "../utils/storage";

const FOCUS_SUPPRESS_AFTER_DAYS = 7;
const FOCUS_SUPPRESS_FOR_DAYS   = 7;
const todayStr = () => new Date().toISOString().slice(0, 10);

export const CAPACITY_FOCUS_COUNT = { low: 1, normal: 3, high: 5 };

const TaskContext = createContext(null);

export function TaskProvider({ user, children }) {
  const { taskLibrary, region, profile, updateUiState } = useProfileContext();
  const {
    taskState, setTaskState,
    disabledTasks, setDisabledTasks,
    markDone, markScheduled, markNotApplicable, markNeeded, setIntervalOverride, setOneTimeOverride, setDueDate, setStepProgress,
    snoozeTask, unsnoozeTask,
    loading, syncError,
  } = useTasks(user);

  const {
    activePlan, isInPlanMode, planProgress, weekStart, planningNextWeek, planFloor,
    confirmPlan, addToPlan, removeFromPlan,
    showNudge: showWeeklyNudge, dismissNudge: dismissWeeklyNudge,
  } = useWeeklyPlan(user, taskState, markScheduled, profile.uiState, updateUiState);

  // Snooze means "hide until this date" — if the task is in the frozen weekly
  // plan, it leaves the plan too so plan mode doesn't keep showing it.
  const snoozeTaskAndUnplan = useCallback(async (id, untilDate) => {
    await snoozeTask(id, untilDate);
    if (isInPlanMode) await removeFromPlan(id);
  }, [snoozeTask, isInPlanMode, removeFromPlan]);

  const activeTasks = useMemo(() =>
    taskLibrary.filter(t => !disabledTasks[t.id] && isDependencySatisfied(t, taskState)),
    [taskLibrary, disabledTasks, taskState]
  );

  const visibleTasks = useMemo(() => activeTasks.filter(t => {
    if (!isWindowActive(t, region)) return false;
    const entry = taskState[t.id];
    if (!entry?.lastDone) return true;
    const daysSince = Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
    return daysSince >= (t.intervalDays - t.windowDays);
  }), [activeTasks, taskState, region]);

  const scoredDue = useMemo(() => [...visibleTasks]
    .filter(t => {
      const s = taskStatus(t, taskState);
      return s !== "ok" && s !== "snoozed";
    })
    .sort((a, b) => {
      const sa = taskScore(a, taskState[a.id]?.lastDone, taskState[a.id]?.intervalDays, taskState[a.id]?.oneTime, taskState[a.id]?.snoozedUntil);
      const sb = taskScore(b, taskState[b.id]?.lastDone, taskState[b.id]?.intervalDays, taskState[b.id]?.oneTime, taskState[b.id]?.snoozedUntil);
      return sb - sa;
    }), [visibleTasks, taskState]);

  const snoozedTasks = useMemo(() =>
    activeTasks.filter(t => taskStatus(t, taskState) === "snoozed"),
    [activeTasks, taskState]);

  const [focusSeen, setFocusSeen] = useState(() => loadS(FOCUS_SEEN_KEY, {}));

  const capacity = profile?.capacity || 'normal';
  const focusCount = CAPACITY_FOCUS_COUNT[capacity] ?? 3;

  const homeTasks = useMemo(() => {
    const today = todayStr();
    return scoredDue
      .filter(t => {
        if (taskStatus(t, taskState) === "unknown") return false;
        const entry = focusSeen[t.id];
        return !(entry?.suppressUntil && entry.suppressUntil > today);
      })
      .slice(0, focusCount);
  }, [scoredDue, taskState, focusSeen, focusCount]);

  useEffect(() => {
    const today = todayStr();
    setFocusSeen(prev => {
      const next = { ...prev };
      let changed = false;
      homeTasks.forEach(t => {
        const currentLastDone = taskState[t.id]?.lastDone ?? null;
        const entry = next[t.id];
        if (!entry || entry.lastDoneSeen !== currentLastDone) {
          // New to focus or just completed — reset tracking
          next[t.id] = { firstSeen: today, lastDoneSeen: currentLastDone, suppressUntil: null };
          changed = true;
        } else if (entry.suppressUntil && entry.suppressUntil <= today) {
          // Suppression window expired — give a fresh cycle
          next[t.id] = { firstSeen: today, lastDoneSeen: currentLastDone, suppressUntil: null };
          changed = true;
        } else if (!entry.suppressUntil) {
          const daysSeen = Math.floor((Date.now() - new Date(entry.firstSeen)) / 86400000);
          if (daysSeen >= FOCUS_SUPPRESS_AFTER_DAYS) {
            const suppressUntil = new Date(Date.now() + FOCUS_SUPPRESS_FOR_DAYS * 86400000)
              .toISOString().slice(0, 10);
            next[t.id] = { ...entry, suppressUntil };
            changed = true;
          }
        }
      });
      if (changed) saveS(FOCUS_SEEN_KEY, next);
      return changed ? next : prev;
    });
  }, [homeTasks, taskState]);

  const doneThisWeek = useMemo(() =>
    Object.values(taskState).filter(entry => {
      if (!entry?.lastDone) return false;
      return (Date.now() - new Date(entry.lastDone)) <= 7 * 86400000;
    }).length,
    [taskState]);

  const getStatus = (t) => taskStatus(t, taskState);

  const getDays = useCallback((t) => {
    const entry = taskState[t.id];
    const isOneTime = entry?.oneTime !== undefined ? entry.oneTime : t.oneTime;
    if (isOneTime) {
      if (entry?.lastDone) return null;
      if (entry?.dueDate) return Math.ceil((new Date(entry.dueDate) - Date.now()) / 86400000);
      return null;
    }
    if (!entry?.lastDone) return 0;
    const intervalDays = entry?.intervalDays ?? t.intervalDays;
    return intervalDays - Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
  }, [taskState]);

  const getNext = (t) => nextDueStr(t, taskState[t.id]?.lastDone, taskState[t.id]?.intervalDays, taskState[t.id]?.oneTime);

  const nextUpcomingTask = useMemo(() =>
    visibleTasks
      .filter(t => taskStatus(t, taskState) === 'coming-up')
      .sort((a, b) => getDays(a) - getDays(b))[0] ?? null,
    [visibleTasks, taskState, getDays]);

  const planTasks = useMemo(() => {
    if (!activePlan) return [];
    const taskMap = new Map(taskLibrary.map(t => [t.id, t]));
    return activePlan.taskIds
      .map(id => taskMap.get(id))
      .filter(Boolean);
  }, [activePlan, taskLibrary]);

  return (
    <TaskContext.Provider value={{
      taskState, setTaskState,
      disabledTasks, setDisabledTasks,
      activeTasks, visibleTasks, scoredDue, homeTasks, doneThisWeek,
      snoozedTasks, nextUpcomingTask,
      markDone, markScheduled, markNotApplicable, markNeeded, setIntervalOverride, setOneTimeOverride, setDueDate, setStepProgress,
      snoozeTask: snoozeTaskAndUnplan, unsnoozeTask,
      getStatus, getDays, getNext,
      loading, syncError,
      isInPlanMode, activePlan, planTasks, planProgress, weekStart, planningNextWeek, planFloor,
      confirmPlan, addToPlan, removeFromPlan,
      showWeeklyNudge, dismissWeeklyNudge,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTaskContext = () => useContext(TaskContext);
