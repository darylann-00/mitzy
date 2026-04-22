import { useState, useEffect } from "react";
import {
  loadS, saveS,
  VISIT_COUNT_KEY, HAZARD_DONE_KEY,
  KNOWLEDGE_REFRESH_KEY, KNOWLEDGE_REFRESH_TTL, TRICKLE_DATE_KEY,
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

    // Trickle: one unknown task per calendar day
    const today    = new Date().toISOString().slice(0, 10);
    const lastDate = loadS(TRICKLE_DATE_KEY, null);
    if (lastDate !== today && activeTasks?.length > 0) {
      const stakeWeight = { high: 3, medium: 2, low: 1 };
      const unknown = activeTasks
        .filter(t => !taskState[t.id]?.lastDone)
        .sort((a, b) => (stakeWeight[b.stakes] || 1) - (stakeWeight[a.stakes] || 1));
      if (unknown.length > 0) setTrickleTask(unknown[0]);
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

  const dismissTrickle = () => {
    saveS(TRICKLE_DATE_KEY, new Date().toISOString().slice(0, 10));
    setTrickleTask(null);
  };

  const answerTrickle = () => {
    saveS(TRICKLE_DATE_KEY, new Date().toISOString().slice(0, 10));
    setTrickleTask(null);
  };

  return {
    visitCount,
    trickleTask,
    dismissTrickle,
    answerTrickle,
    pendingHazards,
    setPendingHazards,
  };
}
