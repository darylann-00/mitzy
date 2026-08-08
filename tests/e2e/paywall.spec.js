import { test, expect } from '@playwright/test';
import {
  loginWithDevCredentials, seedReturnUser, mockProfile,
  mockCustomTasks, mockTaskRecords,
} from './helpers/auth.js';

// The paywall is enforced server-side (api/_entitlement.js), and Playwright
// runs against a static preview with no serverless functions. So these specs
// verify the half that lives in the browser: that a 402 becomes an upgrade
// prompt rather than a generic error, that the free-tier confirm stops the
// assist panel spending an allowance just by opening, and that a Mitzy Pro
// account is never asked either question.

async function mockPlan(page, plan) {
  await page.route('**/rest/v1/subscriptions**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      // .maybeSingle() expects an object or null, not an array.
      body: plan ? JSON.stringify({ plan }) : 'null',
    });
  });
}

// Whichever task ends up first, its assist button hits one of these two. Mock
// both and count across them so the specs don't depend on the task library's
// ordering or on a particular task's assistType.
async function mockAssistEndpoints(page, { status, body }) {
  const calls = { count: 0 };
  for (const pattern of ['**/api/assist', '**/api/providers']) {
    await page.route(pattern, route => {
      calls.count++;
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
  }
  return calls;
}

async function signIn(page) {
  // Mirrors the server's PAYWALL_ENABLED. Without it the client shows no
  // pre-emptive paywall UI at all, which is exactly the point — the prompts
  // stay invisible until the paywall is deliberately switched on.
  await page.addInitScript(() => { window.__MITZY_PAYWALL__ = true; });
  await mockProfile(page);
  await mockCustomTasks(page);
  await mockTaskRecords(page);
  await seedReturnUser(page);
  await page.goto('/');
  await loginWithDevCredentials(page);
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });
}

// All tab always has cards regardless of focus-list state (same approach as
// mark_done.spec.js), then open the first one and ask for help.
async function openAssist(page) {
  await page.getByText('All', { exact: true }).click();
  const firstCard = page.getByTestId('task-card').first();
  await expect(firstCard).toBeVisible({ timeout: 5000 });
  await firstCard.click();
  await page.getByText('Want Mitzy to help?').click();
}

test('a free account is asked before an assist is spent', async ({ page }) => {
  await mockPlan(page, 'free');
  const calls = await mockAssistEndpoints(page, { status: 200, body: { text: 'Here is what to do.' } });

  await signIn(page);
  await openAssist(page);

  // Opening the panel must not have called anything yet — that's the whole
  // point, otherwise a tap costs a third of the month.
  await expect(page.getByText(/uses one of your free assists/i)).toBeVisible();
  expect(calls.count).toBe(0);

  await page.getByRole('button', { name: 'Yes, help me with this' }).click();
  await expect.poll(() => calls.count).toBe(1);
});

test('a spent allowance shows the upgrade prompt, not a retry', async ({ page }) => {
  await mockPlan(page, 'free');
  await mockAssistEndpoints(page, {
    status: 402,
    body: { error: 'upgrade_required', reason: 'quota_exhausted', feature: 'assist', used: 3, limit: 3 },
  });

  await signIn(page);
  await openAssist(page);
  await page.getByRole('button', { name: 'Yes, help me with this' }).click();

  await expect(page.getByText(/used your free assists/i)).toBeVisible();
  // Retrying a 402 only earns another one.
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);

  await page.getByRole('button', { name: 'See Mitzy Pro' }).click();
  await expect(page.getByText('Get Mitzy Pro — $4.99/month')).toBeVisible();
});

test('a Mitzy Pro account fetches straight away with no prompt', async ({ page }) => {
  await mockPlan(page, 'pro');
  const calls = await mockAssistEndpoints(page, { status: 200, body: { text: 'Straight to the answer.' } });

  await signIn(page);
  await openAssist(page);

  await expect.poll(() => calls.count).toBe(1);
  await expect(page.getByText(/uses one of your free assists/i)).toHaveCount(0);
});
