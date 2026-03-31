import { useState, useEffect } from "react";
import { loadS, saveS, TASK_STATE_KEY, DISABLED_KEY } from "../utils/storage";
import { supabase } from "../lib/supabase";

export function useTasks(user) {
  const [taskState, setTaskState] = useState(() => loadS(TASK_STATE_KEY, {}));
  const [disabledTasks, setDisabledTasks] = useState(() => loadS(DISABLED_KEY, {}));

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data, error } = await supabase
        .from("task_records")
        .select("*")
        .eq("user_id", user.id);

      if (error) { console.error(error); return; }

      if (!data || data.length === 0) {
        // First login — migrate localStorage data to Supabase
        const localState    = loadS(TASK_STATE_KEY, {});
        const localDisabled = loadS(DISABLED_KEY, {});
        const allIds = new Set([...Object.keys(localState), ...Object.keys(localDisabled)]);

        if (allIds.size > 0) {
          const rows = [...allIds].map(taskId => ({
            user_id:        user.id,
            task_id:        taskId,
            last_done:      localState[taskId]?.lastDone      ?? null,
            scheduled_date: localState[taskId]?.scheduledDate ?? null,
            disabled:       localDisabled[taskId]             ?? false,
          }));
          await supabase.from("task_records").upsert(rows);
        }
      } else {
        const state    = {};
        const disabled = {};
        for (const row of data) {
          if (row.last_done || row.scheduled_date) {
            state[row.task_id] = {
              lastDone:      row.last_done,
              scheduledDate: row.scheduled_date,
            };
          }
          if (row.disabled) {
            disabled[row.task_id] = true;
          }
        }
        setTaskState(state);
        setDisabledTasks(disabled);
        saveS(TASK_STATE_KEY, state);
        saveS(DISABLED_KEY, disabled);
      }
    }

    load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { saveS(TASK_STATE_KEY, taskState); },    [taskState]);
  useEffect(() => { saveS(DISABLED_KEY, disabledTasks); }, [disabledTasks]);

  const markDone = async (id, dateStr) => {
    const iso = dateStr
      ? (() => { const [y,m,d] = dateStr.split('-').map(Number); return new Date(y, m-1, d).toISOString(); })()
      : new Date().toISOString();
    setTaskState(prev => ({ ...prev, [id]: { lastDone: iso, scheduledDate: null } }));
    if (user) {
      await supabase.from("task_records").upsert({
        user_id: user.id, task_id: id, last_done: iso, scheduled_date: null,
      });
    }
  };

  const markScheduled = async (id, date) => {
    setTaskState(prev => ({ ...prev, [id]: { ...prev[id], scheduledDate: date } }));
    if (user) {
      await supabase.from("task_records").upsert({
        user_id: user.id, task_id: id, scheduled_date: date,
      });
    }
  };

  const markNotApplicable = async (id) => {
    setDisabledTasks(prev => ({ ...prev, [id]: true }));
    if (user) {
      await supabase.from("task_records").upsert({
        user_id: user.id, task_id: id, disabled: true,
      });
    }
  };

  const markNeeded = (id) => {
    setTaskState(prev => ({ ...prev, [id]: { ...prev[id], needed: true } }));
  };

  return { taskState, setTaskState, disabledTasks, setDisabledTasks, markDone, markScheduled, markNotApplicable, markNeeded };
}
