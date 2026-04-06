<template>
  <div class="qrcode-payment-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header title="返回" @back="handleBack" />
      <h1 class="page-title">扫码支付</h1>
    </div>

    <!-- 订单信息卡片 -->
    <el-card v-loading="loading" class="order-info-card" shadow="never">
      <div class="order-summary">
        <div class="order-item">
          <span class="label">订单编号</span>
          <span class="value order-no">{{ orderInfo?.orderNo }}</span>
        </div>
        <div class="order-item">
          <span class="label">支付方式</span>
          <span class="value">
            <el-tag :type="qrCodeInfo?.type === 'alipay' ? 'primary' : 'success'" size="small">
              {{ qrCodeInfo?.type === 'alipay' ? '支付宝' : '微信' }}
            </el-tag>
          </span>
        </div>
        <el-divider />
        <div class="order-item total">
          <span class="label">应付金额</span>
          <span class="value price">{{ formatCurrency(orderInfo?.amount || 0, orderInfo?.currency) }}</span>
        </div>
      </div>
    </el-card>

    <!-- 收款码展示 -->
    <el-card class="qrcode-display-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>收款码</span>
          <el-button type="primary" link @click="saveQRCode">
            <el-icon><Download /></el-icon>
            保存收款码
          </el-button>
        </div>
      </template>

      <div class="qrcode-container">
        <div class="qrcode-image-wrapper">
          <el-image
            :src="qrCodeInfo?.imageUrl"
            :preview-src-list="qrCodeInfo?.imageUrl ? [qrCodeInfo.imageUrl] : []"
            fit="contain"
            class="qrcode-image"
          >
            <template #error>
              <div class="qrcode-error">
                <el-icon :size="48"><Picture /></el-icon>
                <p>收款码加载失败</p>
              </div>
            </template>
          </el-image>
        </div>

        <div class="qrcode-info">
          <h4 class="qrcode-name">{{ qrCodeInfo?.name }}</h4>
          <p v-if="qrCodeInfo?.description" class="qrcode-desc">{{ qrCodeInfo.description }}</p>
        </div>

        <div class="payment-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <div class="step-title">保存收款码</div>
              <div class="step-desc">长按或点击保存按钮保存收款码</div>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <div class="step-title">打开{{ qrCodeInfo?.type === 'alipay' ? '支付宝' : '微信' }}</div>
              <div class="step-desc">使用扫一扫功能扫描收款码</div>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <div class="step-title">完成支付</div>
              <div class="step-desc">输入金额 {{ formatCurrency(orderInfo?.amount || 0, orderInfo?.currency) }} 并完成转账</div>
            </div>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <div class="step-title">上传凭证</div>
              <div class="step-desc">返回本页面上传付款截图</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 付款凭证上传 -->
    <el-card class="proof-upload-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>上传付款凭证</span>
          <el-tag v-if="proofStatus" :type="getProofStatusType(proofStatus.status)">
            {{ getProofStatusText(proofStatus.status) }}
          </el-tag>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <!-- 图片上传 -->
        <el-form-item label="付款截图" prop="proofImage">
          <el-upload
            ref="uploadRef"
            class="proof-uploader"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            :before-upload="beforeImageUpload"
            accept="image/*"
          >
            <div v-if="imagePreview" class="image-preview">
              <el-image :src="imagePreview" fit="cover" />
              <div class="image-overlay">
                <el-icon :size="24"><Edit /></el-icon>
                <span>更换图片</span>
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon :size="48"><Plus /></el-icon>
              <div class="upload-text">
                <span class="primary">点击上传付款截图</span>
                <span class="secondary">支持 JPG、PNG 格式，最大 5MB</span>
              </div>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 备注输入 -->
        <el-form-item label="转账备注（可选）" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入转账时的备注信息，如：转账单号后四位、转账时间等"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <div class="form-actions">
            <el-button size="large" @click="handleCancel">取消</el-button>
            <el-button
              type="primary"
              size="large"
              :loading="submitting"
              :disabled="!canSubmit"
              @click="handleSubmit"
            >
              提交凭证
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 状态查询 -->
    <el-card v-if="proofStatus" class="status-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>审核状态</span>
          <el-button type="primary" link :loading="checkingStatus" @click="checkStatus">
            <el-icon><Refresh /></el-icon>
            刷新状态
          </el-button>
        </div>
      </template>

      <div class="status-content">
        <el-steps :active="getStatusStep" finish-status="success" process-status="process">
          <el-step title="提交凭证" description="已上传付款截图" />
          <el-step title="等待审核" description="客服正在核实" />
          <el-step title="审核完成" :description="getFinalStepDescription" />
        </el-steps>

        <div v-if="proofStatus.reviewRemark" class="review-remark">
          <el-alert
            :title="`审核备注：${proofStatus.reviewRemark}`"
            :type="proofStatus.status === 'rejected' ? 'error' : 'info'"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </el-card>

    <!-- 帮助信息 -->
    <div class="help-section">
      <el-alert
        title="温馨提示"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>• 请确保转账金额与订单金额完全一致</p>
          <p>• 转账时建议添加备注：订单号后6位</p>
          <p>• 凭证审核通常需要 5-30 分钟</p>
          <p>• 如有问题请联系客服：support@example.com</p>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type UploadFile, type UploadRawFile } from 'element-plus';
