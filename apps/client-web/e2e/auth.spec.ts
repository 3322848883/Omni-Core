import { test, expect } from '@playwright/test';

/**
 * 认证流程端到端测试
 */

test.describe('认证流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前导航到登录页
    await page.goto('/auth/login');
  });

  test('正常登录流程', async ({ page }) => {
    // 填写登录表单
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');
    
    // 验证跳转到仪表盘
    await expect(page).toHaveURL('/dashboard');
    
    // 验证仪表盘元素存在
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('邮箱不存在', async ({ page }) => {
    // 填写不存在的邮箱
    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');
    
    // 验证错误提示
    await expect(page.locator('[data-testid="error-message"]')).toContainText('邮箱或密码错误');
  });

  test('密码错误', async ({ page }) => {
    // 填写错误的密码
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword!');
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');
    
    // 验证错误提示
    await expect(page.locator('[data-testid="error-message"]')).toContainText('邮箱或密码错误');
  });

  test('注册新用户', async ({ page }) => {
    // 导航到注册页
    await page.goto('/auth/register');
    
    // 填写注册表单
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'NewUser123!');
    await page.fill('[data-testid="confirm-password-input"]', 'NewUser123!');
    
    // 点击注册按钮
    await page.click('[data-testid="register-button"]');
    
    // 验证跳转到登录页或仪表盘
    await expect(page).toHaveURL(/\/(auth\/login|dashboard)/);
  });

  test('登出功能', async ({ page }) => {
    // 先登录
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    
    // 等待跳转到仪表盘
    await expect(page).toHaveURL('/dashboard');
    
    // 点击登出
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // 验证跳转到登录页
    await expect(page).toHaveURL('/auth/login');
  });
});
