import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser } from './helpers/auth.js';

test('returning user signs in and reaches home screen', async ({ page }) => {
  await seedReturnUser(page);
  await page.goto('/');

  await loginWithDevCredentials(page);

  // BottomDock is always visible once authenticated
  await expect(page.getByText('Today', { exact: true })).toBeVisible({ timeout: 15000 });
});
