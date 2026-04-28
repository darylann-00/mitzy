const TEST_EMAIL    = process.env.PLAYWRIGHT_TEST_EMAIL    ?? 'test@example.com';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'testexample';

export async function loginWithDevCredentials(page) {
  await page.getByTestId('dev-email').fill(TEST_EMAIL);
  await page.getByTestId('dev-password').fill(TEST_PASSWORD);
  await page.getByTestId('dev-sign-in').click();
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
