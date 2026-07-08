import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser } from './helpers/auth.js';

// Stub GETs so the user starts with a known profile (one kid, no insurance
// set yet) and no tasks. Writes are intercepted and echoed back so the test
// never depends on or mutates real data in the dev/prod Supabase project.
async function mockProfileEndpoints(page, { captureUpserts } = {}) {
  await page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/custom_tasks**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/rest/v1/profiles**', route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: '00000000-0000-0000-0000-0000000000aa',
          name: 'Jamie',
          zip: '97201',
          own_rent: 'own',
          age: '1990',
          gender: 'woman',
          cars: [],
          has_car: false,
          kids: [{ name: 'Mira', birthYear: '2015' }],
          has_kids: true,
          pets: [],
          has_pets: false,
          onboarded: true,
          visit_count: 2,
          hazard_done: true,
          profile_questions: null,
          capacity: 'normal',
          insurance: 'Aetna',
        }]),
      });
    }
    // POST/PATCH (upsert) — echo the row back so the save "succeeds" cleanly.
    let parsed = {};
    try {
      const data = JSON.parse(route.request().postData() || '{}');
      parsed = Array.isArray(data) ? data[0] : data;
    } catch {}
    if (captureUpserts) captureUpserts.push(parsed);
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([parsed]) });
  });
}

test('Profile shows a Self health card, and the Kids section now has an insurance field per kid', async ({ page }) => {
  const upserts = [];
  await mockProfileEndpoints(page, { captureUpserts: upserts });
  await seedReturnUser(page);
  await page.goto('/');
  await loginWithDevCredentials(page);

  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // Profile tab
  await page.getByText('Profile', { exact: true }).click();

  // Self health card (renamed from generic "Health")
  await expect(page.getByText('Self', { exact: true })).toBeVisible({ timeout: 5000 });

  // Kid still lives in the existing Kids section — no separate per-kid card —
  // and now shows an Insurance row alongside name/birth year.
  await expect(page.getByText('Mira', { exact: true })).toBeVisible();
  await expect(page.getByText('Not set').first()).toBeVisible();

  // Edit profile → set Mira's insurance (the Kids-section picker is the first
  // "Search providers…" input on the page; Self's is the second).
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByPlaceholder('Search providers…').nth(0).fill('Aetna');
  await page.getByRole('button', { name: 'Aetna' }).first().click();

  await page.getByRole('button', { name: 'Save changes' }).click();

  // Saved profile upsert includes the kid's own insurance, distinct from self's.
  await expect.poll(() => upserts.some(u => u.kids?.[0]?.insurance === 'Aetna')).toBe(true);

  // Display mode reflects the saved value under Mira's Insurance row.
  await expect(page.getByText('Not set')).not.toBeVisible();
});
