import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser, mockTaskRecords } from './helpers/auth.js';

test('user opens a task and marks it done', async ({ page }) => {
  await mockTaskRecords(page);
  await seedReturnUser(page);
  await page.goto('/');

  await loginWithDevCredentials(page);

  // Wait for home screen
  await expect(page.getByText('Today', { exact: true })).toBeVisible({ timeout: 15000 });

  // Switch to All tab so there are always tasks visible regardless of focus list state
  await page.getByText('All', { exact: true }).click();

  // Click the first task card
  const firstCard = page.getByTestId('task-card').first();
  await expect(firstCard).toBeVisible({ timeout: 5000 });
  await firstCard.click();

  // Task detail view — "Mark as done" button
  const markDoneBtn = page.getByRole('button', { name: 'Mark as done' });
  await expect(markDoneBtn).toBeVisible({ timeout: 5000 });
  await markDoneBtn.click();

  // Modal appears
  await expect(page.getByText('Mark as done').last()).toBeVisible();

  // Confirm done
  await page.getByRole('button', { name: 'done', exact: true }).click();

  // Modal closes
  await expect(page.getByRole('button', { name: 'done', exact: true })).not.toBeVisible({ timeout: 5000 });
});
