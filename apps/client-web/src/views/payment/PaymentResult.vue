<template>
  <div class="payment-result-page">
    <div class="result-container">
      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="6" animated />
      </div>

      <!-- 支付成功 -->
      <div v-else-if="resultStatus === 'success'" class="result-state success">
        <div class="result-icon">
          <el-icon :size="80" color="#67c23a"><CircleCheckFilled /></el-icon>
        </div>
        <h2 class="result-title">支付成功</h2>
        <p class="result-desc">您的订单已成功支付，套餐即将生效</p>

        <div class="result-details">
          <div class="detail-item">
            <span class="label">订单编号</span>
            <span class="value">{{ orderInfo?.orderNo }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付金额</span>
            <span class="value price">{{ formatCurrency(orderInfo?.amount || 0, orderInfo?.currency) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付方式</span>
            <span class="value">{{ getPaymentMethodText(orderInfo?.paymentMethod) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付时间</span>
            <span class="value">{{ formatDate(orderInfo?.paidAt) }}</span>
          </div>
        </div>

        <div class="result-actions">
          <el-button type="primary" size="large" @click="goToDashboard">
            返回仪表盘
          </el-button>
          <el-button size="large" @click="goToOrders">
            查看订单
          </el-button>
        </div>
      </div>

      <!-- 支付失败 -->
      <div v-else-if="resultStatus === 'failed'" class="result-state failed">
        <div class="result-icon">
          <el-icon :size="80" color="#f56c6c"><CircleCloseFilled /></el-icon>
        </div>
        <h2 class="result-title">支付失败</h2>
        <p class="result-desc">{{ resultMessage || '支付过程中出现问题，请重试或联系客服' }}</p>

        <div class="result-details">
          <div class="detail-item">
            <span class="label">订单编号</span>
            <span class="value">{{ orderInfo?.orderNo }}</span>
          </div>
          <div class="detail-item">
            <span class="label">失败原因</span>
            <span class="value error-text">{{ resultMessage || '支付超时或用户取消' }}</span>
          </div>
        </div>

        <div class="result-actions">
          <el-button type="primary" size="large" @click="retryPayment">
            重新支付
          </el-button>
          <el-button size="large" @click="goToOrders">
            返回订单
          </el-button>
          <el-button type="info" link size="large" @click="contactSupport">
            联系客服
          </el-button>
        </div>
      </div>

      <!-- 等待确认（个人收款码） -->
      <div v-else-if="resultStatus === 'waiting_confirmation'" class="result-state waiting">
        <div class="result-icon">
          <el-icon :size="80" color="#e6a23c"><Clock /></el-icon>
        </div>
        <h2 class="result-title">等待确认</h2>
        <p class="result-desc">您的付款凭证已提交，正在等待客服审核</p>

        <div class="result-details">
          <div class="detail-item">
            <span class="label">订单编号</span>
            <span class="value">{{ orderInfo?.orderNo }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付金额</span>
            <span class="value price">{{ formatCurrency(orderInfo?.amount || 0, orderInfo?.currency) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付方式</span>
            <span class="value">{{ getPaymentMethodText(orderInfo?.paymentMethod) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">提交时间</span>
            <span class="value">{{ formatDate(proofStatus?.submittedAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">审核状态</span>
            <span class="value">
              <el-tag :type="getProofStatusType(proofStatus?.status)">
                {{ getProofStatusText(proofStatus?.status) }}
              </el-tag>
            </span>
          </div>
        </div>

        <!-- 审核进度 -->
        <div class="progress-section">
          <el-steps :active="getStatusStep" finish-status="success" process-status="process">
            <el-step title="提交凭证" description="已上传付款截图" />
            <el-step title="等待审核" description="客服正在核实" />
            <el-step title="审核完成" description="等待结果" />
          </el-steps>
        </div>

        <div class="result-actions">
          <el-button type="primary" size="large" :loading="checkingStatus" @click="checkStatus">
            <el-icon><Refresh /></el-icon>
            刷新状态
          </el-button>
          <el-button size="large" @click="goToOrders">
            查看订单
          </el-button>
        </div>

        <div class="waiting-tips">
          <el-alert
            title="温馨提示"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>• 凭证审核通常需要 5-30 分钟</p>
              <p>• 审核通过后套餐将自动生效</p>
              <p>• 您可以随时刷新页面查看最新状态</p>
            </template>
          </el-alert>
        </div>
      </div>

      <!-- 处理中 -->
      <div v-else-if="resultStatus === 'processing'" class="result-state processing">
        <div class="result-icon">
          <el-icon :size="80" color="#409eff" class="rotating"><Loading /></el-icon>
        </div>
        <h2 class="result-title">处理中</h2>
        <p class="result-desc">正在处理您的支付，请稍候...</p>

        <div class="result-actions">
          <el-button type="primary" size="large" :loading="checkingStatus" @click="checkStatus">
            刷新状态
          </el-button>
          <el-button size="large" @click="goToOrders">
            查看订单
          </el-button>
        </div>
      </div>

      <!-- 未知状态 -->
      <div v-else class="result-state unknown">
        <div class="result-icon">
          <el-icon :size="80" color="#909399"><WarningFilled /></el-icon>
        </div>
        <h2 class="result-title">状态未知</h2>
        <p class="result-desc">无法获取支付结果，请刷新页面或联系客服</p>

        <div class="result-actions">
          <el-button type="primary" size="large" @click="checkStatus">
            刷新状态
          </el-button>
          <el-button size="large" @click="goToOrders">
            查看订单
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  CircleCheckFilled,
  CircleCloseFilled,
  Clock,
  Loading,
  WarningFilled,
  Refresh,
} from '@element-plus/icons-vue';
import * as paymentApi from '@/api/payment';
import * as orderApi from '@/api/orders';
import type { Order, PaymentProofStatus, PaymentResultStatus } from '@/api/payment';
import { formatCurrency, formatDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();

// 状态
const loading = ref(true);
const checkingStatus = ref(false);
const orderInfo = ref<Order | null>(null);
const proofStatus = ref<PaymentProofStatus | null>(null);
const resultStatus = ref<PaymentResultStatus | null>(null);
const resultMessage = ref<string>('');
const statusCheckInterval = ref<number | null>(null);

// 计算属性：状态步骤
const getStatusStep = computed(() => {
  if (!proofStatus.value) return 1;
  const statusMap: Record<string, number> = {
    'pending': 0,
    'submitted': 1,
    'under_review': 1,
    'approved': 2,
    'rejected': 2,
  };
  return statusMap[proofStatus.value.status] || 1;
});

// 获取支付方式文本
const getPaymentMethodText = (method?: string): string => {
  if (!method) return '-';
  const methodMap: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    paypal: 'PayPal',
    stripe: '信用卡/借记卡',
    qrcode: '个人收款码',
  };
  return methodMap[method] || method;
};

// 获取凭证状态类型
const getProofStatusType = (status?: string): any => {
  if (!status) return 'info';
  const typeMap: Record<string, any> = {
    'pending': 'info',
    'submitted': 'warning',
    'under_review': 'warning',
    'approved': 'success',
    'rejected': 'danger',
  };
  return typeMap[status] || 'info';
};

// 获取凭证状态文本
const getProofStatusText = (status?: string): string => {
  if (!status) return '未知';
  const textMap: Record<string, string> = {
    'pending': '未提交',
    'submitted': '已提交',
    'under_review': '审核中',
    'approved': '已通过',
    'rejected': '已拒绝',
  };
  return textMap[status] || status;
};

// 获取订单信息
const fetchOrderInfo = async () => {
  const orderId = route.query.orderId as string;
  if (!orderId) {
    ElMessage.error('订单信息不存在');
    router.push('/app/orders');
    return;
  }

  loading.value = true;
  try {
    const order = await orderApi.getOrderDetail(orderId);
    orderInfo.value = order as Order;

    // 根据订单状态确定结果状态
    determineResultStatus();
  } catch (error) {
    ElMessage.error('获取订单信息失败');
    router.push('/app/orders');
  } finally {
    loading.value = false;
  }
};

// 确定结果状态
const determineResultStatus = () => {
  if (!orderInfo.value) return;

  const order = orderInfo.value;

  // 根据订单状态映射到结果状态
  switch (order.status) {
    case 'completed':
    case 'paid':
      resultStatus.value = 'success';
      break;
    case 'failed':
      resultStatus.value = 'failed';
      resultMessage.value = '支付失败';
      break;
    case 'cancelled':
      resultStatus.value = 'failed';
      resultMessage.value = '订单已取消';
      break;
    case 'pending':
      // 如果是个人收款码支付，检查凭证状态
      if (order.paymentMethod === 'qrcode') {
        checkProofStatus();
      } else {
        resultStatus.value = 'processing';
      }
      break;
    case 'processing':
      resultStatus.value = 'processing';
      break;
    default:
      resultStatus.value = 'processing';
  }
};

// 查询凭证状态
const checkProofStatus = async () => {
  if (!orderInfo.value) return;

  checkingStatus.value = true;
  try {
    const status = await paymentApi.getPaymentProofStatus(orderInfo.value.id);
    proofStatus.value = status;

    // 根据凭证状态确定结果
    if (status.status === 'approved') {
      resultStatus.value = 'success';
      stopStatusCheck();
      // 刷新订单信息
      const order = await orderApi.getOrderDetail(orderInfo.value.id);
      orderInfo.value = order as Order;
    } else if (status.status === 'rejected') {
      resultStatus.value = 'failed';
      resultMessage.value = status.reviewRemark || '凭证审核未通过';
      stopStatusCheck();
    } else if (status.status === 'submitted' || status.status === 'under_review') {
      resultStatus.value = 'waiting_confirmation';
    } else {
      // 未提交凭证，跳转到扫码支付页面
      resultStatus.value = 'failed';
      resultMessage.value = '未找到付款凭证';
    }
  } catch (error) {
    // 如果获取凭证状态失败，可能是还没有提交
    if (orderInfo.value.paymentMethod === 'qrcode') {
      resultStatus.value = 'failed';
      resultMessage.value = '未找到付款凭证，请重新支付';
    }
  } finally {
    checkingStatus.value = false;
  }
};

// 检查支付结果
const checkPaymentResult = async () => {
  if (!orderInfo.value) return;

  checkingStatus.value = true;
  try {
    const result = await paymentApi.getPaymentResult(orderInfo.value.id);
    resultStatus.value = result.status;
    resultMessage.value = result.message || '';

    // 刷新订单信息
    const order = await orderApi.getOrderDetail(orderInfo.value.id);
    orderInfo.value = order as Order;

    // 如果支付成功或失败，停止轮询
    if (result.status === 'success' || result.status === 'failed') {
      stopStatusCheck();
    }
  } catch (error) {
    // 忽略错误
  } finally {
    checkingStatus.value = false;
  }
};

// 刷新状态
const checkStatus = () => {
  if (orderInfo.value?.paymentMethod === 'qrcode') {
    checkProofStatus();
  } else {
    checkPaymentResult();
  }
};

// 开始状态轮询
const startStatusCheck = () => {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value);
  }

  statusCheckInterval.value = window.setInterval(() => {
    checkStatus();
  }, 5000); // 每5秒检查一次
};

// 停止状态轮询
const stopStatusCheck = () => {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value);
    statusCheckInterval.value = null;
  }
};

// 导航方法
const goToDashboard = () => {
  router.push('/app');
};

const goToOrders = () => {
  router.push('/app/orders');
};

const retryPayment = () => {
  if (!orderInfo.value) return;

  if (orderInfo.value.status === 'cancelled') {
    // 如果订单已取消，需要重新创建订单
    ElMessage.info('订单已取消，请重新下单');
    router.push('/app/subscription/plans');
  } else {
    // 重新支付
    router.push({
      path: '/app/payment/methods',
      query: { orderId: orderInfo.value.id },
    });
  }
};

const contactSupport = () => {
  ElMessageBox.confirm(
    `<div style="text-align: left;">
      <p><strong>客服邮箱：</strong>support@example.com</p>
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
    window.location.href = `mailto:support@example.com?subject=支付问题咨询&body=订单号: ${orderInfo.value?.orderNo || ''}`;
  }).catch(() => {
    // 用户取消
  });
};

onMounted(() => {
  fetchOrderInfo();

  // 对于处理中的状态，开始轮询
  if (resultStatus.value === 'processing' || resultStatus.value === 'waiting_confirmation') {
    startStatusCheck();
  }
});

onUnmounted(() => {
  stopStatusCheck();
});
</script>

<style scoped lang="scss">
.payment-result-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
    align-items: flex-start;
    padding-top: 40px;
  }
}

.result-container {
  background: #fff;
  border-radius: 16px;
  padding: 48px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);

  @media (max-width: 768px) {
    padding: 32px 24px;
  }
}

.loading-state {
  padding: 40px 0;
}

.result-state {
  text-align: center;

  .result-icon {
    margin-bottom: 24px;

    .rotating {
      animation: rotate 2s linear infinite;
    }
  }

  .result-title {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #303133;

    @media (max-width: 768px) {
      font-size: 24px;
    }
  }

  .result-desc {
    font-size: 16px;
    color: #606266;
    margin-bottom: 32px;

    @media (max-width: 768px) {
      font-size: 14px;
    }
  }

  &.success {
    .result-title {
      color: #67c23a;
    }
  }

  &.failed {
    .result-title {
      color: #f56c6c;
    }
  }

  &.waiting {
    .result-title {
      color: #e6a23c;
    }
  }

  &.processing {
    .result-title {
      color: #409eff;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.result-details {
  background-color: #f5f7fa;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  text-align: left;

  @media (max-width: 768px) {
    padding: 16px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e4e7ed;

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: #606266;
      font-size: 14px;
    }

    .value {
      color: #303133;
      font-size: 14px;
      font-weight: 500;

      &.price {
        color: #f56c6c;
        font-size: 18px;
        font-weight: 600;
      }

      &.error-text {
        color: #f56c6c;
      }
    }
  }
}

.progress-section {
  margin-bottom: 32px;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding: 0;
  }
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}

.waiting-tips {
  text-align: left;

  :deep(.el-alert__description) {
    margin-top: 8px;

    p {
      margin: 4px 0;
      font-size: 13px;
    }
  }
}
</style>
