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
  });
}
