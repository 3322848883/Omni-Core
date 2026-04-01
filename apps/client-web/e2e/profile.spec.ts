import { test, expect } from '@playwright/test';

test.describe('个人设置', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('显示用户信息', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="username"]')).toBeVisible();
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
  });

  test('修改密码', async ({ page }) => {
    await page.goto('/profile/settings');

    await page.fill('[data-testid="old-password-input"]', 'OldPassword123!');
    await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!');

    await page.click('[data-testid="change-password-button"]');
    await expect(page.locator('[data-testid="password-changed"]')).toBeVisible();
  });

  test('修改用户名', async ({ page }) => {
    await page.goto('/profile/settings');

    await page.fill('[data-testid="username-input"]', 'NewUsername');
    await page.click('[data-testid="save-username-button"]');
    await expect(page.locator('[data-testid="username-updated"]')).toBeVisible();
  });

  test('显示订阅信息', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('[data-testid="subscription-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="expire-date"]')).toBeVisible();
  });

  test('绑定邮箱验证', async ({ page }) => {
    await page.goto('/profile/settings');

    await page.fill('[data-testid="new-email-input"]', 'newemail@example.com');
    await page.click('[data-testid="bind-email-button"]');
    await expect(page.locator('[data-testid="email-sent"]')).toBeVisible();
  });

  test('启用双因素认证', async ({ page }) => {
    await page.goto('/profile/settings');

    await page.click('[data-testid="enable-2fa-button"]');
    await expect(page.locator('[data-testid="qr-code-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible();
  });

  test('安全设置显示', async ({ page }) => {
    await page.goto('/profile/settings');

    await expect(page.locator('[data-testid="security-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="2fa-section"]')).toBeVisible();
  });
});