import { useState, useEffect } from "react";
import { loadS, saveS, PROVIDER_HISTORY_KEY } from "../utils/storage";

export function useProviders() {
  const [providerHistory, setProviderHistory] = useState(() => loadS(PROVIDER_HISTORY_KEY, {}));

  useEffect(() => {
    saveS(PROVIDER_HISTORY_KEY, providerHistory);
  }, [providerHistory]);

  const saveProvider = (taskId, provider) => {
    setProviderHistory(prev => ({ ...prev, [taskId]: { ...provider, rating: null, notes: "" } }));
  };

  return { providerHistory, saveProvider };
}
