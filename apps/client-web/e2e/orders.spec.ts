import { test, expect } from '@playwright/test';

test.describe('订单管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('显示订单列表', async ({ page }) => {
    await page.goto('/orders');

    await expect(page.locator('[data-testid="orders-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
  });

  test('订单状态筛选', async ({ page }) => {
    await page.goto('/orders');

    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
  });

  test('查看订单详情', async ({ page }) => {
    await page.goto('/orders');

    const firstOrderLink = page.locator('[data-testid="order-link"]').first();
    if (await firstOrderLink.isVisible()) {
      await firstOrderLink.click();
      await expect(page).toHaveURL(/\/orders\/\d+/);
      await expect(page.locator('[data-testid="order-detail"]')).toBeVisible();
    }
  });

  test('取消待支付订单', async ({ page }) => {
    await page.goto('/orders');

    const cancelButton = page.locator('[data-testid="cancel-order-button"]').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await page.click('[data-testid="confirm-cancel"]');
      await expect(page.locator('[data-testid="cancel-success"]')).toBeVisible();
    }
  });

  test('新建订单跳转', async ({ page }) => {
    await page.goto('/orders');

    await page.click('[data-testid="new-order-button"]');
    await expect(page).toHaveURL('/subscription/plans');
  });
});