import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      vue(),
      vueJsx(),
      // 打包分析插件（仅在 analyze 模式下启用）
      isAnalyze &&
        visualizer({
          open: true,
          gzipSize: true,
          brotliSize: true,
          filename: 'dist/stats.html',
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@views': resolve(__dirname, 'src/views'),
        '@stores': resolve(__dirname, 'src/stores'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@api': resolve(__dirname, 'src/api'),
        '@types': resolve(__dirname, 'src/types'),
        '@shared': resolve(__dirname, '../../shared'),
      },
      // 确保使用浏览器版本的 axios
      mainFields: ['browser', 'module', 'main'],
    },
    server: {
      port: 8082,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      // 代码分割优化
      rollupOptions: {
        output: {
          // 手动分块策略
          manualChunks: {
            // Element Plus 单独打包
            'element-plus': ['element-plus'],
            // Vue 核心库
            'vue-core': ['vue', 'vue-router', 'pinia'],
            // 图表库（如果有）
            // 'charts': ['echarts'],
          },
          // 代码块文件名格式
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/')
              : [];
            const name =
              facadeModuleId[facadeModuleId.length - 2] || '[name]';
            return `js/${name}/[name]-[hash].js`;
          },
          // 入口文件名
          entryFileNames: 'js/[name]-[hash].js',
          // 静态资源文件名
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || '';
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(info)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(info)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            if (/\.css$/i.test(info)) {
              return 'css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // 压缩配置
      minify: 'terser',
      terserOptions: {
        compress: {
          // 移除 console 和 debugger
          drop_console: true,
          drop_debugger: true,
          // 移除未使用的代码
          dead_code: true,
          // 优化循环
          loops: true,
        },
        mangle: {
          // 压缩变量名
          safari10: true,
        },
        format: {
          // 移除注释
          comments: false,
        },
      },
      // 资源内联限制（小于 4KB 的文件内联为 base64）
      assetsInlineLimit: 4096,
      // CSS 代码分割
      cssCodeSplit: true,
      // 预加载策略
      modulePreload: {
        polyfill: true,
      },
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'element-plus',
        '@element-plus/icons-vue',
      ],
      exclude: [],
      esbuildOptions: {
        // 确保 @shared 模块被正确处理
        loader: {
          '.js': 'jsx',
        },
      },
    },
    // 实验性功能
    experimental: {
      // 启用 renderBuiltUrl 以支持 CDN
      renderBuiltUrl() {
        // 可以在这里配置 CDN 地址
        return { relative: true };
      },
    },
  };
});
