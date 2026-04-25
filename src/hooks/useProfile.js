import { useState, useEffect, useMemo } from "react";
import { loadS, saveS, PROFILE_KEY } from "../utils/storage";
import { buildTaskLibrary } from "../data/taskFactory";
import { supabase } from "../lib/supabase";

const PROFILE_FIELDS = [
  'name', 'zip', 'hasHome', 'birthYear', 'gender',
  'cars', 'hasCar', 'kids', 'hasKids', 'pets', 'hasPets',
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
  const [customTasks, setCustomTasks] = useState([]);
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

  const addCustomTask = (task) => {
    setCustomTasks(prev => [...prev, task]);
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
    profile, setProfile, taskLibrary,
    updateProfile, addCustomTask,
    loading, syncError,
    pendingConflict, resolveConflict,
    serverProfileChecked, serverProfileExists,
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
  };
}
