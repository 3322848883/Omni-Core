<template>
  <div class="dashboard">
    <!-- 欢迎区域 - 玻璃拟态效果 -->
    <div class="dashboard-welcome glass-panel">
      <div class="welcome-content">
        <h1 class="welcome-title">
          欢迎回来，<span class="gradient-text">{{ userStore.userInfo?.username || '用户' }}</span>
        </h1>
        <p class="welcome-subtitle">这里是您的网络加速控制中心</p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" class="welcome-btn" @click="refreshData">
          <el-icon class="mr-2"><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 状态卡片 - 玻璃拟态效果 -->
    <div class="stats-grid">
      <div
        v-for="(stat, index) in stats"
        :key="stat.key"
        class="stat-card glass-card"
        :class="`stat-card--${stat.type}`"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <div class="stat-card__header">
          <div class="stat-card__icon" :style="{ background: stat.gradient }">
            <el-icon size="24">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-card__badge" v-if="stat.badge">{{ stat.badge }}</div>
        </div>
        <div class="stat-card__content">
          <div class="stat-card__value">{{ stat.value }}</div>
          <div class="stat-card__label">{{ stat.label }}</div>
        </div>
        <div class="stat-card__footer">
          <div class="stat-card__progress" v-if="stat.progress">
            <div class="stat-card__progress-bar">
              <div
                class="stat-card__progress-fill"
                :style="{ width: `${stat.progress}%`, background: stat.gradient }"
              />
            </div>
            <span class="stat-card__progress-text">{{ stat.progress }}%</span>
          </div>
          <div class="stat-card__trend" v-if="stat.trend">
            <el-icon :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">
              <ArrowUp v-if="stat.trend > 0" />
              <ArrowDown v-else />
            </el-icon>
            <span :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">
              {{ Math.abs(stat.trend) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作 - 玻璃拟态效果 -->
    <div class="quick-actions">
      <h3 class="section-title">快速操作</h3>
      <div class="actions-grid">
        <div
          v-for="(action, index) in quickActions"
          :key="action.key"
          class="action-card glass-card"
          @click="handleAction(action)"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div class="action-card__icon" :style="{ background: action.gradient }">
            <el-icon size="24">
              <component :is="action.icon" />
            </el-icon>
          </div>
          <div class="action-card__content">
            <div class="action-card__title">{{ action.title }}</div>
            <div class="action-card__desc">{{ action.desc }}</div>
          </div>
          <el-icon class="action-card__arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 订阅链接和图表 - 玻璃拟态面板 -->
    <div class="dashboard-row">
      <!-- 订阅链接 -->
      <div class="dashboard-col dashboard-col--left">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <el-icon><Link /></el-icon>
              订阅链接
            </h3>
          </div>
          <div class="panel-body">
            <div class="subscription-info">
              <div class="subscription-status">
                <div class="status-indicator" :class="subscriptionStatus.class">
                  <span class="status-dot"></span>
                  {{ subscriptionStatus.text }}
                </div>
                <div class="status-expire" v-if="userStore.userInfo?.expireDate">
                  到期时间: {{ formatDate(userStore.userInfo.expireDate) }}
                </div>
              </div>

              <div class="subscription-links">
                <div class="link-item">
                  <div class="link-item__label">订阅地址</div>
                  <div class="link-item__input">
                    <el-input
                      v-model="subscriptionUrl"
                      readonly
                      class="subscription-input"
                    >
                      <template #append>
                        <el-button @click="copyLink(subscriptionUrl)" class="copy-btn">
                          <el-icon><CopyDocument /></el-icon>
                        </el-button>
                      </template>
                    </el-input>
                  </div>
                </div>

                <div class="link-item">
                  <div class="link-item__label">二维码</div>
                  <div class="link-item__qrcode">
                    <div class="qrcode-placeholder" @click="showQRCodeDialog">
                      <el-icon size="48"><Picture /></el-icon>
                      <span>点击生成二维码</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 流量统计 -->
      <div class="dashboard-col dashboard-col--right">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3 class="panel-title">
              <el-icon><TrendCharts /></el-icon>
              流量使用
            </h3>
            <el-radio-group v-model="trafficPeriod" size="small" class="period-selector">
              <el-radio-button label="day">今日</el-radio-button>
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
            </el-radio-group>
          </div>
          <div class="panel-body">
            <div class="traffic-chart">
              <div class="traffic-summary">
                <div class="traffic-item">
                  <div class="traffic-item__label">已用流量</div>
                  <div class="traffic-item__value">{{ formatTraffic(usedTraffic) }}</div>
                </div>
                <div class="traffic-item">
                  <div class="traffic-item__label">剩余流量</div>
                  <div class="traffic-item__value">{{ formatTraffic(remainingTraffic) }}</div>
                </div>
              </div>
              <div class="traffic-chart-placeholder">
                <div class="chart-bars">
                  <div
                    v-for="(bar, index) in trafficData"
                    :key="index"
                    class="chart-bar"
                    :style="{
                      height: `${bar.value}%`,
                      background: bar.color,
                      animationDelay: `${index * 50}ms`
                    }"
                  >
                    <div class="chart-bar__tooltip">{{ bar.label }}: {{ bar.value }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近订单 - 玻璃拟态面板 -->
    <div class="recent-orders">
      <div class="panel glass-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            <el-icon><ShoppingCart /></el-icon>
            最近订单
          </h3>
          <el-button type="text" class="panel-more" @click="$router.push('/app/orders')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="panel-body">
          <el-table :data="recentOrders" class="orders-table">
            <el-table-column prop="orderNo" label="订单号" min-width="150">
              <template #default="{ row }">
                <span class="order-no">{{ row.orderNo }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="planName" label="套餐" min-width="120" />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                <span class="order-amount">¥{{ row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)" size="small" effect="dark">
                  {{ getOrderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- QR Code Dialog - 玻璃拟态效果 -->
    <el-dialog v-model="qrCodeDialogVisible" title="订阅二维码" width="360px" center class="glass-dialog">
      <div class="qrcode-dialog-content">
        <div class="qrcode-container">
          <qrcode-vue
            v-if="subscriptionUrl"
            :value="subscriptionUrl"
            :size="200"
            level="H"
            render-as="svg"
            class="qrcode-image"
          />
        </div>
        <p class="qrcode-tip">使用客户端扫描二维码快速导入订阅</p>
      </div>
      <template #footer>
        <el-button @click="qrCodeDialogVisible = false" class="cancel-btn">关闭</el-button>
        <el-button type="primary" @click="downloadQRCode" class="download-btn">
          <el-icon><Download /></el-icon>
          下载二维码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import QrcodeVue from 'qrcode.vue';
import {
  Refresh,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Link,
  TrendCharts,
  CopyDocument,
  Picture,
  ShoppingCart,
  Download
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import * as subscriptionApi from '@/api/subscription';
import * as orderApi from '@/api/orders';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const trafficPeriod = ref('week');
const subscriptionUrl = ref('https://api.fgvpn.com/subscribe/xxxxxxxxxxxx');
const qrCodeDialogVisible = ref(false);

// 统计数据
const stats = computed(() => [
  {
    key: 'traffic',
    icon: 'Download',
    label: '剩余流量',
    value: formatTraffic(userStore.userInfo?.trafficLimit || 0),
    progress: 65,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    type: 'primary'
  },
  {
    key: 'expire',
    icon: 'Timer',
    label: '剩余天数',
    value: calculateRemainingDays(userStore.userInfo?.expireDate),
    badge: '天',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    type: 'success'
  },
  {
    key: 'balance',
    icon: 'Wallet',
    label: '账户余额',
    value: `¥${userStore.userInfo?.balance || 0}`,
    trend: 12.5,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    type: 'warning'
  },
  {
    key: 'invite',
    icon: 'Share',
    label: '邀请人数',
    value: userStore.userInfo?.inviteCount || 0,
    trend: 8.3,
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    type: 'info'
  }
]);

// 快速操作
const quickActions = [
  {
    key: 'nodes',
    icon: 'MapLocation',
    title: '选择节点',
    desc: '查看可用节点列表',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    route: '/app/nodes'
  },
  {
    key: 'plans',
    icon: 'Goods',
    title: '购买套餐',
    desc: '升级您的订阅计划',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    route: '/app/subscription'
  },
  {
    key: 'invite',
    icon: 'Share',
    title: '邀请好友',
    desc: '赚取额外流量奖励',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    route: '/app/invite'
  },
  {
    key: 'traffic',
    icon: 'TrendCharts',
    title: '流量详情',
    desc: '查看详细使用统计',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    route: '/app/traffic'
  }
];

// 流量数据（模拟）
const usedTraffic = ref(35.2 * 1024 * 1024 * 1024); // 35.2 GB
const remainingTraffic = computed(() => {
  const total = (userStore.userInfo?.trafficLimit || 100) * 1024 * 1024 * 1024;
  return total - usedTraffic.value;
});

const trafficData = ref([
  { label: '周一', value: 45, color: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' },
  { label: '周二', value: 62, color: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' },
  { label: '周三', value: 38, color: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' },
  { label: '周四', value: 75, color: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' },
  { label: '周五', value: 55, color: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' },
  { label: '周六', value: 82, color: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' },
  { label: '周日', value: 48, color: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' }
]);

// 最近订单（模拟）
const recentOrders = ref([
  {
    orderNo: 'ORD202403210001',
    planName: '月度套餐',
    amount: 29.9,
    status: 'completed',
    createdAt: '2024-03-21 10:30:00'
  },
  {
    orderNo: 'ORD202403150002',
    planName: '季度套餐',
    amount: 79.9,
    status: 'paid',
    createdAt: '2024-03-15 14:20:00'
  },
  {
    orderNo: 'ORD202403100003',
    planName: '月度套餐',
    amount: 29.9,
    status: 'pending',
    createdAt: '2024-03-10 09:15:00'
  }
]);

// 订阅状态
const subscriptionStatus = computed(() => {
  const expireDate = userStore.userInfo?.expireDate;
  if (!expireDate) {
    return { text: '未激活', class: 'status-inactive' };
  }
  const days = calculateRemainingDays(expireDate);
  if (days <= 0) {
    return { text: '已过期', class: 'status-expired' };
  } else if (days <= 7) {
    return { text: '即将到期', class: 'status-warning' };
  }
  return { text: '正常使用', class: 'status-active' };
});

// 工具函数
function formatTraffic(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateRemainingDays(expireDateStr?: string | null): number {
  if (!expireDateStr) return 0;
  const expireDate = new Date(expireDateStr);
  const now = new Date();
  const diff = expireDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getOrderStatusType(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    paid: 'primary',
    completed: 'success',
    cancelled: 'info'
  };
  return statusMap[status] || 'info';
}

function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
}

function copyLink(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板');
  });
}

function showQRCodeDialog() {
  qrCodeDialogVisible.value = true;
}

function downloadQRCode() {
  const svg = document.querySelector('.qrcode-image svg');
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    const pngFile = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = 'subscription-qrcode.png';
    downloadLink.href = pngFile;
    downloadLink.click();
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function handleAction(action: any) {
  router.push(action.route);
}

function refreshData() {
  loading.value = true;
  Promise.all([
    userStore.fetchUserInfo(),
    fetchSubscriptionUrl(),
    fetchRecentOrders()
  ])
    .then(() => {
      loading.value = false;
      ElMessage.success('数据已刷新');
    })
    .catch(() => {
      loading.value = false;
      ElMessage.error('数据刷新失败，请重试');
    });
}

async function fetchSubscriptionUrl() {
  try {
    const response = await subscriptionApi.getSubscriptionUrl();
    subscriptionUrl.value = (response as unknown as { url: string }).url;
  } catch (error) {
    console.error('Failed to fetch subscription URL:', error);
  }
}

async function fetchRecentOrders() {
  try {
    const response = await orderApi.getOrderList({ page: 1, limit: 5 });
    recentOrders.value = (response as unknown as { items: typeof recentOrders.value }).items;
  } catch (error) {
    console.error('Failed to fetch recent orders:', error);
  }
}

onMounted(async () => {
  await userStore.fetchUserInfo();
  fetchSubscriptionUrl();
  fetchRecentOrders();
});
</script>

<style scoped lang="scss">
.dashboard {
  padding: var(--space-4);
}

// 玻璃拟态面板基础样式
.glass-panel {
  background: rgba(26, 26, 37, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.1);
  }
}

// 玻璃拟态卡片基础样式
.glass-card {
  background: rgba(26, 26, 37, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.1);
  }
}

// 欢迎区域
.dashboard-welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  padding: var(--space-6);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);

  .welcome-content {
    .welcome-title {
      font-size: var(--text-h3);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin-bottom: var(--space-2);

      .gradient-text {
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .welcome-subtitle {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }
  }

  .welcome-btn {
    background: var(--gradient-primary);
    border: none;
    box-shadow: var(--shadow-button);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-button-hover);
    }
  }
}

// 状态卡片网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.stat-card {
  padding: var(--space-5);
  position: relative;
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
    color: white;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }

  &__badge {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    color: var(--text-tertiary);
    background: rgba(255, 255, 255, 0.05);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-full);
  }

  &__content {
    margin-bottom: var(--space-4);
  }

  &__value {
    font-size: var(--text-data);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  &__label {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__progress {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);

    &-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    &-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 0.5s ease;
    }

    &-text {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      min-width: 35px;
    }
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);

    .trend-up {
      color: var(--color-success);
    }

    .trend-down {
      color: var(--color-danger);
    }
  }
}

// 快速操作
.quick-actions {
  margin-bottom: var(--space-6);

  .section-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-2);

    &::before {
      content: '';
      width: 4px;
      height: 20px;
      background: var(--gradient-primary);
      border-radius: 2px;
    }
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.action-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  cursor: pointer;
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.15);
    transform: translateY(-4px);

    .action-card__arrow {
      transform: translateX(4px);
      color: var(--text-brand);
    }
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }

  &__content {
    flex: 1;
  }

  &__title {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  &__desc {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  &__arrow {
    color: var(--text-tertiary);
    transition: all 0.3s ease;
  }
}

// 面板样式
.panel {
  height: 100%;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
  }

  &-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;

    .el-icon {
      color: var(--brand-primary);
    }
  }

  &-more {
    color: var(--text-tertiary);
    font-size: var(--text-sm);

    &:hover {
      color: var(--text-brand);
    }
  }

  &-body {
    padding: var(--space-6);
  }
}

// 仪表板行
.dashboard-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

// 订阅信息
.subscription-info {
  .subscription-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-5);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    &.status-active {
      color: var(--color-success);
      .status-dot {
        background: var(--color-success);
        box-shadow: 0 0 10px var(--color-success-glow);
      }
    }

    &.status-warning {
      color: var(--color-warning);
      .status-dot {
        background: var(--color-warning);
        box-shadow: 0 0 10px var(--color-warning-glow);
      }
    }

    &.status-expired {
      color: var(--color-danger);
      .status-dot {
        background: var(--color-danger);
        box-shadow: 0 0 10px var(--color-danger-glow);
      }
    }

    &.status-inactive {
      color: var(--text-muted);
      .status-dot {
        background: var(--text-muted);
      }
    }
  }

  .status-expire {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }
}

