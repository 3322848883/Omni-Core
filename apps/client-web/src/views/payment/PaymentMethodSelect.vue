<template>
  <div class="payment-method-select-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header title="返回" @back="handleBack" />
      <h1 class="page-title">选择支付方式</h1>
    </div>

    <!-- 订单信息卡片 -->
    <el-card v-loading="loading" class="order-info-card" shadow="never">
      <div class="order-summary">
        <div class="order-item">
          <span class="label">订单编号</span>
          <span class="value order-no">{{ orderInfo?.orderNo }}</span>
        </div>
        <div class="order-item">
          <span class="label">套餐名称</span>
          <span class="value">{{ orderInfo?.planName }}</span>
        </div>
        <el-divider />
        <div class="order-item total">
          <span class="label">应付金额</span>
          <span class="value price">{{ formatCurrency(orderInfo?.amount || 0, orderInfo?.currency) }}</span>
        </div>
      </div>
    </el-card>

    <!-- 支付方式选择 -->
    <el-card class="payment-methods-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>选择支付方式</span>
        </div>
      </template>

      <div v-if="paymentMethods.length === 0 && !loadingMethods" class="empty-methods">
        <el-empty description="暂无可用支付方式" />
      </div>

      <div v-else class="payment-methods-list">
        <!-- 在线支付方式 -->
        <div v-if="onlineMethods.length > 0" class="method-section">
          <h4 class="section-title">在线支付</h4>
          <div
            v-for="method in onlineMethods"
            :key="method.id"
            class="payment-method-item"
            :class="{ active: selectedMethod === method.type, disabled: method.status !== 'active' }"
            @click="selectMethod(method)"
          >
            <div class="method-icon">
              <el-icon :size="28">
                <component :is="getMethodIcon(method.type)" />
              </el-icon>
            </div>
            <div class="method-info">
              <div class="method-name">{{ method.name }}</div>
              <div v-if="method.description" class="method-desc">{{ method.description }}</div>
            </div>
            <div class="method-check">
              <el-radio :label="method.type" :model-value="selectedMethod">
                <span class="sr-only">{{ method.name }}</span>
              </el-radio>
            </div>
          </div>
        </div>

        <!-- 个人收款码 -->
        <div v-if="qrCodeMethods.length > 0" class="method-section">
          <h4 class="section-title">个人收款码</h4>
          <div
            v-for="qrCode in qrCodeMethods"
            :key="qrCode.id"
            class="payment-method-item qrcode-method"
            :class="{ active: selectedQRCode?.id === qrCode.id }"
            @click="selectQRCode(qrCode)"
          >
            <div class="method-icon qrcode-icon">
              <el-image
                :src="qrCode.thumbnailUrl"
                :preview-src-list="[qrCode.imageUrl]"
                fit="cover"
                class="qrcode-thumbnail"
              >
                <template #error>
                  <div class="qrcode-placeholder">
                    <el-icon :size="24"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="method-info">
              <div class="method-name">{{ qrCode.name }}</div>
              <div class="method-desc">
                <el-tag size="small" :type="qrCode.type === 'alipay' ? 'primary' : 'success'">
                  {{ qrCode.type === 'alipay' ? '支付宝' : '微信' }}
                </el-tag>
                <span v-if="qrCode.description" class="qrcode-desc">{{ qrCode.description }}</span>
              </div>
            </div>
            <div class="method-check">
              <el-radio :label="qrCode.id" :model-value="selectedQRCode?.id">
                <span class="sr-only">{{ qrCode.name }}</span>
              </el-radio>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="payment-actions">
        <el-button size="large" @click="handleCancel">取消订单</el-button>
        <el-button
          type="primary"
          size="large"
          :loading="processing"
          :disabled="!canProceed"
          @click="handleProceed"
        >
          {{ getProceedButtonText }}
        </el-button>
      </div>
    </el-card>

    <!-- 安全提示 -->
    <div class="security-tips">
      <el-alert
        title="安全支付提示"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>• 请确保支付金额与订单金额一致</p>
          <p>• 使用个人收款码支付后，请上传付款凭证</p>
          <p>• 如遇支付问题，请联系客服处理</p>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Wallet,
  ChatDotRound,
  CreditCard,
  Money,
  Picture,
} from '@element-plus/icons-vue';
import * as paymentApi from '@/api/payment';
import * as orderApi from '@/api/orders';
import type { PaymentMethod, QRCode, Order } from '@/api/payment';
import { formatCurrency } from '@/utils/format';

const route = useRoute();
const router = useRouter();

// 状态
const loading = ref(false);
const loadingMethods = ref(false);
const processing = ref(false);
const orderInfo = ref<Order | null>(null);
const paymentMethods = ref<PaymentMethod[]>([]);
const qrCodes = ref<QRCode[]>([]);
const selectedMethod = ref<string>('');
const selectedQRCode = ref<QRCode | null>(null);

// 计算属性：在线支付方式
const onlineMethods = computed(() => {
  return paymentMethods.value.filter(m => m.type !== 'qrcode');
});

// 计算属性：个人收款码
const qrCodeMethods = computed(() => {
  return qrCodes.value.filter(q => q.status === 'active');
});

// 计算属性：是否可以继续
const canProceed = computed(() => {
  if (!selectedMethod.value) return false;
  if (selectedMethod.value === 'qrcode' && !selectedQRCode.value) return false;
  return true;
});

