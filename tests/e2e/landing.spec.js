import { test, expect } from '@playwright/test';

// The landing page is what Google's OAuth reviewers read to decide whether the
// app's purpose and its use of Google data are explained. These assertions guard
// that copy — if it disappears, branding verification breaks again.

test('landing page states what the app is and how it uses Google data', async ({ page }) => {
  await page.goto('/');

  // Category label above the fold, plus the plain descriptor sentence.
  await expect(page.getByText('Household task manager', { exact: true })).toBeVisible();
  await expect(page.getByText('Mitzy is a household task manager.')).toBeVisible();

  // Shows real tasks from the library rather than describing it.
  await expect(page.getByText("The stuff you're supposed to remember")).toBeVisible();
  await expect(page.getByText('HVAC filter', { exact: true })).toBeVisible();
  await expect(page.getByText('Car registration', { exact: true })).toBeVisible();

  // How it works.
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Answer a few questions' })).toBeVisible();

  // Google account / calendar scope explanation.
  await expect(page.getByRole('heading', { name: 'Mitzy and your Google account' })).toBeVisible();
  await expect(page.getByText('Sign in with Google', { exact: true })).toBeVisible();
  await expect(page.getByText('Google Calendar (optional)', { exact: true })).toBeVisible();
  await expect(page.getByText('never creates, edits, or deletes events')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read the Privacy Policy' })).toBeVisible();
});

test('static boot fallback never flashes once the app mounts', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Mitzy is a household task manager.')).toBeVisible();

  // index.html carries a plain-HTML summary inside #root for crawlers and no-JS
  // visitors. React clears it on mount; the js-boot class hides it before then.
  await expect(page.locator('#boot-fallback')).toHaveCount(0);
  await expect(page.locator('html')).toHaveClass(/js-boot/);
});
