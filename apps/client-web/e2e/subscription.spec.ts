import { test, expect } from '@playwright/test';

/**
 * 订阅管理端到端测试
 */

test.describe('订阅管理', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('查看套餐列表', async ({ page }) => {
    // 导航到订阅页面
    await page.goto('/subscription');
    
    // 验证套餐列表显示
    await expect(page.locator('[data-testid="subscription-plans"]')).toBeVisible();
    
    // 验证至少有一个套餐
    const plans = await page.locator('[data-testid="plan-card"]').count();
    expect(plans).toBeGreaterThan(0);
  });

  test('查看当前订阅', async ({ page }) => {
    // 导航到订阅页面
    await page.goto('/subscription');
    
    // 验证当前订阅信息
    await expect(page.locator('[data-testid="current-subscription"]')).toBeVisible();
    
    // 验证订阅详情
    await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-expire"]')).toBeVisible();
  });

  test('选择套餐和周期', async ({ page }) => {
    // 导航到订阅页面
    await page.goto('/subscription');
    
    // 选择一个套餐
    await page.click('[data-testid="plan-card"]:first-child');
    
    // 选择订阅周期
    await page.click('[data-testid="period-12months"]');
    
    // 验证价格更新
    await expect(page.locator('[data-testid="total-price"]')).toBeVisible();
  });

  test('创建订单', async ({ page }) => {
    // 导航到订阅页面
    await page.goto('/subscription');
    
    // 选择套餐
    await page.click('[data-testid="plan-card"]:first-child');
    await page.click('[data-testid="period-12months"]');
    
    // 点击购买按钮
    await page.click('[data-testid="buy-button"]');
    
    // 验证跳转到订单确认页
    await expect(page).toHaveURL(/\/orders\/confirm/);
  });

  test('下载订阅配置', async ({ page }) => {
    // 导航到订阅页面
    await page.goto('/subscription');
    
    // 点击下载配置按钮
    await page.click('[data-testid="download-config-button"]');
    
    // 验证下载选项显示
    await expect(page.locator('[data-testid="download-options"]')).toBeVisible();
    
    // 选择通用订阅
    await page.click('[data-testid="download-base64"]');
    
    // 验证下载成功提示
    await expect(page.locator('[data-testid="download-success"]')).toBeVisible();
  });

  test('显示订阅二维码', async ({ page }) => {
    // 导航到订阅页面
    await page.goto('/subscription');
    
    // 点击二维码按钮
    await page.click('[data-testid="qr-code-button"]');
    
    // 验证二维码显示
    await expect(page.locator('[data-testid="qr-code-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible();
  });
});
