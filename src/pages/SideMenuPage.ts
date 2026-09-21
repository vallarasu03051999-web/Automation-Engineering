import { Page, Locator, expect } from '@playwright/test';

export class SideMenuPage {
  constructor(private readonly page: Page) {}

  private get menuItems(): Locator {
    return this.page.locator('.oxd-main-menu-item');
  }

  async expectMenuItemVisible(name: string): Promise<void> {
    await expect(
      this.menuItems.filter({ hasText: name }),
      `"${name}" menu item should be visible for this role`,
    ).toHaveCount(1);
  }

  async expectMenuItemHidden(name: string): Promise<void> {
    await expect(
      this.menuItems.filter({ hasText: name }),
      `"${name}" menu item should NOT be visible for this role`,
    ).toHaveCount(0);
  }
}
