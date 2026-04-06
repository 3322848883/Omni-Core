<template>
  <div class="pending-confirmation-orders">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">待确认订单</span>
            <el-tag type="warning" class="count-tag">{{ total }} 个待处理</el-tag>
          </div>
          <el-button @click="goBack">返回订单列表</el-button>
        </div>
      </template>

      <!-- Search Form -->
      <el-form :model="queryForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="订单号/用户名/邮箱"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="queryForm.paymentMethod" placeholder="全部" clearable style="width: 150px">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table :data="orderList" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="planName" label="套餐" width="150" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold;">
              {{ row.amount.toFixed(2) }} {{ row.currency }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="120">
          <template #default="{ row }">
            {{ getPaymentMethodText(row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column label="付款凭证" width="120" align="center">
          <template #default="{ row }">
            <div class="proof-thumbnail" @click="handleViewProof(row)">
              <el-image
                v-if="row.paymentProofUrl"
                :src="row.paymentProofUrl"
                fit="cover"
                class="thumbnail-image"
                :preview-src-list="[]"
              >
                <template #error>
                  <div class="thumbnail-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-proof">
                <el-icon><Picture /></el-icon>
                <span>无凭证</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="userRemark" label="用户备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="submittedAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="success" link @click="handleConfirm(row)">确认收款</el-button>
            <el-button type="danger" link @click="handleReject(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Order Detail Dialog -->
    <el-dialog v-model="detailVisible" title="订单详情" width="700px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag type="warning">待确认</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentOrder.email }}</el-descriptions-item>
        <el-descriptions-item label="套餐">{{ currentOrder.planName }}</el-descriptions-item>
        <el-descriptions-item label="流量限制">{{ formatTraffic(currentOrder.trafficLimit) }}</el-descriptions-item>
        <el-descriptions-item label="时长">{{ currentOrder.duration }} 天</el-descriptions-item>
        <el-descriptions-item label="金额">
          <span style="color: #F56C6C; font-weight: bold;">
            {{ currentOrder.amount.toFixed(2) }} {{ currentOrder.currency }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ getPaymentMethodText(currentOrder.paymentMethod) }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ currentOrder.submittedAt }}</el-descriptions-item>
        <el-descriptions-item label="用户备注" :span="2">
          {{ currentOrder.userRemark || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="付款凭证" :span="2">
          <div v-if="currentOrder.paymentProofUrl" class="detail-proof-image" @click="handleViewProof(currentOrder)">
            <el-image
              :src="currentOrder.paymentProofUrl"
              fit="contain"
              class="proof-preview"
            >
              <template #error>
                <div class="image-error">图片加载失败</div>
              </template>
            </el-image>
            <div class="click-tip">点击查看大图</div>
          </div>
          <span v-else>无凭证</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="danger" @click="handleReject(currentOrder!)">拒绝收款</el-button>
        <el-button type="success" @click="handleConfirm(currentOrder!)">确认收款</el-button>
      </template>
    </el-dialog>

    <!-- Confirm Payment Dialog -->
    <el-dialog
      v-model="confirmVisible"
      title="确认收款"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="confirm-dialog-content">
        <p>确定要确认订单 <strong>{{ confirmOrder?.orderNo }}</strong> 的收款吗？</p>
        <el-form :model="confirmForm" label-width="80px">
          <el-form-item label="备注">
            <el-input
              v-model="confirmForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注（可选）"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="success" :loading="confirmLoading" @click="submitConfirm">确认收款</el-button>
      </template>
    </el-dialog>

    <!-- Reject Payment Dialog -->
    <el-dialog
      v-model="rejectVisible"
      title="拒绝收款"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="reject-dialog-content">
        <el-alert
          title="拒绝后订单将退回给用户，用户可以重新提交付款凭证"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form :model="rejectForm" label-width="80px" :rules="rejectRules" ref="rejectFormRef">
          <el-form-item label="订单号">
            <span>{{ rejectOrder?.orderNo }}</span>
          </el-form-item>
          <el-form-item label="拒绝原因" prop="reason">
            <el-input
              v-model="rejectForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入拒绝原因，将告知给用户"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="submitReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- Payment Proof Dialog -->
    <PaymentProofDialog ref="paymentProofDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import PaymentProofDialog from './PaymentProofDialog.vue';
import {
  getPendingConfirmationOrders,
  confirmOrderPayment,
  rejectOrderPayment,
} from '@api/orders';
import type { PendingConfirmationOrder, PendingOrderQuery } from '../../types/order';

const router = useRouter();
const loading = ref(false);
const orderList = ref<PendingConfirmationOrder[]>([]);
const total = ref(0);
const dateRange = ref<[Date, Date] | null>(null);
const detailVisible = ref(false);
const currentOrder = ref<PendingConfirmationOrder | null>(null);
const paymentProofDialogRef = ref<InstanceType<typeof PaymentProofDialog>>();

// Confirm dialog
const confirmVisible = ref(false);
const confirmLoading = ref(false);
const confirmOrder = ref<PendingConfirmationOrder | null>(null);
const confirmForm = reactive({
  remark: '',
});

// Reject dialog
const rejectVisible = ref(false);
const rejectLoading = ref(false);
const rejectOrder = ref<PendingConfirmationOrder | null>(null);
const rejectFormRef = ref<FormInstance>();
const rejectForm = reactive({
  reason: '',
});
const rejectRules: FormRules = {
  reason: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }],
};

const queryForm = reactive<PendingOrderQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  paymentMethod: undefined,
  startDate: undefined,
  endDate: undefined,
});

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await getPendingConfirmationOrders(queryForm);
    orderList.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const getPaymentMethodText = (method: string) => {
  const map: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    bank_transfer: '银行转账',
    paypal: 'PayPal',
    credit_card: '信用卡',
    other: '其他',
  };
  return map[method] || method;
};

