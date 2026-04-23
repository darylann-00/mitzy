import { createContext, useContext } from "react";
import { useProfile } from "../hooks/useProfile";
import { useProviders } from "../hooks/useProviders";
import { getClimateRegion } from "../utils/climateRegion";

const ProfileContext = createContext(null);

export function ProfileProvider({ user, children }) {
  const { profile, setProfile, taskLibrary, updateProfile, addCustomTask, loading, syncError } = useProfile(user);
  const { providerHistory, saveProvider } = useProviders();
  const region = getClimateRegion(profile?.zip);

  return (
    <ProfileContext.Provider value={{
      profile, setProfile, taskLibrary,
      updateProfile, addCustomTask,
      loading, syncError,
      providerHistory, saveProvider,
      region,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfileContext = () => useContext(ProfileContext);
