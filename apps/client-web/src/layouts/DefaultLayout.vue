<template>
  <div class="quantum-layout">
    <!-- 左侧导航面板 -->
    <nav class="nav-panel">
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-glow"></div>
          <div class="logo-core">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="url(#gradient1)" stroke-width="2"/>
              <path d="M12 20L18 26L28 14" stroke="url(#gradient1)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00FFFF"/>
                  <stop offset="50%" stop-color="#8B5CF6"/>
                  <stop offset="100%" stop-color="#F472B6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <h1 class="brand-name">
          <span class="brand-omni">OMNI</span>
          <span class="brand-core">CORE</span>
        </h1>
      </div>

      <div class="nav-items">
        <div
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: currentRoute === item.route }"
          @click="navigateTo(item.route)"
        >
          <div class="nav-icon">
            <component :is="item.icon" />
            <div class="nav-glow" v-if="currentRoute === item.route"></div>
          </div>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </div>

      <div class="status-bar">
        <div class="status-item">
          <div class="status-dot" :class="connectionStatus.class"></div>
          <span>{{ connectionStatus.text }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">运行时间</span>
          <span class="status-value">{{ uptime }}</span>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-area">
      <!-- 顶部状态栏 -->
      <header class="top-bar">
        <div class="top-left">
          <div class="greeting">
            <span class="greeting-emoji">👋</span>
            <span class="greeting-text">欢迎回来，</span>
            <span class="username">{{ userStore.userInfo?.username || '旅行者' }}</span>
          </div>
        </div>

        <div class="top-right">
          <div class="search-container">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="搜索节点、套餐..." class="search-input" />
          </div>

          <button class="icon-button" @click="toggleNotifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notification-badge">3</span>
          </button>

          <button class="icon-button" @click="toggleSettings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          <div class="user-avatar" @click="toggleUserMenu">
            <img
              v-if="userStore.userInfo?.avatar"
              :src="userStore.userInfo.avatar"
              :alt="userStore.userInfo.username"
            />
            <div v-else class="avatar-placeholder">
              {{ (userStore.userInfo?.username || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="avatar-ring"></div>
          </div>
        </div>
      </header>

      <!-- 内容区域 -->
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="page-transition" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 快速访问浮动按钮 -->
    <div class="floating-actions">
      <button class="quick-action primary" @click="quickConnect">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        <span>快速连接</span>
      </button>
      <button class="quick-action secondary" @click="speedTest">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const currentRoute = computed(() => route.path);
const uptime = ref('12h 34m');

const navItems = [
  { id: 'dashboard', route: '/app', label: '控制中心', icon: 'DashboardIcon' },
  { id: 'nodes', route: '/app/nodes', label: '节点网络', icon: 'NodesIcon' },
  { id: 'subscription', route: '/app/subscription', label: '订阅管理', icon: 'SubscriptionIcon' },
  { id: 'traffic', route: '/app/traffic', label: '流量分析', icon: 'TrafficIcon' },
  { id: 'orders', route: '/app/orders', label: '交易记录', icon: 'OrdersIcon' },
  { id: 'invite', route: '/app/invite', label: '邀请计划', icon: 'InviteIcon' },
  { id: 'profile', route: '/app/profile', label: '个人档案', icon: 'ProfileIcon' }
];

const connectionStatus = computed(() => ({
  text: '已连接',
  class: 'connected'
}));

const DashboardIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="9" rx="1"/>
      <rect x="14" y="3" width="7" height="5" rx="1"/>
      <rect x="14" y="12" width="7" height="9" rx="1"/>
      <rect x="3" y="16" width="7" height="5" rx="1"/>
    </svg>
  `
};

const NodesIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="5" cy="12" r="3"/>
      <circle cx="19" cy="12" r="3"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <circle cx="12" cy="5" r="3"/>
      <line x1="12" y1="8" x2="12" y2="9"/>
      <circle cx="12" cy="19" r="3"/>
      <line x1="12" y1="15" x2="12" y2="16"/>
    </svg>
  `
};

const SubscriptionIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 10h20"/>
    </svg>
  `
};

const TrafficIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 3v18h18"/>
      <path d="M18 17V9"/>
      <path d="M13 17V5"/>
      <path d="M8 17v-3"/>
    </svg>
  `
};

const OrdersIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  `
};

const InviteIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  `
};

const ProfileIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `
};

const navigateTo = (path: string) => {
  router.push(path);
};

const toggleNotifications = () => {
  ElMessage.info('通知面板即将推出');
};

const toggleSettings = () => {
  ElMessage.info('设置面板即将推出');
};

const toggleUserMenu = () => {
  ElMessage.info('用户菜单即将推出');
};

const quickConnect = () => {
  ElMessage.success('正在连接最优节点...');
};

const speedTest = () => {
  ElMessage.info('开始测速...');
};

let uptimeTimer: number;
const updateUptime = () => {
  const hours = Math.floor(Date.now() / 3600000) % 24;
  const minutes = Math.floor(Date.now() / 60000) % 60;
  uptime.value = `${hours}h ${minutes}m`;
};

onMounted(() => {
  uptimeTimer = window.setInterval(updateUptime, 60000);
  updateUptime();
});

onUnmounted(() => {
  clearInterval(uptimeTimer);
});
</script>

<style scoped lang="scss">
.quantum-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  z-index: 10;
}

// 导航面板
.nav-panel {
  width: 280px;
  background: linear-gradient(180deg, rgba(10, 10, 20, 0.95) 0%, rgba(5, 5, 15, 0.98) 100%);
  border-right: 1px solid rgba(0, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  backdrop-filter: blur(20px);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, transparent, rgba(0, 255, 255, 0.5), transparent);
    animation: border-pulse 3s ease-in-out infinite;
  }
}

@keyframes border-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.logo-section {
  margin-bottom: 40px;
}

.logo-container {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.logo-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: linear-gradient(135deg, #00FFFF, #8B5CF6, #F472B6);
  border-radius: 20px;
  filter: blur(20px);
  opacity: 0.4;
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

.logo-core {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 40px;
    height: 40px;
  }
}

.brand-name {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 4px;
  margin: 0;
}

.brand-omni {
  color: #E5E7EB;
}

.brand-core {
  background: linear-gradient(135deg, #00FFFF 0%, #8B5CF6 50%, #F472B6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

// 导航项目
.nav-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    background: rgba(0, 255, 255, 0.08);

    .nav-icon {
      color: #00FFFF;
    }
  }

  &.active {
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);

    .nav-icon {
      color: #00FFFF;
    }

    .nav-label {
      color: #FFFFFF;
      font-weight: 600;
    }
  }
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: #9CA3AF;
  position: relative;
  transition: color 0.3s ease;

  .nav-glow {
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: #00FFFF;
    border-radius: 50%;
    filter: blur(8px);
    opacity: 0.5;
  }

  svg {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
  }
}

.nav-label {
  font-size: 14px;
  color: #9CA3AF;
  font-weight: 500;
  transition: all 0.3s ease;
}

// 状态栏
.status-bar {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: relative;

    &.connected {
      background: #10B981;

      &::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: #10B981;
        border-radius: 50%;
        filter: blur(4px);
        animation: status-pulse 2s ease-in-out infinite;
      }
    }
  }

  span:not(.status-label):not(.status-value) {
    font-size: 13px;
    color: #D1D5DB;
    font-weight: 500;
  }

  .status-label {
    font-size: 11px;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .status-value {
    font-size: 14px;
    color: #00FFFF;
    font-weight: 600;
    font-family: 'SF Mono', monospace;
  }
}

@keyframes status-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0; }
}

// 主内容区
.main-area {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

// 顶部栏
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  background: linear-gradient(180deg, rgba(5, 5, 15, 0.8) 0%, rgba(5, 5, 15, 0.4) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 50;
}

.top-left {
  display: flex;
  align-items: center;
}

.greeting {
  display: flex;
  align-items: center;
  gap: 8px;
}

.greeting-emoji {
  font-size: 24px;
}

.greeting-text {
  color: #9CA3AF;
  font-size: 16px;
}

.username {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #00FFFF 0%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-container {
  position: relative;
  width: 280px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #6B7280;
}

.search-input {
  width: 100%;
  height: 44px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0 16px 0 42px;
  color: #E5E7EB;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(0, 255, 255, 0.4);
    background: rgba(0, 255, 255, 0.05);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
  }

  &::placeholder {
    color: #6B7280;
  }
}

.icon-button {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #9CA3AF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 255, 0.1);
    border-color: rgba(0, 255, 255, 0.3);
    color: #00FFFF;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #EF4444;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  overflow: hidden;

  img,
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, #00FFFF 0%, #8B5CF6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 18px;
  }

  .avatar-ring {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid transparent;
    border-radius: 14px;
    background: linear-gradient(135deg, #00FFFF, #8B5CF6, #F472B6) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .avatar-ring {
    opacity: 1;
  }
}

// 内容区域
.content-area {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

// 页面过渡
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

// 浮动操作
.floating-actions {
  position: fixed;
  bottom: 32px;
  right: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  svg {
    width: 20px;
    height: 20px;
  }

  &.primary {
    background: linear-gradient(135deg, #00FFFF 0%, #8B5CF6 100%);
    color: #000;
    box-shadow: 0 8px 30px rgba(0, 255, 255, 0.3);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 255, 255, 0.4);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.08);
    color: #00FFFF;
    border: 1px solid rgba(0, 255, 255, 0.2);
    padding: 16px;

    &:hover {
      background: rgba(0, 255, 255, 0.15);
      transform: translateY(-2px);
    }
  }
}

// 响应式
@media (max-width: 1024px) {
  .nav-panel {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .main-area {
    margin-left: 0;
  }

  .top-bar {
    padding: 16px 20px;
  }

  .search-container {
    width: 200px;
  }

  .content-area {
    padding: 20px;
  }

  .floating-actions {
    bottom: 20px;
    right: 20px;
  }
}

@media (max-width: 640px) {
  .greeting-text {
    display: none;
  }

  .search-container {
    display: none;
  }

  .quick-action span {
    display: none;
  }
}
</style>