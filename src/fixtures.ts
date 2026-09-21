import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SideMenuPage } from './pages/SideMenuPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { AddEmployeePage } from './pages/AddEmployeePage';
import { PersonalDetailsPage } from './pages/PersonalDetailsPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { AdminUserPage } from './pages/AdminUserPage';
import { ApiClient } from './utils/apiClient';

interface Fixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  sideMenuPage: SideMenuPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage: AddEmployeePage;
  personalDetailsPage: PersonalDetailsPage;
  jobDetailsPage: JobDetailsPage;
  adminUserPage: AdminUserPage;
  apiClient: ApiClient;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  sideMenuPage: async ({ page }, use) => use(new SideMenuPage(page)),
  employeeListPage: async ({ page }, use) => use(new EmployeeListPage(page)),
  addEmployeePage: async ({ page }, use) => use(new AddEmployeePage(page)),
  personalDetailsPage: async ({ page }, use) => use(new PersonalDetailsPage(page)),
  jobDetailsPage: async ({ page }, use) => use(new JobDetailsPage(page)),
  adminUserPage: async ({ page }, use) => use(new AdminUserPage(page)),

  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await client.init();
    await use(client);
    await client.dispose();
  },
});

export { expect };
