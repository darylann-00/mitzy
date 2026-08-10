import { test, expect } from '@playwright/test';
import {
  loginWithDevCredentials, seedReturnUser, mockProfile,
  mockCustomTasks, mockTaskRecords,
} from './helpers/auth.js';

// Stripe's success_url lands the user back on `${origin}/app?checkout=success`.
// The webhook that actually flips the row may not have landed yet, so App.js
// polls entitlement.refetch() with backoff. These specs exercise that return
// trip against a static preview (no serverless functions), so the checkout
// query string is applied at the root path rather than /app — the app's own
// state-driven redirect effect settles the pathname regardless of which one
// we start from, and every other spec in this suite only ever navigates to
// '/', so this stays on the one tested navigation pattern.

// Mocks /rest/v1/subscriptions with a fixed sequence of plan reads: the first
// call is useEntitlement's initial load, subsequent calls are the backoff
// poll's refetch(). The last entry repeats for any calls beyond the sequence.
async function mockPlanSequence(page, sequence) {
  let call = 0;
  await page.route('**/rest/v1/subscriptions**', route => {
    if (route.request().method() !== 'GET') return route.continue();
    const plan = sequence[Math.min(call, sequence.length - 1)];
    call++;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: plan ? JSON.stringify({ plan }) : 'null',
    });
  });
}

async function signInWithCheckoutParam(page, checkoutParam) {
  await mockProfile(page);
  await mockCustomTasks(page);
  await mockTaskRecords(page);
  await seedReturnUser(page);
  await page.goto(`/?checkout=${checkoutParam}`);
  // loginWithDevCredentials reloads the *current* URL, so the query string
  // set above survives the reload that actually establishes the session.
  await loginWithDevCredentials(page);
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });
}

test('a successful checkout return settles on Mitzy Pro once the webhook lands, with no error', async ({ page }) => {
  // First read (initial load) sees the free row from before checkout; the
  // first backoff poll sees the row the webhook just flipped to pro. Setup
  // itself (mocked routes, reload, waiting for the app to render) can eat
  // more than the first 1s backoff delay, so by the time we start asserting
  // the interim "unlocking" banner may already be gone — only the eventual
  // settled state is timing-safe to assert on.
  await mockPlanSequence(page, ['free', 'pro']);

  await signInWithCheckoutParam(page, 'success');

  await expect(page.getByText("You're on Mitzy Pro!")).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/couldn't reach the server/i)).toHaveCount(0);

  // The query string is cleaned up once read.
  await expect(page).not.toHaveURL(/checkout=/);
});

test('a checkout return with a slow webhook stays friendly, never shows an error', async ({ page }) => {
  // The row never flips in this window — simulates the webhook not having
  // landed yet by the time the first couple of backoff attempts fire.
  await mockPlanSequence(page, ['free']);

  await signInWithCheckoutParam(page, 'success');

  // Give it through the first couple of backoff attempts without ever
  // showing an error, or claiming success it hasn't earned. These negative
  // assertions hold at any point in the (still-running) backoff sequence.
  await page.waitForTimeout(3500);
  await expect(page.getByText(/couldn't reach the server/i)).toHaveCount(0);
  await expect(page.getByText("You're on Mitzy Pro!")).toHaveCount(0);

  await expect(page).not.toHaveURL(/checkout=/);
});

test('a cancelled checkout shows no banner and cleans the URL', async ({ page }) => {
  await mockPlanSequence(page, ['free']);

  await signInWithCheckoutParam(page, 'cancelled');

  await expect(page.getByText(/will unlock in a moment/i)).toHaveCount(0);
  await expect(page.getByText("You're on Mitzy Pro!")).toHaveCount(0);
  await expect(page).not.toHaveURL(/checkout=/);
});
