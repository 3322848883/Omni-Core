import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@api': resolve(__dirname, 'src/api'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/*.ts', 'src/stores/*.ts', 'src/components/common/*.vue'],
      exclude: [
        'src/**/*.d.ts',
        'src/utils/index.ts',
        'src/stores/index.ts',
        'src/utils/request.ts',
        'src/components/common/Breadcrumb.vue',
        'src/components/common/ErrorDisplay.vue',
        'src/components/common/Loading.vue',
        'src/stores/node.ts',
        'src/stores/subscription.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    deps: {
      inline: [/element-plus/],
    },
  },
});
