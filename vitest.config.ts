import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/e2e/**',
      ],
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      '**/e2e/**',
      'apps/client-web/e2e/**',
    ],
  },
  resolve: {
    alias: {
      // client-api aliases
      '@/': path.resolve(__dirname, './apps/client-api/src/'),
      '@': path.resolve(__dirname, './apps/client-api/src'),
      // admin-api aliases - use relative paths for tests in admin-api
      '@admin/': path.resolve(__dirname, './apps/admin-api/src/'),
    },
  },
});
