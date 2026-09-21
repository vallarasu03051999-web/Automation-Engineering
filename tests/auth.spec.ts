import { test, expect } from '../src/fixtures';
import { env } from '../src/config/env';

// Authentication is tested in its own file, starting from a clean
// (unauthenticated) browser context — every other spec reuses the
// pre-authenticated Admin storageState from tests/global-setup.ts instead of
// repeating this flow.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', { tag: '@smoke' }, () => {
  test('logs in with valid credentials and reaches the dashboard', async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login(env.adminUsername, env.adminPassword);
    await dashboardPage.expectDashboardVisible();
  });

  test('rejects login with invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(env.adminUsername, 'not-the-real-password');
    await loginPage.expectLoginError('Invalid credentials');
  });

  test('logging out invalidates the session', async ({ page, loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login(env.adminUsername, env.adminPassword);
    await dashboardPage.expectDashboardVisible();

    await dashboardPage.logout();
    await expect(page, 'Should be redirected to the login page after logout').toHaveURL(/auth\/login/);

    await page.goto('/web/index.php/dashboard/index', { waitUntil: 'domcontentloaded' });
    await expect(
      page,
      'Visiting an authenticated route after logout should redirect back to login (session invalidated)',
    ).toHaveURL(/auth\/login/);
  });
});
