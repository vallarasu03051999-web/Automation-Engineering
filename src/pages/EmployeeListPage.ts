import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class EmployeeListPage extends BasePage {
  private readonly addEmployeeTab: Locator;
  private readonly employeeIdFilter: Locator;
  private readonly searchButton: Locator;
  private readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.addEmployeeTab = page.getByRole('link', { name: 'Add Employee' });
    this.employeeIdFilter = page.locator('.oxd-input-group', { hasText: 'Employee Id' }).locator('input');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.tableRows = page.locator('.oxd-table-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/pim/viewEmployeeList', { waitUntil: 'domcontentloaded' });
    await expect(this.employeeIdFilter, 'Employee list search form should be visible').toBeVisible();
  }

  async goToAddEmployee(): Promise<void> {
    await this.addEmployeeTab.click();
    await this.page.waitForURL(/pim\/addEmployee/);
  }

  async searchByEmployeeId(employeeId: string): Promise<void> {
    await this.employeeIdFilter.fill(employeeId);
    await this.searchButton.click();
  }

  async expectEmployeeFound(employeeId: string): Promise<void> {
    const timeout = 20_000;
    await expect(
      this.tableRows.first(),
      `Employee ${employeeId} should appear in the search results`,
    ).toBeVisible({ timeout });
    await expect(this.tableRows.first()).toContainText(employeeId, { timeout });
  }

  async expectNoEmployeeFound(): Promise<void> {
    await expect(
      this.page.getByText('No Records Found').first(),
      'Expected no records after deletion',
    ).toBeVisible({ timeout: 20_000 });
  }

  async openEmployeeByRow(): Promise<void> {
    const row = this.tableRows.first();
    await row.locator('button').filter({ has: this.page.locator('i.bi-pencil-fill') }).click();
    await this.page.waitForURL(/pim\/viewPersonalDetails/);
  }

  async deleteEmployeeByRow(): Promise<void> {
    const row = this.tableRows.first();
    await row.locator('button').filter({ has: this.page.locator('i.bi-trash') }).click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  }
}