// 计算属性：继续按钮文本
const getProceedButtonText = computed(() => {
  if (selectedMethod.value === 'qrcode') {
    return '前往扫码支付';
  }
  return '立即支付';
});

// 获取支付方式图标
const getMethodIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    alipay: Wallet,
    wechat: ChatDotRound,
    paypal: Money,
    stripe: CreditCard,
  };
  return iconMap[type] || Wallet;
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
    if (order.status !== 'pending') {
      ElMessage.warning('该订单状态不允许支付');
      router.push(`/app/orders/${orderId}`);
      return;
    }
    orderInfo.value = order as Order;
  } catch (error) {
    ElMessage.error('获取订单信息失败');
    router.push('/app/orders');
  } finally {
    loading.value = false;
  }
};

// 获取支付方式列表
const fetchPaymentMethods = async () => {
  loadingMethods.value = true;
  try {
    const [methods, codes] = await Promise.all([
      paymentApi.getPaymentMethods(),
      paymentApi.getQRCodes(),
    ]);
    paymentMethods.value = methods;
    qrCodes.value = codes;
  } catch (error) {
    ElMessage.error('获取支付方式失败');
  } finally {
    loadingMethods.value = false;
  }
};

// 选择支付方式
const selectMethod = (method: PaymentMethod) => {
  if (method.status !== 'active') return;
  selectedMethod.value = method.type;
  if (method.type !== 'qrcode') {
    selectedQRCode.value = null;
  }
};

// 选择收款码
const selectQRCode = (qrCode: QRCode) => {
  selectedMethod.value = 'qrcode';
  selectedQRCode.value = qrCode;
};

// 返回
const handleBack = () => {
  if (orderInfo.value) {
    router.push(`/app/orders/${orderInfo.value.id}`);
  } else {
    router.push('/app/orders');
  }
};

// 取消订单
const handleCancel = async () => {
  if (!orderInfo.value) return;

  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await orderApi.cancelOrder(orderInfo.value.id, '用户取消支付');
    ElMessage.success('订单已取消');
    router.push('/app/orders');
  } catch (error) {
    // 用户取消
  }
};

// 继续支付
const handleProceed = async () => {
  if (!orderInfo.value || !canProceed.value) return;

  // 个人收款码支付，跳转到扫码页面
  if (selectedMethod.value === 'qrcode' && selectedQRCode.value) {
    router.push({
      path: '/app/payment/qrcode',
      query: {
        orderId: orderInfo.value.id,
        qrCodeId: selectedQRCode.value.id,
      },
    });
    return;
  }

  // 在线支付
  processing.value = true;
  try {
    const paymentInfo = await orderApi.payOrder(orderInfo.value.id, selectedMethod.value);

    if (paymentInfo.payment_url) {
      window.open(paymentInfo.payment_url, '_blank');
    }

    // 跳转到支付结果页面
    router.push({
      path: '/app/payment/result',
      query: {
        orderId: orderInfo.value.id,
        method: selectedMethod.value,
      },
    });
  } catch (error) {
    ElMessage.error('发起支付失败');
  } finally {
    processing.value = false;
  }
};

onMounted(() => {
  fetchOrderInfo();
  fetchPaymentMethods();
});
</script>

<style scoped lang="scss">
.payment-method-select-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f5f7fa;

  @media (max-width: 768px) {
    padding: 12px;
  }
}

.page-header {
  margin-bottom: 20px;

  .page-title {
    margin-top: 16px;
    font-size: 24px;
    font-weight: 600;
    color: #303133;

    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
}

.order-info-card {
  margin-bottom: 16px;

  .order-summary {
    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;

      &.total {
        padding-top: 16px;

        .label {
          font-size: 16px;
          font-weight: 600;
        }

        .price {
          color: #f56c6c;
          font-size: 24px;
          font-weight: 700;

          @media (max-width: 768px) {
            font-size: 20px;
          }
        }
      }

      .label {
        color: #606266;
        font-size: 14px;
      }

      .value {
        color: #303133;
        font-size: 14px;

        &.order-no {
          font-family: monospace;
          font-weight: 500;
        }
      }
    }
  }
}

.payment-methods-card {
  margin-bottom: 16px;

  .card-header {
    font-weight: 600;
    font-size: 16px;
  }
}

.empty-methods {
  padding: 40px 0;
}

.payment-methods-list {
  .method-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 12px;
    font-weight: 500;
  }
}

.payment-method-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;

  &:hover:not(.disabled) {
    border-color: #c0c4cc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.active {
    border-color: #409eff;
    background-color: #f0f9ff;
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f5f7fa;
  }

  .method-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    color: #409eff;

    &.qrcode-icon {
      background-color: transparent;
      overflow: hidden;
    }
  }

  .qrcode-thumbnail {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }

  .qrcode-placeholder {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
    color: #909399;
  }

  .method-info {
    flex: 1;
    min-width: 0;

    .method-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .method-desc {
      font-size: 13px;
      color: #909399;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .qrcode-desc {
        color: #606266;
      }
    }
  }

  .method-check {
    margin-left: 12px;
  }
}

.payment-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 12px;

    .el-button {
      width: 100%;
    }
  }
}

.security-tips {
  margin-top: 16px;

  :deep(.el-alert__description) {
    margin-top: 8px;

    p {
      margin: 4px 0;
      font-size: 13px;
    }
  }
}

// 辅助类
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
