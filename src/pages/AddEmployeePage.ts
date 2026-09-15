import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { NewEmployeeData } from '../types/employee';

export class AddEmployeePage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly employeeIdInput: Locator;
  private readonly profilePictureInput: Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('input.orangehrm-firstname');
    this.lastNameInput = page.locator('input.orangehrm-lastname');
    this.employeeIdInput = page.locator('.oxd-input-group', { hasText: 'Employee Id' }).locator('input');
    this.profilePictureInput = page.locator('input.oxd-file-input');
    this.saveButton = page.locator('button[type="submit"]');
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.firstNameInput, 'Add Employee form should be visible').toBeVisible();
  }

  async fillEmployeeDetails(data: NewEmployeeData, employeeId: string): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.employeeIdInput.fill('');
    await this.employeeIdInput.fill(employeeId);
    await this.profilePictureInput.setInputFiles(data.profilePicture);
  }

  async save(): Promise<void> {
    // The success toast auto-dismisses in a few seconds, and the SPA route change to
    // viewPersonalDetails happens almost immediately — so the toast must be asserted
    // concurrently with the navigation wait, not after it, or it will already be gone.
    await this.saveButton.click();
    await Promise.all([
      this.page.waitForURL(/pim\/viewPersonalDetails/, { timeout: 15_000 }),
      this.expectToastMessage('Successfully Saved'),
    ]);
  }
}
