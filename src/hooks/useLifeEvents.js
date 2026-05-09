import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { loadS, saveS, LIFE_EVENTS_KEY } from "../utils/storage";
import { getEventDef } from "../data/lifeEvents";
import { tasksForIntake as newBabyTasksForIntake } from "../data/lifeEvents/newBaby";

// Per-event-type task generator. As we add more events, register their
// intake → tasks function here.
const TASK_GENERATORS = {
  'new-baby': newBabyTasksForIntake,
};

// Convert a bundle template into a custom_task row. Each user's instance gets
// a unique id (event-id-prefixed) so multiple instances of the same event
// type — say, a second baby down the line — don't collide.
function bundleTaskToCustomTask(t, lifeEventId, eventType) {
  return {
    id:                  `lf-${eventType}-${lifeEventId.slice(0, 8)}-${t.id}`,
    cat:                 t.cat,
    label:               t.label,
    intervalDays:        null,
    windowDays:          null,
    stakes:              t.stakes ?? 'medium',
    activeMonths:        null,
    assistType:          t.assistType ?? null,
    searchQuery:         t.searchQuery ?? null,
    why:                 t.why ?? null,
    guidance:            t.guidance ?? null,
    oneTime:             true,
    isCustom:            true,
    isAIGenerated:       false,
    lifeEventId,
    eventBundleKey:      t.id,
    eventPhase:          t.phase ?? null,
    suppressCelebration: !!getEventDef(eventType)?.suppressCelebration,
    requires:            [],
  };
}

function fromRow(row) {
  return {
    id:            row.id,
    type:          row.type,
    status:        row.status,
    intakeAnswers: row.intake_answers,
    startedAt:     row.started_at,
    updatedAt:     row.updated_at,
  };
}

export function useLifeEvents({ user, customTasks, addCustomTasksBulk, removeCustomTasksByLifeEvent }) {
  const [events, setEvents] = useState(() => loadS(LIFE_EVENTS_KEY, []));
  const [loading, setLoading] = useState(!!user);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('user_id', user.id);
      if (cancelled) return;
      if (!error && data) {
        const mapped = data.map(fromRow);
        setEvents(mapped);
        saveS(LIFE_EVENTS_KEY, mapped);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeEvent = useMemo(
    () => events.find(e => e.status === 'active') || null,
    [events]
  );

  // Tasks for the active event, hydrated from the user's custom_tasks list.
  // Sorted by phase order for predictable display (T1 → T2 → T3 → POST).
  const activeEventTasks = useMemo(() => {
    if (!activeEvent || !customTasks) return [];
    const phaseOrder = { T1: 0, T2: 1, T3: 2, POST: 3 };
    return customTasks
      .filter(t => t.lifeEventId === activeEvent.id)
      .sort((a, b) => (phaseOrder[a.eventPhase] ?? 99) - (phaseOrder[b.eventPhase] ?? 99));
  }, [activeEvent, customTasks]);

  const startEvent = useCallback(async (type, answers) => {
    if (!user) return null;
    const def = getEventDef(type);
    if (!def) throw new Error(`Unknown event type: ${type}`);

    const { data, error } = await supabase
      .from('life_events')
      .insert({ user_id: user.id, type, status: 'active', intake_answers: answers })
      .select()
      .single();
    if (error) throw error;

    const event = fromRow(data);
    setEvents(prev => {
      const next = [...prev, event];
      saveS(LIFE_EVENTS_KEY, next);
      return next;
    });

    const generate = TASK_GENERATORS[type];
    if (generate) {
      const bundleTasks = generate(answers);
      const tasks = bundleTasks.map(t => bundleTaskToCustomTask(t, event.id, type));
      await addCustomTasksBulk(tasks);
    }

    return event;
  }, [user, addCustomTasksBulk]);

  const completeEvent = useCallback(async (id) => {
    if (!user) return;
    const { error } = await supabase
      .from('life_events')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setEvents(prev => {
      const next = prev.map(e => e.id === id ? { ...e, status: 'completed' } : e);
      saveS(LIFE_EVENTS_KEY, next);
      return next;
    });
  }, [user]);

  // Dismiss = bail out entirely. Removes the event and its tasks. Intentional
  // hard delete — the user is saying "this isn't relevant to me."
  const dismissEvent = useCallback(async (id) => {
    if (!user) return;
    await removeCustomTasksByLifeEvent(id);
    const { error } = await supabase
      .from('life_events')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      saveS(LIFE_EVENTS_KEY, next);
      return next;
    });
  }, [user, removeCustomTasksByLifeEvent]);

  return {
    events, activeEvent, activeEventTasks,
    startEvent, completeEvent, dismissEvent,
    loading,
  };
}
