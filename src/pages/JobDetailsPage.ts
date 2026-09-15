import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { JobUpdateData } from '../types/employee';

export class JobDetailsPage extends BasePage {
  private readonly saveButton: Locator;
  private readonly jobTitleValue: Locator;
  private readonly employmentStatusValue: Locator;

  constructor(page: Page) {
    super(page);
    this.saveButton = page.locator('button[type="submit"]');
    this.jobTitleValue = page
      .locator('.oxd-input-group', { hasText: 'Job Title' })
      .locator('.oxd-select-text-input');
    this.employmentStatusValue = page
      .locator('.oxd-input-group', { hasText: 'Employment Status' })
      .locator('.oxd-select-text-input');
  }

  async updateJobDetails(data: JobUpdateData): Promise<void> {
    await this.openDropdownAndSelect('Job Title', data.jobTitle);
    await this.openDropdownAndSelect('Employment Status', data.employmentStatus);
    await this.saveButton.click();
  }

  async expectJobDetails(data: JobUpdateData): Promise<void> {
    await expect(this.jobTitleValue, 'Job Title should reflect the update').toHaveText(data.jobTitle);
    await expect(this.employmentStatusValue, 'Employment Status should reflect the update').toHaveText(
      data.employmentStatus,
    );
  }
}
