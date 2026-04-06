<template>
  <header class="app-header">
    <div class="header-left">
      <slot name="left">
        <el-button
          v-if="showMenuToggle"
          text
          @click="emit('toggle-menu')"
        >
          <el-icon :size="20"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
        </el-button>
        <breadcrumb v-if="showBreadcrumb" />
      </slot>
    </div>
    <div class="header-right">
      <slot name="right">
        <el-tooltip content="通知" placement="bottom">
          <el-badge :value="unreadCount" :hidden="!unreadCount" class="header-item">
            <el-button text @click="emit('show-notifications')">
              <el-icon :size="18"><Bell /></el-icon>
            </el-button>
          </el-badge>
        </el-tooltip>

        <el-tooltip content="主题切换" placement="bottom">
          <el-button text @click="toggleTheme">
            <el-icon :size="18"><Sunny v-if="isDark" /><Moon v-else /></el-icon>
          </el-button>
        </el-tooltip>

        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" :src="userStore.currentUser?.avatar" />
            <span class="username">{{ displayName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>个人中心
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>账户设置
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import {
  Fold,
  Expand,
  Bell,
  Sunny,
  Moon,
  ArrowDown,
  User,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue';
import Breadcrumb from './Breadcrumb.vue';

interface Props {
  collapsed?: boolean;
  showMenuToggle?: boolean;
  showBreadcrumb?: boolean;
  unreadCount?: number;
}

withDefaults(defineProps<Props>(), {
  collapsed: false,
  showMenuToggle: true,
  showBreadcrumb: true,
  unreadCount: 0,
});

const emit = defineEmits<{
  'toggle-menu': [];
  'show-notifications': [];
}>();

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

// 统一的用户名显示（带 fallback）
const displayName = computed(() => {
  const user = userStore.currentUser || userStore.userInfo;
  if (user?.username) return user.username;
  if (user?.email) return user.email.split('@')[0];
  return '用户';
});

const isDark = computed(() => document.documentElement.classList.contains('dark'));

const toggleTheme = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark.value ? 'light' : 'dark');
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/app/profile');
      break;
    case 'settings':
      router.push('/app/profile/settings');
      break;
    case 'logout':
      authStore.logout();
      router.push('/');
      break;
  }
};
</script>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .header-item {
      margin-right: 8px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      .username {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}
</style>
