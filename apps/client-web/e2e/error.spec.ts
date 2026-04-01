import { test, expect } from '@playwright/test';

test.describe('错误页面', () => {
  test('404 页面显示', async ({ page }) => {
    await page.goto('/non-existent-page');

    await expect(page.locator('[data-testid="error-page"]')).toBeVisible();
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=页面不存在')).toBeVisible();
  });

  test('404 页面返回首页按钮', async ({ page }) => {
    await page.goto('/non-existent-page');

    const homeButton = page.locator('text=返回首页');
    await homeButton.click();
    await expect(page).toHaveURL('/');
  });

  test('500 页面显示', async ({ page }) => {
    await page.goto('/error/500');

    await expect(page.locator('[data-testid="error-page"]')).toBeVisible();
    await expect(page.locator('text=500')).toBeVisible();
  });
});