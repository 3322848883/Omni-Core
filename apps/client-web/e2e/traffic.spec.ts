import { test, expect } from '@playwright/test';

test.describe('流量统计', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('显示流量统计卡片', async ({ page }) => {
    await page.goto('/traffic');

    await expect(page.locator('[data-testid="traffic-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="today-used"]')).toBeVisible();
    await expect(page.locator('[data-testid="month-used"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-limit"]')).toBeVisible();
    await expect(page.locator('[data-testid="remaining"]')).toBeVisible();
  });

  test('显示流量趋势图表', async ({ page }) => {
    await page.goto('/traffic');

    await expect(page.locator('[data-testid="traffic-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-canvas"]')).toBeVisible();
  });

  test('切换日期范围', async ({ page }) => {
    await page.goto('/traffic');

    await page.click('[data-testid="date-range-7"]');
    await expect(page.locator('[data-testid="traffic-chart"]')).toBeVisible();

    await page.click('[data-testid="date-range-30"]');
    await expect(page.locator('[data-testid="traffic-chart"]')).toBeVisible();

    await page.click('[data-testid="date-range-90"]');
    await expect(page.locator('[data-testid="traffic-chart"]')).toBeVisible();
  });

  test('流量百分比显示', async ({ page }) => {
    await page.goto('/traffic');

    await expect(page.locator('[data-testid="usage-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-percentage"]')).toBeVisible();
  });

  test('刷新流量数据', async ({ page }) => {
    await page.goto('/traffic');

    await page.click('[data-testid="refresh-button"]');
    await expect(page.locator('[data-testid="traffic-page"]')).toBeVisible();
  });
});