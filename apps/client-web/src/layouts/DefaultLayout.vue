<template>
  <div class="omni-layout">
    <!-- 侧边栏 - 未来科技感 -->
    <aside
      class="omni-sidebar"
      :class="{ 'is-collapsed': isCollapse }"
    >
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <div class="logo-glow"></div>
          <OmniCoreLogo :size="isCollapse ? 32 : 36" />
        </div>
        <h1 v-show="!isCollapse" class="logo-text">
          <span class="logo-text__omni">Omni</span>
          <span class="logo-text__core">Core</span>
        </h1>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li
            v-for="item in navItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: isActive(item.route) }"
            @click="navigate(item.route)"
          >
            <div class="nav-item__icon">
              <el-icon :size="isCollapse ? 20 : 24">
                <component :is="item.icon" />
              </el-icon>
              <div class="nav-item__glow" v-if="isActive(item.route)"></div>
            </div>
            <span v-show="!isCollapse" class="nav-item__label">{{ item.label }}</span>
          </li>
        </ul>
      </nav>

      <!-- 状态指示器 -->
      <div v-show="!isCollapse" class="sidebar-status">
        <div class="status-item">
          <div class="status-dot" :class="connectionStatus.class"></div>
          <span class="status-text">{{ connectionStatus.text }}</span>
        </div>
        <div class="status-item">
          <el-icon size="16"><Timer /></el-icon>
          <span class="status-text">{{ uptime }}</span>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="omni-main">
      <!-- 顶部导航栏 -->
      <header class="omni-header">
        <div class="header-left">
          <button
            class="collapse-btn"
            @click="toggleCollapse"
            aria-label="Toggle sidebar"
          >
            <el-icon :size="20">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </button>
          
          <!-- 面包屑 -->
          <el-breadcrumb class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/app' }">
              <el-icon size="16"><HomeFilled /></el-icon>
              <span>首页</span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 搜索 -->
          <div class="search-box">
            <el-icon class="search-icon"><Search /></el-icon>
            <input
              type="text"
              placeholder="搜索节点、套餐..."
              class="search-input"
            />
          </div>

          <!-- 通知 -->
          <div class="header-action">
            <el-badge :value="notificationCount" class="notification-badge">
              <button class="action-btn" @click="showNotifications">
                <el-icon :size="20"><Bell /></el-icon>
              </button>
            </el-badge>
          </div>

          <!-- 主题切换 -->
          <div class="header-action">
            <button class="action-btn" @click="toggleTheme">
              <el-icon :size="20"><MoonNight v-if="isDark" /><Sunny v-else /></el-icon>
            </button>
          </div>

          <!-- 用户菜单 -->
          <div class="user-menu">
            <el-dropdown @command="handleUserCommand">
              <div class="user-menu__trigger">
                <div class="user-avatar">
                  <img
                    v-if="userStore.userInfo?.avatar"
                    :src="userStore.userInfo.avatar"
                    :alt="userStore.userInfo.username"
                  />
                  <div v-else class="avatar-placeholder">
                    <el-icon><User /></el-icon>
                  </div>
                  <div class="avatar-status" :class="userStatus.class"></div>
                </div>
                <span v-if="!isMobile" class="user-name">
                  {{ userStore.userInfo?.username || '用户' }}
                </span>
                <el-icon class="user-arrow"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="user-dropdown">
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    <span>个人中心</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>
                    <span>账号设置</span>
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    <span>退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="omni-content">
        <router-view v-slot="{ Component }">
          <transition name="omni-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 浮动控制按钮 -->
    <div class="floating-controls">
      <button class="control-btn" @click="showSpeedTest" title="测速">
        <el-icon><Timer /></el-icon>
      </button>
      <button class="control-btn" @click="showQuickConnect" title="快速连接">
        <el-icon><Connection /></el-icon>
      </button>
    </div>
  </div>
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
  SwitchButton,
  Search,
  MoonNight,
  Sunny,
  Timer,
  Connection
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import OmniCoreLogo from '@/components/common/OmniCoreLogo.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isCollapse = ref(false);
const isMobile = ref(false);
const isDark = ref(true);
const notificationCount = ref(3);
const uptime = ref('24h 15m');

