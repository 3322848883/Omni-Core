<template>
  <div class="payment-orders">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Refresh" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 标签页导航 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部订单" name="all">
          <template #label>
            <span>全部订单</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="待确认订单" name="pending">
          <template #label>
            <span>待确认订单</span>
            <el-badge v-if="pendingCount > 0" :value="pendingCount" class="tab-badge" />
          </template>
        </el-tab-pane>
        <el-tab-pane label="已完成订单" name="completed">
          <template #label>
            <span>已完成订单</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已退款订单" name="refunded">
          <template #label>
            <span>已退款订单</span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 搜索栏 -->
      <el-form :model="queryParams" inline class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="queryParams.paymentMethod" placeholder="全部" clearable>
            <el-option label="支付宝" value="alipay">
              <el-icon class="payment-icon"><Wallet /></el-icon> 支付宝
            </el-option>
            <el-option label="微信" value="wechat">
              <el-icon class="payment-icon"><ChatDotRound /></el-icon> 微信
            </el-option>
            <el-option label="个人收款码" value="qrcode">
              <el-icon class="payment-icon"><Picture /></el-icon> 个人收款码
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="orderNo" label="订单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="user" label="用户" min-width="150">
          <template #default="{ row }">
            <div class="user-info">
              <div class="username">{{ row.username }}</div>
              <div class="email">{{ row.email }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="130">
          <template #default="{ row }">
            <div class="payment-method">
              <el-icon :size="16" :class="getPaymentIconClass(row.paymentMethod)">
                <component :is="getPaymentIcon(row.paymentMethod)" />
              </el-icon>
              <span>{{ getPaymentMethodLabel(row.paymentMethod) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleView(row)">查看详情</el-button>
            <template v-if="isPendingOrder(row)">
              <el-button type="success" link :icon="Check" @click="handleConfirm(row)">确认收款</el-button>
              <el-button type="danger" link :icon="Close" @click="handleReject(row)">拒绝</el-button>
            </template>
            <el-button
              v-else-if="canRefund(row)"
              type="warning"
              link
              :icon="CircleCloseFilled"
              @click="handleRefund(row)"
            >
              退款
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="700px" destroy-on-close>
      <el-scrollbar max-height="500px">
        <!-- 订单基本信息 -->
        <div class="detail-section">
          <div class="section-title">订单信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号" :span="2">{{ currentOrder?.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getStatusType(currentOrder?.status)" effect="dark">
                {{ getStatusLabel(currentOrder?.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(currentOrder?.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="套餐名称">{{ currentOrder?.planName }}</el-descriptions-item>
            <el-descriptions-item label="流量额度">{{ formatTraffic(currentOrder?.trafficLimit) }}</el-descriptions-item>
            <el-descriptions-item label="时长">{{ currentOrder?.duration }} 天</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 用户信息 -->
        <div class="detail-section">
          <div class="section-title">用户信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">{{ currentOrder?.username }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ currentOrder?.email }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ currentOrder?.userId }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 支付信息 -->
        <div class="detail-section">
          <div class="section-title">支付信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="支付金额">
              <span class="amount-large">¥{{ currentOrder?.amount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">
              <div class="payment-method">
                <el-icon :size="18" :class="getPaymentIconClass(currentOrder?.paymentMethod)">
                  <component :is="getPaymentIcon(currentOrder?.paymentMethod)" />
                </el-icon>
                <span>{{ getPaymentMethodLabel(currentOrder?.paymentMethod) }}</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentOrder?.paidAt" label="支付时间">
              {{ formatDateTime(currentOrder?.paidAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 个人收款码付款凭证 -->
        <div v-if="isPendingOrder(currentOrder) && currentOrder?.paymentProofUrl" class="detail-section">
          <div class="section-title">付款凭证</div>
          <div class="payment-proof">
            <el-image
              :src="currentOrder.paymentProofUrl"
              :preview-src-list="[currentOrder.paymentProofUrl]"
              fit="contain"
              class="proof-image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon :size="40"><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
          <div v-if="currentOrder?.userRemark" class="user-remark">
            <el-alert :title="`用户备注: ${currentOrder.userRemark}`" type="info" :closable="false" />
          </div>
        </div>

        <!-- 操作记录 -->
        <div v-if="currentOrder?.updatedAt !== currentOrder?.createdAt" class="detail-section">
          <div class="section-title">操作记录</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="最后更新时间">{{ formatDateTime(currentOrder?.updatedAt) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-scrollbar>

      <template #footer>
        <div class="dialog-footer">
          <template v-if="isPendingOrder(currentOrder)">
            <el-button type="danger" @click="handleReject(currentOrder)">拒绝收款</el-button>
            <el-button type="success" @click="handleConfirm(currentOrder)">确认收款</el-button>
          </template>
          <el-button v-else-if="canRefund(currentOrder)" type="warning" @click="handleRefund(currentOrder)">申请退款</el-button>
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 拒绝收款对话框 -->
    <el-dialog v-model="rejectVisible" title="拒绝收款" width="500px" destroy-on-close>
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="订单号">
          <span>{{ currentOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因，将通知给用户"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="submitReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Refresh,
  Search,
  View,
  Check,
  Close,
  ChatDotRound,
  Picture,
  Money,
  CreditCard,
  CircleCloseFilled
} from '@element-plus/icons-vue';
import {
  getOrders,
  getPendingConfirmationOrders,
  confirmOrderPayment,
  rejectOrderPayment,
  refundOrder,
  getOrderStats
} from '@/api/orders';
import type { Order, PendingConfirmationOrder } from '@/types/order';

type TabType = 'all' | 'pending' | 'completed' | 'refunded';
type OrderStatus = 1 | 2 | 3 | 4;

const loading = ref(false);
const submitting = ref(false);
const detailVisible = ref(false);
const rejectVisible = ref(false);
const activeTab = ref<TabType>('all');
const currentOrder = ref<Order | PendingConfirmationOrder | null>(null);
const total = ref(0);
const pendingCount = ref(0);

const queryParams = reactive({
  page: 1,
  limit: 10,
  orderNo: '',
  username: '',
  paymentMethod: '',
  dateRange: [] as string[],
});

const rejectForm = reactive({
  reason: ''
});

const tableData = ref<(Order | PendingConfirmationOrder)[]>([]);

// 获取状态标签
const getStatusLabel = (status?: OrderStatus | number) => {
  const map: Record<number, string> = {
    1: '待支付',
    2: '已完成',
    3: '已取消',
    4: '已退款',
  };
  return map[status || 0] || '未知';
};

// 获取状态类型
const getStatusType = (status?: OrderStatus | number): any => {
  const map: Record<number, any> = {
    1: 'warning',
    2: 'success',
    3: 'info',
    4: 'danger',
  };
  return map[status || 0] || 'info';
};

// 获取支付方式标签
const getPaymentMethodLabel = (method?: string) => {
  const map: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信',
    qrcode: '个人收款码',
    card: '银行卡',
  };
  return map[method || ''] || method || '未知';
};

// 获取支付方式图标
const getPaymentIcon = (method?: string) => {
  const map: Record<string, any> = {
    alipay: Wallet,
    wechat: ChatDotRound,
    qrcode: Picture,
    card: CreditCard,
  };
  return map[method || ''] || Money;
};

// 获取支付方式图标样式类
const getPaymentIconClass = (method?: string) => {
  const map: Record<string, string> = {
    alipay: 'alipay-icon',
    wechat: 'wechat-icon',
    qrcode: 'qrcode-icon',
    card: 'card-icon',
  };
  return map[method || ''] || '';
};

// 判断是否为待确认订单（个人收款码待确认）
const isPendingOrder = (row?: Order | PendingConfirmationOrder | null): boolean => {
  if (!row) return false;
  // 个人收款码订单且状态为待支付
  return row.paymentMethod === 'qrcode' && row.status === 1;
};

// 判断是否可以退款
const canRefund = (row?: Order | PendingConfirmationOrder | null): boolean => {
  if (!row) return false;
  return row.status === 2; // 已完成订单可以退款
};

// 格式化日期时间
const formatDateTime = (date?: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

// 格式化流量
const formatTraffic = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes >= 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  return (bytes / 1024).toFixed(2) + ' KB';
};

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true;
  try {
    let res;
    const params: any = {
      page: queryParams.page,
      limit: queryParams.limit,
    };

    if (queryParams.orderNo) {
      params.orderNo = queryParams.orderNo;
    }
    if (queryParams.username) {
      params.username = queryParams.username;
    }
    if (queryParams.paymentMethod) {
      params.paymentMethod = queryParams.paymentMethod;
    }
    if (queryParams.dateRange?.length === 2) {
      params.startDate = queryParams.dateRange[0];
      params.endDate = queryParams.dateRange[1];
    }

    if (activeTab.value === 'pending') {
      // 待确认订单
      res = await getPendingConfirmationOrders(params);
    } else {
      // 其他订单
      if (activeTab.value === 'completed') {
        params.status = 2;
      } else if (activeTab.value === 'refunded') {
        params.status = 4;
      }
      res = await getOrders(params);
    }

    tableData.value = res.list || [];
    total.value = res.total || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '获取订单列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取待确认订单数量
const fetchPendingCount = async () => {
  try {
    const res = await getOrderStats();
    pendingCount.value = res.pendingOrders || 0;
  } catch (error) {
    // 静默处理
  }
};

// 标签页切换
const handleTabChange = () => {
  queryParams.page = 1;
  fetchOrders();
};

// 搜索
const handleSearch = () => {
  queryParams.page = 1;
  fetchOrders();
};

// 重置
const handleReset = () => {
  queryParams.orderNo = '';
  queryParams.username = '';
  queryParams.paymentMethod = '';
  queryParams.dateRange = [];
  queryParams.page = 1;
  fetchOrders();
};

// 刷新
const handleRefresh = () => {
  fetchOrders();
  fetchPendingCount();
  ElMessage.success('刷新成功');
};

// 查看详情
const handleView = (row: Order | PendingConfirmationOrder) => {
  currentOrder.value = row;
  detailVisible.value = true;
};

// 确认收款
const handleConfirm = async (row: Order | PendingConfirmationOrder | null) => {
  if (!row) return;

  try {
    await ElMessageBox.confirm(
      `确定要确认订单 ${row.orderNo} 的收款吗？`,
      '确认收款',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'success',
      }
    );

    submitting.value = true;
    await confirmOrderPayment(row.id);
    ElMessage.success('收款确认成功');
    fetchOrders();
    fetchPendingCount();
    if (detailVisible.value) {
      detailVisible.value = false;
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    submitting.value = false;
  }
};

// 拒绝收款
const handleReject = (row: Order | PendingConfirmationOrder | null) => {
  if (!row) return;
  currentOrder.value = row;
  rejectForm.reason = '';
  rejectVisible.value = true;
};

// 提交拒绝
const submitReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入拒绝原因');
    return;
  }

  if (!currentOrder.value) return;

  try {
    submitting.value = true;
    await rejectOrderPayment(currentOrder.value.id, rejectForm.reason);
    ElMessage.success('已拒绝该订单');
    rejectVisible.value = false;
    fetchOrders();
    fetchPendingCount();
    if (detailVisible.value) {
      detailVisible.value = false;
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

// 退款
const handleRefund = async (row: Order | PendingConfirmationOrder | null) => {
  if (!row) return;

  try {
    await ElMessageBox.confirm(
      `确定要对订单 ${row.orderNo} 进行退款吗？退款金额：¥${row.amount}`,
      '确认退款',
      {
        confirmButtonText: '确定退款',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    submitting.value = true;
    await refundOrder(row.id);
    ElMessage.success('退款成功');
    fetchOrders();
    if (detailVisible.value) {
      detailVisible.value = false;
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '退款失败');
    }
  } finally {
    submitting.value = false;
  }
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  queryParams.limit = val;
  fetchOrders();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  fetchOrders();
};

onMounted(() => {
  fetchOrders();
  fetchPendingCount();
});
</script>

<style scoped lang="scss">
.payment-orders {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .search-form {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }

  .tab-badge {
    margin-left: 4px;

    :deep(.el-badge__content) {
      transform: translateY(-50%) scale(0.8);
    }
  }

  .user-info {
    .username {
      font-weight: 500;
      color: #303133;
    }
    .email {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .amount {
    font-weight: 600;
    color: #f56c6c;
    font-size: 14px;
  }

  .amount-large {
    font-weight: 600;
    color: #f56c6c;
    font-size: 18px;
  }

  .payment-method {
    display: flex;
    align-items: center;
    gap: 6px;

    .el-icon {
      font-size: 16px;
    }

    .alipay-icon {
      color: #1677ff;
    }

    .wechat-icon {
      color: #07c160;
    }

    .qrcode-icon {
      color: #e6a23c;
    }

    .card-icon {
      color: #909399;
    }
  }

  .payment-icon {
    margin-right: 4px;
    vertical-align: middle;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      padding-left: 8px;
      border-left: 3px solid #409eff;
    }
  }

  .payment-proof {
    display: flex;
    justify-content: center;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 4px;

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
      width: 200px;
      height: 200px;
      color: #909399;
      gap: 8px;
    }
  }

  .user-remark {
    margin-top: 12px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
