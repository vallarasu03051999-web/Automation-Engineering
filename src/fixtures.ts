import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { AddEmployeePage } from './pages/AddEmployeePage';
import { PersonalDetailsPage } from './pages/PersonalDetailsPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { ApiClient } from './utils/apiClient';

interface Fixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage: AddEmployeePage;
  personalDetailsPage: PersonalDetailsPage;
  jobDetailsPage: JobDetailsPage;
  apiClient: ApiClient;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  employeeListPage: async ({ page }, use) => use(new EmployeeListPage(page)),
  addEmployeePage: async ({ page }, use) => use(new AddEmployeePage(page)),
  personalDetailsPage: async ({ page }, use) => use(new PersonalDetailsPage(page)),
  jobDetailsPage: async ({ page }, use) => use(new JobDetailsPage(page)),

  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await client.init();
    await use(client);
    await client.dispose();
  },
});

export { expect };
