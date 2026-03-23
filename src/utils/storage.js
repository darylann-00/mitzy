// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const TASK_STATE_KEY         = "mitzy-v6";
export const ONBOARDED_KEY          = "mitzy-ob-v6";
export const DISABLED_KEY           = "mitzy-dis-v6";
export const PROFILE_KEY            = "mitzy-pro-v6";
export const ASSIST_CACHE_PREFIX    = "mitzy-assist-v6";
export const PROVIDER_HISTORY_KEY   = "mitzy-ph-v6";
export const VISIT_COUNT_KEY        = "mitzy-visits-v6";
export const HAZARD_DONE_KEY        = "mitzy-hz-v6";
export const KNOWLEDGE_REFRESH_KEY  = "mitzy-kr-v6";
export const PROFILE_QUESTIONS_KEY  = "mitzy-pq-v6";

export const ASSIST_CACHE_TTL      = 7  * 24 * 60 * 60 * 1000; // 7 days
export const KNOWLEDGE_REFRESH_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

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
