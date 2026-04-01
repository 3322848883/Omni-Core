import type { Router, NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

export function setupRouterGuards(router: Router) {
  // Global before guard
  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      const userStore = useUserStore();

      // Set page title
      document.title = to.meta.title ? `${to.meta.title} - FGVPN Client` : 'FGVPN Client';

      // Public pages
      if (to.meta.public) {
        // Redirect to home if already logged in
        if (to.path.startsWith('/auth') && userStore.isLoggedIn) {
          return next('/');
        }
        return next();
      }

      // Auth required pages
      if (to.meta.requiresAuth) {
        if (!userStore.isLoggedIn) {
          // Redirect to landing page (官网首页)
          return next('/');
        }
      }

      next();
    }
  );

  // Global error handler with user-friendly error handling
  router.onError((error) => {
    console.error('Router error:', error);

    const errorMessage = error.message || '页面加载失败，请重试';
    ElMessage.error(errorMessage);

    // Detect if it's a chunk loading error
    if (error.message?.includes('chunk') || error.message?.includes('Loading chunk')) {
      ElMessage.warning({
        message: '资源加载失败，正在重新加载...',
        duration: 3000,
        onClose: () => {
          window.location.reload();
        }
      });
    }
  });
}
