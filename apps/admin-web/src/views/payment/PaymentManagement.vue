<template>
  <div class="payment-management">
    <div class="payment-sidebar">
      <el-menu
        :default-active="activeMenu"
        class="payment-menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <div class="menu-header">
          <el-icon class="header-icon"><Wallet /></el-icon>
          <span class="header-title">支付管理</span>
        </div>
        
        <el-menu-item index="/payment/qrcodes">
          <el-icon><Picture /></el-icon>
          <span>收款码管理</span>
        </el-menu-item>
        
        <el-menu-item index="/payment/statistics">
          <el-icon><TrendCharts /></el-icon>
          <span>支付统计</span>
        </el-menu-item>
      </el-menu>
    </div>
    
    <div class="payment-content">
      <div class="breadcrumb-container">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>支付管理</el-breadcrumb-item>
          <el-breadcrumb-item v-if="currentRouteTitle">{{ currentRouteTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Wallet,
  TrendCharts,
  Picture,
} from '@element-plus/icons-vue';

const route = useRoute();

const activeMenu = computed(() => {
  return route.path;
});

const currentRouteTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/payment/dashboard': '仪表盘',
    '/payment/config': '支付配置',
    '/payment/qrcodes': '收款码管理',
    '/payment/orders': '订单管理',
    '/payment/statistics': '支付统计',
  };
  return titleMap[route.path] || '';
});
</script>

<style scoped lang="scss">
.payment-management {
  display: flex;
  height: 100%;
  min-height: calc(100vh - 84px);
}

.payment-sidebar {
  width: 200px;
  flex-shrink: 0;
  background-color: #304156;
  
  .payment-menu {
    border-right: none;
    height: 100%;
  }
  
  .menu-header {
    display: flex;
    align-items: center;
    padding: 20px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 8px;
    
    .header-icon {
      font-size: 24px;
      color: #409EFF;
      margin-right: 12px;
    }
    
    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    }
  }
}

.payment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  overflow: hidden;
}

.breadcrumb-container {
  padding: 16px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
}

.content-wrapper {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 页面切换动画 */
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

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .payment-management {
    flex-direction: column;
  }
  
  .payment-sidebar {
    width: 100%;
    height: auto;
    
    .payment-menu {
      display: flex;
      flex-wrap: wrap;
      
      .menu-header {
        width: 100%;
        justify-content: center;
      }
      
      :deep(.el-menu-item) {
        flex: 1;
        min-width: 120px;
        justify-content: center;
      }
    }
  }
  
  .content-wrapper {
    padding: 16px;
  }
}
</style>
