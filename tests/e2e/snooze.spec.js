import { test, expect } from '@playwright/test';
import { loginWithDevCredentials, seedReturnUser, mockTaskRecords, mockProfile, mockCustomTasks } from './helpers/auth.js';

function mockTaskRecordsWithSnoozeSupport(page) {
  const lastDone = new Date(Date.now() - 400 * 86400000).toISOString();
  return page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          task_id:        'hm-smoke',
          last_done:      lastDone,
          scheduled_date: null,
          snoozed_until:  null,
          interval_days:  30,
          needed:         false,
          disabled:       false,
        }]),
      });
    }
    // Intercept writes too so the test doesn't depend on the dev DB having snoozed_until
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

async function simulateSwipeLeft(page, element) {
  const box = await element.boundingBox();
  const startX = box.x + box.width - 20;
  const startY = box.y + box.height / 2;
  const endX = startX - 120;

  await page.evaluate(({ sx, sy, ex, ey }) => {
    const el = document.elementFromPoint(sx, sy);
    if (!el) return;

    // Current Chrome validates TouchEventInit.touches/changedTouches strictly
    // against the Touch interface — a plain object literal is no longer
    // accepted and throws "Failed to convert value to 'Touch'".
    const makeTouch = (x, y) => new Touch({
      identifier: 0, target: el, clientX: x, clientY: y, pageX: x, pageY: y,
    });

    const fire = (type, x, y) => {
      const touch = makeTouch(x, y);
      el.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
      }));
    };

    fire('touchstart', sx, sy);
    // Move in steps so direction lock detects horizontal
    for (let i = 1; i <= 10; i++) {
      const cx = sx + (ex - sx) * (i / 10);
      fire('touchmove', cx, sy);
    }
    fire('touchend', ex, sy);
  }, { sx: startX, sy: startY, ex: endX, ey: startY });
}

test('swipe left on task card opens snooze picker, pick preset moves task to snoozed section', async ({ page }) => {
  await mockTaskRecordsWithSnoozeSupport(page);
  await mockProfile(page);
  await mockCustomTasks(page);
  await seedReturnUser(page);
  await page.goto('/');
  await loginWithDevCredentials(page);

  // Wait for home screen
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // Dismiss the snooze tooltip if it's showing so it doesn't interfere
  const snoozeTooltip = page.getByText('Swipe left on a task to snooze it for later');
  if (await snoozeTooltip.isVisible().catch(() => false)) {
    await snoozeTooltip.click();
  }

  // Switch to All tab where swipeable cards are rendered
  await page.getByText('All', { exact: true }).click();

  // Wait for a task card to appear
  const taskCard = page.getByTestId('task-card').first();
  await expect(taskCard).toBeVisible({ timeout: 5000 });

  // Swipe the card left
  await simulateSwipeLeft(page, taskCard);

  // Snooze picker should appear
  await expect(page.getByText('Snooze this task')).toBeVisible({ timeout: 3000 });

  // Pick "Next week"
  await page.getByText('Next week').click();

  // Picker should close
  await expect(page.getByText('Snooze this task')).not.toBeVisible({ timeout: 3000 });

  // Snoozed section should now appear in AllView
  await expect(page.getByText('1 snoozed')).toBeVisible({ timeout: 3000 });
});

test('unsnooze a task from the snoozed section', async ({ page }) => {
  // Seed a task that is already snoozed
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const lastDone = new Date(Date.now() - 400 * 86400000).toISOString();
  await page.route('**/rest/v1/task_records**', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          task_id:        'hm-smoke',
          last_done:      lastDone,
          scheduled_date: null,
          snoozed_until:  nextWeek,
          interval_days:  30,
          needed:         false,
          disabled:       false,
        }]),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await mockProfile(page);
  await mockCustomTasks(page);
  await seedReturnUser(page);
  await page.goto('/');
  await loginWithDevCredentials(page);

  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // Switch to All tab
  await page.getByText('All', { exact: true }).click();

  // Snoozed section should be visible
  await expect(page.getByText('1 snoozed')).toBeVisible({ timeout: 5000 });

  // Expand the snoozed section
  await page.getByText('1 snoozed').click();

  // "Wake up" button should appear
  const wakeUpBtn = page.getByRole('button', { name: 'Wake up' });
  await expect(wakeUpBtn).toBeVisible({ timeout: 3000 });

  // Unsnooze
  await wakeUpBtn.click();

  // Snoozed section should disappear (0 snoozed = hidden)
  await expect(page.getByText('1 snoozed')).not.toBeVisible({ timeout: 3000 });
});
