import { createContext, useContext } from "react";
import { useProfile } from "../hooks/useProfile";
import { useProviders } from "../hooks/useProviders";
import { useLifeEvents } from "../hooks/useLifeEvents";
import { getClimateRegion } from "../utils/climateRegion";

const ProfileContext = createContext(null);

export function ProfileProvider({ user, welcomeChoice, children }) {
  const {
    profile, setProfile, taskLibrary, customTasks,
    updateProfile, addCustomTask, removeCustomTask,
    addCustomTasksBulk, removeCustomTasksByLifeEvent,
    loading, syncError,
    pendingConflict, resolveConflict,
    serverProfileChecked, serverProfileExists,
  } = useProfile(user, welcomeChoice);
  const { providerHistory, saveProvider, updateProvider, removeProvider } = useProviders();
  const lifeEvents = useLifeEvents({ user, customTasks, addCustomTasksBulk, removeCustomTasksByLifeEvent });
  const region = getClimateRegion(profile?.zip);

  return (
    <ProfileContext.Provider value={{
      profile, setProfile, taskLibrary, customTasks,
      updateProfile, addCustomTask, removeCustomTask,
      loading, syncError,
      pendingConflict, resolveConflict,
      serverProfileChecked, serverProfileExists,
      providerHistory, saveProvider, updateProvider, removeProvider,
      region,
      lifeEvents,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfileContext = () => useContext(ProfileContext);
