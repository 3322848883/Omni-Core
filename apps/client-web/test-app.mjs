import { chromium } from 'playwright';

async function testUserClient() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('=== FGVPN 用户端测试 ===\n');

  try {
    // 测试1: 访问登录页
    console.log('1. 测试登录页面...');
    await page.goto('http://localhost:5174/auth/login');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    console.log(`   页面标题: ${title}`);

    // 检查登录表单元素
    const emailInput = await page.locator('input[placeholder*="邮箱"]').isVisible();
    const passwordInput = await page.locator('input[type="password"]').isVisible();
    const loginButton = await page.locator('button:has-text("登录")').isVisible();

    console.log(`   邮箱输入框: ${emailInput ? '✅' : '❌'}`);
    console.log(`   密码输入框: ${passwordInput ? '✅' : '❌'}`);
    console.log(`   登录按钮: ${loginButton ? '✅' : '❌'}`);

    // 测试2: 尝试登录
    console.log('\n2. 测试登录功能...');
    await page.fill('input[placeholder*="邮箱"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123456!');

    // 监听网络请求
    const loginResponse = await page.waitForResponse(
      response => response.url().includes('/api/auth/login') || response.url().includes('/auth/login'),
      { timeout: 5000 }
    ).catch(() => null);

    await page.click('button:has-text("登录")');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`   登录后 URL: ${currentUrl}`);
    console.log(`   登录跳转: ${currentUrl.includes('dashboard') ? '✅' : '⚠️'}`);

    // 测试3: 访问仪表盘
    console.log('\n3. 测试仪表盘页面...');
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForLoadState('networkidle');

    const dashboardContent = await page.content();
    const hasDashboardElements = dashboardContent.includes('欢迎') || dashboardContent.includes('dashboard') || dashboardContent.includes('仪表盘');
    console.log(`   仪表盘内容: ${hasDashboardElements ? '✅' : '❌'}`);

    // 测试4: 访问节点页面
    console.log('\n4. 测试节点页面...');
    await page.goto('http://localhost:5174/nodes');
    await page.waitForLoadState('networkidle');

    const nodesContent = await page.content();
    const hasNodesElements = nodesContent.includes('节点') || nodesContent.includes('node');
    console.log(`   节点内容: ${hasNodesElements ? '✅' : '❌'}`);

    // 测试5: 访问订阅页面
    console.log('\n5. 测试订阅页面...');
    await page.goto('http://localhost:5174/subscription');
    await page.waitForLoadState('networkidle');

    const subContent = await page.content();
    const hasSubElements = subContent.includes('订阅') || subContent.includes('subscription') || subContent.includes('套餐');
    console.log(`   订阅内容: ${hasSubElements ? '✅' : '❌'}`);

    // 测试6: 访问流量页面
    console.log('\n6. 测试流量页面...');
    await page.goto('http://localhost:5174/traffic');
    await page.waitForLoadState('networkidle');

    const trafficContent = await page.content();
    const hasTrafficElements = trafficContent.includes('流量') || trafficContent.includes('traffic');
    console.log(`   流量内容: ${hasTrafficElements ? '✅' : '❌'}`);

    // 测试7: 检查控制台错误
    console.log('\n7. 检查控制台错误...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(2000);

    if (consoleErrors.length === 0) {
      console.log('   控制台错误: ✅ 无错误');
    } else {
      console.log(`   控制台错误: ⚠️ 发现 ${consoleErrors.length} 个错误`);
      consoleErrors.slice(0, 3).forEach(err => console.log(`      - ${err.substring(0, 100)}`));
    }

    // 测试8: 检查 404 页面
    console.log('\n8. 测试 404 错误页面...');
    await page.goto('http://localhost:5174/non-existent-page-xyz');
    await page.waitForLoadState('networkidle');

    const errorPageContent = await page.content();
    const has404Elements = errorPageContent.includes('404') || errorPageContent.includes('不存在');
    console.log(`   404 页面: ${has404Elements ? '✅' : '❌'}`);

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testUserClient();