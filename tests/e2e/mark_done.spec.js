import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser, mockTaskRecords, mockProfile, mockCustomTasks } from './helpers/auth.js';

test('user opens a task and marks it done', async ({ page }) => {
  await mockTaskRecords(page);
  await mockProfile(page);
  await mockCustomTasks(page);
  await seedReturnUser(page);
  await page.goto('/');

  await loginWithDevCredentials(page);

  // Wait for home screen
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

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

test('date picker month arrows do not close picker', async ({ page }) => {
  await mockTaskRecords(page);
  await mockProfile(page);
  await mockCustomTasks(page);
  await seedReturnUser(page);
  await page.goto('/');

  await loginWithDevCredentials(page);

  // Wait for home screen
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // Switch to All tab
  await page.getByText('All', { exact: true }).click();

  // Click the first task card to open task detail
  const firstCard = page.getByTestId('task-card').first();
  await expect(firstCard).toBeVisible({ timeout: 5000 });
  await firstCard.click();

  // Wait for task detail view
  await expect(page.getByRole('button', { name: 'Mark as done' })).toBeVisible({ timeout: 5000 });

  // Expand the history card to reveal the Last done row
  await page.getByTestId('history-card-toggle').click();

  // Click the "Last done" cell to reveal the date field
  await page.getByTestId('last-done-cell').click();

  // Click the calendar icon to open the picker
  await page.getByTestId('date-field-toggle').click();

  // Calendar should appear
  const calendar = page.getByTestId('month-calendar');
  await expect(calendar).toBeVisible();

  const monthLabel = page.getByTestId('calendar-month-label');
  const initialMonth = await monthLabel.textContent();

  // Click prev month arrow twice
  await page.getByTestId('calendar-prev').click();
  await page.getByTestId('calendar-prev').click();

  // Calendar should still be visible
  await expect(calendar).toBeVisible();

  // Month should have changed
  const newMonth = await monthLabel.textContent();
  expect(newMonth).not.toBe(initialMonth);

  // Click a day in the calendar (e.g., day 15)
  await page.getByTestId('calendar-day-15').click();

  // Calendar should close
  await expect(calendar).not.toBeVisible({ timeout: 5000 });
});
