import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  // 官网首页 - 公开访问
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/landing/Index.vue'),
    meta: { public: true, title: 'Omni Core - 安全、快速、匿名的网络体验' },
  },

  // Auth routes - 使用官网首页登录
  {
    path: '/login',
    name: 'Login',
    redirect: '/',
    meta: { public: true, title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    redirect: '/',
    meta: { public: true, title: '注册' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    redirect: '/',
    meta: { public: true, title: '找回密码' },
  },

  // App routes - 需要登录
  {
    path: '/app',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: { title: '仪表盘', icon: 'Dashboard' },
      },
      {
        path: 'subscription',
        name: 'Subscription',
        component: () => import('@/views/subscription/Index.vue'),
        meta: { title: '我的订阅', icon: 'Ticket' },
      },
      {
        path: 'subscription/plans',
        name: 'Plans',
        component: () => import('@/views/subscription/Plans.vue'),
        meta: { title: '升级套餐', icon: 'Goods' },
      },
      {
        path: 'subscription/plans/:id',
        name: 'PlanDetail',
        component: () => import('@/views/subscription/PlanDetail.vue'),
        meta: { title: '套餐详情', icon: 'Goods' },
      },
      {
        path: 'nodes',
        name: 'Nodes',
        component: () => import('@/views/nodes/Index.vue'),
        meta: { title: '节点列表', icon: 'MapLocation' },
      },
      {
        path: 'traffic',
        name: 'Traffic',
        component: () => import('@/views/traffic/Index.vue'),
        meta: { title: '流量统计', icon: 'TrendCharts' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/Index.vue'),
        meta: { title: '我的订单', icon: 'Document' },
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/Detail.vue'),
        meta: { title: '订单详情', icon: 'Document' },
      },
      {
        path: 'invite',
        name: 'Invite',
        component: () => import('@/views/invite/Index.vue'),
        meta: { title: '邀请好友', icon: 'UserFilled' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/Index.vue'),
        meta: { title: '个人中心', icon: 'User' },
      },
      {
        path: 'profile/settings',
        name: 'Settings',
        component: () => import('@/views/profile/Settings.vue'),
        meta: { title: '账户设置', icon: 'Setting' },
      },
    ],
  },

  // Error pages
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { public: true, title: '页面未找到' },
  },
  {
    path: '/500',
    name: 'ServerError',
    component: () => import('@/views/error/500.vue'),
    meta: { public: true, title: '服务器错误' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
];
