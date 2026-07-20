import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser, mockProfile } from './helpers/auth.js';

// Fully mocks task_records and custom_tasks (GET returns known state, writes
// are captured and echoed back) so the test never writes to the real
// prod/preview Supabase project.
async function mockTaskTables(page, captured) {
  const lastDone = new Date(Date.now() - 400 * 86400000).toISOString();
  await page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          task_id: 'hm-smoke', last_done: lastDone, scheduled_date: null,
          interval_days: 30, needed: false, disabled: false,
        }]),
      });
    }
    return route.fulfill({ status: 201, contentType: 'application/json', body: route.request().postData() || '[]' });
  });

  await page.route('**/rest/v1/custom_tasks**', route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (method === 'POST') {
      try { captured.rows.push(JSON.parse(route.request().postData() || '{}')); } catch {}
      return route.fulfill({ status: 201, contentType: 'application/json', body: route.request().postData() || '{}' });
    }
    return route.continue();
  });
}

test('manual mode saves a custom task with the Other category and a custom frequency', async ({ page }) => {
  const captured = { rows: [] };
  await mockProfile(page);
  await mockTaskTables(page, captured);
  await seedReturnUser(page);

  await page.goto('/');
  await loginWithDevCredentials(page);
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // Open the creator from the sparkle FAB and switch to manual mode.
  await page.getByRole('button', { name: 'Add a task' }).click();
  await expect(page.getByText('Mitzy magic')).toBeVisible();
  await page.getByRole('button', { name: 'Do it myself' }).click();

  await page.getByPlaceholder('e.g. Clean washing machine').fill('Descale the espresso machine');
  await page.getByRole('button', { name: 'Other' }).click();

  // Custom frequency via the "Every N unit" control: every 2 months → 60 days.
  await page.getByRole('spinbutton').fill('2');
  await page.getByRole('combobox').selectOption('months');

  await page.getByRole('button', { name: /high/i }).click();
  await page.getByRole('button', { name: 'Add to my tasks' }).click();

  // The upsert must carry the manual form's choices.
  await expect.poll(() => captured.rows.length).toBeGreaterThan(0);
  const row = Array.isArray(captured.rows[0]) ? captured.rows[0][0] : captured.rows[0];
  expect(row.cat).toBe('other');
  expect(row.interval_days).toBe(60);
  expect(row.stakes).toBe('high');
  expect(row.one_time).toBe(false);
  expect(row.label).toBe('Descale the espresso machine');

  // Overlay closes after saving.
  await expect(page.getByText('Do it myself')).not.toBeVisible();
});
