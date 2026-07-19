import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabase";

// Format a Date as YYYY-MM-DD in the user's local timezone. toISOString() is
// UTC — for US-evening users the UTC date is already "tomorrow", which shifted
// week_start by a day and made a plan saved in the evening unfindable the next
// morning.
function toLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return toLocalISO(monday);
}

// "Jul 13 – Jul 19" for a given Monday — used anywhere the UI needs to say
// which week a plan covers.
function weekRangeLabel(weekStart) {
  const start = new Date(weekStart + 'T12:00:00');
  const end = new Date(start.getTime() + 6 * 86400000);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export { getCurrentWeekStart, toLocalISO, weekRangeLabel };

export function useWeeklyPlan(user, taskState, markScheduled, uiState, updateUiState) {
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(!!user);

  const weekStart = getCurrentWeekStart();

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("weekly_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (error) { setLoading(false); return; }

      if (data) {
        setActivePlan({
          id: data.id,
          weekStart: data.week_start,
          taskIds: data.task_ids || [],
          scheduledDates: data.scheduled_dates || {},
          userInput: data.user_input,
          confirmedAt: data.confirmed_at,
        });
      }
      setLoading(false);
    }

    load();
  }, [user?.id, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInPlanMode = !!(activePlan?.confirmedAt);

  const planProgress = useMemo(() => {
    if (!activePlan) return { done: 0, total: 0 };
    const done = activePlan.taskIds.filter(id => {
      const entry = taskState[id];
      if (!entry?.lastDone) return false;
      return entry.lastDone >= activePlan.weekStart;
    }).length;
    return { done, total: activePlan.taskIds.length };
  }, [activePlan, taskState]);

  const confirmPlan = useCallback(async (taskIds, scheduledDates, userInput) => {
    if (!user) return { error: new Error("Not signed in") };

    const now = new Date().toISOString();
    const dates = scheduledDates || {};

    setActivePlan(prev => ({
      ...prev,
      weekStart,
      taskIds,
      scheduledDates: dates,
      userInput: userInput || null,
      confirmedAt: now,
    }));

    const row = {
      user_id: user.id,
      week_start: weekStart,
      task_ids: taskIds,
      scheduled_dates: dates,
      user_input: userInput || null,
      confirmed_at: now,
    };

    const { data, error } = await supabase
      .from("weekly_plans")
      .upsert(row, { onConflict: "user_id,week_start" })
      .select()
      .single();

    if (error) {
      setActivePlan(null);
      return { error };
    }

    setActivePlan({
      id: data.id,
      weekStart: data.week_start,
      taskIds: data.task_ids || [],
      scheduledDates: data.scheduled_dates || {},
      userInput: data.user_input,
      confirmedAt: data.confirmed_at,
    });

    if (markScheduled) {
      for (const [taskId, date] of Object.entries(dates)) {
        if (date) markScheduled(taskId, date);
      }
    }
    return { error: null };
  }, [user, weekStart, markScheduled]);

  const addToPlan = useCallback(async (taskId) => {
    if (!user || !activePlan) return;

    const newIds = [...activePlan.taskIds];
    if (newIds.includes(taskId)) return;
    newIds.push(taskId);

    const prev = { ...activePlan };
    setActivePlan(p => ({ ...p, taskIds: newIds }));

    const { error } = await supabase
      .from("weekly_plans")
      .update({ task_ids: newIds })
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    if (error) {
      setActivePlan(prev);
    }
  }, [user, activePlan, weekStart]);

  // Snoozing a task is a promise to hide it until a chosen date — it should
  // also leave the frozen weekly plan so the two features don't contradict.
  const removeFromPlan = useCallback(async (taskId) => {
    if (!user || !activePlan || !activePlan.taskIds.includes(taskId)) return;

    const newIds = activePlan.taskIds.filter(id => id !== taskId);
    const newDates = { ...activePlan.scheduledDates };
    delete newDates[taskId];

    const prev = { ...activePlan };
    setActivePlan(p => ({ ...p, taskIds: newIds, scheduledDates: newDates }));

    const { error } = await supabase
      .from("weekly_plans")
      .update({ task_ids: newIds, scheduled_dates: newDates })
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    if (error) {
      setActivePlan(prev);
    }
  }, [user, activePlan, weekStart]);

  const dismissedWeek = uiState?.weeklyCheckinDismissedWeek ?? null;
  const showNudge = !loading && !isInPlanMode && dismissedWeek !== weekStart;

  const dismissNudge = useCallback(() => {
    updateUiState?.({ weeklyCheckinDismissedWeek: weekStart });
  }, [weekStart, updateUiState]);

  return {
    activePlan,
    loading,
    isInPlanMode,
    planProgress,
    weekStart,
    confirmPlan,
    addToPlan,
    removeFromPlan,
    showNudge,
    dismissNudge,
  };
}
