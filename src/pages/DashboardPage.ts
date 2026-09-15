import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly breadcrumbTitle: Locator;
  private readonly userDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.breadcrumbTitle = page.locator('.oxd-topbar-header-breadcrumb-module');
    this.userDropdown = page.locator('.oxd-userdropdown-tab').first();
  }

  async expectDashboardVisible(): Promise<void> {
    await expect(this.page, 'URL should reflect the dashboard route').toHaveURL(/dashboard\/index/);
    await expect(this.breadcrumbTitle, 'Dashboard breadcrumb should be visible after login').toHaveText('Dashboard');
  }

  async navigateToPim(): Promise<void> {
    await this.page.locator('.oxd-main-menu-item').filter({ hasText: 'PIM' }).click();
    await this.page.waitForURL(/pim\/viewEmployeeList/);
  }

  async logout(): Promise<void> {
    await this.userDropdown.click();
    await this.page.getByText('Logout', { exact: true }).click();
  }
}
