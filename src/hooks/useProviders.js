import { useState, useEffect } from "react";
import { loadS, saveS, PROVIDER_HISTORY_KEY } from "../utils/storage";

export function useProviders() {
  const [providerHistory, setProviderHistory] = useState(() => loadS(PROVIDER_HISTORY_KEY, {}));

  useEffect(() => {
    saveS(PROVIDER_HISTORY_KEY, providerHistory);
  }, [providerHistory]);

  // providerHistory[taskId] is an array of saved providers (good and bad),
  // most recent last, so multiple providers per task type can be kept.
  const saveProvider = (taskId, provider) => {
    const entry = { ...provider, id: provider.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setProviderHistory(prev => ({ ...prev, [taskId]: [...(prev[taskId] || []), entry] }));
  };

  const updateProvider = (taskId, providerId, updates) => {
    setProviderHistory(prev => {
      const list = prev[taskId];
      if (!list) return prev;
      return { ...prev, [taskId]: list.map(p => p.id === providerId ? { ...p, ...updates } : p) };
    });
  };

  const removeProvider = (taskId, providerId) => {
    setProviderHistory(prev => {
      const list = prev[taskId];
      if (!list) return prev;
      const next = list.filter(p => p.id !== providerId);
      const out = { ...prev };
      if (next.length) out[taskId] = next; else delete out[taskId];
      return out;
    });
  };

  return { providerHistory, saveProvider, updateProvider, removeProvider };
}