const currentRoute = computed(() => route);

const navItems = [
  { key: 'dashboard', route: '/app', label: '仪表盘', icon: 'HomeFilled' },
  { key: 'nodes', route: '/app/nodes', label: '节点列表', icon: 'MapLocation' },
  { key: 'subscription', route: '/app/subscription', label: '订阅套餐', icon: 'Goods' },
  { key: 'traffic', route: '/app/traffic', label: '流量统计', icon: 'TrendCharts' },
  { key: 'orders', route: '/app/orders', label: '我的订单', icon: 'List' },
  { key: 'invite', route: '/app/invite', label: '邀请好友', icon: 'Share' },
  { key: 'profile', route: '/app/profile', label: '个人中心', icon: 'User' }
];

const connectionStatus = computed(() => {
  return {
    text: '已连接',
    class: 'status-connected'
  };
});

const userStatus = computed(() => {
  return {
    class: 'status-online'
  };
});

const isActive = (routePath: string) => {
  return route.path === routePath;
};

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  // 这里可以添加主题切换逻辑
};

const navigate = (routePath: string) => {
  router.push(routePath);
};

const handleUserCommand = async (command: string) => {
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

const showNotifications = () => {
  // 显示通知列表
  ElMessage.info('通知功能开发中');
};

const showSpeedTest = () => {
  // 显示测速面板
  ElMessage.info('测速功能开发中');
};

const showQuickConnect = () => {
  // 显示快速连接面板
  ElMessage.info('快速连接功能开发中');
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
:root {
  --primary: #6366f1;
  --primary-glow: 0 0 20px rgba(99, 102, 241, 0.5);
  --secondary: #8b5cf6;
  --success: #10b981;
  --success-glow: 0 0 20px rgba(16, 185, 129, 0.5);
  --warning: #f59e0b;
  --danger: #ef4444;
  --dark: #0f172a;
  --darker: #020617;
  --card-bg: rgba(15, 23, 42, 0.8);
  --border: rgba(255, 255, 255, 0.1);
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
}

.omni-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--darker) 0%, var(--dark) 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
}

// 侧边栏
.omni-sidebar {
  width: 280px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);

  &.is-collapsed {
    width: 80px;

    .logo-text,
    .nav-item__label,
    .sidebar-status {
      display: none;
    }

    .logo-icon {
      justify-content: center;
      margin: 0;
    }

    .nav-item {
      justify-content: center;
      padding: 16px 0;

      .nav-item__icon {
        margin-right: 0;
      }
    }
  }
}

// Logo
.sidebar-logo {
  padding: 24px;
  border-bottom: 1px solid var(--border);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    right: 20%;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--primary), transparent);
  }

  .logo-icon {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    position: relative;

    .logo-glow {
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      background: var(--primary);
      border-radius: 12px;
      filter: blur(20px);
      opacity: 0.3;
      z-index: 0;
    }

    :deep(.omni-logo) {
      position: relative;
      z-index: 1;
    }
  }

  .logo-text {
    font-size: 24px;
    font-weight: 700;
    margin: 0;

    &__omni {
      color: var(--text-primary);
    }

    &__core {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}

// 导航
.sidebar-nav {
  padding: 24px 0;

  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    border-left: 3px solid transparent;

    &:hover {
      background: rgba(99, 102, 241, 0.1);
      border-left-color: var(--primary);
    }

    &.active {
      background: rgba(99, 102, 241, 0.15);
      border-left-color: var(--primary);

      .nav-item__icon {
        color: var(--primary);

        .nav-item__glow {
          opacity: 1;
        }
      }

      .nav-item__label {
        color: var(--text-primary);
        font-weight: 500;
      }
    }

    &__icon {
      margin-right: 16px;
      color: var(--text-muted);
      position: relative;
      transition: color 0.3s ease;

      .nav-item__glow {
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        background: var(--primary);
        border-radius: 50%;
        filter: blur(10px);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
      }
    }

    &__label {
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 400;
      transition: color 0.3s ease;
    }
  }
}

