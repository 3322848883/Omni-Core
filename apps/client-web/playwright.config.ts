import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 端到端测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* 每个测试的最长时间 */
  timeout: 30 * 1000,

  /* 预期断言的超时时间 */
  expect: {
    timeout: 5000,
  },

  /* 禁止在 CI 中并行执行，本地开发可以并行 */
  fullyParallel: !process.env.CI,

  /* 在 CI 中禁止重复运行测试 */
  forbidOnly: !!process.env.CI,

  /* 仅在 CI 中重试 */
  retries: process.env.CI ? 2 : 0,

  /* 在 CI 中使用 4 个 workers，本地使用 2 个 */
  workers: process.env.CI ? 4 : 2,

  /* 报告器配置 */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  /* 共享所有项目的配置 */
  use: {
    /* 测试的基础 URL */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    /* 收集所有跟踪的上下文 */
    trace: 'on-first-retry',

    /* 失败时截图 */
    screenshot: 'only-on-failure',

    /* 录制视频 */
    video: 'on-first-retry',

    /* 视口大小 */
    viewport: { width: 1280, height: 720 },

    /* 动作超时 */
    actionTimeout: 15000,

    /* 导航超时 */
    navigationTimeout: 15000,
  },

  /* 针对不同浏览器配置项目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 在运行测试前启动开发服务器 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
