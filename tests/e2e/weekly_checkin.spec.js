import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser, mockTaskRecords } from './helpers/auth.js';

// Seeds one custom one-time task (due in 2 days) plus one overdue library task
// (hm-smoke) so the review screen has both "already on your plate" and
// "Mitzy suggestions" content without needing to mock the Claude matching API.
async function mockWeeklyCheckInData(page, { dueDate }) {
  await page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          task_id: 'custom-test-1',
          last_done: null,
          scheduled_date: null,
          due_date: dueDate,
          interval_days: null,
          one_time: true,
          needed: false,
          disabled: false,
        },
        {
          task_id: 'hm-smoke',
          last_done: new Date(Date.now() - 400 * 86400000).toISOString(),
          scheduled_date: null,
          interval_days: 30,
          needed: false,
          disabled: false,
        },
      ]),
    });
  });

  await page.route('**/rest/v1/custom_tasks**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        task_id: 'custom-test-1',
        cat: 'finance',
        label: 'Submit claim for FSA',
        one_time: true,
        window_days: 14,
      }]),
    });
  });
}

test('unchecking an existing task on the review screen keeps it visible, and its due date stays editable', async ({ page }) => {
  const inTwoDays = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  await mockWeeklyCheckInData(page, { dueDate: inTwoDays });
  await seedReturnUser(page);

  await page.goto('/');
  await loginWithDevCredentials(page);
  await expect(page.getByText('Today', { exact: true })).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: "Let's do it" }).click();
  await expect(page.getByText('Already on your plate')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Submit claim for FSA')).toBeVisible();

  // Skip the brain-dump textarea — go straight to the review screen.
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText("This week's plan")).toBeVisible({ timeout: 10000 });

  const taskLabel = page.getByText('Submit claim for FSA');
  await expect(taskLabel).toBeVisible();

  // Mitzy suggestions should already be visible, no expand needed.
  await expect(page.getByText('Mitzy suggestions')).toBeVisible();
  await expect(page.getByText('Test smoke & CO detectors')).toBeVisible();

  // Uncheck the custom task — it should stay on screen, just unchecked.
  await taskLabel.click();
  await expect(taskLabel).toBeVisible();

  // Re-check it, then confirm its due date is still editable from this screen.
  await taskLabel.click();
  await expect(taskLabel).toBeVisible();

  const dateLabel = new Date(inTwoDays + 'T12:00:00')
    .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  await page.getByRole('button', { name: dateLabel }).click();
  await expect(page.getByTestId('date-field-toggle')).toBeVisible();
});

// Regression test for a bug where a day-of-week mention (e.g. "Monday") in the
// brain-dump was resolved to a date already in the past, because the matching
// API only received "weekStart" and had no way to tell whether that weekday had
// already passed this week. Fix: the frontend now also sends "today", and the
// matching API's system prompt uses it to roll forward to next week when needed.
// This test locks in the plumbing (the request payload) since the actual
// day-of-week judgment happens inside the mocked Claude call, not in JS.
test('brain dump submission sends today\'s actual date to the matching API', async ({ page }) => {
  await mockTaskRecords(page);
  await page.route('**/rest/v1/custom_tasks**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await seedReturnUser(page);

  let requestBody = null;
  await page.route('**/api/weekly-checkin', route => {
    requestBody = route.request().postDataJSON();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ matches: [], newTaskSuggestions: [], gapFill: [] }),
    });
  });

  await page.goto('/');
  await loginWithDevCredentials(page);
  await expect(page.getByText('Today', { exact: true })).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: "Let's do it" }).click();
  await page.getByPlaceholder(/vet Thursday/).fill('Vet appointment Monday');
  await page.getByRole('button', { name: 'Plan my week' }).click();

  await expect.poll(() => requestBody).not.toBeNull();
  expect(requestBody.today).toBe(new Date().toISOString().slice(0, 10));
  expect(requestBody.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