// 状态指示器
.sidebar-status {
  position: absolute;
  bottom: 24px;
  left: 0;
  right: 0;
  padding: 0 24px;

  .status-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      &.status-connected {
        background: var(--success);

        &::after {
          background: var(--success-glow);
        }
      }
    }

    .status-text {
      color: var(--text-muted);
      font-size: 12px;
    }

    .el-icon {
      margin-right: 8px;
      color: var(--text-muted);
    }
  }
}

// 主内容区
.omni-main {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  position: relative;

  .omni-sidebar.is-collapsed + & {
    margin-left: 80px;
  }
}

// 顶部导航栏
.omni-header {
  height: 64px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .collapse-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(99, 102, 241, 0.15);
      color: var(--primary);
      transform: scale(1.05);
    }
  }

  .breadcrumb {
    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        color: var(--text-muted);
        font-size: 14px;

        &.is-link {
          &:hover {
            color: var(--primary);
          }
        }
      }

      &:last-child .el-breadcrumb__inner {
        color: var(--text-primary);
        font-weight: 500;
      }
    }

    :deep(.el-breadcrumb__separator) {
      color: var(--text-muted);
      margin: 0 8px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .search-box {
    position: relative;
    width: 240px;

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }

    .search-input {
      width: 100%;
      height: 40px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0 40px 0 36px;
      color: var(--text-primary);
      font-size: 14px;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        background: rgba(255, 255, 255, 0.08);
      }

      &::placeholder {
        color: var(--text-muted);
      }
    }
  }

  .header-action {
    .action-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(99, 102, 241, 0.15);
        color: var(--primary);
        transform: scale(1.05);
      }
    }

    .notification-badge {
      :deep(.el-badge__content) {
        background: var(--danger);
        border: none;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
      }
    }
  }

  .user-menu {
    &__trigger {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(99, 102, 241, 0.15);
      }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      position: relative;
      overflow: hidden;
      border: 2px solid var(--primary);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .avatar-status {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid rgba(15, 23, 42, 0.95);

        &.status-online {
          background: var(--success);
        }
      }
    }

    .user-name {
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-arrow {
      color: var(--text-muted);
      font-size: 12px;
      transition: transform 0.3s ease;
    }

    .user-dropdown {
      background: rgba(15, 23, 42, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid var(--border) !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;

      :deep(.el-dropdown-menu__item) {
        color: var(--text-secondary);
        font-size: 14px;
        padding: 10px 16px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(99, 102, 241, 0.15) !important;
          color: var(--primary) !important;
        }

        .el-icon {
          margin-right: 8px;
        }
      }
    }
  }
}

// 页面内容
.omni-content {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

// 浮动控制按钮
.floating-controls {
  position: fixed;
  bottom: 32px;
  right: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;

  .control-btn {
    width: 56px;
    height: 56px;
    border: none;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.6);
    }

    .el-icon {
      font-size: 20px;
    }
  }
}

// 动画
.omni-fade-enter-active,
.omni-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.omni-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.omni-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

// 响应式
@media (max-width: 768px) {
  .omni-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.is-open {
      transform: translateX(0);
    }
  }

  .omni-main {
    margin-left: 0 !important;
  }

  .omni-header {
    padding: 0 16px;

    .search-box {
      width: 180px;
    }

    .user-name {
      display: none;
    }
  }

  .omni-content {
    padding: 16px;
  }

  .floating-controls {
    bottom: 24px;
    right: 24px;

    .control-btn {
      width: 48px;
      height: 48px;
    }
  }
}
</style>