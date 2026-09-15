import { test, expect } from '../src/fixtures';
import { loadEmployeeFixture, generateUniqueEmployeeId } from '../src/utils/testDataLoader';

const fixture = loadEmployeeFixture();

test.describe('Employee Lifecycle Management', () => {
  test('login, create, edit, validate via API, delete and logout an employee', async ({
    page,
    loginPage,
    dashboardPage,
    employeeListPage,
    addEmployeePage,
    personalDetailsPage,
    jobDetailsPage,
    apiClient,
  }) => {
    const employeeId = generateUniqueEmployeeId(fixture.newEmployee.employeeIdPrefix);
    let apiRecordId = '';

    await test.step('1. Login with valid credentials', async () => {
      await loginPage.goto();
      await loginPage.login(fixture.credentials.username, fixture.credentials.password);
      await dashboardPage.expectDashboardVisible();
    });

    await test.step('2. Add a new employee (data-driven, with profile picture)', async () => {
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
    });

    await test.step('3. Edit employee information (Job Title & Employment Status)', async () => {
      await employeeListPage.goto();
      await employeeListPage.searchByEmployeeId(employeeId);
      await employeeListPage.expectEmployeeFound(employeeId);
      await employeeListPage.openEmployeeByRow();

      await personalDetailsPage.goToJobTab();
      await jobDetailsPage.updateJobDetails(fixture.jobUpdate);
      await jobDetailsPage.expectToastMessage('Successfully Updated');
      await jobDetailsPage.expectJobDetails(fixture.jobUpdate);
    });

    await test.step('4. Validate employee via API and cross-check with UI', async () => {
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

    await test.step('5. Delete the employee and verify via UI and API', async () => {
      await employeeListPage.goto();
      await employeeListPage.searchByEmployeeId(employeeId);
      await employeeListPage.expectEmployeeFound(employeeId);
      await employeeListPage.deleteEmployeeByRow();
      await employeeListPage.expectToastMessage('Successfully Deleted');

      await employeeListPage.searchByEmployeeId(employeeId);
      await employeeListPage.expectNoEmployeeFound();

      const deleteStatus = await apiClient.deleteEmployeeRecord(apiRecordId);
      expect(deleteStatus, 'API delete of the mirrored record should return 204 No Content').toBe(204);
    });

    await test.step('6. Logout and confirm the session is invalidated', async () => {
      await dashboardPage.logout();
      await expect(page, 'Should be redirected to the login page after logout').toHaveURL(/auth\/login/);

      await page.goto('/web/index.php/dashboard/index', { waitUntil: 'domcontentloaded' });
      await expect(
        page,
        'Visiting an authenticated route after logout should redirect back to login (session invalidated)',
      ).toHaveURL(/auth\/login/);
    });
  });
});
