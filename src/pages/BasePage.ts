import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  protected get toast(): Locator {
    return this.page.locator('.oxd-toast');
  }

  async expectToastMessage(expectedText: string): Promise<void> {
    await expect(this.toast, `Expected toast message to contain "${expectedText}"`).toContainText(expectedText, {
      timeout: 10_000,
    });
  }

  async openDropdownAndSelect(groupLabel: string, optionText: string): Promise<void> {
    const group = this.page.locator('.oxd-input-group', { hasText: groupLabel }).first();
    await group.locator('.oxd-select-text').click();
    const option = this.page.locator('.oxd-select-option', { hasText: optionText }).first();
    await expect(option, `Expected "${optionText}" option to be visible in "${groupLabel}" dropdown`).toBeVisible();
    await option.click();
  }
}