.subscription-links {
  .link-item {
    margin-bottom: var(--space-5);

    &:last-child {
      margin-bottom: 0;
    }

    &__label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
      margin-bottom: var(--space-2);
    }

    &__input {
      :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: none;

        &:hover {
          border-color: rgba(99, 102, 241, 0.3);
        }
      }

      .copy-btn {
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.2);
        color: var(--text-brand);

        &:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.3);
        }
      }
    }

    &__qrcode {
      .qrcode-placeholder {
        width: 120px;
        height: 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.03);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: var(--radius-lg);
        color: var(--text-tertiary);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--brand-primary);
          color: var(--text-brand);
          background: rgba(99, 102, 241, 0.05);
        }

        span {
          font-size: var(--text-xs);
          margin-top: var(--space-2);
        }
      }
    }
  }
}

// 时间段选择器
.period-selector {
  :deep(.el-radio-button__inner) {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--text-tertiary);

    &:hover {
      color: var(--text-secondary);
    }
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: var(--gradient-primary);
    border-color: transparent;
    box-shadow: var(--shadow-button);
  }
}

// 流量统计
.traffic-chart {
  .traffic-summary {
    display: flex;
    gap: var(--space-8);
    margin-bottom: var(--space-5);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .traffic-item {
    &__label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      margin-bottom: var(--space-1);
    }

    &__value {
      font-size: var(--text-h4);
      font-weight: var(--font-bold);
      color: var(--text-primary);
    }
  }

  .traffic-chart-placeholder {
    height: 200px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: var(--space-4);
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-lg);

    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: var(--space-3);
      height: 100%;
      width: 100%;
      justify-content: space-around;
    }

    .chart-bar {
      width: 24px;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      position: relative;
      transition: all 0.3s ease;
      animation: growUp 0.5s ease-out forwards;
      transform-origin: bottom;
      transform: scaleY(0);

      &:hover {
        filter: brightness(1.2);

        .chart-bar__tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(-8px);
        }
      }

      &__tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-4px);
        background: var(--bg-elevated);
        color: var(--text-primary);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-md);
        font-size: var(--text-xs);
        white-space: nowrap;
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
        box-shadow: var(--shadow-md);
      }
    }
  }
}

