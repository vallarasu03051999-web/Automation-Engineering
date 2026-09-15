import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('.oxd-alert-content-text');
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/auth/login', { waitUntil: 'domcontentloaded' });
    await expect(this.usernameInput, 'Login form should be visible').toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginError(message: string): Promise<void> {
    await expect(this.errorAlert, `Expected login error "${message}"`).toContainText(message);
  }
}
