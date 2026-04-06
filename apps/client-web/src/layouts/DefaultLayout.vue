<template>
  <el-container class="layout">
    <!-- 侧边栏 - 玻璃拟态效果 -->
    <el-aside
      class="layout-sidebar"
      :class="{ 'is-collapsed': isCollapse }"
      :width="isCollapse ? '64px' : '260px'"
    >
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="sidebar-logo__icon">
          <OmniCoreLogo :size="isCollapse ? 36 : 40" />
        </div>
        <span v-show="!isCollapse" class="sidebar-logo__text">Omni Core</span>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/app">
          <el-icon><HomeFilled /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>

        <el-menu-item index="/app/nodes">
          <el-icon><MapLocation /></el-icon>
          <template #title>节点列表</template>
        </el-menu-item>

        <el-menu-item index="/app/subscription">
          <el-icon><Goods /></el-icon>
          <template #title>订阅套餐</template>
        </el-menu-item>

        <el-menu-item index="/app/traffic">
          <el-icon><TrendCharts /></el-icon>
          <template #title>流量统计</template>
        </el-menu-item>

        <el-menu-item index="/app/orders">
          <el-icon><List /></el-icon>
          <template #title>我的订单</template>
        </el-menu-item>

        <el-menu-item index="/app/invite">
          <el-icon><Share /></el-icon>
          <template #title>邀请好友</template>
        </el-menu-item>

        <el-menu-item index="/app/profile">
          <el-icon><User /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>

      <!-- 底部信息 -->
      <div v-show="!isCollapse" class="sidebar-footer">
        <div class="sidebar-footer__version">v1.0.0</div>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="layout-main">
      <!-- 顶部导航栏 - 玻璃拟态效果 -->
      <el-header class="layout-header">
        <div class="header-left">
          <el-button
            class="header-collapse-btn"
            type="text"
            @click="toggleCollapse"
          >
            <el-icon size="20">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </el-button>

          <!-- 面包屑 -->
          <el-breadcrumb class="header-breadcrumb">
            <el-breadcrumb-item :to="{ path: '/app' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 通知 -->
          <el-badge :value="3" class="header-notify">
            <el-button type="text" class="header-btn">
              <el-icon size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>

          <!-- 用户下拉 -->
          <el-dropdown class="header-user" @command="handleCommand">
            <div class="header-user__trigger">
              <el-avatar
                :size="36"
                :src="userStore.userInfo?.avatar"
                class="header-user__avatar"
              >
                <el-icon><User /></el-icon>
              </el-avatar>
              <span v-if="!isMobile" class="header-user__name">
                {{ username }}
              </span>
              <el-icon class="header-user__arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="glass-dropdown">
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>账号设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="layout-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  HomeFilled,
  MapLocation,
  Goods,
  TrendCharts,
  List,
  Share,
  User,
  Fold,
  Expand,
  Bell,
  ArrowDown,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import OmniCoreLogo from '@/components/common/OmniCoreLogo.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 计算属性：用户名，带 fallback
const username = computed(() => {
  const userInfo = userStore.userInfo;
  if (userInfo?.username) {
    return userInfo.username;
  }
  if (userInfo?.email) {
    return userInfo.email.split('@')[0];
  }
  return '用户';
});

const isCollapse = ref(false);
const isMobile = ref(false);

const activeMenu = computed(() => route.path);
const currentRoute = computed(() => route);

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/app/profile');
      break;
    case 'settings':
      router.push('/app/profile/settings');
      break;
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        userStore.logout();
        ElMessage.success('已退出登录');
        router.push('/');
      } catch {
        // 用户取消
      }
      break;
  }
};

// 响应式处理
const handleResize = () => {
  const width = window.innerWidth;
  isMobile.value = width < 768;
  if (width < 768) {
    isCollapse.value = true;
  } else if (width >= 1024) {
    isCollapse.value = false;
  }
};

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.layout {
  min-height: 100vh;
  background: var(--bg-dark);
}