const formatTraffic = (bytes: number) => {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
};

const handleSearch = () => {
  queryForm.page = 1;
  fetchOrders();
};

const handleReset = () => {
  queryForm.keyword = '';
  queryForm.paymentMethod = undefined;
  queryForm.startDate = undefined;
  queryForm.endDate = undefined;
  dateRange.value = null;
  queryForm.page = 1;
  fetchOrders();
};

const handleDateChange = (val: [Date, Date] | null) => {
  if (val) {
    queryForm.startDate = val[0].toISOString().split('T')[0];
    queryForm.endDate = val[1].toISOString().split('T')[0];
  } else {
    queryForm.startDate = undefined;
    queryForm.endDate = undefined;
  }
};

const handleView = (row: PendingConfirmationOrder) => {
  currentOrder.value = row;
  detailVisible.value = true;
};

const handleViewProof = (row: PendingConfirmationOrder) => {
  if (!row.paymentProofUrl) {
    ElMessage.warning('暂无付款凭证');
    return;
  }
  paymentProofDialogRef.value?.open({
    proofUrl: row.paymentProofUrl,
    orderNo: row.orderNo,
    submitTime: row.submittedAt,
    userRemark: row.userRemark,
  });
};

const handleConfirm = (row: PendingConfirmationOrder) => {
  confirmOrder.value = row;
  confirmForm.remark = '';
  confirmVisible.value = true;
};

const submitConfirm = async () => {
  if (!confirmOrder.value) return;
  confirmLoading.value = true;
  try {
    await confirmOrderPayment(confirmOrder.value.id, confirmForm.remark);
    ElMessage.success('收款确认成功');
    confirmVisible.value = false;
    detailVisible.value = false;
    fetchOrders();
  } catch (error) {
    ElMessage.error('收款确认失败');
  } finally {
    confirmLoading.value = false;
  }
};

const handleReject = (row: PendingConfirmationOrder) => {
  rejectOrder.value = row;
  rejectForm.reason = '';
  rejectVisible.value = true;
};

const submitReject = async () => {
  if (!rejectOrder.value || !rejectFormRef.value) return;
  await rejectFormRef.value.validate(async (valid) => {
    if (valid) {
      rejectLoading.value = true;
      try {
        await rejectOrderPayment(rejectOrder.value!.id, rejectForm.reason);
        ElMessage.success('已拒绝收款');
        rejectVisible.value = false;
        detailVisible.value = false;
        fetchOrders();
      } catch (error) {
        ElMessage.error('操作失败');
      } finally {
        rejectLoading.value = false;
      }
    }
  });
};

const handleSizeChange = (size: number) => {
  queryForm.pageSize = size;
  fetchOrders();
};

const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchOrders();
};

const goBack = () => {
  router.push('/orders');
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped lang="scss">
.pending-confirmation-orders {
  min-height: calc(100vh - 120px);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .title {
        font-size: 16px;
        font-weight: 500;
      }

      .count-tag {
        font-size: 12px;
      }
    }
  }

  .proof-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
    }

    .thumbnail-image {
      width: 100%;
      height: 100%;
    }

    .thumbnail-error {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
      font-size: 20px;
    }

    .no-proof {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;
      font-size: 12px;

      .el-icon {
        font-size: 20px;
        margin-bottom: 2px;
      }
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .detail-proof-image {
    display: inline-block;
    position: relative;
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #dcdfe6;

    &:hover {
      .click-tip {
        opacity: 1;
      }
    }

    .proof-preview {
      width: 200px;
      height: 150px;
      display: block;
    }

    .click-tip {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      text-align: center;
      padding: 8px;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .image-error {
      width: 200px;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
      background: #f5f7fa;
    }
  }

  .confirm-dialog-content,
  .reject-dialog-content {
    p {
      margin-bottom: 20px;
      color: #606266;

      strong {
        color: #303133;
      }
    }
  }
}
</style>
