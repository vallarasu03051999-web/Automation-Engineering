import { test, expect } from '../../src/fixtures';
import { loadEmployeeFixture, generateUniqueEmployeeId } from '../../src/utils/testDataLoader';

// Standalone API coverage — no browser/page involved. These exercise the same
// ApiClient used inside the UI cross-check step (employee-lifecycle.spec.ts),
// but independently, so the API layer can be validated on its own. Setup and
// teardown come from the shared `apiClient` fixture (src/fixtures.ts) instead
// of each test re-implementing init/dispose.
const fixture = loadEmployeeFixture();

test.describe('Employee API', { tag: ['@api', '@regression'] }, () => {
  test('creates an employee record and echoes back the submitted fields', async ({ apiClient }) => {
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

  test('updates job title and employment status on an existing record', async ({ apiClient }) => {
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

  test('deletes a record and returns 204 No Content', async ({ apiClient }) => {
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
