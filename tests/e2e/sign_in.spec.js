import { test, expect } from '@playwright/test';

test('signs in with test user and lands on home screen', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('dev-email').fill('test@example.com');
  await page.getByTestId('dev-password').fill('testexample');
  await page.getByTestId('dev-sign-in').click();

  await expect(page.getByText('Focus for today')).toBeVisible({ timeout: 10000 });
});
