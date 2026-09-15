import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PersonalDetailsPage extends BasePage {
  private readonly employeeIdInput: Locator;
  private readonly jobTab: Locator;

  constructor(page: Page) {
    super(page);
    this.employeeIdInput = page.locator('.oxd-input-group', { hasText: 'Employee Id' }).locator('input');
    this.jobTab = page.getByText('Job', { exact: true });
  }

  async expectEmployeeId(employeeId: string): Promise<void> {
    await expect(this.employeeIdInput, 'Employee Id field should match the created employee').toHaveValue(
      employeeId,
    );
  }

  async goToJobTab(): Promise<void> {
    await this.jobTab.click();
    await this.page.waitForURL(/pim\/viewJobDetails/);
  }
}
