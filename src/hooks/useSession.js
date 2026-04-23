import { useState, useEffect } from "react";
import {
  loadS, saveS,
  VISIT_COUNT_KEY, HAZARD_DONE_KEY,
  KNOWLEDGE_REFRESH_KEY, KNOWLEDGE_REFRESH_TTL, TRICKLE_DATE_KEY, TRICKLE_QUEUE_KEY,
} from "../utils/storage";
import { detectHazards } from "../utils/hazards";

export function useSession({ onboarded, profile, activeTasks, taskState }) {
  const [visitCount,     setVisitCount]   = useState(() => loadS(VISIT_COUNT_KEY, 0));
  const [trickleTask,    setTrickleTask]  = useState(null);
  const [pendingHazards, setPendingHazards] = useState(null);
  const [hazardDone,     setHazardDone]  = useState(() => loadS(HAZARD_DONE_KEY, false));

  useEffect(() => {
    if (!onboarded) return;

    const next = visitCount + 1;
    setVisitCount(next);
    saveS(VISIT_COUNT_KEY, next);

    // Trickle: rotate through unknown tasks, one per 5 days.
    // Clock starts when surfaced — dismiss/ignore/answer all advance the same way.
    const lastDate  = loadS(TRICKLE_DATE_KEY, null);
    const daysSince = lastDate
      ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
      : 999;
    if (daysSince >= 5 && activeTasks?.length > 0) {
      const stakeWeight = { high: 3, medium: 2, low: 1 };
      const unknown = activeTasks
        .filter(t => !taskState[t.id]?.lastDone)
        .sort((a, b) => (stakeWeight[b.stakes] || 1) - (stakeWeight[a.stakes] || 1));
      if (unknown.length > 0) {
        const unknownIds = new Set(unknown.map(t => t.id));
        // Keep only still-unknown IDs, then append any new ones not yet queued
        let queue = loadS(TRICKLE_QUEUE_KEY, []).filter(id => unknownIds.has(id));
        const inQueue = new Set(queue);
        unknown.forEach(t => { if (!inQueue.has(t.id)) queue.push(t.id); });
        // Pick from front, rotate to back
        const taskId = queue[0];
        queue.push(queue.shift());
        saveS(TRICKLE_QUEUE_KEY, queue);
        saveS(TRICKLE_DATE_KEY, new Date().toISOString().slice(0, 10));
        const task = unknown.find(t => t.id === taskId);
        if (task) setTrickleTask(task);
      }
    }

    // Hazard check
    if (next >= 2 && !hazardDone && profile.zip) {
      detectHazards(profile.zip)
        .then(hazards => {
          if (hazards.length > 0) setPendingHazards(hazards);
          setHazardDone(true);
          saveS(HAZARD_DONE_KEY, true);
        })
        .catch(() => {});
    }

    // Knowledge refresh (mocked)
    const lastRefresh = loadS(KNOWLEDGE_REFRESH_KEY, 0);
    if (next >= 3 && Date.now() - lastRefresh > KNOWLEDGE_REFRESH_TTL) {
      setTimeout(() => saveS(KNOWLEDGE_REFRESH_KEY, Date.now()), 1000);
    }
  }, [onboarded]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissTrickle = () => setTrickleTask(null);
  const answerTrickle  = () => setTrickleTask(null);

  return {
    visitCount,
    trickleTask,
    dismissTrickle,
    answerTrickle,
    pendingHazards,
    setPendingHazards,
  };
}
