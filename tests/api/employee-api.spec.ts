import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/utils/apiClient';
import { loadEmployeeFixture, generateUniqueEmployeeId } from '../../src/utils/testDataLoader';

// Standalone API coverage — no browser/page involved. These exercise the same
// ApiClient used inside the UI cross-check step (employee-lifecycle.spec.ts),
// but independently, so the API layer can be validated on its own.
const fixture = loadEmployeeFixture();

test.describe('Employee API', () => {
  let apiClient: ApiClient;

  test.beforeEach(async () => {
    apiClient = new ApiClient();
    await apiClient.init();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test('creates an employee record and echoes back the submitted fields', async () => {
    const employeeId = generateUniqueEmployeeId(fixture.newEmployee.employeeIdPrefix);

    const record = await apiClient.createEmployeeRecord({
      employeeId,
      firstName: fixture.newEmployee.firstName,
      lastName: fixture.newEmployee.lastName,
    });

    expect(record.id, 'Created record should be assigned an id').toBeTruthy();
    expect(record.firstName, 'Response should echo the submitted first name').toBe(
      fixture.newEmployee.firstName,
    );
    expect(record.lastName, 'Response should echo the submitted last name').toBe(fixture.newEmployee.lastName);
    expect(record.employeeId, 'Response should echo the submitted employee ID').toBe(employeeId);
  });

  test('updates job title and employment status on an existing record', async () => {
    const employeeId = generateUniqueEmployeeId(fixture.newEmployee.employeeIdPrefix);
    const created = await apiClient.createEmployeeRecord({
      employeeId,
      firstName: fixture.newEmployee.firstName,
      lastName: fixture.newEmployee.lastName,
    });

    const updated = await apiClient.updateEmployeeRecord(created.id, fixture.jobUpdate);

    expect(updated.jobTitle, 'Response should echo the updated job title').toBe(fixture.jobUpdate.jobTitle);
    expect(updated.employmentStatus, 'Response should echo the updated employment status').toBe(
      fixture.jobUpdate.employmentStatus,
    );
  });

  test('deletes a record and returns 204 No Content', async () => {
    const employeeId = generateUniqueEmployeeId(fixture.newEmployee.employeeIdPrefix);
    const created = await apiClient.createEmployeeRecord({
      employeeId,
      firstName: fixture.newEmployee.firstName,
      lastName: fixture.newEmployee.lastName,
    });

    const status = await apiClient.deleteEmployeeRecord(created.id);

    expect(status, 'Delete should return 204 No Content').toBe(204);
  });
});