import {
  Download,
  Picture,
  Plus,
  Edit,
  Refresh,
} from '@element-plus/icons-vue';
import * as paymentApi from '@/api/payment';
import * as orderApi from '@/api/orders';
import type { QRCode, Order, PaymentProofStatus } from '@/api/payment';
import { formatCurrency } from '@/utils/format';

const route = useRoute();
const router = useRouter();

// Refs
const formRef = ref<FormInstance>();
const uploadRef = ref<any>();

// 状态
const loading = ref(false);
const submitting = ref(false);
const checkingStatus = ref(false);
const orderInfo = ref<Order | null>(null);
const qrCodeInfo = ref<QRCode | null>(null);
const proofStatus = ref<PaymentProofStatus | null>(null);
const imagePreview = ref<string>('');
const statusCheckInterval = ref<number | null>(null);

// 表单数据
const form = ref({
  proofImage: null as File | null,
  remark: '',
});

// 表单验证规则
const rules = {
  proofImage: [
    { required: true, message: '请上传付款截图', trigger: 'change' },
  ],
};

// 计算属性：是否可以提交
const canSubmit = computed(() => {
  return form.value.proofImage !== null;
});

// 计算属性：状态步骤
const getStatusStep = computed(() => {
  if (!proofStatus.value) return 0;
  const statusMap: Record<string, number> = {
    'pending': 0,
    'submitted': 1,
    'under_review': 1,
    'approved': 2,
    'rejected': 2,
  };
  return statusMap[proofStatus.value.status] || 0;
});

// 计算属性：最终步骤描述
const getFinalStepDescription = computed(() => {
  if (!proofStatus.value) return '等待处理';
  if (proofStatus.value.status === 'approved') return '审核通过';
  if (proofStatus.value.status === 'rejected') return '审核未通过';
  return '等待处理';
});

// 获取凭证状态类型
const getProofStatusType = (status: string): any => {
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
const getProofStatusText = (status: string): string => {
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

    // 如果订单已支付或取消，跳转到结果页
    if (order.status !== 'pending') {
      router.push({
        path: '/app/payment/result',
        query: { orderId },
      });
      return;
    }
  } catch (error) {
    ElMessage.error('获取订单信息失败');
    router.push('/app/orders');
  } finally {
    loading.value = false;
  }
};

// 获取收款码信息
const fetchQRCodeInfo = async () => {
  const qrCodeId = route.query.qrCodeId as string;
  if (!qrCodeId) {
    ElMessage.error('收款码信息不存在');
    router.push('/app/orders');
    return;
  }

  try {
    const codes = await paymentApi.getQRCodes();
    const code = codes.find(c => c.id === qrCodeId);
    if (!code) {
      ElMessage.error('收款码不存在');
      router.push('/app/orders');
      return;
    }
    qrCodeInfo.value = code;
  } catch (error) {
    ElMessage.error('获取收款码信息失败');
  }
};

// 查询凭证状态
const checkProofStatus = async () => {
  if (!orderInfo.value) return;

  checkingStatus.value = true;
  try {
    const status = await paymentApi.getPaymentProofStatus(orderInfo.value.id);
    proofStatus.value = status;

    // 如果审核通过，跳转到成功页面
    if (status.status === 'approved') {
      clearInterval(statusCheckInterval.value as number);
      ElMessage.success('支付审核通过！');
      router.push({
        path: '/app/payment/result',
        query: { orderId: orderInfo.value.id },
      });
    }
  } catch (error) {
    // 忽略错误，可能是还没有提交凭证
  } finally {
    checkingStatus.value = false;
  }
};

// 处理图片选择
const handleImageChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件');
    return;
  }

  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB');
    return;
  }

  form.value.proofImage = file;

  // 生成预览
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

