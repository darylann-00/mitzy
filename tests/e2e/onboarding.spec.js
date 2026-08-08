import { test, expect } from '@playwright/test';
import { loginWithDevCredentials } from './helpers/auth.js';

test('new user completes onboarding and reaches home screen', async ({ page }) => {
  await page.goto('/');

  // LandingPage
  await expect(page.getByText('Stop carrying your household')).toBeVisible();
  await page.getByRole('button', { name: 'Get started free' }).first().click();

  // SlimOnboarding — welcome screen
  await expect(page.getByText('Your household, handled.')).toBeVisible();
  await page.getByRole('button', { name: "Let's get started" }).click();

  // Step 0: name / birth year / gender
  await expect(page.getByText('A little about you')).toBeVisible();
  await page.getByPlaceholder('First name').fill('Test');
  await page.getByPlaceholder('Birth year (e.g. 1988)').fill('1990');
  await page.getByRole('button', { name: 'Woman' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 1: own or rent — auto-advances on click
  await expect(page.getByText('Do you own or rent?')).toBeVisible();
  await page.getByText('Owner').click();

  // Step 2: car — click No
  await expect(page.getByText('Do you have a car?')).toBeVisible();
  await page.getByText('No').first().click();

  // Step 3: zip
  await expect(page.getByText("What's your zip code?")).toBeVisible();
  await page.getByPlaceholder('e.g. 97201').fill('97201');
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 4: kids — click No
  await expect(page.getByText('Any kids at home?')).toBeVisible();
  await page.getByText('No').first().click();

  // Step 5: pets — click No
  await expect(page.getByText('Any pets?')).toBeVisible();
  await page.getByText('No').first().click();

  // Step 6: Google Calendar — skip
  await expect(page.getByText('Connect Google Calendar?')).toBeVisible();
  await page.getByRole('button', { name: 'Skip for now' }).click();

  // Step 7: bandwidth/capacity
  await expect(page.getByText("How's your bandwidth right now?")).toBeVisible();
  await page.getByText('Keeping up').click();

  // Transition screen
  await expect(page.getByRole('button', { name: "Let's go" })).toBeVisible();
  await page.getByRole('button', { name: "Let's go" }).click();

  // PrioritySetup — click through each slide.
  // Each slide shows "When did you last do this?" (recurring) or "Have you done this?" (one-time).
  // We click the first available answer chip to advance.
  const maxSlides = 15; // safety cap above the current ~12 priority tasks
  for (let i = 0; i < maxSlides; i++) {
    const onLoginGate = await page.getByText('Save your setup').isVisible().catch(() => false);
    if (onLoginGate) break;

    const recentBtn  = page.getByRole('button', { name: 'Recently (last month)' });
    const thisYearBtn = page.getByRole('button', { name: 'This year' });
    const yesBtn     = page.getByRole('button', { name: 'Yes' });

    if (await recentBtn.isVisible({ timeout: 800 }).catch(() => false)) {
      await recentBtn.click();
    } else if (await thisYearBtn.isVisible({ timeout: 800 }).catch(() => false)) {
      await thisYearBtn.click();
    } else if (await yesBtn.isVisible({ timeout: 800 }).catch(() => false)) {
      await yesBtn.click();
    }

    await page.waitForTimeout(350); // slide animation
  }

  // LoginGate
  await expect(page.getByText('Save your setup')).toBeVisible({ timeout: 5000 });
  await loginWithDevCredentials(page);

  // Home screen — BottomDock always present once authenticated
  await expect(page.getByText('Today', { exact: true }).first()).toBeVisible({ timeout: 15000 });
});
