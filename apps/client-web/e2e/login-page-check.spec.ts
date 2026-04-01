import { test, expect } from '@playwright/test';

test.describe('FGVPN 登录页面元素检查', () => {
  test('检查登录页面按钮和链接元素', async ({ page }) => {
    console.log('\n========================================');
    console.log('FGVPN 用户端前端界面检查');
    console.log('========================================\n');

    // 1. 访问登录页面
    console.log('[1] 正在访问 http://localhost:5174/auth/login ...');
    await page.goto('http://localhost:5174/auth/login', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('    ✓ 页面加载成功\n');

    // 2. 检查登录按钮
    console.log('[2] 检查登录按钮...');
    const loginButtonSelectors = [
      'button:has-text("登录")',
      'button[type="submit"]',
      '.submit-btn',
      '.el-button--primary',
    ];

    let loginBtnFound = false;
    let loginBtnText = '';
    for (const selector of loginButtonSelectors) {
      try {
        const btn = page.locator(selector).first();
        const count = await btn.count();
        if (count > 0) {
          const visible = await btn.isVisible().catch(() => false);
          if (visible) {
            loginBtnText = await btn.innerText().catch(() => '');
            console.log(`    ✓ 登录按钮存在 (选择器: ${selector})`);
            console.log(`    ✓ 按钮文本: "${loginBtnText.trim()}"`);
            loginBtnFound = true;
            break;
          }
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    if (!loginBtnFound) {
      console.log('    ✗ 登录按钮未找到');
    }
    console.log('');

    // 3. 检查注册按钮/链接
    console.log('[3] 检查注册按钮...');
    const registerSelectors = [
      'a:has-text("立即注册")',
      '.form-footer a',
      'a:has-text("注册")',
    ];

    let registerFound = false;
    let registerText = '';
    for (const selector of registerSelectors) {
      try {
        const elem = page.locator(selector).first();
        const count = await elem.count();
        if (count > 0) {
          const visible = await elem.isVisible().catch(() => false);
          if (visible) {
            registerText = await elem.innerText().catch(() => '');
            console.log(`    ✓ 注册链接存在 (选择器: ${selector})`);
            console.log(`    ✓ 链接文本: "${registerText.trim()}"`);
            registerFound = true;
            break;
          }
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    if (!registerFound) {
      console.log('    ✗ 注册按钮未找到');
    }
    console.log('');

    // 4. 检查忘记密码链接
    console.log('[4] 检查忘记密码链接...');
    const forgotPasswordSelectors = [
      'a:has-text("忘记密码")',
      '.el-link:has-text("忘记密码")',
      'a[href*="forgot"]',
    ];

    let forgotFound = false;
    let forgotText = '';
    for (const selector of forgotPasswordSelectors) {
      try {
        const elem = page.locator(selector).first();
        const count = await elem.count();
        if (count > 0) {
          const visible = await elem.isVisible().catch(() => false);
          if (visible) {
            forgotText = await elem.innerText().catch(() => '');
            console.log(`    ✓ 忘记密码链接存在 (选择器: ${selector})`);
            console.log(`    ✓ 链接文本: "${forgotText.trim()}"`);
            forgotFound = true;
            break;
          }
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    if (!forgotFound) {
      console.log('    ✗ 忘记密码链接未找到');
    }
    console.log('');

    // 5. 截图记录
    console.log('[5] 正在截图...');
    await page.screenshot({
      path: 'test-results/login-page-check.png',
      fullPage: true
    });
    console.log('    ✓ 截图已保存: test-results/login-page-check.png\n');

    // 6. 页面基本信息
    console.log('[6] 页面基本信息:');
    const title = await page.title();
    const url = page.url();
    console.log(`    - 页面标题: ${title}`);
    console.log(`    - 页面URL: ${url}\n`);

    // 7. 列出所有按钮
    console.log('[7] 页面上的所有按钮:');
    const buttons = await page.locator('button').all();
    let btnCount = 0;
    for (const btn of buttons.slice(0, 10)) {
      try {
        const text = await btn.innerText();
        const visible = await btn.isVisible().catch(() => false);
        if (text.trim() && visible) {
          console.log(`    ${++btnCount}. "${text.trim()}"`);
        }
      } catch (e) {
        // 忽略错误
      }
    }
    if (btnCount === 0) {
      console.log('    (未找到可见按钮)');
    }
    console.log('');

    // 8. 列出所有链接
    console.log('[8] 页面上的所有链接:');
    const links = await page.locator('a, .el-link').all();
    let linkCount = 0;
    for (const link of links.slice(0, 10)) {
      try {
        const text = await link.innerText();
        const visible = await link.isVisible().catch(() => false);
        if (text.trim() && visible) {
          console.log(`    ${++linkCount}. "${text.trim()}"`);
        }
      } catch (e) {
        // 忽略错误
      }
    }
    if (linkCount === 0) {
      console.log('    (未找到可见链接)');
    }

    console.log('\n========================================');
    console.log('检查完成!');
    console.log('========================================\n');

    // 检查结果汇总
    console.log('检查结果汇总:');
    console.log(`  - 登录按钮: ${loginBtnFound ? '✓ 存在' : '✗ 未找到'}`);
    console.log(`  - 注册按钮: ${registerFound ? '✓ 存在' : '✗ 未找到'}`);
    console.log(`  - 忘记密码链接: ${forgotFound ? '✓ 存在' : '✗ 未找到'}`);
    console.log('');

    // 断言检查结果
    expect(loginBtnFound, '登录按钮应该存在').toBeTruthy();
    expect(registerFound, '注册链接应该存在').toBeTruthy();
    expect(forgotFound, '忘记密码链接应该存在').toBeTruthy();
  });
});
