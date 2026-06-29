import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL      = process.env.PLAYWRIGHT_TEST_EMAIL      ?? 'test@example.com';
const supabaseUrl     = process.env.VITE_SUPABASE_URL          ?? '';
const supabaseAnon    = process.env.VITE_SUPABASE_ANON_KEY     ?? '';
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY   ?? '';

let cachedSession = null;

// Tests share one real, pre-onboarded PLAYWRIGHT_TEST_EMAIL account (most
// specs don't mock /rest/v1/profiles and depend on its persisted profile
// row). Supabase only keeps one active OTP per user, so concurrent CI jobs
// generating a magic link for that same email can invalidate each other's
// token between our generateLink and verifyOtp calls. Retry the whole
// generate-then-verify cycle with jittered backoff rather than failing.
async function getSession() {
  if (cachedSession) return cachedSession;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const client = createClient(supabaseUrl, supabaseAnon);

  const maxAttempts = 5;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: TEST_EMAIL,
    });
    if (linkError) throw new Error(`Test auth: generateLink failed: ${linkError.message}`);

    const { data, error } = await client.auth.verifyOtp({
      email: TEST_EMAIL,
      token: linkData.properties.email_otp,
      type: 'email',
    });
    if (!error) {
      cachedSession = data.session;
      return cachedSession;
    }

    lastError = error;
    await new Promise(resolve => setTimeout(resolve, attempt * 500 + Math.random() * 500));
  }
  throw new Error(`Test auth: verifyOtp failed after ${maxAttempts} attempts: ${lastError.message}`);
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
