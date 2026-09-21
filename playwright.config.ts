import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import { ADMIN_STORAGE_STATE } from './tests/global-setup';

export default defineConfig({
  testDir: './tests',
  // The full lifecycle test walks through several sequential steps against a public // testing
  // demo instance that can be slow to respond, so the overall budget is generous.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // The public OrangeHRM demo instance is occasionally slow/unresponsive; retry
  // transient navigation failures rather than failing the whole lifecycle run.
  // See docs/TEST_STRATEGY.md for the full flaky-detection/mitigation write-up.
  retries: 2,
  workers: 1,
  globalSetup: require.resolve('./tests/global-setup'),
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: env.baseUrl,
    // Pre-authenticated as Admin by default (see tests/global-setup.ts); specs
    // that need to test authentication itself or a different role override this
    // with `test.use({ storageState: ... })`.
    storageState: ADMIN_STORAGE_STATE,
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
