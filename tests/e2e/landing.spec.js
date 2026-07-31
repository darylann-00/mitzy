import { test, expect } from '@playwright/test';

// The landing page is what Google's OAuth reviewers read to decide whether the
// app's purpose and its use of Google data are explained. These assertions guard
// that copy — if it disappears, branding verification breaks again.

test('landing page states what the app is and how it uses Google data', async ({ page }) => {
  await page.goto('/');

  // Plain-language descriptor in the hero, not just the tagline.
  await expect(page.getByText('Mitzy is a household task manager.')).toBeVisible();

  // Concrete capability list.
  await expect(page.getByRole('heading', { name: 'What Mitzy does' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Builds your task list for you' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Tells you what's due now" })).toBeVisible();

  // Google account / calendar scope explanation.
  await expect(page.getByRole('heading', { name: 'Mitzy and your Google account' })).toBeVisible();
  await expect(page.getByText('Mitzy only reads your calendar.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
});

test('static boot fallback never flashes once the app mounts', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Mitzy is a household task manager.')).toBeVisible();

  // index.html carries a plain-HTML summary inside #root for crawlers and no-JS
  // visitors. React clears it on mount; the js-boot class hides it before then.
  await expect(page.locator('#boot-fallback')).toHaveCount(0);
  await expect(page.locator('html')).toHaveClass(/js-boot/);
});
