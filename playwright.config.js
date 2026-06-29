import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: isCI ? 'http://localhost:4173' : 'http://localhost:5173',
    headless: isCI,
    channel: isCI ? 'chrome' : undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: isCI ? 'npm run build && npm run preview' : 'npm run start',
    url: isCI ? 'http://localhost:4173' : 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: isCI ? 120000 : 60000,
  },
});
