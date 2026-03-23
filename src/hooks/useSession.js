import { useState, useEffect } from "react";
import {
  loadS, saveS,
  VISIT_COUNT_KEY, HAZARD_DONE_KEY,
  KNOWLEDGE_REFRESH_KEY, KNOWLEDGE_REFRESH_TTL, PROFILE_QUESTIONS_KEY,
} from "../utils/storage";
import { TRICKLE_QUESTIONS } from "../data/constants";
import { detectHazards } from "../utils/hazards";

export function useSession({ onboarded, profile }) {
  const [visitCount,       setVisitCount]       = useState(() => loadS(VISIT_COUNT_KEY, 0));
  const [trickleQ,         setTrickleQ]          = useState(null);
  const [knowledgeUpdates, setKnowledgeUpdates]  = useState(null); // eslint-disable-line no-unused-vars
  const [pendingHazards,   setPendingHazards]    = useState(null);
  const [hazardDone,       setHazardDone]        = useState(() => loadS(HAZARD_DONE_KEY, false));

  // Increment visit count and kick off session checks on first onboarded load
  useEffect(() => {
    if (!onboarded) return;

    const next = visitCount + 1;
    setVisitCount(next);
    saveS(VISIT_COUNT_KEY, next);

    // Trickle question
    const answered = loadS(PROFILE_QUESTIONS_KEY, []);
    const q = TRICKLE_QUESTIONS.find(q =>
      next >= q.visit &&
      !answered.includes(q.id) &&
      !(q.id === "enrollment" && !profile.hasKids)
    );
    if (q) setTrickleQ(q);

    // Hazard check
    if (next >= 2 && !hazardDone && profile.zip) {
      detectHazards(profile.zip).then(hazards => {
        if (hazards.length > 0) setPendingHazards(hazards);
        setHazardDone(true);
        saveS(HAZARD_DONE_KEY, true);
      });
    }

    // Knowledge refresh
    const lastRefresh = loadS(KNOWLEDGE_REFRESH_KEY, 0);
    if (next >= 3 && Date.now() - lastRefresh > KNOWLEDGE_REFRESH_TTL) {
      // Mocked — real implementation checks for guidance updates
      setTimeout(() => saveS(KNOWLEDGE_REFRESH_KEY, Date.now()), 1000);
    }
  }, [onboarded]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissTrickle = () => {
    const answered = loadS(PROFILE_QUESTIONS_KEY, []);
    saveS(PROFILE_QUESTIONS_KEY, [...answered, trickleQ.id]);
    setTrickleQ(null);
  };

  const answerTrickle = (updates, onUpdateProfile) => {
    onUpdateProfile(updates);
    const answered = loadS(PROFILE_QUESTIONS_KEY, []);
    saveS(PROFILE_QUESTIONS_KEY, [...answered, trickleQ.id]);
    setTrickleQ(null);
  };

  return {
    visitCount,
    trickleQ,
    dismissTrickle,
    answerTrickle,
    knowledgeUpdates,
    pendingHazards,
    setPendingHazards,
  };
}
