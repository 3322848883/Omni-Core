import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { setupRouterGuards } from './guards';

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Setup guards
setupRouterGuards(router);

export default router;
