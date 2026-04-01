import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@stores/auth';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Layouts
import MainLayout from '@layouts/MainLayout.vue';

// Views
import LoginView from '@views/login/LoginView.vue';
import DashboardView from '@views/dashboard/DashboardView.vue';
import UserListView from '@views/users/UserListView.vue';
import OrderListView from '@views/orders/OrderListView.vue';
import TrafficMonitorView from '@views/traffic/TrafficMonitorView.vue';
import NodeListView from '@views/nodes/NodeListView.vue';
import NodeDetail from '@views/nodes/NodeDetail.vue';
import NodeForm from '@views/nodes/NodeForm.vue';
import InviteListView from '@views/invites/InviteListView.vue';
import SettingsView from '@views/settings/SettingsView.vue';
import ServiceTypeList from '@views/service-types/ServiceTypeList.vue';
import PlanList from '@views/plans/PlanList.vue';
import PlanForm from '@views/plans/PlanForm.vue';
import PlanStats from '@views/plans/PlanStats.vue';
import UserSubscriptions from '@views/users/UserSubscriptions.vue';
import ServiceTypeDashboard from '@views/dashboard/ServiceTypeDashboard.vue';
import IpPoolList from '@views/ip-pools/IpPoolList.vue';
import IpPoolForm from '@views/ip-pools/IpPoolForm.vue';
import IpPoolDetail from '@views/ip-pools/IpPoolDetail.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: '数据概览', icon: 'DataLine' },
      },
      {
        path: 'service-types',
        name: 'ServiceTypes',
        component: ServiceTypeList,
        meta: { title: '服务类型', icon: 'SetUp' },
      },
      {
        path: 'service-type-dashboard',
        name: 'ServiceTypeDashboard',
        component: ServiceTypeDashboard,
        meta: { title: '服务监控', icon: 'TrendCharts' },
      },
      {
        path: 'users',
        name: 'Users',
        component: UserListView,
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'users/:id/subscriptions',
        name: 'UserSubscriptions',
        component: UserSubscriptions,
        meta: { title: '用户订阅', icon: 'Tickets', hidden: true },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: OrderListView,
        meta: { title: '订单管理', icon: 'ShoppingCart' },
      },
      {
        path: 'plans',
        name: 'Plans',
        component: PlanList,
        meta: { title: '套餐管理', icon: 'Collection' },
      },
      {
        path: 'plans/create',
        name: 'PlanCreate',
        component: PlanForm,
        meta: { title: '创建套餐', icon: 'Plus', hidden: true },
      },
      {
        path: 'plans/:id/edit',
        name: 'PlanEdit',
        component: PlanForm,
        meta: { title: '编辑套餐', icon: 'Edit', hidden: true },
      },
      {
        path: 'plans/stats',
        name: 'PlanStats',
        component: PlanStats,
        meta: { title: '套餐统计', icon: 'TrendCharts' },
      },
      {
        path: 'traffic',
        name: 'Traffic',
        component: TrafficMonitorView,
        meta: { title: '流量监控', icon: 'TrendCharts' },
      },
      {
        path: 'nodes',
        name: 'Nodes',
        component: NodeListView,
        meta: { title: '节点管理', icon: 'MapLocation' },
      },
      {
        path: 'nodes/create',
        name: 'NodeCreate',
        component: NodeForm,
        meta: { title: '创建节点', icon: 'Plus', hidden: true },
      },
      {
        path: 'nodes/:id',
        name: 'NodeDetail',
        component: NodeDetail,
        meta: { title: '节点详情', icon: 'InfoFilled', hidden: true },
      },
      {
        path: 'nodes/:id/edit',
        name: 'NodeEdit',
        component: NodeForm,
        meta: { title: '编辑节点', icon: 'Edit', hidden: true },
      },
      {
        path: 'invites',
        name: 'Invites',
        component: InviteListView,
        meta: { title: '邀请管理', icon: 'Share' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsView,
        meta: { title: '系统设置', icon: 'Setting' },
      },
      {
        path: 'ip-pools',
        name: 'IpPools',
        component: IpPoolList,
        meta: { title: 'IP池管理', icon: 'MapLocation' },
      },
      {
        path: 'ip-pools/create',
        name: 'IpPoolCreate',
        component: IpPoolForm,
        meta: { title: '创建IP池', icon: 'Plus', hidden: true },
      },
      {
        path: 'ip-pools/:id',
        name: 'IpPoolDetail',
        component: IpPoolDetail,
        meta: { title: 'IP池详情', icon: 'InfoFilled', hidden: true },
      },
      {
        path: 'ip-pools/:id/edit',
        name: 'IpPoolEdit',
        component: IpPoolForm,
        meta: { title: '编辑IP池', icon: 'Edit', hidden: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Navigation guards
router.beforeEach((to, _from, next) => {
  NProgress.start();

  const authStore = useAuthStore();

  if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
