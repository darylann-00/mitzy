import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser } from './helpers/auth.js';

// Saved providers used to live only in localStorage and were wiped on
// sign-out/cache-clear. They now sync through the `saved_providers` table —
// this test proves a saved provider round-trips through Supabase rather than
// just sitting in local component state.
async function mockProfileEndpoints(page) {
  await page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/rest/v1/custom_tasks**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/rest/v1/profiles**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: '00000000-0000-0000-0000-0000000000aa',
        name: 'Jamie', zip: '97201', own_rent: 'own', age: '1990', gender: 'woman',
        cars: [], has_car: false, kids: [], has_kids: false, pets: [], has_pets: false,
        onboarded: true, visit_count: 2, hazard_done: true, profile_questions: null,
        capacity: 'normal', insurance: null,
      }]),
    });
  });
  await page.route('**/api/providers', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: '[]' }) });
  });
}

test('a manually saved provider persists through Supabase, not just local state', async ({ page }) => {
  let savedRow = null;

  await mockProfileEndpoints(page);

  // Saved providers table: starts empty, captures the insert, then the
  // reload below re-fetches as if from a fresh session — proving the data
  // didn't just live in component/localStorage state.
  await page.route('**/rest/v1/saved_providers**', route => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(savedRow ? [savedRow] : []),
      });
    }
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      savedRow = {
        id: 'sp-1',
        user_id: body.user_id,
        task_id: body.task_id,
        vote: body.vote,
        notes: body.notes,
        data: body.data,
        created_at: new Date().toISOString(),
      };
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([savedRow]) });
    }
    return route.continue();
  });

  await seedReturnUser(page);
  await page.goto('/');
  await loginWithDevCredentials(page);

  await expect(page.getByText('Today', { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByText('Profile', { exact: true }).click();

  await expect(page.getByText('No providers saved yet')).toBeVisible();

  await page.getByRole('button', { name: '+ Add provider' }).click();
  await page.getByPlaceholder("e.g. Dr. Smith, Joe's Plumbing").fill('Riverside Plumbing');
  await page.getByPlaceholder('e.g. plumber, dentist, vet').fill('plumber');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Good', exact: true }).click();
  await page.getByRole('button', { name: 'Save provider' }).click();

  // The row actually went to Supabase, not just local state.
  await expect.poll(() => savedRow?.data?.name).toBe('Riverside Plumbing');
  expect(savedRow.task_id).toBe('plumber');
  expect(savedRow.vote).toBe('good');

  await expect(page.getByText('Riverside Plumbing')).toBeVisible();

  // Simulate a fresh session (e.g. after sign-out/sign-in, or a new device):
  // local component state is gone, so this only shows up if it reloaded from
  // the saved_providers table.
  await page.reload();
  await expect(page.getByText('Today', { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByText('Profile', { exact: true }).click();
  await expect(page.getByText('Riverside Plumbing')).toBeVisible();
});
