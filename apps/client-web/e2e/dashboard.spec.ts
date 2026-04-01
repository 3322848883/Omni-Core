import { test, expect } from '@playwright/test';

/**
 * 仪表盘端到端测试
 */

test.describe('仪表盘', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('显示流量概览', async ({ page }) => {
    // 验证流量概览卡片
    await expect(page.locator('[data-testid="traffic-overview"]')).toBeVisible();
    
    // 验证已用流量
    await expect(page.locator('[data-testid="traffic-used"]')).toBeVisible();
    
    // 验证剩余流量
    await expect(page.locator('[data-testid="traffic-remaining"]')).toBeVisible();
    
    // 验证流量百分比
    await expect(page.locator('[data-testid="traffic-percentage"]')).toBeVisible();
  });

  test('显示订阅信息', async ({ page }) => {
    // 验证订阅信息卡片
    await expect(page.locator('[data-testid="subscription-info"]')).toBeVisible();
    
    // 验证订阅状态
    await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible();
    
    // 验证到期时间
    await expect(page.locator('[data-testid="subscription-expire"]')).toBeVisible();
  });

  test('显示节点状态', async ({ page }) => {
    // 验证节点状态卡片
    await expect(page.locator('[data-testid="nodes-status"]')).toBeVisible();
    
    // 验证在线节点数
    await expect(page.locator('[data-testid="online-nodes-count"]')).toBeVisible();
    
    // 验证推荐节点
    await expect(page.locator('[data-testid="recommended-node"]')).toBeVisible();
  });

  test('流量趋势图表', async ({ page }) => {
    // 验证流量趋势卡片
    await expect(page.locator('[data-testid="traffic-chart"]')).toBeVisible();
    
    // 验证图表存在
    await expect(page.locator('[data-testid="traffic-chart-canvas"]')).toBeVisible();
    
    // 验证时间范围选择器
    await expect(page.locator('[data-testid="chart-time-range"]')).toBeVisible();
  });

  test('快速操作按钮', async ({ page }) => {
    // 验证快速操作区域
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    
    // 验证下载配置按钮
    await expect(page.locator('[data-testid="quick-download-config"]')).toBeVisible();
    
    // 验证查看节点按钮
    await expect(page.locator('[data-testid="quick-view-nodes"]')).toBeVisible();
    
    // 验证购买订阅按钮
    await expect(page.locator('[data-testid="quick-buy-subscription"]')).toBeVisible();
  });

  test('导航到订阅页面', async ({ page }) => {
    // 点击购买订阅按钮
    await page.click('[data-testid="quick-buy-subscription"]');
    
    // 验证跳转到订阅页面
    await expect(page).toHaveURL('/subscription');
  });

  test('导航到节点页面', async ({ page }) => {
    // 点击查看节点按钮
    await page.click('[data-testid="quick-view-nodes"]');
    
    // 验证跳转到节点页面
    await expect(page).toHaveURL('/nodes');
  });

  test('显示通知公告', async ({ page }) => {
    // 验证通知区域
    await expect(page.locator('[data-testid="announcements"]')).toBeVisible();
  });
});
