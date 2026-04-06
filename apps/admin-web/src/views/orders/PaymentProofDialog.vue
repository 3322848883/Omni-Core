<template>
  <el-dialog
    v-model="visible"
    title="付款凭证"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="payment-proof-dialog">
      <!-- 付款凭证图片 -->
      <div class="proof-image-section">
        <el-image
          :src="proofUrl"
          :preview-src-list="[proofUrl]"
          fit="contain"
          class="proof-image"
        >
          <template #error>
            <div class="image-error">
              <el-icon :size="48"><Picture /></el-icon>
              <p>图片加载失败</p>
            </div>
          </template>
        </el-image>
      </div>

      <!-- 信息区域 -->
      <div class="proof-info-section">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">
            {{ orderNo }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ submitTime }}
          </el-descriptions-item>
          <el-descriptions-item label="用户备注">
            <div class="user-remark">{{ userRemark || '无备注' }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Picture } from '@element-plus/icons-vue';

interface PaymentProofDialogProps {
  proofUrl: string;
  orderNo: string;
  submitTime: string;
  userRemark?: string;
}

const visible = ref(false);
const dialogData = ref<Partial<PaymentProofDialogProps>>({});

const proofUrl = computed(() => dialogData.value.proofUrl || '');
const orderNo = computed(() => dialogData.value.orderNo || '');
const submitTime = computed(() => dialogData.value.submitTime || '');
const userRemark = computed(() => dialogData.value.userRemark || '');

const open = (data: PaymentProofDialogProps) => {
  dialogData.value = { ...data };
  visible.value = true;
};

const close = () => {
  visible.value = false;
};

defineExpose({
  open,
  close,
});
</script>

<style scoped lang="scss">
.payment-proof-dialog {
  .proof-image-section {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    background-color: #f5f7fa;
    border-radius: 8px;
    padding: 20px;
    min-height: 300px;

    .proof-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .image-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      padding: 40px;

      p {
        margin-top: 10px;
        font-size: 14px;
      }
    }
  }

  .proof-info-section {
    .user-remark {
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.6;
      color: #606266;
      min-height: 40px;
      padding: 8px 0;
    }
  }
}
</style>
