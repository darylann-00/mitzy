import { useState, useEffect, useMemo } from "react";
import { loadS, saveS, PROFILE_KEY, CUSTOM_TASKS_KEY } from "../utils/storage";
import { buildTaskLibrary } from "../data/taskFactory";
import { supabase } from "../lib/supabase";

const PROFILE_FIELDS = [
  'name', 'zip', 'hasHome', 'birthYear', 'gender', 'insurance',
  'cars', 'hasCar', 'kids', 'hasKids', 'pets', 'hasPets',
  'capacity',
];

function isProfileNonEmpty(p) {
  if (!p) return false;
  return PROFILE_FIELDS.some(k => {
    const v = p[k];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

function isServerProfileMeaningful(p) {
  if (!p) return false;
  return !!(p.name || p.zip);
}

function localHasFieldsServerDoesnt(local, server) {
  return PROFILE_FIELDS.some(k => {
    const lv = local?.[k];
    const sv = server?.[k];
    const lEmpty = lv == null || (Array.isArray(lv) && lv.length === 0);
    const sEmpty = sv == null || (Array.isArray(sv) && sv.length === 0);
    return !lEmpty && sEmpty;
  });
}

export function useProfile(user, welcomeChoice) {
  const [profile, setProfile] = useState(() => loadS(PROFILE_KEY, {}));
  const [customTasks, setCustomTasks] = useState(() => loadS(CUSTOM_TASKS_KEY, []));
  const [loading, setLoading] = useState(!!user);
  const [syncError, setSyncError] = useState(null);
  const [pendingConflict, setPendingConflict] = useState(null);
  const [serverProfileChecked, setServerProfileChecked] = useState(false);
  const [serverProfileExists, setServerProfileExists] = useState(false);

  const taskLibrary = useMemo(() => {
    const base = profile.zip ? buildTaskLibrary(profile) : [];
    return [...base, ...customTasks];
  }, [profile, customTasks]);

  useEffect(() => {
    if (!user) {
      setServerProfileChecked(false);
      setServerProfileExists(false);
      return;
    }

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) { setSyncError(error); setLoading(false); return; }

      const serverProfile = data ? fromRow(data) : null;
      const serverHasMeaning = isServerProfileMeaningful(serverProfile);
      const local = loadS(PROFILE_KEY, {});

      if (serverHasMeaning) {
        if (welcomeChoice === 'new' && isProfileNonEmpty(local) && localHasFieldsServerDoesnt(local, serverProfile)) {
          setPendingConflict({ server: serverProfile, local });
        } else {
          setProfile(serverProfile);
          saveS(PROFILE_KEY, serverProfile);
        }
      } else if (isProfileNonEmpty(local)) {
        const { error: upsertError } = await supabase.from("profiles").upsert({ id: user.id, ...toRow(local) });
        if (upsertError) { setSyncError(upsertError); setLoading(false); return; }
      }

      setServerProfileExists(serverHasMeaning);
      setServerProfileChecked(true);

      const { data: ctData, error: ctError } = await supabase
        .from("custom_tasks")
        .select("*")
        .eq("user_id", user.id);

      if (!ctError) {
        const serverTasks = (ctData ?? []).map(fromCustomTaskRow);
        if (serverTasks.length > 0) {
          setCustomTasks(serverTasks);
          saveS(CUSTOM_TASKS_KEY, serverTasks);
        } else {
          const localTasks = loadS(CUSTOM_TASKS_KEY, []);
          if (localTasks.length > 0) {
            const rows = localTasks.map(t => ({ user_id: user.id, ...toCustomTaskRow(t) }));
            await supabase.from("custom_tasks").upsert(rows, { onConflict: "user_id,task_id" });
          }
        }
      }

      setLoading(false);
    }

    load();
  }, [user?.id, welcomeChoice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep localStorage in sync so onboarding and offline still work
  useEffect(() => {
    saveS(PROFILE_KEY, profile);
  }, [profile]);

  const updateProfile = async (updates) => {
    const next = { ...profile, ...updates };
    const prev = profile;
    setProfile(next);
    if (user) {
      const { error } = await supabase.from("profiles").upsert({ id: user.id, ...toRow(next) });
      if (error) {
        setProfile(prev);
      }
    }
  };

  const addCustomTask = async (task) => {
    const next = [...customTasks, task];
    const prev = customTasks;
    setCustomTasks(next);
    saveS(CUSTOM_TASKS_KEY, next);
    if (user) {
      const { error } = await supabase
        .from("custom_tasks")
        .upsert({ user_id: user.id, ...toCustomTaskRow(task) }, { onConflict: "user_id,task_id" });
      if (error) {
        setCustomTasks(prev);
        saveS(CUSTOM_TASKS_KEY, prev);
        throw error;
      }
    }
  };

  const addCustomTasksBulk = async (tasks) => {
    if (!tasks || tasks.length === 0) return;
    const next = [...customTasks, ...tasks];
    const prev = customTasks;
    setCustomTasks(next);
    saveS(CUSTOM_TASKS_KEY, next);
    if (user) {
      const rows = tasks.map(t => ({ user_id: user.id, ...toCustomTaskRow(t) }));
      const { error } = await supabase
        .from("custom_tasks")
        .upsert(rows, { onConflict: "user_id,task_id" });
      if (error) {
        setCustomTasks(prev);
        saveS(CUSTOM_TASKS_KEY, prev);
        throw error;
      }
    }
  };

  const removeCustomTasksByLifeEvent = async (lifeEventId) => {
    const prev = customTasks;
    const next = customTasks.filter(t => t.lifeEventId !== lifeEventId);
    setCustomTasks(next);
    saveS(CUSTOM_TASKS_KEY, next);
    if (user) {
      const { error } = await supabase
        .from("custom_tasks")
        .delete()
        .eq("user_id", user.id)
        .eq("life_event_id", lifeEventId);
      if (error) {
        setCustomTasks(prev);
        saveS(CUSTOM_TASKS_KEY, prev);
        throw error;
      }
    }
  };

  const removeCustomTask = async (taskId) => {
    const prev = customTasks;
    const next = customTasks.filter(t => t.id !== taskId);
    setCustomTasks(next);
    saveS(CUSTOM_TASKS_KEY, next);
    if (user) {
      const { error } = await supabase
        .from("custom_tasks")
        .delete()
        .eq("user_id", user.id)
        .eq("task_id", taskId);
      if (error) {
        setCustomTasks(prev);
        saveS(CUSTOM_TASKS_KEY, prev);
        throw error;
      }
    }
  };

  const resolveConflict = async (choice) => {
    if (!pendingConflict) return;
    const { server, local } = pendingConflict;
    if (choice === 'use-saved') {
      setProfile(server);
      saveS(PROFILE_KEY, server);
    } else if (choice === 'use-new') {
      if (user) {
        const { error } = await supabase.from("profiles").upsert({ id: user.id, ...toRow(local) });
        if (error) { setSyncError(error); return; }
      }
    }
    setPendingConflict(null);
  };

  return {
    profile, setProfile, taskLibrary, customTasks,
    updateProfile, addCustomTask, removeCustomTask,
    addCustomTasksBulk, removeCustomTasksByLifeEvent,
    loading, syncError,
    pendingConflict, resolveConflict,
    serverProfileChecked, serverProfileExists,
  };
}

function toCustomTaskRow(t) {
  return {
    task_id:             t.id,
    cat:                 t.cat,
    label:               t.label,
    interval_days:       t.intervalDays   ?? null,
    window_days:         t.windowDays     ?? null,
    stakes:              t.stakes         ?? null,
    active_months:       t.activeMonths   ?? null,
    assist_type:         t.assistType     ?? null,
    search_query:        t.searchQuery    ?? null,
    why:                 t.why            ?? null,
    guidance:            t.guidance       ?? null,
    one_time:            !!t.oneTime,
    is_ai_generated:     !!t.isAIGenerated,
    risk_tier:           t.riskTier       ?? null,
    assumptions:         t.assumptions    ?? null,
    prompt_text:         t.promptText     ?? null,
    life_event_id:       t.lifeEventId    ?? null,
    suppress_celebration: !!t.suppressCelebration,
    steps:               t.steps          ?? null,
  };
}

function fromCustomTaskRow(row) {
  return {
    id:            row.task_id,
    cat:           row.cat,
    label:         row.label,
    intervalDays:  row.interval_days  ?? undefined,
    windowDays:    row.window_days    ?? undefined,
    stakes:        row.stakes         ?? undefined,
    activeMonths:  row.active_months  ?? undefined,
    assistType:    row.assist_type    ?? null,
    searchQuery:   row.search_query   ?? undefined,
    why:           row.why            ?? undefined,
    guidance:      row.guidance       ?? undefined,
    oneTime:       !!row.one_time,
    isCustom:      true,
    isAIGenerated: !!row.is_ai_generated,
    riskTier:      row.risk_tier      ?? undefined,
    assumptions:   row.assumptions    ?? undefined,
    promptText:    row.prompt_text    ?? undefined,
    lifeEventId:   row.life_event_id  ?? null,
    suppressCelebration: !!row.suppress_celebration,
    steps:         row.steps          ?? undefined,
    requires:      [],
  };
}

function toRow(p) {
  return {
    name:              p.name      ?? null,
    zip:               p.zip       ?? null,
    own_rent:          p.hasHome === true ? "own" : p.hasHome === false ? "rent" : null,
    age:               p.birthYear  ?? null,
    gender:            p.gender    ?? null,
    cars:              p.cars      ?? [],
    has_car:           p.hasCar    ?? null,
    kids:              p.kids      ?? [],
    has_kids:          p.hasKids   ?? null,
    pets:              p.pets      ?? [],
    has_pets:          p.hasPets   ?? null,
    onboarded:         p.onboarded ?? false,
    visit_count:       p.visitCount       ?? 0,
    hazard_done:       p.hazardDone       ?? false,
    profile_questions: p.profileQuestions ?? null,
    capacity:          p.capacity ?? null,
    insurance:         p.insurance ?? null,
  };
}

function fromRow(row) {
  return {
    name:             row.name,
    zip:              row.zip,
    hasHome:          row.own_rent === "own" ? true : row.own_rent === "rent" ? false : null,
    birthYear:        row.age,
    gender:           row.gender,
    cars:             row.cars     ?? [],
    hasCar:           row.has_car,
    kids:             row.kids     ?? [],
    hasKids:          row.has_kids,
    pets:             row.pets     ?? [],
    hasPets:          row.has_pets,
    onboarded:        row.onboarded,
    visitCount:       row.visit_count,
    hazardDone:       row.hazard_done,
    profileQuestions: row.profile_questions,
    capacity:         row.capacity ?? null,
    insurance:        row.insurance ?? null,
  };
}
