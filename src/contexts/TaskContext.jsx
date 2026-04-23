import { createContext, useContext, useMemo, useCallback } from "react";
import { useTasks } from "../hooks/useTasks";
import { useProfileContext } from "./ProfileContext";
import { taskStatus, taskScore, nextDueStr, isWindowActive, isDependencySatisfied } from "../utils/taskLogic";

const TaskContext = createContext(null);

export function TaskProvider({ user, children }) {
  const { taskLibrary, region } = useProfileContext();
  const {
    taskState, setTaskState,
    disabledTasks, setDisabledTasks,
    markDone, markScheduled, markNotApplicable, markNeeded, setIntervalOverride,
    loading, syncError,
  } = useTasks(user);

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
    .filter(t => taskStatus(t, taskState) !== "ok")
    .sort((a, b) => {
      const sa = taskScore(a, taskState[a.id]?.lastDone, taskState[a.id]?.intervalDays);
      const sb = taskScore(b, taskState[b.id]?.lastDone, taskState[b.id]?.intervalDays);
      return sb - sa;
    }), [visibleTasks, taskState]);

  const focusTasks = useMemo(() =>
    scoredDue.filter(t => taskStatus(t, taskState) !== "unknown").slice(0, 3),
    [scoredDue, taskState]);

  const doneThisWeek = useMemo(() =>
    Object.values(taskState).filter(entry => {
      if (!entry?.lastDone) return false;
      return (Date.now() - new Date(entry.lastDone)) <= 7 * 86400000;
    }).length,
    [taskState]);

  const getStatus = (t) => taskStatus(t, taskState);

  const getDays = useCallback((t) => {
    const entry = taskState[t.id];
    if (!entry?.lastDone) return 0;
    if (t.oneTime) return null;
    const intervalDays = entry?.intervalDays ?? t.intervalDays;
    return intervalDays - Math.floor((Date.now() - new Date(entry.lastDone)) / 86400000);
  }, [taskState]);

  const getNext = (t) => nextDueStr(t, taskState[t.id]?.lastDone, taskState[t.id]?.intervalDays);

  const nextUpcomingTask = useMemo(() =>
    visibleTasks
      .filter(t => taskStatus(t, taskState) === 'coming-up')
      .sort((a, b) => getDays(a) - getDays(b))[0] ?? null,
    [visibleTasks, taskState, getDays]);

  return (
    <TaskContext.Provider value={{
      taskState, setTaskState,
      disabledTasks, setDisabledTasks,
      activeTasks, visibleTasks, scoredDue, focusTasks, doneThisWeek,
      nextUpcomingTask,
      markDone, markScheduled, markNotApplicable, markNeeded, setIntervalOverride,
      getStatus, getDays, getNext,
      loading, syncError,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTaskContext = () => useContext(TaskContext);
