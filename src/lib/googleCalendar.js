// Google Identity Services (GIS) wrapper — single shared loader + token client.
// Used at app startup (silent) and by SchedulePanel (silent first, falls back).
//
// Scope `calendar.events` covers BOTH read (events.list) and write (events.insert),
// so a single consent grant powers calendar matching at startup AND scheduling later.

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

let gisLoadPromise = null;
let tokenClient = null;

function loadGIS() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('gis_load_failed'));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

/**
 * Request a Google Calendar access token.
 *
 * @param {{ silent?: boolean }} opts
 *   silent=true uses `prompt: ''` — returns the existing grant if the user already
 *   consented, otherwise rejects without showing UI. Use at app startup.
 *   silent=false uses `prompt: 'consent'` — shows the OAuth popup. Use as fallback.
 *
 * @returns {Promise<string>} access token
 */
export function getCalendarToken({ silent = true } = {}) {
  if (!GOOGLE_CLIENT_ID) return Promise.reject(new Error('no_client_id'));

  return loadGIS().then(() => new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPE,
        callback: () => {}, // overridden per-request below
      });
    }
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return; }
      resolve(resp.access_token);
    };
    try {
      tokenClient.requestAccessToken({ prompt: silent ? '' : 'consent' });
    } catch (e) {
      reject(e);
    }
  }));
}
