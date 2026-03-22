import { useState, useEffect } from "react";
import { loadS, saveS, TASK_STATE_KEY, DISABLED_KEY } from "../utils/storage";

export function useTasks() {
  const [taskState, setTaskState] = useState(() => loadS(TASK_STATE_KEY, {}));
  const [disabledTasks, setDisabledTasks] = useState(() => loadS(DISABLED_KEY, {}));

  useEffect(() => { saveS(TASK_STATE_KEY, taskState); },    [taskState]);
  useEffect(() => { saveS(DISABLED_KEY, disabledTasks); }, [disabledTasks]);

  const markDone = (id, dateStr) => {
    const iso = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
    setTaskState(prev => ({ ...prev, [id]: { lastDone: iso, scheduledDate: null } }));
  };

  const markScheduled = (id, date) => {
    setTaskState(prev => ({ ...prev, [id]: { ...prev[id], scheduledDate: date } }));
  };

  return { taskState, setTaskState, disabledTasks, setDisabledTasks, markDone, markScheduled };
}
