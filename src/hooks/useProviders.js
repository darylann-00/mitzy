import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { loadS, saveS, PROVIDER_HISTORY_KEY } from "../utils/storage";

// providerHistory[taskId] is an array of saved providers (good and bad),
// most recent last, so multiple providers per task type can be kept.
// Backed by the `saved_providers` table; localStorage is just the cache,
// same pattern as profile/task data, so providers survive sign-out and
// device switches instead of living only in the browser.

function fromRow(row) {
  return { id: row.id, vote: row.vote, notes: row.notes, ...row.data };
}

function groupByTask(rows) {
  return rows.reduce((acc, row) => {
    const entry = fromRow(row);
    (acc[row.task_id] ||= []).push(entry);
    return acc;
  }, {});
}

export function useProviders(user) {
  const [providerHistory, setProviderHistory] = useState(() => loadS(PROVIDER_HISTORY_KEY, {}));
  const [loading, setLoading] = useState(!!user);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        const grouped = groupByTask(data);
        setProviderHistory(grouped);
        saveS(PROVIDER_HISTORY_KEY, grouped);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProvider = async (taskId, provider) => {
    if (!user) return;
    const { vote, notes, id: _ignored, ...data } = provider;
    const { data: row, error } = await supabase
      .from('saved_providers')
      .insert({ user_id: user.id, task_id: taskId, vote, notes: notes ?? null, data })
      .select()
      .single();
    if (error) throw error;
    setProviderHistory(prev => {
      const next = { ...prev, [taskId]: [...(prev[taskId] || []), fromRow(row)] };
      saveS(PROVIDER_HISTORY_KEY, next);
      return next;
    });
  };

  const updateProvider = async (taskId, providerId, updates) => {
    if (!user) return;
    const { vote, notes, ...rest } = updates;
    const patch = {};
    if (vote !== undefined) patch.vote = vote;
    if (notes !== undefined) patch.notes = notes;
    if (Object.keys(rest).length) {
      const list = providerHistory[taskId] || [];
      const current = list.find(p => p.id === providerId);
      if (current) {
        const { id: _id, vote: _v, notes: _n, ...currentData } = current;
        patch.data = { ...currentData, ...rest };
      }
    }
    const { error } = await supabase.from('saved_providers').update(patch).eq('id', providerId);
    if (error) throw error;
    setProviderHistory(prev => {
      const list = prev[taskId];
      if (!list) return prev;
      const next = { ...prev, [taskId]: list.map(p => p.id === providerId ? { ...p, ...updates } : p) };
      saveS(PROVIDER_HISTORY_KEY, next);
      return next;
    });
  };

  const removeProvider = async (taskId, providerId) => {
    if (!user) return;
    const { error } = await supabase.from('saved_providers').delete().eq('id', providerId);
    if (error) throw error;
    setProviderHistory(prev => {
      const list = prev[taskId];
      if (!list) return prev;
      const next = list.filter(p => p.id !== providerId);
      const out = { ...prev };
      if (next.length) out[taskId] = next; else delete out[taskId];
      saveS(PROVIDER_HISTORY_KEY, out);
      return out;
    });
  };

  return { providerHistory, saveProvider, updateProvider, removeProvider, loading };
}
