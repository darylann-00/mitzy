import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCalendarToken } from "../lib/googleCalendar";
import { supabase } from "../lib/supabase";
import { useTaskContext } from "./TaskContext";
import { loadS, saveS, CAL_GRANTED_KEY } from "../utils/storage";

const CalendarContext = createContext(null);

export function CalendarProvider({ user, children }) {
  const { activeTasks } = useTaskContext();
  const [accessToken, setAccessToken] = useState(null);
  const [calGranted, setCalGranted] = useState(() => loadS(CAL_GRANTED_KEY, false));
  const [pendingCalendarMatches, setPendingCalendarMatches] = useState([]);
  const handledTaskIdsRef = useRef(new Set());
  const ranForUserRef = useRef(null);
  const detectionKeyRef = useRef(null);
  const activeTasksRef = useRef(activeTasks);
  useEffect(() => { activeTasksRef.current = activeTasks; }, [activeTasks]);

  const markGranted = (token) => {
    setAccessToken(token);
    setCalGranted(true);
    saveS(CAL_GRANTED_KEY, true);
    detectionKeyRef.current = null; // allow detection to re-run with new token
  };

  // Explicit connect -- called from Profile, ScheduleSurface, and Onboarding.
  // Only shown when calGranted is false, so a silent pre-check almost never
  // succeeds -- and awaiting it before falling back to the consent popup
  // burns the click's user-gesture window, causing the popup to be blocked
  // or silently closed by the browser. Go straight to the consent prompt.
  const connectCalendar = async () => {
    try {
      const token = await getCalendarToken({ silent: false });
      markGranted(token);
      return true;
    } catch (err) {
      console.error('[calendar] connect failed:', err);
      return false;
    }
  };

  // Silent token request on sign-in. If it succeeds, also persist the granted
  // flag so the UI knows calendar is connected.
  useEffect(() => {
    if (!user) {
      setAccessToken(null);
      setPendingCalendarMatches([]);
      handledTaskIdsRef.current = new Set();
      ranForUserRef.current = null;
      detectionKeyRef.current = null;
      return;
    }
    if (ranForUserRef.current === user.id) return;
    ranForUserRef.current = user.id;

    getCalendarToken({ silent: true })
      .then(token => markGranted(token))
      .catch(() => { /* not granted yet -- fine */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Detection pipeline -- runs once per (user, token). Uses activeTasks.length
  // so it triggers when tasks first load, but not on every state mutation.
  useEffect(() => {
    if (!accessToken || !user || activeTasks.length === 0) return;

    const key = `${user.id}:${accessToken}`;
    if (detectionKeyRef.current === key) return;
    detectionKeyRef.current = key;

    const tasks = activeTasksRef.current;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const supaToken = session?.access_token;
        if (!supaToken) return;

        const eventsRes = await fetch('/api/calendar-events', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${supaToken}` },
          body: JSON.stringify({ accessToken }),
        });
        if (!eventsRes.ok) return;
        const { events } = await eventsRes.json();
        if (cancelled || !Array.isArray(events) || events.length === 0) return;

        const matchRes = await fetch('/api/calendar-match', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${supaToken}` },
          body: JSON.stringify({
            events,
            tasks: tasks.map(t => ({ id: t.id, label: t.label, category: t.cat })),
          }),
        });
        if (!matchRes.ok) return;
        const { matches } = await matchRes.json();
        if (cancelled || !Array.isArray(matches)) return;
        const fresh = matches.filter(m => !handledTaskIdsRef.current.has(m.taskId));
        setPendingCalendarMatches(fresh);
      } catch { /* non-essential */ }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user, activeTasks.length]);

  const dismissMatch = (taskId) => {
    handledTaskIdsRef.current.add(taskId);
    setPendingCalendarMatches(prev => prev.filter(m => m.taskId !== taskId));
  };

  return (
    <CalendarContext.Provider value={{
      accessToken,
      setAccessToken,
      calGranted,
      connectCalendar,
      pendingCalendarMatches,
      dismissMatch,
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendarContext = () => useContext(CalendarContext);
