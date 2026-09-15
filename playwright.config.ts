import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // The full lifecycle test walks through six sequential steps against a public
  // demo instance that can be slow to respond, so the overall budget is generous.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // The public OrangeHRM demo instance is occasionally slow/unresponsive; retry
  // transient navigation failures rather than failing the whole lifecycle run.
  retries: 2,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://opensource-demo.orangehrmlive.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
