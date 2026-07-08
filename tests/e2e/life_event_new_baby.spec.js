import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser } from './helpers/auth.js';

// Stub GETs so the user starts with no tasks and no events. POSTs are
// intercepted so the test never writes to the dev Supabase project.
async function mockLifeEventEndpoints(page) {
  await page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/custom_tasks**', route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (method === 'POST') {
      // Echo the inserted rows back so the upsert "succeeds" cleanly.
      let parsed = [];
      try { parsed = JSON.parse(route.request().postData() || '[]'); } catch {}
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(parsed) });
    }
    return route.continue();
  });

  await page.route('**/rest/v1/life_events**', route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (method === 'POST') {
      let parsed = {};
      try {
        const data = JSON.parse(route.request().postData() || '{}');
        parsed = Array.isArray(data) ? data[0] : data;
      } catch {}
      const row = {
        id: '00000000-0000-0000-0000-000000000001',
        user_id: parsed.user_id ?? null,
        type: parsed.type ?? 'new-baby',
        status: 'active',
        intake_answers: parsed.intake_answers ?? null,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // .single() in supabase-js sets Accept header for a single object response
      const accept = route.request().headers()['accept'] || '';
      const body = accept.includes('vnd.pgrst.object') ? JSON.stringify(row) : JSON.stringify([row]);
      return route.fulfill({ status: 201, contentType: 'application/json', body });
    }
    return route.continue();
  });
}

test('user starts a new-baby life event from Profile', async ({ page }) => {
  await mockLifeEventEndpoints(page);
  await seedReturnUser(page);
  await page.goto('/');

  await loginWithDevCredentials(page);

  // Wait for app shell
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // Profile tab
  await page.getByText('Profile', { exact: true }).click();

  // Life events section is present, with the "New baby" button
  const newBabyBtn = page.getByRole('button', { name: /New baby/ });
  await expect(newBabyBtn).toBeVisible({ timeout: 5000 });
  await newBabyBtn.click();

  // Step 1: due date — advance ~8 months so the user is firmly in T1 (no retro screen)
  await expect(page.getByText('When is the baby due')).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.getByTestId('calendar-next').click();
  }
  await page.getByTestId('calendar-day-15').click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 2: conception path
  await expect(page.getByText('How is baby joining')).toBeVisible();
  await page.getByRole('button', { name: 'Pregnancy', exact: true }).click();

  // Step 3: accounts — say no to both so beneficiary tasks are filtered out
  await expect(page.getByText('A couple quick account questions.')).toBeVisible();
  // Two "No" buttons appear; click both in order
  const noButtons = page.getByRole('button', { name: 'No', exact: true });
  await noButtons.nth(0).click();
  await noButtons.nth(1).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // No retro screen for T1 users — straight to confirm
  await expect(page.getByText(/Ready to add \d+ tasks/)).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Add \d+ tasks/ }).click();

  // Sheet closes; Profile shows the active event with progress
  await expect(page.getByText(/of \d+ done/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Find your event tasks at the top of the All tab.')).toBeVisible();

  // All tab — event group should be visible at the top
  await page.getByText('All', { exact: true }).click();
  await expect(page.getByText('New baby').first()).toBeVisible({ timeout: 5000 });
});
