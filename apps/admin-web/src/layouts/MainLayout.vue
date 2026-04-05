<template>
  <el-container class="main-layout">
    <!-- Sidebar -->
    <el-aside :width="isCollapse ? '64px' : '240px'" class="sidebar">
      <div class="logo">
        <OmniCoreLogo :size="isCollapse ? 40 : 50" v-if="!isCollapse" />
        <span v-else class="logo-text">OC</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="var(--cyber-bg-secondary)"
        text-color="var(--cyber-text-secondary)"
        active-text-color="var(--cyber-accent-blue)"
      >
        <el-menu-item v-for="route in menuRoutes" :key="route.path" :index="route.path">
          <el-icon class="menu-icon">
            <component :is="route.meta?.icon" />
          </el-icon>
          <template #title>{{ route.meta?.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <breadcrumb />
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              {{ authStore.userInfo?.username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="cyber-dropdown">
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@stores/auth';
import Breadcrumb from '@components/Breadcrumb.vue';
import OmniCoreLogo from '@components/OmniCoreLogo.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isCollapse = ref(false);

const menuRoutes = computed(() => {
  return route.matched[0]?.children?.filter(r => !r.meta?.hidden) || [];
});

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/settings');
      break;
    case 'logout':
      authStore.logout();
      router.push('/login');
      break;
  }
};
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  background: linear-gradient(135deg, var(--cyber-bg-primary) 0%, var(--cyber-bg-secondary) 100%);
}

.sidebar {
  background-color: var(--cyber-bg-secondary);
  transition: width 0.3s;
  border-right: var(--cyber-border);

  .logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cyber-text-primary);
    font-size: 20px;
    font-weight: bold;
    border-bottom: var(--cyber-border);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.2), transparent);
      animation: shine 3s infinite;
    }

    .logo-text {
      font-size: 14px;
      letter-spacing: 2px;
      background: linear-gradient(135deg, var(--cyber-accent-blue) 0%, var(--cyber-accent-purple) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
    }
  }

  .el-menu {
    border-right: none;
    background-color: transparent !important;

    .el-menu-item {
      transition: all 0.3s ease;
      border-left: 3px solid transparent;

      &:hover {
        background-color: rgba(14, 165, 233, 0.1) !important;
        border-left-color: var(--cyber-accent-blue);
      }

      &.is-active {
        background-color: rgba(14, 165, 233, 0.2) !important;
        border-left-color: var(--cyber-accent-blue);
        box-shadow: 0 0 10px rgba(14, 165, 233, 0.3);
      }

      .menu-icon {
        font-size: 18px;
        margin-right: 10px;
      }
    }
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(26, 26, 46, 0.8);
  box-shadow: 0 1px 20px rgba(14, 165, 233, 0.1);
  border-bottom: var(--cyber-border);
  backdrop-filter: blur(10px);

  .header-left {
    display: flex;
    align-items: center;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      margin-right: 15px;
      color: var(--cyber-accent-blue);
      transition: all 0.3s ease;

      &:hover {
        text-shadow: var(--cyber-neon-glow);
      }
    }
  }

  .header-right {
    .user-info {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--cyber-text-primary);
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(14, 165, 233, 0.1);
        box-shadow: 0 0 10px rgba(14, 165, 233, 0.3);
      }
    }

    .cyber-dropdown {
      background: rgba(26, 26, 46, 0.95) !important;
      border: var(--cyber-border) !important;
      box-shadow: 0 0 20px rgba(14, 165, 233, 0.2) !important;

      .el-dropdown-item {
        color: var(--cyber-text-primary) !important;

        &:hover {
          background: rgba(14, 165, 233, 0.1) !important;
        }

        &.is-disabled {
          color: var(--cyber-text-secondary) !important;
        }
      }
    }
  }
}

.main-content {
  background: rgba(10, 10, 10, 0.8);
  padding: 20px;
  overflow-y: auto;
  min-height: calc(100vh - 60px);
  backdrop-filter: blur(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  20% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}
</style>