// 侧边栏 - 玻璃拟态效果
.layout-sidebar {
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;

  &.is-collapsed {
    .sidebar-logo {
      padding: var(--space-4) var(--space-3);
      justify-content: center;

      &__icon {
        margin-right: 0;
      }
    }
  }
}

// Logo
.sidebar-logo {
  display: flex;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  height: 64px;

  &__icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-primary);
    border-radius: var(--radius-lg);
    color: white;
    margin-right: var(--space-3);
    box-shadow: var(--glow-primary);
    flex-shrink: 0;
  }

  &__text {
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: var(--tracking-wide);
    white-space: nowrap;
  }
}

// 导航菜单
.sidebar-menu {
  flex: 1;
  border-right: none;
  padding: var(--space-4) 0;
  background: transparent;

  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin: var(--space-1) var(--space-3);
    padding: 0 var(--space-4) !important;
    border-radius: var(--radius-lg);
    color: var(--text-tertiary);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(99, 102, 241, 0.1);
      color: var(--text-secondary);
    }

    &.is-active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
      color: var(--text-brand);
      font-weight: var(--font-medium);
      border: 1px solid rgba(99, 102, 241, 0.3);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: var(--gradient-primary);
        border-radius: 0 2px 2px 0;
        box-shadow: var(--glow-primary);
      }

      .el-icon {
        color: var(--brand-primary);
      }
    }

    .el-icon {
      font-size: 18px;
      color: var(--text-tertiary);
      margin-right: var(--space-3);
    }
  }

  :deep(.el-tooltip__trigger) {
    justify-content: center;
    padding: 0 !important;
  }
}

// 底部信息
.sidebar-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  &__version {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-align: center;
  }
}

// 主内容区
.layout-main {
  margin-left: 260px;
  transition: margin-left 0.3s ease;
  min-height: 100vh;
  background: var(--bg-dark);

  .layout-sidebar.is-collapsed + & {
    margin-left: 64px;
  }
}

// 顶部导航栏 - 玻璃拟态效果
.layout-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  background: rgba(18, 18, 26, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 99;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-collapse-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.15);
    color: var(--text-brand);
  }
}

.header-breadcrumb {
  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: var(--text-tertiary);
      font-weight: var(--font-medium);

      &.is-link {
        &:hover {
          color: var(--text-brand);
        }
      }
    }

    &:last-child .el-breadcrumb__inner {
      color: var(--text-primary);
      font-weight: var(--font-semibold);
    }
  }

  :deep(.el-breadcrumb__separator) {
    color: var(--text-muted);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.15);
    color: var(--text-brand);
  }
}

.header-notify {
  :deep(.el-badge__content) {
    background: var(--color-danger);
    border: none;
    box-shadow: var(--glow-danger);
  }
}

.header-user {
  &__trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(99, 102, 241, 0.15);
    }
  }

  &__avatar {
    background: var(--gradient-primary);
    color: white;
    box-shadow: var(--glow-primary);
  }

  &__name {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__arrow {
    font-size: 12px;
    color: var(--text-tertiary);
  }
}

// 玻璃拟态下拉菜单
.glass-dropdown {
  background: rgba(26, 26, 37, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1) !important;

  :deep(.el-dropdown-menu__item) {
    color: var(--text-secondary);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(99, 102, 241, 0.15) !important;
      color: var(--text-brand) !important;
    }

    .el-icon {
      margin-right: var(--space-2);
      color: var(--text-tertiary);
    }
  }
}

// 页面内容
.layout-content {
  padding: var(--space-6);
  min-height: calc(100vh - 64px);
}

// 页面过渡动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// 响应式
@media (max-width: 768px) {
  .layout-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &.is-open {
      transform: translateX(0);
    }
  }

  .layout-main {
    margin-left: 0 !important;
  }

  .layout-header {
    padding: 0 var(--space-4);
  }

  .layout-content {
    padding: var(--space-4);
  }

  .header-breadcrumb {
    display: none;
  }
}
</style>
