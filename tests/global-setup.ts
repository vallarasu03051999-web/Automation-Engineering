import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env';
import { LoginPage } from '../src/pages/LoginPage';
import { DashboardPage } from '../src/pages/DashboardPage';
import { logger } from '../src/utils/logger';

export const ADMIN_STORAGE_STATE = path.resolve(__dirname, '../playwright/.auth/admin.json');

// Logs in once as Admin and persists the session so individual tests can start
// already authenticated (via `use.storageState`) instead of repeating the
// login flow in every spec — login itself is covered on its own in auth.spec.ts.
export default async function globalSetup(): Promise<void> {
  fs.mkdirSync(path.dirname(ADMIN_STORAGE_STATE), { recursive: true });

  // Global setup runs outside the test runner, so this page doesn't inherit
  // playwright.config.ts's actionTimeout/navigationTimeout/expect.timeout —
  // waits here are explicit and generous rather than relying on that config.
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: env.baseUrl });

  logger.info('Global setup: authenticating Admin session for storageState reuse');
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  await page.goto('/web/index.php/auth/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('input[name="username"]', { timeout: 30_000 });
  await loginPage.login(env.adminUsername, env.adminPassword);
  await page.waitForURL(/dashboard\/index/, { timeout: 30_000 });
  await dashboardPage.expectDashboardVisible();

  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
  await browser.close();
}