// 订单表格
.recent-orders {
  .orders-table {
    background: transparent;

    :deep(.el-table__header) {
      th {
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-primary);
        font-weight: var(--font-semibold);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
    }

    :deep(.el-table__row) {
      background: transparent;

      &:hover > td {
        background: rgba(99, 102, 241, 0.05) !important;
      }

      td {
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      }
    }

    .order-no {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .order-amount {
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }
  }
}

// 二维码弹窗
.glass-dialog {
  :deep(.el-dialog) {
    background: rgba(26, 26, 37, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-xl);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);

    .el-dialog__header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: var(--space-5) var(--space-6);
      margin-right: 0;

      .el-dialog__title {
        color: var(--text-primary);
        font-weight: var(--font-semibold);
      }
    }

    .el-dialog__body {
      padding: var(--space-6);
    }

    .el-dialog__footer {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding: var(--space-4) var(--space-6);
    }
  }
}

.qrcode-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4);

  .qrcode-container {
    padding: var(--space-4);
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--space-4);

    .qrcode-image {
      display: block;
    }
  }

  .qrcode-tip {
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    text-align: center;
    margin: 0;
  }
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
    color: var(--text-primary);
  }
}

.download-btn {
  background: var(--gradient-primary);
  border: none;
  box-shadow: var(--shadow-button);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-button-hover);
  }
}

// 动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes growUp {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard {
    padding: var(--space-3);
  }

  .dashboard-welcome {
    flex-direction: column;
    gap: var(--space-4);
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .traffic-summary {
    flex-direction: column;
    gap: var(--space-4);
  }
}
</style>
