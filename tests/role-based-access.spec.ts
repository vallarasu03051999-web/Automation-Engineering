import { test, expect } from '../src/fixtures';
import { generateUniqueEmployeeId, generateUniqueSuffix } from '../src/utils/testDataLoader';
import { logger } from '../src/utils/logger';
import { env } from '../src/config/env';
import { LoginPage } from '../src/pages/LoginPage';
import { SideMenuPage } from '../src/pages/SideMenuPage';
import { AdminUserPage } from '../src/pages/AdminUserPage';
import { EmployeeListPage } from '../src/pages/EmployeeListPage';
import { ADMIN_STORAGE_STATE } from './global-setup';

// Verifies OrangeHRM's role-based permission boundary: an ESS (Employee
// Self Service) user must not see or reach Admin functionality that an
// Admin user can. This exercises a second user role end-to-end (create it,
// log in as it, probe the boundary, tear it down) rather than only ever
// testing as Admin.
test.describe.serial('Role-based access control', { tag: '@regression' }, () => {
  const suffix = generateUniqueSuffix();
  const employeeId = generateUniqueEmployeeId('RB');
  const employeeLastName = `RoleTest${suffix}`;
  const username = `essuser${suffix}`;
  const password = `TestPass!${suffix}`;
  let systemUserCreated = false;
  let employeeCreated = false;

  test('provisions an ESS-role system user linked to a fresh employee', async ({
    page,
    dashboardPage,
    employeeListPage,
    addEmployeePage,
    personalDetailsPage,
    adminUserPage,
  }) => {
    // The pre-authenticated storageState only restores cookies, not
    // navigation — this test starts from a blank page, so it must land on an
    // authenticated route itself before interacting with the menu.
    await page.goto('/web/index.php/dashboard/index', { waitUntil: 'domcontentloaded' });
    await dashboardPage.expectDashboardVisible();
    await dashboardPage.navigateToPim();
    await employeeListPage.goToAddEmployee();
    await addEmployeePage.expectFormVisible();
    await addEmployeePage.fillEmployeeDetails(
      { firstName: 'Role', lastName: employeeLastName, employeeIdPrefix: 'RB' },
      employeeId,
    );
    await addEmployeePage.save();
    await personalDetailsPage.expectEmployeeId(employeeId);
    employeeCreated = true;

    await adminUserPage.goto();
    await adminUserPage.goToAddUser();
    await adminUserPage.createUser({
      role: 'ESS',
      employeeName: employeeLastName,
      status: 'Enabled',
      username,
      password,
    });
    systemUserCreated = true;
  });

  test('an ESS user cannot see or reach Admin functionality', async ({ browser }) => {
    // Deliberately bypasses the shared Admin storageState: this test logs in
    // as a different, lower-privileged user in a clean context. `browser`
    // (unlike the `page`/`context` fixtures) still inherits the project's
    // `use` defaults — including the Admin storageState — on newContext(),
    // so both baseURL and a blank storageState must be set explicitly here.
    const context = await browser.newContext({ baseURL: env.baseUrl, storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    const sideMenuPage = new SideMenuPage(page);

    try {
      await loginPage.goto();
      await loginPage.login(username, password);
      await expect(page, 'ESS login should land on the dashboard').toHaveURL(/dashboard\/index/);

      await sideMenuPage.expectMenuItemHidden('Admin');
      await sideMenuPage.expectMenuItemVisible('My Info');

      await page.goto('/web/index.php/admin/viewSystemUsers', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByText('Credential Required'),
        'Directly navigating to an Admin route as an ESS user should be blocked, not show the System Users list',
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('cleans up the ESS system user and linked employee', async ({ adminUserPage, employeeListPage }) => {
    await adminUserPage.goto();
    await adminUserPage.searchByUsername(username);
    await adminUserPage.expectUserFound(username);
    await adminUserPage.deleteUserByRow();
    systemUserCreated = false;

    await employeeListPage.goto();
    await employeeListPage.searchByEmployeeId(employeeId);
    await employeeListPage.expectEmployeeFound(employeeId);
    await employeeListPage.deleteEmployeeByRow();
    employeeCreated = false;
  });

  // Cleanup independent of the happy path: if the dedicated cleanup test above
  // never ran (e.g. the permission-boundary assertion failed), the ESS user
  // and its linked employee would otherwise be left behind on the shared
  // demo instance.
  test.afterAll(async ({ browser }) => {
    if (!systemUserCreated && !employeeCreated) {
      return;
    }

    logger.warn('Role-based access cleanup did not complete on the happy path — attempting fallback cleanup', {
      username,
      employeeId,
      systemUserCreated,
      employeeCreated,
    });
    const context = await browser.newContext({ baseURL: env.baseUrl, storageState: ADMIN_STORAGE_STATE });
    const page = await context.newPage();
    try {
      if (systemUserCreated) {
        const adminUserPage = new AdminUserPage(page);
        await adminUserPage.goto();
        await adminUserPage.searchByUsername(username);
        await adminUserPage.expectUserFound(username);
        await adminUserPage.deleteUserByRow();
      }
      if (employeeCreated) {
        const employeeListPage = new EmployeeListPage(page);
        await employeeListPage.goto();
        await employeeListPage.searchByEmployeeId(employeeId);
        await employeeListPage.expectEmployeeFound(employeeId);
        await employeeListPage.deleteEmployeeByRow();
      }
      logger.info('Fallback cleanup for role-based access test succeeded');
    } catch (error) {
      logger.error('Fallback cleanup failed — ESS user/employee may need manual removal', {
        username,
        employeeId,
        error: (error as Error).message,
      });
    } finally {
      await context.close();
    }
  });
});
