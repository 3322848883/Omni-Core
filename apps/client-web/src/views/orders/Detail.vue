<template>
  <div class="order-detail-page">
    <el-page-header title="返回订单列表" @back="$router.push('/app/orders')" />

    <el-card v-loading="loading" class="detail-card">
      <template #header>
        <div class="card-header">
          <div class="order-title">
            <span class="order-no">订单号: {{ order?.orderNo }}</span>
            <el-tag :type="getStatusType(order?.status)" size="large">
              {{ getStatusText(order?.status) }}
            </el-tag>
          </div>
          <div class="order-actions">
            <el-button
              v-if="order?.status === 'pending'"
              type="primary"
              size="large"
              @click="handlePay"
            >
              立即支付
            </el-button>
            <el-button
              v-if="order?.status === 'pending'"
              type="danger"
              size="large"
              @click="handleCancel"
            >
              取消订单
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="order" class="order-content">
        <!-- Order Info -->
        <div class="section">
          <h3>订单信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="套餐名称">
              {{ order.planName }}
            </el-descriptions-item>
            <el-descriptions-item label="订单金额">
              <span class="amount">{{ formatCurrency(order.amount, order.currency) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(order.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">
              {{ order.paymentMethod ? getPaymentMethodText(order.paymentMethod) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="支付时间">
              {{ order.paidAt ? formatDate(order.paidAt) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="完成时间">
              {{ order.completedAt ? formatDate(order.completedAt) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Order Timeline -->
        <div class="section">
          <h3>订单状态</h3>
          <el-timeline>
            <el-timeline-item
              :type="order.status === 'pending' ? 'primary' : 'success'"
              :hollow="order.status === 'pending'"
              :timestamp="formatDate(order.createdAt)"
            >
              <h4>订单创建</h4>
              <p class="timeline-desc">订单已创建，等待支付</p>
            </el-timeline-item>
            <el-timeline-item
              :type="getTimelineType('paid')"
              :hollow="!isStatusReached('paid')"
              :timestamp="order.paidAt ? formatDate(order.paidAt) : ''"
            >
              <h4>订单支付</h4>
              <p class="timeline-desc">
                {{ isStatusReached('paid') ? '订单已支付' : '等待支付' }}
              </p>
            </el-timeline-item>
            <el-timeline-item
              :type="getTimelineType('completed')"
              :hollow="!isStatusReached('completed')"
              :timestamp="order.completedAt ? formatDate(order.completedAt) : ''"
            >
              <h4>订单完成</h4>
              <p class="timeline-desc">
                {{ isStatusReached('completed') ? '订单已完成，套餐已激活' : '等待处理' }}
              </p>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- Help Section -->
        <div class="section help-section">
          <h3>需要帮助？</h3>
          <p>如果您对订单有任何疑问，请联系客服支持。</p>
          <el-button type="primary" link @click="contactSupport">
            联系客服
          </el-button>
        </div>
      </div>

      <el-empty v-else description="订单不存在或已删除" />
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Wallet, ChatDotRound, CreditCard } from '@element-plus/icons-vue';
import * as orderApi from '@/api/orders';
import type { Order, OrderStatus } from '@/types/order';
import { formatDate, formatCurrency } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const order = ref<Order | null>(null);

// Pay dialog
const payDialogVisible = ref(false);
const payLoading = ref(false);
const selectedPayMethod = ref('alipay');

const getStatusType = (status?: OrderStatus): string => {
  if (!status) return 'info';
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

const getStatusText = (status?: OrderStatus): string => {
  if (!status) return '未知';
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

const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    card: '银行卡',
  };
  return methodMap[method] || method;
};

const isStatusReached = (status: OrderStatus): boolean => {
  if (!order.value) return false;
  const statusOrder: OrderStatus[] = ['pending', 'paid', 'processing', 'completed'];
  const currentIndex = statusOrder.indexOf(order.value.status);
  const targetIndex = statusOrder.indexOf(status);
  return currentIndex >= targetIndex;
};

const getTimelineType = (status: OrderStatus): string => {
  if (!order.value) return 'info';
  if (isStatusReached(status)) {
    if (order.value.status === 'failed' || order.value.status === 'cancelled') {
      return 'danger';
    }
    return 'success';
  }
  return 'info';
};

const fetchOrderDetail = async () => {
  const orderId = route.params.id as string;
  if (!orderId) {
    router.push('/app/orders');
    return;
  }

  loading.value = true;
  try {
    order.value = await orderApi.getOrderDetail(orderId);
  } catch (error) {
    ElMessage.error('获取订单详情失败');
  } finally {
    loading.value = false;
  }
};

const handlePay = () => {
  selectedPayMethod.value = 'alipay';
  payDialogVisible.value = true;
};

const confirmPay = async () => {
  if (!order.value) return;

  payLoading.value = true;
  try {
    const res = await orderApi.payOrder(order.value.id, selectedPayMethod.value);
    payDialogVisible.value = false;
    ElMessage.success('正在跳转支付页面...');
    if (res.payment_url) {
      window.open(res.payment_url, '_blank');
    }
    fetchOrderDetail();
  } finally {
    payLoading.value = false;
  }
};

const handleCancel = async () => {
  if (!order.value) return;

  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await orderApi.cancelOrder(order.value.id);
    ElMessage.success('订单已取消');
    fetchOrderDetail();
  } catch (error) {
    // User cancelled
  }
};

const contactSupport = () => {
  ElMessageBox.confirm(
    `<div style="text-align: left;">
      <p><strong>客服邮箱：</strong>support@fgvpn.com</p>
      <p><strong>客服电话：</strong>400-888-8888</p>
      <p><strong>服务时间：</strong>周一至周五 9:00-18:00</p>
      <p style="margin-top: 10px; color: #909399; font-size: 12px;">
        请在邮件中提供您的订单号以便快速处理
      </p>
    </div>`,
    '联系客服',
    {
      confirmButtonText: '发送邮件',
      cancelButtonText: '关闭',
      dangerouslyUseHTMLString: true,
      type: 'info',
    }
  ).then(() => {
    window.location.href = 'mailto:support@fgvpn.com?subject=订单咨询&body=订单号: ' + (order.value?.orderNo || '');
  }).catch(() => {
    // 用户取消
  });
};

onMounted(() => {
  fetchOrderDetail();
});
</script>

<style scoped lang="scss">
.order-detail-page {
  .detail-card {
    margin-top: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

      .order-title {
        display: flex;
        align-items: center;
        gap: 16px;

        .order-no {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }
      }

      .order-actions {
        display: flex;
        gap: 12px;
      }
    }

    .order-content {
      .section {
        margin-bottom: 32px;

        h3 {
          margin-bottom: 16px;
          color: #303133;
          font-size: 16px;
          font-weight: 600;
          padding-left: 12px;
          border-left: 4px solid #409eff;
        }

        .amount {
          font-weight: 600;
          color: #f56c6c;
          font-size: 16px;
        }
      }

      .el-timeline {
        padding-left: 20px;

        h4 {
          margin: 0 0 4px 0;
          color: #303133;
          font-weight: 600;
        }

        .timeline-desc {
          margin: 0;
          color: #909399;
          font-size: 14px;
        }
      }

      .help-section {
        background-color: #f5f7fa;
        padding: 20px;
        border-radius: 8px;

        h3 {
          border-left: none;
          padding-left: 0;
          margin-bottom: 8px;
        }

        p {
          color: #606266;
          margin-bottom: 12px;
        }
      }
    }
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
}
</style>
