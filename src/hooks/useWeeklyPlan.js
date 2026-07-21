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

// The week a fresh check-in should plan. Mon–Thu that's the current week;
// Fri–Sun the current week is nearly over, so planning targets the upcoming
// Monday instead (day-of-week mentions would mostly roll there anyway).
function getPlanningWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun … 5 Fri, 6 Sat
  const monday = new Date(now);
  if (day === 5 || day === 6 || day === 0) {
    monday.setDate(now.getDate() + (day === 0 ? 1 : 8 - day));
  } else {
    monday.setDate(now.getDate() - (day - 1));
  }
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

export { getCurrentWeekStart, getPlanningWeekStart, toLocalISO, weekRangeLabel };

export function useWeeklyPlan(user, taskState, markScheduled, uiState, updateUiState) {
  const [activePlan, setActivePlan] = useState(null);
  const [upcomingPlanExists, setUpcomingPlanExists] = useState(false);
  const [loading, setLoading] = useState(!!user);

  const currentWeekStart = getCurrentWeekStart();
  const planningWeekStart = getPlanningWeekStart();

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("weekly_plans")
        .select("*")
        .eq("user_id", user.id)
        .in("week_start", [...new Set([currentWeekStart, planningWeekStart])]);

      if (error) { setLoading(false); return; }

      const rows = data || [];

      // The current week's plan governs Home through Sunday; a plan confirmed
      // early for the upcoming week (Fri–Sun check-in) takes over only when
      // there is no current-week plan.
      const currentRow = rows.find(r => r.week_start === currentWeekStart && r.confirmed_at);
      const upcomingRow = planningWeekStart !== currentWeekStart
        ? rows.find(r => r.week_start === planningWeekStart && r.confirmed_at)
        : null;

      const row = currentRow ?? upcomingRow;
      if (row) {
        setActivePlan({
          id: row.id,
          weekStart: row.week_start,
          taskIds: row.task_ids || [],
          scheduledDates: row.scheduled_dates || {},
          userInput: row.user_input,
          confirmedAt: row.confirmed_at,
        });
      }

      setUpcomingPlanExists(!!(upcomingRow && currentRow));
      setLoading(false);
    }

    load();
  }, [user?.id, currentWeekStart, planningWeekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInPlanMode = !!(activePlan?.confirmedAt);

  // The week a check-in targets: adjusting keeps the active plan's week; a
  // fresh plan goes to the planning week (next Monday on Fri–Sun).
  const weekStart = activePlan?.weekStart ?? planningWeekStart;
  const planningNextWeek = !activePlan && planningWeekStart !== currentWeekStart;

  // Completions count toward the plan from whichever came first: the plan's
  // week or its confirmation day (a next-week plan confirmed Saturday should
  // credit weekend head-starts).
  const confirmedDay = activePlan?.confirmedAt?.slice(0, 10);
  const planFloor = activePlan
    ? (confirmedDay && confirmedDay < activePlan.weekStart ? confirmedDay : activePlan.weekStart)
    : null;

  const planProgress = useMemo(() => {
    if (!activePlan || !planFloor) return { done: 0, total: 0 };
    const done = activePlan.taskIds.filter(id => {
      const entry = taskState[id];
      if (!entry?.lastDone) return false;
      return entry.lastDone >= planFloor;
    }).length;
    return { done, total: activePlan.taskIds.length };
  }, [activePlan, planFloor, taskState]);

  const confirmPlan = useCallback(async (taskIds, scheduledDates, userInput, targetWeekStart) => {
    if (!user) return { error: new Error("Not signed in") };

    const target = targetWeekStart || weekStart;
    const isUpcoming = target !== currentWeekStart && target === planningWeekStart;
    const now = new Date().toISOString();
    const dates = scheduledDates || {};

    if (!isUpcoming) {
      setActivePlan(prev => ({
        ...prev,
        weekStart: target,
        taskIds,
        scheduledDates: dates,
        userInput: userInput || null,
        confirmedAt: now,
      }));
    }

    const row = {
      user_id: user.id,
      week_start: target,
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
      if (!isUpcoming) setActivePlan(null);
      return { error };
    }

    if (isUpcoming) {
      setUpcomingPlanExists(true);
    } else {
      setActivePlan({
        id: data.id,
        weekStart: data.week_start,
        taskIds: data.task_ids || [],
        scheduledDates: data.scheduled_dates || {},
        userInput: data.user_input,
        confirmedAt: data.confirmed_at,
      });
    }

    if (markScheduled) {
      for (const [taskId, date] of Object.entries(dates)) {
        if (date) markScheduled(taskId, date);
      }
    }
    return { error: null };
  }, [user, weekStart, currentWeekStart, planningWeekStart, markScheduled]);

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
      .eq("week_start", activePlan.weekStart);

    if (error) {
      setActivePlan(prev);
    }
  }, [user, activePlan]);

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
      .eq("week_start", activePlan.weekStart);

    if (error) {
      setActivePlan(prev);
    }
  }, [user, activePlan]);

  // Fri-Sun with an active current-week plan and no upcoming plan yet: the
  // user can plan next week without losing their current-week progress card.
  const canPlanNextWeek = planningWeekStart !== currentWeekStart && isInPlanMode && !upcomingPlanExists;

  const dismissedWeek = uiState?.weeklyCheckinDismissedWeek ?? null;
  const showNudge = !loading && !isInPlanMode && dismissedWeek !== planningWeekStart;

  const dismissNudge = useCallback(() => {
    updateUiState?.({ weeklyCheckinDismissedWeek: planningWeekStart });
  }, [planningWeekStart, updateUiState]);

  return {
    activePlan,
    loading,
    isInPlanMode,
    planProgress,
    weekStart,
    planningWeekStart,
    planningNextWeek,
    planFloor,
    canPlanNextWeek,
    confirmPlan,
    addToPlan,
    removeFromPlan,
    showNudge,
    dismissNudge,
  };
}