// 上传前验证
const beforeImageUpload = (rawFile: UploadRawFile) => {
  if (!rawFile.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件');
    return false;
  }
  if (rawFile.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB');
    return false;
  }
  return true;
};

// 保存收款码
const saveQRCode = () => {
  if (!qrCodeInfo.value?.imageUrl) {
    ElMessage.warning('收款码图片不存在');
    return;
  }

  // 创建下载链接
  const link = document.createElement('a');
  link.href = qrCodeInfo.value.imageUrl;
  link.download = `收款码_${qrCodeInfo.value.name}.png`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  ElMessage.success('收款码保存中，请检查下载');
};

// 返回
const handleBack = () => {
  if (orderInfo.value) {
    router.push({
      path: '/app/payment/methods',
      query: { orderId: orderInfo.value.id },
    });
  } else {
    router.push('/app/orders');
  }
};

// 取消
const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要取消支付吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '继续支付',
      type: 'warning',
    });

    if (orderInfo.value) {
      await orderApi.cancelOrder(orderInfo.value.id, '用户取消支付');
      ElMessage.success('订单已取消');
    }
    router.push('/app/orders');
  } catch (error) {
    // 用户取消
  }
};

// 提交凭证
const handleSubmit = async () => {
  if (!formRef.value || !orderInfo.value || !form.value.proofImage) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const result = await paymentApi.uploadPaymentProof(
        orderInfo.value.id,
        form.value.proofImage,
        form.value.remark
      );

      ElMessage.success('凭证提交成功，请等待审核');

      // 清空表单
      form.value.proofImage = null;
      form.value.remark = '';
      imagePreview.value = '';

      // 更新状态
      await checkProofStatus();

      // 开始轮询状态
      startStatusCheck();
    } catch (error) {
      ElMessage.error('提交凭证失败，请重试');
    } finally {
      submitting.value = false;
    }
  });
};

// 刷新状态
const checkStatus = () => {
  checkProofStatus();
};

// 开始状态轮询
const startStatusCheck = () => {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value);
  }

  statusCheckInterval.value = window.setInterval(() => {
    checkProofStatus();
  }, 10000); // 每10秒检查一次
};

// 停止状态轮询
const stopStatusCheck = () => {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value);
    statusCheckInterval.value = null;
  }
};

onMounted(() => {
  fetchOrderInfo();
  fetchQRCodeInfo();
  checkProofStatus();
  startStatusCheck();
});

onUnmounted(() => {
  stopStatusCheck();
});
</script>

<style scoped lang="scss">
.qrcode-payment-page {
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

.qrcode-display-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }
}

.qrcode-container {
  text-align: center;
}

.qrcode-image-wrapper {
  display: inline-block;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 16px;
  margin-bottom: 16px;

  .qrcode-image {
    width: 240px;
    height: 240px;
    border-radius: 8px;

    @media (max-width: 768px) {
      width: 200px;
      height: 200px;
    }
  }
}

.qrcode-error {
  width: 240px;
  height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 8px;

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

.qrcode-info {
  margin-bottom: 24px;

  .qrcode-name {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .qrcode-desc {
    font-size: 14px;
    color: #909399;
  }
}

.payment-steps {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;

  .step {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #409eff;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      padding-top: 4px;

      .step-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }

      .step-desc {
        font-size: 13px;
        color: #909399;
      }
    }
  }
}

.proof-upload-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }
}

.proof-uploader {
  :deep(.el-upload) {
    width: 100%;
  }
}

.upload-placeholder {
  width: 100%;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    background-color: #f5f7fa;
  }

  .el-icon {
    color: #409eff;
    margin-bottom: 16px;
  }

  .upload-text {
    text-align: center;

    .primary {
      display: block;
      font-size: 16px;
      color: #303133;
      margin-bottom: 8px;
    }

    .secondary {
      display: block;
      font-size: 13px;
      color: #909399;
    }
  }
}

.image-preview {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;

  .el-image {
    width: 100%;
    height: 100%;
  }

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    opacity: 0;
    transition: opacity 0.3s;

    span {
      margin-top: 8px;
      font-size: 14px;
    }
  }

  &:hover .image-overlay {
    opacity: 1;
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-top: 16px;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 12px;

    .el-button {
      width: 100%;
    }
  }
}

.status-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }
}

.status-content {
  padding: 20px 0;

  .review-remark {
    margin-top: 20px;
  }
}

.help-section {
  margin-top: 16px;

  :deep(.el-alert__description) {
    margin-top: 8px;

    p {
      margin: 4px 0;
      font-size: 13px;
    }
  }
}
</style>
