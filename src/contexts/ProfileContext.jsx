import { createContext, useContext } from "react";
import { useProfile } from "../hooks/useProfile";
import { useProviders } from "../hooks/useProviders";
import { getClimateRegion } from "../utils/climateRegion";

const ProfileContext = createContext(null);

export function ProfileProvider({ user, welcomeChoice, children }) {
  const {
    profile, setProfile, taskLibrary,
    updateProfile, addCustomTask,
    loading, syncError,
    pendingConflict, resolveConflict,
    serverProfileChecked, serverProfileExists,
  } = useProfile(user, welcomeChoice);
  const { providerHistory, saveProvider } = useProviders();
  const region = getClimateRegion(profile?.zip);

  return (
    <ProfileContext.Provider value={{
      profile, setProfile, taskLibrary,
      updateProfile, addCustomTask,
      loading, syncError,
      pendingConflict, resolveConflict,
      serverProfileChecked, serverProfileExists,
      providerHistory, saveProvider,
      region,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfileContext = () => useContext(ProfileContext);
