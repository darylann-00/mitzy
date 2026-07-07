import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabase";

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

export { getCurrentWeekStart };

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

  const savePlan = useCallback(async (taskIds, scheduledDates, userInput) => {
    if (!user) return;

    const draft = {
      weekStart,
      taskIds,
      scheduledDates: scheduledDates || {},
      userInput: userInput || null,
      confirmedAt: null,
    };
    setActivePlan(prev => ({ ...prev, ...draft }));

    const row = {
      user_id: user.id,
      week_start: weekStart,
      task_ids: taskIds,
      scheduled_dates: scheduledDates || {},
      user_input: userInput || null,
      confirmed_at: null,
    };

    const { data, error } = await supabase
      .from("weekly_plans")
      .upsert(row, { onConflict: "user_id,week_start" })
      .select()
      .single();

    if (error) {
      setActivePlan(null);
      return;
    }
    setActivePlan({
      id: data.id,
      weekStart: data.week_start,
      taskIds: data.task_ids || [],
      scheduledDates: data.scheduled_dates || {},
      userInput: data.user_input,
      confirmedAt: data.confirmed_at,
    });
  }, [user, weekStart]);

  const confirmPlan = useCallback(async () => {
    if (!user || !activePlan) return;

    const now = new Date().toISOString();
    const prev = { ...activePlan };
    setActivePlan(p => ({ ...p, confirmedAt: now }));

    const { error } = await supabase
      .from("weekly_plans")
      .update({ confirmed_at: now })
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    if (error) {
      setActivePlan(prev);
      return;
    }

    if (markScheduled && activePlan.scheduledDates) {
      for (const [taskId, date] of Object.entries(activePlan.scheduledDates)) {
        if (date) markScheduled(taskId, date);
      }
    }
  }, [user, activePlan, weekStart, markScheduled]);

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
    savePlan,
    confirmPlan,
    addToPlan,
    showNudge,
    dismissNudge,
  };
}
