// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const TASK_STATE_KEY         = "mitzy-v6";
export const ONBOARDED_KEY          = "mitzy-ob-v6";
export const PROFILE_DONE_KEY       = "mitzy-ob-v6-p";
export const DISABLED_KEY           = "mitzy-dis-v6";
export const PROFILE_KEY            = "mitzy-pro-v7";
export const ASSIST_CACHE_PREFIX    = "mitzy-assist-v12";
export const PROVIDER_HISTORY_KEY   = "mitzy-ph-v6";
export const VISIT_COUNT_KEY        = "mitzy-visits-v6";
export const HAZARD_DONE_KEY        = "mitzy-hz-v6";
export const KNOWLEDGE_REFRESH_KEY  = "mitzy-kr-v6";
export const TRICKLE_DATE_KEY       = "mitzy-td-v6";
export const TRICKLE_QUEUE_KEY      = "mitzy-tq-v6";
export const WELCOME_CHOICE_KEY     = "mitzy-welcome-v1";

export const ASSIST_CACHE_TTL      = 7  * 24 * 60 * 60 * 1000; // 7 days
export const KNOWLEDGE_REFRESH_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

// ─── Old key cleanup ──────────────────────────────────────────────────────────
// Removes stale mitzy-* keys from previous schema versions on startup.
const CURRENT_KEYS = new Set([
  "mitzy-v6", "mitzy-ob-v6", "mitzy-ob-v6-p", "mitzy-dis-v6", "mitzy-pro-v7",
  "mitzy-ph-v6", "mitzy-visits-v6", "mitzy-hz-v6", "mitzy-kr-v6", "mitzy-td-v6", "mitzy-tq-v6",
  "mitzy-welcome-v1",
]);

export function cleanupOldKeys() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mitzy-') && !CURRENT_KEYS.has(key) && !key.startsWith(ASSIST_CACHE_PREFIX + '-')) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}

// Per-user local state — cleared on sign-out.
const USER_KEYS = [
  "mitzy-v6",         // TASK_STATE_KEY
  "mitzy-ob-v6",      // ONBOARDED_KEY
  "mitzy-ob-v6-p",    // PROFILE_DONE_KEY
  "mitzy-dis-v6",     // DISABLED_KEY
  "mitzy-pro-v7",     // PROFILE_KEY
  "mitzy-visits-v6",  // VISIT_COUNT_KEY
  "mitzy-hz-v6",      // HAZARD_DONE_KEY
  "mitzy-kr-v6",      // KNOWLEDGE_REFRESH_KEY
  "mitzy-td-v6",      // TRICKLE_DATE_KEY
  "mitzy-tq-v6",      // TRICKLE_QUEUE_KEY
  "mitzy-ph-v6",      // PROVIDER_HISTORY_KEY
  "mitzy-welcome-v1", // WELCOME_CHOICE_KEY
];

export function clearLocalUserData() {
  try {
    USER_KEYS.forEach(key => localStorage.removeItem(key));
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(ASSIST_CACHE_PREFIX + '-')) localStorage.removeItem(key);
    });
  } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function loadS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
