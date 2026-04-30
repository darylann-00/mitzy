import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCalendarToken } from "../lib/googleCalendar";
import { supabase } from "../lib/supabase";
import { useTaskContext } from "./TaskContext";

const CalendarContext = createContext(null);

// Phase 1: silently request calendar OAuth at startup, fetch upcoming events,
// run a Claude-Haiku match against active tasks. Phase 2 consumes
// `pendingCalendarMatches` to render confirm UI. Matches are NOT persisted —
// they are re-derived per session.

export function CalendarProvider({ user, children }) {
  const { activeTasks } = useTaskContext();
  const [accessToken, setAccessToken] = useState(null);
  const [pendingCalendarMatches, setPendingCalendarMatches] = useState([]);
  // Track taskIds the user has confirmed or dismissed this session so the
  // pipeline (which re-runs whenever activeTasks changes) doesn't re-surface them.
  const handledTaskIdsRef = useRef(new Set());
  const ranForUserRef = useRef(null);

  // Silent token request on sign-in. If denied, we swallow — calendar matching
  // is non-essential and SchedulePanel will fall back to a consent prompt later.
  useEffect(() => {
    if (!user) {
      setAccessToken(null);
      setPendingCalendarMatches([]);
      handledTaskIdsRef.current = new Set();
      ranForUserRef.current = null;
      return;
    }
    if (ranForUserRef.current === user.id) return;
    ranForUserRef.current = user.id;

    getCalendarToken({ silent: true })
      .then(setAccessToken)
      .catch(() => { /* user hasn't granted yet — fine, stay silent */ });
  }, [user]);

  // Once we have a token AND tasks, fetch events and match them.
  useEffect(() => {
    if (!accessToken || !user || activeTasks.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const supaToken = session?.access_token;
        if (!supaToken) return;

        const eventsRes = await fetch('/api/calendar-events', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${supaToken}`,
          },
          body: JSON.stringify({ accessToken }),
        });
        if (!eventsRes.ok) return;
        const { events } = await eventsRes.json();
        if (cancelled || !Array.isArray(events) || events.length === 0) return;

        const tasksPayload = activeTasks.map(t => ({
          id: t.id,
          label: t.label,
          category: t.cat,
        }));

        const matchRes = await fetch('/api/calendar-match', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${supaToken}`,
          },
          body: JSON.stringify({ events, tasks: tasksPayload }),
        });
        if (!matchRes.ok) return;
        const { matches } = await matchRes.json();
        if (cancelled || !Array.isArray(matches)) return;
        const fresh = matches.filter(m => !handledTaskIdsRef.current.has(m.taskId));
        setPendingCalendarMatches(fresh);
      } catch {
        // non-essential; fail quietly
      }
    })();

    return () => { cancelled = true; };
  }, [accessToken, user, activeTasks]);

  const dismissMatch = (taskId) => {
    handledTaskIdsRef.current.add(taskId);
    setPendingCalendarMatches(prev => prev.filter(m => m.taskId !== taskId));
  };

  return (
    <CalendarContext.Provider value={{
      accessToken,
      setAccessToken,
      pendingCalendarMatches,
      dismissMatch,
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendarContext = () => useContext(CalendarContext);
