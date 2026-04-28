const TEST_EMAIL    = process.env.PLAYWRIGHT_TEST_EMAIL    ?? 'test@example.com';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'testexample';

export async function loginWithDevCredentials(page) {
  await page.getByTestId('dev-email').fill(TEST_EMAIL);
  await page.getByTestId('dev-password').fill(TEST_PASSWORD);
  await page.getByTestId('dev-sign-in').click();
}

export async function seedReturnUser(page) {
  await page.addInitScript(() => {
    localStorage.setItem('mitzy-welcome-v1', JSON.stringify('returning'));
    localStorage.setItem('mitzy-ob-v6',    JSON.stringify(true));
    localStorage.setItem('mitzy-ob-v6-p',  JSON.stringify(true));

    // Minimal profile so tasks are generated and visible in AllView
    localStorage.setItem('mitzy-pro-v7', JSON.stringify({
      name: 'Test', birthYear: '1990', gender: 'prefer-not',
      hasHome: true, hasCar: false, hasKids: false, hasPets: false,
      zip: '97201', hazards: [],
    }));

    // One task overdue (400 days since last done) so it shows in the main list,
    // not the collapsed "explore" accordion. hm-hvac interval is 90 days.
    const lastDone = new Date(Date.now() - 400 * 86400000).toISOString();
    localStorage.setItem('mitzy-v6', JSON.stringify({
      'hm-hvac': { lastDone, intervalDays: 90 },
    }));
  });
}
