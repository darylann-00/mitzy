import { test, expect } from '@playwright/test';

// The landing page is what Google's OAuth reviewers read to decide whether the
// app's purpose is explained. These assertions guard that copy — if it
// disappears, branding verification breaks again.

test('landing page states what the app is and what it does', async ({ page }) => {
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
  await expect(page.getByRole('heading', { name: 'Get a custom list specific to you' })).toBeVisible();

  // Calendar behaviour is described honestly — Mitzy both reads events and
  // creates them (api/schedule.js POSTs to calendars/primary/events), so the
  // page must never claim read-only access.
  await expect(page.getByRole('heading', { name: 'Works with your calendar' })).toBeVisible();
  await expect(page.getByText('puts the appointment on your calendar')).toBeVisible();

  // Google's branding review requires the homepage to explain why the app asks
  // for user data, and to link the privacy policy configured on the consent
  // screen. Both live in the footer.
  await expect(page.getByText('so it can work out which tasks apply to you')).toBeVisible();
  await expect(page.getByText('adds an event to your calendar')).toBeVisible();
  const privacy = page.getByRole('link', { name: 'Privacy Policy' });
  await expect(privacy).toBeVisible();
  await expect(privacy).toHaveAttribute('href', 'https://mitzy.io/privacy.html');
});

// The pricing table is a promise the app has to keep. The server gates AI
// assist, provider search, and the brain-dump creator, giving free accounts a
// small monthly allowance — so the Free column has to say so. If someone
// removes that line, free users hit a paywall the page never warned them about.
test('pricing table matches what the app actually enforces', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
  await expect(page.getByText('$0 / forever')).toBeVisible();
  await expect(page.getByText('3 AI assists a month')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Mitzy Pro' })).toBeVisible();
  await expect(page.getByText('$4.99 / month')).toBeVisible();
  await expect(page.getByText('Unlimited AI task assistant')).toBeVisible();

  // Freemium, not a trial — the CTA must not promise one.
  await expect(page.getByRole('button', { name: 'Get started free' }).first()).toBeVisible();
  await expect(page.getByText('Start my free trial')).toHaveCount(0);
});

test('static boot fallback never flashes before the app mounts', async ({ page }) => {
  // Block the app bundle so the page is frozen in its pre-React state — the
  // exact moment the fallback used to flash. The first version of this fix
  // hid the block with an inline <script>, which passed locally and then did
  // nothing on mitzy.io because vercel.json's script-src has no
  // 'unsafe-inline'. Asserting with scripts stalled catches that: the rule
  // must hold with no app JS having run at all.
  await page.route('**/assets/*.js', route => route.abort());
  await page.goto('/');

  const fallback = page.locator('#boot-fallback');
  await expect(fallback).toHaveCount(1);
  await expect(fallback).toBeHidden();
});

test('boot fallback carries a plain-HTML description for crawlers', async ({ page }) => {
  const html = await (await page.request.get('/')).text();
  expect(html).toContain('Mitzy is a household task manager.');
  expect(html).toContain('id="boot-fallback"');
  // Must not claim read-only calendar access — api/schedule.js creates events.
  expect(html).not.toContain('never creates, edits, or deletes');
});
