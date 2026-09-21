import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { NewSystemUserData } from '../types/employee';

export class AdminUserPage extends BasePage {
  private readonly addButton: Locator;
  private readonly usernameFilter: Locator;
  private readonly searchButton: Locator;
  private readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.usernameFilter = page.locator('.oxd-input-group', { hasText: 'Username' }).locator('input');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.tableRows = page.locator('.oxd-table-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/admin/viewSystemUsers', { waitUntil: 'domcontentloaded' });
    await expect(this.addButton, 'System Users list should be visible').toBeVisible();
  }

  async goToAddUser(): Promise<void> {
    await this.addButton.click();
    await this.page.waitForURL(/admin\/saveSystemUser/);
    await expect(
      this.page.locator('.oxd-input-group').first(),
      'Add User form should be visible',
    ).toBeVisible();
  }

  async createUser(data: NewSystemUserData): Promise<void> {
    await this.openDropdownAndSelect('User Role', data.role);

    // Employee Name is an autocomplete, not a plain input: typing filters a
    // suggestion list and the user must be linked by picking one of its options.
    const employeeGroup = this.page.locator('.oxd-input-group', { hasText: 'Employee Name' });
    await employeeGroup.locator('input').fill(data.employeeName);
    const suggestion = this.page.locator('.oxd-autocomplete-option', { hasText: data.employeeName });
    await expect(
      suggestion.first(),
      `Employee "${data.employeeName}" should appear in the autocomplete suggestions`,
    ).toBeVisible({ timeout: 10_000 });
    await suggestion.first().click();

    await this.openDropdownAndSelect('Status', data.status);

    await this.page.locator('.oxd-input-group', { hasText: 'Username' }).locator('input').fill(data.username);

    // "Password" and "Confirm Password" both contain the substring "Password",
    // so match on the exact label text to avoid filling the wrong field.
    const passwordGroup = this.page.locator('.oxd-input-group').filter({ hasText: /^Password$/ });
    await passwordGroup.locator('input').fill(data.password);
    const confirmGroup = this.page.locator('.oxd-input-group').filter({ hasText: /^Confirm Password$/ });
    await confirmGroup.locator('input').fill(data.password);

    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL(/admin\/viewSystemUsers/, { timeout: 15_000 });
  }

  async searchByUsername(username: string): Promise<void> {
    await this.usernameFilter.fill(username);
    await this.searchButton.click();
  }

  async expectUserFound(username: string): Promise<void> {
    const timeout = 20_000;
    await expect(this.tableRows.first(), `System user ${username} should appear in search results`).toBeVisible({
      timeout,
    });
  }

  async deleteUserByRow(): Promise<void> {
    const row = this.tableRows.first();
    await row.locator('button').filter({ has: this.page.locator('i.bi-trash') }).click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  }
}
