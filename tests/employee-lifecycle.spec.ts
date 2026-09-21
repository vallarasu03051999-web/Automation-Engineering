import { test, expect } from '../src/fixtures';
import { loadEmployeeFixture, generateUniqueEmployeeId } from '../src/utils/testDataLoader';
import { logger } from '../src/utils/logger';
import { env } from '../src/config/env';
import { ADMIN_STORAGE_STATE } from './global-setup';

const fixture = loadEmployeeFixture();

// Each stage of the lifecycle is its own independent, individually-reported
// test() (rather than test.step()s inside one giant test), so a failure at
// any stage is visible on its own and the suite can be filtered/run stage by
// stage. They still share the employee created in the first test, so
// `.serial()` keeps them in order and stops the file early if creation fails.
test.describe.serial('Employee Lifecycle Management', { tag: '@regression' }, () => {
  let employeeId: string;
  let apiRecordId = '';
  let employeeDeleted = false;

  test(
    'creates a new employee (data-driven, with profile picture) and verifies it via API',
    { tag: '@smoke' },
    async ({ page, dashboardPage, employeeListPage, addEmployeePage, personalDetailsPage, apiClient }) => {
      employeeId = generateUniqueEmployeeId(fixture.newEmployee.employeeIdPrefix);

      // The pre-authenticated storageState only restores cookies, not
      // navigation — each test starts from a blank page, so it must land on
      // an authenticated route itself before interacting with the menu.
      await page.goto('/web/index.php/dashboard/index', { waitUntil: 'domcontentloaded' });
      await dashboardPage.expectDashboardVisible();
      await dashboardPage.navigateToPim();
      await employeeListPage.goToAddEmployee();
      await addEmployeePage.expectFormVisible();
      await addEmployeePage.fillEmployeeDetails(fixture.newEmployee, employeeId);
      await addEmployeePage.save();
      await personalDetailsPage.expectEmployeeId(employeeId);

      const apiRecord = await apiClient.createEmployeeRecord({
        employeeId,
        firstName: fixture.newEmployee.firstName,
        lastName: fixture.newEmployee.lastName,
      });
      apiRecordId = apiRecord.id;

      expect(apiRecord.firstName, 'API-created record should echo the first name entered in the UI').toBe(
        fixture.newEmployee.firstName,
      );
      expect(apiRecord.lastName, 'API-created record should echo the last name entered in the UI').toBe(
        fixture.newEmployee.lastName,
      );
      expect(apiRecord.employeeId, 'API-created record should echo the employee ID entered in the UI').toBe(
        employeeId,
      );
    },
  );

  test('edits employee job details and verifies persistence via UI reload + API', async ({
    page,
    employeeListPage,
    personalDetailsPage,
    jobDetailsPage,
    apiClient,
  }) => {
    await employeeListPage.goto();
    await employeeListPage.searchByEmployeeId(employeeId);
    await employeeListPage.expectEmployeeFound(employeeId);
    await employeeListPage.openEmployeeByRow();

    await personalDetailsPage.goToJobTab();
    await jobDetailsPage.updateJobDetails(fixture.jobUpdate);
    await jobDetailsPage.expectToastMessage('Successfully Updated');
    await jobDetailsPage.expectJobDetails(fixture.jobUpdate);

    const updatedRecord = await apiClient.updateEmployeeRecord(apiRecordId, {
      jobTitle: fixture.jobUpdate.jobTitle,
      employmentStatus: fixture.jobUpdate.employmentStatus,
    });

    expect(updatedRecord.jobTitle, 'API record job title should match the UI after the edit step').toBe(
      fixture.jobUpdate.jobTitle,
    );
    expect(
      updatedRecord.employmentStatus,
      'API record employment status should match the UI after the edit step',
    ).toBe(fixture.jobUpdate.employmentStatus);

    // Re-read the UI to make sure the change actually persisted server-side, not just client state.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await jobDetailsPage.expectJobDetails(fixture.jobUpdate);
  });

  test('deletes the employee and verifies removal via UI and API', async ({ employeeListPage, apiClient }) => {
    await employeeListPage.goto();
    await employeeListPage.searchByEmployeeId(employeeId);
    await employeeListPage.expectEmployeeFound(employeeId);
    await employeeListPage.deleteEmployeeByRow();
    await employeeListPage.expectToastMessage('Successfully Deleted');
    employeeDeleted = true;

    await employeeListPage.searchByEmployeeId(employeeId);
    await employeeListPage.expectNoEmployeeFound();

    const deleteStatus = await apiClient.deleteEmployeeRecord(apiRecordId);
    expect(deleteStatus, 'API delete of the mirrored record should return 204 No Content').toBe(204);
  });

  // Cleanup independent of the happy path: if the delete test above never ran
  // (e.g. an earlier stage failed) the employee created in stage one would
  // otherwise be left behind on the shared demo instance.
  test.afterAll(async ({ browser }) => {
    if (!employeeId || employeeDeleted) {
      return;
    }

    logger.warn('Employee lifecycle did not reach the delete stage — attempting fallback cleanup', { employeeId });
    const context = await browser.newContext({ baseURL: env.baseUrl, storageState: ADMIN_STORAGE_STATE });
    const page = await context.newPage();
    try {
      const { EmployeeListPage } = await import('../src/pages/EmployeeListPage');
      const employeeListPage = new EmployeeListPage(page);
      await employeeListPage.goto();
      await employeeListPage.searchByEmployeeId(employeeId);
      await employeeListPage.expectEmployeeFound(employeeId);
      await employeeListPage.deleteEmployeeByRow();
      logger.info('Fallback cleanup deleted the orphaned employee', { employeeId });
    } catch (error) {
      logger.error('Fallback cleanup failed — employee may need manual removal', {
        employeeId,
        error: (error as Error).message,
      });
    } finally {
      await context.close();
    }
  });
});
