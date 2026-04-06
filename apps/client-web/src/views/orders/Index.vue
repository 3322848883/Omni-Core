<template>
  <div class="orders-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>我的订单</span>
          <el-button type="primary" @click="$router.push('/app/subscription/plans')">
            新建订单
          </el-button>
        </div>
      </template>

      <!-- Filter -->
      <div class="filter-section">
        <el-select
          v-model="filterStatus"
          placeholder="订单状态"
          clearable
          @change="handleFilterChange"
        >
          <el-option label="待支付" value="pending" />
          <el-option label="已支付" value="paid" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已失败" value="failed" />
          <el-option label="已退款" value="refunded" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </div>

      <!-- Orders Table with Virtual Scroll for large datasets -->
      <div v-if="orders.length > 50" class="virtual-list-wrapper">
        <div class="orders-header">
          <div class="header-cell order-no">订单号</div>
          <div class="header-cell plan-name">套餐</div>
          <div class="header-cell amount">金额</div>
          <div class="header-cell status">状态</div>
          <div class="header-cell created-at">创建时间</div>
          <div class="header-cell actions">操作</div>
        </div>
        <VirtualList
          :items="orders"
          :item-height="60"
          :buffer-size="5"
          container-height="500px"
          key-field="id"
        >
          <template #default="{ item: order }">
            <div class="order-row">
              <div class="cell order-no">
                <el-link type="primary" @click="viewDetail(order.id)">
                  {{ order.orderNo }}
                </el-link>
              </div>
              <div class="cell plan-name">{{ order.planName }}</div>
              <div class="cell amount">
                <span class="amount-text">{{ formatCurrency(order.amount, order.currency) }}</span>
              </div>
              <div class="cell status">
                <el-tag :type="getStatusType(order.status)" size="small">
                  {{ getStatusText(order.status) }}
                </el-tag>
              </div>
              <div class="cell created-at">{{ formatDate(order.createdAt) }}</div>
              <div class="cell actions">
                <el-button
                  v-if="order.status === 'pending'"
                  type="primary"
                  size="small"
                  @click="handlePay(order)"
                >
                  支付
                </el-button>
                <el-button
                  v-if="order.status === 'pending'"
                  type="danger"
                  size="small"
                  @click="handleCancel(order)"
                >
                  取消
                </el-button>
                <el-button
                  v-else
                  type="primary"
                  size="small"
                  link
                  @click="viewDetail(order.id)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </template>
        </VirtualList>
      </div>

      <!-- Regular Table for small datasets -->
      <el-table v-else :data="orders" stripe style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row.id)">
              {{ row.orderNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="planName" label="套餐" min-width="150" />
        <el-table-column label="金额" min-width="120">
          <template #default="{ row }">
            <span class="amount">{{ formatCurrency(row.amount, row.currency) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              size="small"
              @click="handlePay(row)"
            >
              支付
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
            <el-button
              v-else
              type="primary"
              size="small"
              link
              @click="viewDetail(row.id)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Pay Dialog -->
    <el-dialog v-model="payDialogVisible" title="选择支付方式" width="400px">
      <div class="pay-methods">
        <el-radio-group v-model="selectedPayMethod">
          <el-radio label="alipay">
            <div class="pay-method-item">
              <el-icon><Wallet /></el-icon>
              <span>支付宝</span>
            </div>
          </el-radio>
          <el-radio label="wechat">
            <div class="pay-method-item">
              <el-icon><ChatDotRound /></el-icon>
              <span>微信支付</span>
            </div>
          </el-radio>
          <el-radio label="card">
            <div class="pay-method-item">
              <el-icon><CreditCard /></el-icon>
              <span>银行卡</span>
            </div>
          </el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="payLoading" @click="confirmPay">
          确认支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Wallet, ChatDotRound, CreditCard } from '@element-plus/icons-vue';
import * as orderApi from '@/api/orders';
import type { Order, OrderStatus } from '@/types/order';
import { formatDate, formatCurrency } from '@/utils/format';
import VirtualList from '@/components/common/VirtualList.vue';
import { usePerformanceMonitor } from '@/utils/performance';

const router = useRouter();
const loading = ref(false);
const orders = ref<Order[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const filterStatus = ref<OrderStatus | ''>('');

// Pay dialog
const payDialogVisible = ref(false);
const payLoading = ref(false);
const selectedPayMethod = ref('alipay');
const currentOrder = ref<Order | null>(null);

// 性能监控
const { start: startPerformanceMonitor, stop: stopPerformanceMonitor } =
  usePerformanceMonitor({
    enabled: true,
    monitorWebVitals: true,
  });

const getStatusType = (status: OrderStatus): string => {
  const typeMap: Record<OrderStatus, string> = {
    pending: 'warning',
    paid: 'success',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    refunded: 'info',
    cancelled: 'info',
  };
  return typeMap[status] || 'info';
};

const getStatusText = (status: OrderStatus): string => {
  const textMap: Record<OrderStatus, string> = {
    pending: '待支付',
    paid: '已支付',
    processing: '处理中',
    completed: '已完成',
    failed: '已失败',
    refunded: '已退款',
    cancelled: '已取消',
  };
  return textMap[status] || status;
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    console.log('[fetchOrders] Fetching orders...');
    const res = await orderApi.getOrderList({
      page: currentPage.value,
      limit: pageSize.value,
      status: filterStatus.value || undefined,
    });
    console.log('[fetchOrders] Response:', res);
    console.log('[fetchOrders] res.items:', res?.items);
    console.log('[fetchOrders] res.pagination:', res?.pagination);
    orders.value = res?.items || [];
    total.value = res?.pagination?.total || 0;
  } catch (error) {
    console.error('[fetchOrders] Error:', error);
    orders.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchOrders();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchOrders();
};

const handleFilterChange = () => {
  currentPage.value = 1;
  fetchOrders();
};

const viewDetail = (id: string) => {
  router.push(`/orders/${id}`);
};

const handlePay = (row: Order) => {
  currentOrder.value = row;
  selectedPayMethod.value = 'alipay';
  payDialogVisible.value = true;
};

const confirmPay = async () => {
  if (!currentOrder.value) return;

  payLoading.value = true;
  try {
    const res = await orderApi.payOrder(currentOrder.value.id, selectedPayMethod.value);
    payDialogVisible.value = false;
    ElMessage.success('正在跳转支付页面...');
    // Open payment URL in new tab
    if (res.payment_url) {
      window.open(res.payment_url, '_blank');
    }
    fetchOrders();
  } finally {
    payLoading.value = false;
  }
};

const handleCancel = async (row: Order) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await orderApi.cancelOrder(row.id);
    ElMessage.success('订单已取消');
    fetchOrders();
  } catch (error) {
    // User cancelled
  }
};

onMounted(() => {
  fetchOrders();
  startPerformanceMonitor();
});

onUnmounted(() => {
  stopPerformanceMonitor();
});
</script>

<style scoped lang="scss">
.orders-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-section {
    margin-bottom: 20px;

    .el-select {
      width: 150px;
    }
  }

  .amount {
    font-weight: 600;
    color: #f56c6c;
  }

  .pagination-section {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .pay-methods {
    .el-radio-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pay-method-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 8px;

      .el-icon {
        font-size: 20px;
      }
    }
  }

  // Virtual list styles
  .virtual-list-wrapper {
    border: 1px solid #ebeef5;
    border-radius: 4px;

    .orders-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: #f5f7fa;
      border-bottom: 1px solid #ebeef5;
      font-weight: 600;
      color: #606266;

      .header-cell {
        padding: 0 8px;

        &.order-no {
          flex: 2;
          min-width: 180px;
        }

        &.plan-name {
          flex: 1.5;
          min-width: 150px;
        }

        &.amount {
          width: 120px;
        }

        &.status {
          width: 100px;
        }

        &.created-at {
          width: 160px;
        }

        &.actions {
          width: 150px;
          text-align: center;
        }
      }
    }

    .order-row {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #ebeef5;
      height: 60px;
      box-sizing: border-box;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f7fa;
      }

      .cell {
        padding: 0 8px;

        &.order-no {
          flex: 2;
          min-width: 180px;
        }

        &.plan-name {
          flex: 1.5;
          min-width: 150px;
          color: #606266;
        }

        &.amount {
          width: 120px;

          .amount-text {
            font-weight: 600;
            color: #f56c6c;
          }
        }

        &.status {
          width: 100px;
        }

        &.created-at {
          width: 160px;
          color: #909399;
          font-size: 13px;
        }

        &.actions {
          width: 150px;
          display: flex;
          gap: 8px;
          justify-content: center;
        }
      }
    }
  }
}
</style>
