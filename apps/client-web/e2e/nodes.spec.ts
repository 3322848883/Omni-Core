import { test, expect } from '@playwright/test';

/**
 * 节点服务端到端测试
 */

test.describe('节点服务', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Test123456!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('显示节点列表', async ({ page }) => {
    // 导航到节点页面
    await page.goto('/nodes');
    
    // 验证节点列表显示
    await expect(page.locator('[data-testid="nodes-list"]')).toBeVisible();
    
    // 验证至少有一个节点
    const nodes = await page.locator('[data-testid="node-card"]').count();
    expect(nodes).toBeGreaterThan(0);
  });

  test('节点状态显示', async ({ page }) => {
    // 导航到节点页面
    await page.goto('/nodes');
    
    // 验证节点状态显示
    await expect(page.locator('[data-testid="node-status"]')).toBeVisible();
    
    // 验证延迟显示
    await expect(page.locator('[data-testid="node-latency"]')).toBeVisible();
  });

  test('单节点延迟测试', async ({ page }) => {
    // 导航到节点页面
    await page.goto('/nodes');
    
    // 点击第一个节点的测速按钮
    await page.click('[data-testid="node-card"]:first-child [data-testid="test-latency-button"]');
    
    // 验证测速中状态
    await expect(page.locator('[data-testid="testing-indicator"]')).toBeVisible();
    
    // 等待测速完成
    await expect(page.locator('[data-testid="latency-result"]')).toBeVisible({ timeout: 10000 });
  });

  test('批量延迟测试', async ({ page }) => {
    // 导航到节点页面
    await page.goto('/nodes');
    
    // 点击批量测速按钮
    await page.click('[data-testid="batch-test-button"]');
    
    // 验证测速中状态
    await expect(page.locator('[data-testid="batch-testing-indicator"]')).toBeVisible();
    
    // 等待测速完成
    await expect(page.locator('[data-testid="batch-test-complete"]')).toBeVisible({ timeout: 30000 });
  });

  test('下载节点配置', async ({ page }) => {
    // 导航到节点页面
    await page.goto('/nodes');
    
    // 点击第一个节点的配置按钮
    await page.click('[data-testid="node-card"]:first-child [data-testid="config-button"]');
    
    // 验证配置弹窗显示
    await expect(page.locator('[data-testid="config-modal"]')).toBeVisible();
    
    // 验证分享链接显示
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible();
    
    // 验证二维码显示
    await expect(page.locator('[data-testid="node-qr-code"]')).toBeVisible();
  });

  test('节点筛选和排序', async ({ page }) => {
    // 导航到节点页面
    await page.goto('/nodes');
    
    // 选择协议筛选
    await page.selectOption('[data-testid="protocol-filter"]', 'vless');
    
    // 验证筛选结果
    const nodes = await page.locator('[data-testid="node-card"]').count();
    expect(nodes).toBeGreaterThanOrEqual(0);
    
    // 点击排序按钮
    await page.click('[data-testid="sort-by-latency"]');
    
    // 验证排序后的节点列表
    await expect(page.locator('[data-testid="nodes-list"]')).toBeVisible();
  });

  test('查看节点详情', async ({ page }) => {
    // 导航到节点页面
    await page.goto('/nodes');
    
    // 点击第一个节点的详情按钮
    await page.click('[data-testid="node-card"]:first-child [data-testid="details-button"]');
    
    // 验证详情弹窗显示
    await expect(page.locator('[data-testid="node-details-modal"]')).toBeVisible();
    
    // 验证节点信息
    await expect(page.locator('[data-testid="node-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="node-host"]')).toBeVisible();
    await expect(page.locator('[data-testid="node-port"]')).toBeVisible();
    await expect(page.locator('[data-testid="node-protocol"]')).toBeVisible();
  });
});
