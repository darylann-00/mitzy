import { useState, useEffect } from "react";
import { loadS, saveS, PROFILE_KEY } from "../utils/storage";
import { buildTaskLibrary } from "../data/taskFactory";
import { supabase } from "../lib/supabase";

export function useProfile(user) {
  const [profile, setProfile] = useState(() => loadS(PROFILE_KEY, {}));
  const [taskLibrary, setTaskLibrary] = useState(() => {
    const saved = loadS(PROFILE_KEY, {});
    return saved.zip ? buildTaskLibrary(saved) : [];
  });
  const [loading, setLoading] = useState(!!user);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) { setSyncError(error); setLoading(false); return; }

      if (!data) {
        // First login — write whatever onboarding collected to Supabase
        const local = loadS(PROFILE_KEY, {});
        if (Object.keys(local).length > 0) {
          const { error: upsertError } = await supabase.from("profiles").upsert({ id: user.id, ...toRow(local) });
          if (upsertError) { setSyncError(upsertError); setLoading(false); return; }
        }
      } else {
        const p = fromRow(data);
        setProfile(p);
        setTaskLibrary(buildTaskLibrary(p));
        saveS(PROFILE_KEY, p);
      }
      setLoading(false);
    }

    load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep localStorage in sync so onboarding and offline still work
  useEffect(() => {
    saveS(PROFILE_KEY, profile);
  }, [profile]);

  const updateProfile = async (updates) => {
    const next = { ...profile, ...updates };
    const prev = profile;
    const prevLib = taskLibrary;
    setProfile(next);
    setTaskLibrary(buildTaskLibrary(next));
    if (user) {
      const { error } = await supabase.from("profiles").upsert({ id: user.id, ...toRow(next) });
      if (error) {
        setProfile(prev);
        setTaskLibrary(prevLib);
      }
    }
  };

  const addCustomTask = (task) => {
    setTaskLibrary(prev => [...prev, task]);
  };

  return { profile, setProfile, taskLibrary, setTaskLibrary, updateProfile, addCustomTask, loading, syncError };
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
