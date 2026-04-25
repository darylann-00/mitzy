import { useState, useEffect } from "react";
import { loadS, saveS, TASK_STATE_KEY, DISABLED_KEY } from "../utils/storage";
import { supabase } from "../lib/supabase";

export function useTasks(user) {
  const [taskState, setTaskState] = useState(() => loadS(TASK_STATE_KEY, {}));
  const [disabledTasks, setDisabledTasks] = useState(() => loadS(DISABLED_KEY, {}));
  const [loading, setLoading] = useState(!!user);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("task_records")
        .select("*")
        .eq("user_id", user.id);

      if (error) { setSyncError(error); setLoading(false); return; }

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
            interval_days:  localState[taskId]?.intervalDays  ?? null,
            needed:         localState[taskId]?.needed        ?? false,
            disabled:       localDisabled[taskId]             ?? false,
          }));
          const { error: upsertError } = await supabase.from("task_records").upsert(rows);
          if (upsertError) { setSyncError(upsertError); setLoading(false); return; }
        }
      } else {
        const state    = {};
        const disabled = {};
        for (const row of data) {
          if (row.last_done || row.scheduled_date || row.interval_days || row.needed) {
            state[row.task_id] = {
              lastDone:      row.last_done,
              scheduledDate: row.scheduled_date,
              ...(row.interval_days ? { intervalDays: row.interval_days } : {}),
              ...(row.needed       ? { needed: true }                      : {}),
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
      setLoading(false);
    }

    load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { saveS(TASK_STATE_KEY, taskState); },    [taskState]);
  useEffect(() => { saveS(DISABLED_KEY, disabledTasks); }, [disabledTasks]);

  const markDone = async (id, dateStr, intervalDays) => {
    const iso = dateStr
      ? (() => { const [y,m,d] = dateStr.split('-').map(Number); return new Date(y, m-1, d).toISOString(); })()
      : new Date().toISOString();
    const entry = { lastDone: iso, scheduledDate: null };
    if (intervalDays) entry.intervalDays = intervalDays;
    const prev = taskState[id];
    setTaskState(s => ({ ...s, [id]: entry }));
    if (user) {
      const { error } = await supabase.from("task_records").upsert({
        user_id: user.id, task_id: id, last_done: iso, scheduled_date: null,
        ...(intervalDays ? { interval_days: intervalDays } : {}),
      });
      if (error) { setTaskState(s => ({ ...s, [id]: prev })); return { error }; }
    }
    return {};
  };

  const markScheduled = async (id, date) => {
    const prev = taskState[id];
    setTaskState(s => ({ ...s, [id]: { ...s[id], scheduledDate: date } }));
    if (user) {
      const { error } = await supabase.from("task_records").upsert({
        user_id: user.id, task_id: id, scheduled_date: date,
      });
      if (error) setTaskState(s => ({ ...s, [id]: prev }));
    }
  };

  const markNotApplicable = async (id) => {
    const prev = disabledTasks[id];
    setDisabledTasks(s => ({ ...s, [id]: true }));
    if (user) {
      const { error } = await supabase.from("task_records").upsert({
        user_id: user.id, task_id: id, disabled: true,
      });
      if (error) setDisabledTasks(s => ({ ...s, [id]: prev }));
    }
  };

  const markNeeded = async (id) => {
    const prev = taskState[id];
    setTaskState(s => ({ ...s, [id]: { ...s[id], needed: true } }));
    if (user) {
      const { error } = await supabase.from("task_records").upsert({
        user_id: user.id, task_id: id, needed: true,
      });
      if (error) setTaskState(s => ({ ...s, [id]: prev }));
    }
  };

  const setIntervalOverride = async (id, intervalDays) => {
    const prev = taskState[id];
    setTaskState(s => ({ ...s, [id]: { ...s[id], intervalDays } }));
    if (user) {
      const { error } = await supabase.from("task_records").upsert({
        user_id: user.id, task_id: id, interval_days: intervalDays,
      });
      if (error) setTaskState(s => ({ ...s, [id]: prev }));
    }
  };

  return { taskState, setTaskState, disabledTasks, setDisabledTasks, markDone, markScheduled, markNotApplicable, markNeeded, setIntervalOverride, loading, syncError };
}
