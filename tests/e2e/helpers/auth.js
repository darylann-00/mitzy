import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Each worker process gets its own throwaway "+pw-<uuid>" address derived from
// PLAYWRIGHT_TEST_EMAIL. Supabase doesn't canonicalize "+tag" addressing, so
// this is a distinct auth user per process — concurrent CI runs (or workers)
// never share magic-link state and can't invalidate each other's tokens.
// Stale tagged users are swept up by tests/e2e/helpers/cleanupTestUsers.js.
const TEST_EMAIL = buildTestEmail(process.env.PLAYWRIGHT_TEST_EMAIL ?? 'test@example.com');
const supabaseUrl     = process.env.VITE_SUPABASE_URL          ?? '';
const supabaseAnon    = process.env.VITE_SUPABASE_ANON_KEY     ?? '';
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY   ?? '';

function buildTestEmail(base) {
  const [local, domain] = base.split('@');
  return `${local}+pw-${randomUUID()}@${domain}`;
}

let cachedSession = null;

async function getSession() {
  if (cachedSession) return cachedSession;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_EMAIL,
  });
  if (linkError) throw new Error(`Test auth: generateLink failed: ${linkError.message}`);

  const client = createClient(supabaseUrl, supabaseAnon);
  const { data, error } = await client.auth.verifyOtp({
    email: TEST_EMAIL,
    token: linkData.properties.email_otp,
    type: 'email',
  });
  if (error) throw new Error(`Test auth: verifyOtp failed: ${error.message}`);

  cachedSession = data.session;
  return cachedSession;
}

export async function loginWithDevCredentials(page) {
  const session = await getSession();
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

  await page.addInitScript(({ key, session }) => {
    localStorage.setItem(key, JSON.stringify(session));
  }, { key: storageKey, session });

  await page.reload();
}

export async function seedReturnUser(page) {
  await page.addInitScript(() => {
    localStorage.setItem('mitzy-welcome-v1', JSON.stringify('returning'));
    localStorage.setItem('mitzy-ob-v6',    JSON.stringify(true));
    localStorage.setItem('mitzy-ob-v6-p',  JSON.stringify(true));
  });
}

// Intercepts the Supabase task_records GET so the test always sees one known
// overdue task (hm-smoke, requires: []) regardless of the test user's real DB state.
// Only GETs are intercepted — writes pass through so mark_done can actually save.
export async function mockTaskRecords(page) {
  const lastDone = new Date(Date.now() - 400 * 86400000).toISOString();
  await page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        task_id:        'hm-smoke',
        last_done:      lastDone,
        scheduled_date: null,
        interval_days:  30,
        needed:         false,
        disabled:       false,
      }]),
    });
  });
}
