<template>
  <div class="user-subscriptions">
    <!-- Header -->
    <el-card class="header-card">
      <div class="header-content">
        <div>
          <h2>用户详情</h2>
          <p class="subtitle">查看用户详细信息、流量使用情况和订单记录</p>
        </div>
        <div class="header-actions">
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Loading State -->
    <el-skeleton :rows="5" animated v-if="loading" />

    <template v-else>
      <!-- User Info -->
      <el-card class="user-info-card">
        <template #header>
          <div class="card-header">
            <span>用户信息</span>
            <el-tag :type="getStatusType(userInfo.status)">{{ getStatusText(userInfo.status) }}</el-tag>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="用户ID">{{ userInfo.userId }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
          <el-descriptions-item label="VPN UUID">{{ userInfo.vpnUuid }}</el-descriptions-item>
          <el-descriptions-item label="到期时间">{{ formatDate(userInfo.expireDate) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(userInfo.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Traffic Stats -->
      <el-card class="traffic-card">
        <template #header>
          <div class="card-header">
            <span>流量使用情况</span>
            <el-radio-group v-model="trafficDays" size="small" @change="fetchTrafficStats">
              <el-radio-button :value="7">7天</el-radio-button>
              <el-radio-button :value="30">30天</el-radio-button>
              <el-radio-button :value="90">90天</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div class="traffic-stats">
          <div class="stat-item">
            <div class="stat-label">总流量限制</div>
            <div class="stat-value">{{ formatTraffic(trafficStats.trafficLimit) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">已用流量</div>
            <div class="stat-value used">{{ formatTraffic(trafficStats.trafficUsed) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">剩余流量</div>
            <div class="stat-value remaining">{{ formatTraffic(trafficStats.trafficRemaining) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">使用比例</div>
            <div class="stat-value">
              <el-progress :percentage="trafficStats.usagePercent" :status="getTrafficStatus(trafficStats.usagePercent)" />
            </div>
          </div>
        </div>
        <div class="traffic-detail" v-if="trafficStats.totalUpload > 0 || trafficStats.totalDownload > 0">
          <el-divider />
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="traffic-detail-item">
                <el-icon><Upload /></el-icon>
                <span>上传: {{ formatTraffic(trafficStats.totalUpload) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="traffic-detail-item">
                <el-icon><Download /></el-icon>
                <span>下载: {{ formatTraffic(trafficStats.totalDownload) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- Orders List -->
      <el-card class="orders-card">
        <template #header>
          <div class="card-header">
            <span>订单记录</span>
            <span class="order-count">共 {{ ordersTotal }} 条</span>
          </div>
        </template>
        <el-table :data="ordersList" v-loading="ordersLoading" stripe>
          <el-table-column prop="orderNo" label="订单号" width="180" />
          <el-table-column prop="orderType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getOrderTypeText(row.orderType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getOrderStatusType(row.status)" size="small">
                {{ getOrderStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="100">
            <template #default="{ row }">
              ¥{{ row.amount }}
            </template>
          </el-table-column>
          <el-table-column prop="trafficLimit" label="流量" width="120">
            <template #default="{ row }">
              {{ formatTraffic(row.trafficLimit) }}
            </template>
          </el-table-column>
          <el-table-column prop="durationDays" label="时长" width="80">
            <template #default="{ row }">
              {{ row.durationDays }}天
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="paymentMethod" label="支付方式" width="120">
            <template #default="{ row }">
              {{ getPaymentMethodText(row.paymentMethod) }}
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination" v-if="ordersTotal > 0">
          <el-pagination
            v-model:current-page="ordersPage"
            v-model:page-size="ordersPageSize"
            :total="ordersTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchOrders"
            @current-change="fetchOrders"
          />
        </div>
        <el-empty v-if="ordersList.length === 0 && !ordersLoading" description="暂无订单记录" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Upload, Download } from '@element-plus/icons-vue';
import { getUserById, getUserTraffic, getUserOrders } from '@api/users';
import type { User } from '../../types/user';

const route = useRoute();
const userId = route.params.id as string;

const loading = ref(true);
const userInfo = reactive<User & { status: number }>({
  id: '',
  userId: '',
  email: '',
  username: '',
  vpnUuid: '',
  status: 1,
  trafficLimit: 0,
  trafficUsed: 0,
  expireDate: '',
  createdAt: '',
  updatedAt: '',
});

// Traffic stats
const trafficDays = ref(30);
const trafficStats = reactive({
  trafficLimit: 0,
  trafficUsed: 0,
  trafficRemaining: 0,
  usagePercent: 0,
  totalUpload: 0,
  totalDownload: 0,
  dailyStats: [],
});

// Orders
const ordersLoading = ref(false);
const ordersList = ref([]);
const ordersTotal = ref(0);
const ordersPage = ref(1);
const ordersPageSize = ref(10);

const fetchUserInfo = async () => {
  try {
    loading.value = true;
    const data = await getUserById(userId);
    Object.assign(userInfo, data);
  } catch (error) {
    ElMessage.error('获取用户信息失败');
    console.error('Fetch user info error:', error);
  } finally {
    loading.value = false;
  }
};

const fetchTrafficStats = async () => {
  try {
    const data = await getUserTraffic(userId, { days: trafficDays.value });
    Object.assign(trafficStats, data);
  } catch (error) {
    console.error('Fetch traffic stats error:', error);
  }
};

const fetchOrders = async () => {
  try {
    ordersLoading.value = true;
    const data = await getUserOrders(userId, {
      page: ordersPage.value,
      limit: ordersPageSize.value,
    });
    ordersList.value = data.items || [];
    ordersTotal.value = data.pagination?.total || 0;
  } catch (error) {
    console.error('Fetch orders error:', error);
  } finally {
    ordersLoading.value = false;
  }
};

const formatTraffic = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(2)} TB`;
  }
  return `${gb.toFixed(2)} GB`;
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    1: 'success',
    2: 'danger',
    3: 'info',
  };
  return map[status] || 'info';
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '正常',
    2: '禁用',
    3: '已删除',
  };
  return map[status] || '未知';
};

const getTrafficStatus = (percent: number) => {
  if (percent >= 90) return 'exception';
  if (percent >= 70) return 'warning';
  return 'success';
};

const getOrderTypeText = (type: string) => {
  const map: Record<string, string> = {
    new: '新购',
    renew: '续费',
    upgrade: '升级',
  };
  return map[type] || type;
};

const getOrderStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    cancelled: 'info',
    refunded: 'danger',
  };
  return map[status] || 'info';
};

const getOrderStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款',
  };
  return map[status] || status;
};

const getPaymentMethodText = (method: string) => {
  const map: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    stripe: 'Stripe',
    paypal: 'PayPal',
  };
  return map[method] || method;
};

onMounted(() => {
  fetchUserInfo();
  fetchTrafficStats();
  fetchOrders();
});
</script>

<style scoped lang="scss">
.user-subscriptions {
  min-height: calc(100vh - 120px);

  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }

      .subtitle {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .user-info-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
  }

  .traffic-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }

    .traffic-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;

      .stat-item {
        text-align: center;
        padding: 20px;
        background: #f5f7fa;
        border-radius: 8px;

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;

          &.used {
            color: #e6a23c;
          }

          &.remaining {
            color: #67c23a;
          }

          :deep(.el-progress) {
            margin-top: 8px;
          }
        }
      }
    }

    .traffic-detail {
      margin-top: 20px;

      .traffic-detail-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 4px;
        color: #606266;
      }
    }
  }

  .orders-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;

      .order-count {
        font-size: 14px;
        color: #909399;
        font-weight: normal;
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
