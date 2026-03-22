import { useState, useEffect } from "react";
import { loadS, saveS, PROFILE_KEY } from "../utils/storage";
import { buildTaskLibrary } from "../data/taskFactory";

export function useProfile() {
  const [profile, setProfile] = useState(() => loadS(PROFILE_KEY, {}));

  const [taskLibrary, setTaskLibrary] = useState(() => {
    const saved = loadS(PROFILE_KEY, {});
    return saved.zip ? buildTaskLibrary(saved) : [];
  });

  useEffect(() => {
    saveS(PROFILE_KEY, profile);
  }, [profile]);

  const updateProfile = (updates) => {
    const next = { ...profile, ...updates };
    setProfile(next);
    setTaskLibrary(buildTaskLibrary(next));
  };

  const addCustomTask = (task) => {
    setTaskLibrary(prev => [...prev, task]);
  };

  return { profile, setProfile, taskLibrary, setTaskLibrary, updateProfile, addCustomTask };
}
