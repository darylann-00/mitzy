import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser, mockTaskRecords, mockProfile, mockCustomTasks } from './helpers/auth.js';

// Mocks Phase 1's calendar OAuth + match pipeline so the test doesn't need a
// real Google account. Three pieces:
// 1) Stub `getCalendarToken` so the silent OAuth resolves with a fake token.
// 2) Mock `/api/calendar-events` to return one event matching the seeded task.
// 3) Mock `/api/calendar-match` to return a hand-crafted match for `hm-smoke`.
async function mockCalendarMatch(page, { taskId, eventTitle, eventDate }) {
  await page.addInitScript(({ taskId, eventTitle, eventDate }) => {
    window.__MITZY_FAKE_CAL_TOKEN__ = 'fake-token';
    window.__MITZY_FAKE_MATCH__ = { taskId, eventTitle, eventDate };
  }, { taskId, eventTitle, eventDate });

  await page.route('**/api/calendar-events', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: [{ id: 'evt-1', summary: eventTitle, start: eventDate }] }),
    });
  });

  await page.route('**/api/calendar-match', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        matches: [{ taskId, eventId: 'evt-1', eventTitle, eventDate, confidence: 0.95 }],
      }),
    });
  });
}

test('user confirms a calendar match → task becomes scheduled', async ({ page }) => {
  const inAWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  await mockTaskRecords(page);
  await mockProfile(page);
  await mockCustomTasks(page);
  await seedReturnUser(page);
  await mockCalendarMatch(page, {
    taskId: 'hm-smoke',
    eventTitle: 'Replace smoke detector batteries',
    eventDate: inAWeek,
  });

  // Capture the upsert that markScheduled fires so we can assert the date is saved.
  let scheduledUpsertBody = null;
  await page.route('**/rest/v1/task_records**', async route => {
    const req = route.request();
    if (req.method() === 'POST' || req.method() === 'PATCH') {
      try { scheduledUpsertBody = req.postDataJSON(); } catch { /* noop */ }
      return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
    }
    return route.continue();
  });

  await page.goto('/');
  await loginWithDevCredentials(page);
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // Switch to All so the seeded task is always rendered regardless of focus state.
  await page.getByText('All', { exact: true }).click();
  await expect(page.getByTestId('task-card').first()).toBeVisible({ timeout: 5000 });

  // Confirmation chip should appear with the event title.
  const chipText = page.getByText('Replace smoke detector batteries');
  await expect(chipText).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Found:')).toBeVisible();

  // Click "Yes" — there's only one match chip, so the first Yes is unambiguous.
  await page.getByRole('button', { name: 'Yes' }).first().click();

  // Chip dismisses on confirm.
  await expect(chipText).not.toBeVisible({ timeout: 5000 });

  // Supabase upsert should include the scheduled_date we sent.
  await expect.poll(() => scheduledUpsertBody?.scheduled_date).toBe(inAWeek);
});

test('user dismisses a calendar match → chip disappears, no upsert', async ({ page }) => {
  const inAWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  await mockTaskRecords(page);
  await mockProfile(page);
  await mockCustomTasks(page);
  await seedReturnUser(page);
  await mockCalendarMatch(page, {
    taskId: 'hm-smoke',
    eventTitle: 'Replace smoke detector batteries',
    eventDate: inAWeek,
  });

  let writesObserved = 0;
  await page.route('**/rest/v1/task_records**', async route => {
    const m = route.request().method();
    if (m === 'POST' || m === 'PATCH') writesObserved++;
    return m === 'GET' ? route.continue() : route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/');
  await loginWithDevCredentials(page);
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });
  await page.getByText('All', { exact: true }).click();

  const chipText = page.getByText('Replace smoke detector batteries');
  await expect(chipText).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: 'Not mine' }).first().click();
  await expect(chipText).not.toBeVisible({ timeout: 5000 });

  // Dismiss should NOT write to Supabase.
  expect(writesObserved).toBe(0);
});
