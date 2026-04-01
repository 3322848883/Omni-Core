import { test, expect } from '@playwright/test';

test.describe('邀请奖励', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('显示邀请页面', async ({ page }) => {
    await page.goto('/invite');

    await expect(page.locator('[data-testid="invite-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="invite-title"]')).toBeVisible();
  });

  test('显示邀请码', async ({ page }) => {
    await page.goto('/invite');

    await expect(page.locator('[data-testid="invite-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="invite-code-input"]')).toBeVisible();
  });

  test('复制邀请链接', async ({ page }) => {
    await page.goto('/invite');

    const copyButton = page.locator('[data-testid="copy-link-button"]');
    if (await copyButton.isVisible()) {
      await copyButton.click();
      await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
    }
  });

  test('显示邀请规则', async ({ page }) => {
    await page.goto('/invite');

    await expect(page.locator('[data-testid="reward-rules"]')).toBeVisible();
    await expect(page.locator('[data-testid="reward-description"]')).toBeVisible();
  });

  test('显示邀请记录', async ({ page }) => {
    await page.goto('/invite');

    await expect(page.locator('[data-testid="invite-records"]')).toBeVisible();
  });

  test('显示奖励统计', async ({ page }) => {
    await page.goto('/invite');

    await expect(page.locator('[data-testid="reward-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="invited-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="reward-amount"]')).toBeVisible();
  });

  test('分享邀请链接', async ({ page }) => {
    await page.goto('/invite');

    const shareButton = page.locator('[data-testid="share-button"]');
    if (await shareButton.isVisible()) {
      await shareButton.click();
      await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
    }
  });
});