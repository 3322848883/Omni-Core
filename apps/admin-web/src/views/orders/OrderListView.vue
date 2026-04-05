<template>
  <div class="order-list">
    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon :size="24" color="#fff"><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrders }}</div>
              <div class="stat-title">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon :size="24" color="#fff"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">${{ stats.totalAmount.toFixed(2) }}</div>
              <div class="stat-title">总收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon :size="24" color="#fff"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayOrders }}</div>
              <div class="stat-title">今日订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <el-icon :size="24" color="#fff"><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingOrders }}</div>
              <div class="stat-title">待处理订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="primary" @click="handleCreate">新建订单</el-button>
        </div>
      </template>

      <!-- Search Form -->
      <el-form :model="queryForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="订单号/用户名/邮箱" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="待支付" :value="1" />
            <el-option label="已支付" :value="2" />
            <el-option label="已取消" :value="3" />
            <el-option label="已退款" :value="4" />
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
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="planName" label="套餐" width="150" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold;">${{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              v-if="row.status === 1" 
              type="success" 
              link 
              @click="handlePay(row)"
            >
              标记支付
            </el-button>
            <el-button 
              v-if="row.status === 1" 
              type="danger" 
              link 
              @click="handleCancel(row)"
            >
              取消
            </el-button>
            <el-button 
              v-if="row.status === 2" 
              type="warning" 
              link 
              @click="handleRefund(row)"
            >
              退款
            </el-button>
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
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentOrder.email }}</el-descriptions-item>
        <el-descriptions-item label="套餐">{{ currentOrder.planName }}</el-descriptions-item>
        <el-descriptions-item label="流量限制">{{ formatTraffic(currentOrder.trafficLimit) }}</el-descriptions-item>
        <el-descriptions-item label="时长">{{ currentOrder.duration }} 天</el-descriptions-item>
        <el-descriptions-item label="金额">
          <span style="color: #F56C6C; font-weight: bold;">${{ currentOrder.amount.toFixed(2) }} {{ currentOrder.currency }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ currentOrder.paymentMethod }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ currentOrder.paidAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ currentOrder.startDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ currentOrder.endDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentOrder.createdAt }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="formVisible" :title="isEdit ? '编辑订单' : '新建订单'" width="600px">
      <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="formData.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="套餐" prop="planId">
          <el-select v-model="formData.planId" placeholder="请选择套餐">
            <el-option label="基础套餐" value="plan_basic" />
            <el-option label="标准套餐" value="plan_standard" />
            <el-option label="高级套餐" value="plan_premium" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="formData.amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="formData.paymentMethod" placeholder="请选择支付方式">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="PayPal" value="paypal" />
            <el-option label="信用卡" value="credit_card" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="待支付" :value="1" />
            <el-option label="已支付" :value="2" />
            <el-option label="已取消" :value="3" />
            <el-option label="已退款" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ShoppingCart, Money, Calendar, Timer } from '@element-plus/icons-vue';
import { getOrders, getOrderById, createOrder, updateOrder, payOrder, cancelOrder, refundOrder, getOrderStats } from '@api/orders';
import type { Order, OrderQuery, OrderStats } from '../../types/order';
import type { FormInstance, FormRules } from 'element-plus';

const loading = ref(false);
const orderList = ref<Order[]>([]);
const total = ref(0);
const dateRange = ref<[Date, Date] | null>(null);
const detailVisible = ref(false);
const formVisible = ref(false);
const isEdit = ref(false);
const currentOrder = ref<Order | null>(null);
const formRef = ref<FormInstance>();

const stats = reactive<OrderStats>({
  totalOrders: 0,
  totalAmount: 0,
  todayOrders: 0,
  todayAmount: 0,
  pendingOrders: 0,
});

const queryForm = reactive<OrderQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: undefined,
});

const formData = reactive<Partial<Order>>({
  userId: '',
  planId: '',
  amount: 0,
  paymentMethod: '',
  status: 1,
});

const formRules: FormRules = {
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  planId: [{ required: true, message: '请选择套餐', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await getOrders(queryForm);
    orderList.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const res = await getOrderStats();
    Object.assign(stats, res);
  } catch (error) {
    // Use default values
  }
};

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    1: 'warning',
    2: 'success',
    3: 'info',
    4: 'danger',
  };
  return map[status] || 'info';
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '待支付',
    2: '已支付',
    3: '已取消',
    4: '已退款',
  };
  return map[status] || '未知';
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
  queryForm.status = undefined;
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

const handleCreate = () => {
  isEdit.value = false;
  Object.assign(formData, {
    userId: '',
    planId: '',
    amount: 0,
    paymentMethod: '',
    status: 1,
  });
  formVisible.value = true;
};

const handleView = async (row: Order) => {
  try {
    const res = await getOrderById(row.id);
    currentOrder.value = res;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取订单详情失败');
  }
};

const handleEdit = (row: Order) => {
  isEdit.value = true;
  Object.assign(formData, { ...row });
  formVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value && formData.id) {
          await updateOrder(formData.id, formData);
          ElMessage.success('更新成功');
        } else {
          await createOrder(formData);
          ElMessage.success('创建成功');
        }
        formVisible.value = false;
        fetchOrders();
        fetchStats();
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
      }
    }
  });
};

const handlePay = async (row: Order) => {
  try {
    await ElMessageBox.confirm('确定要标记该订单为已支付吗？', '提示', {
      type: 'warning',
    });
    await payOrder(row.id);
    ElMessage.success('操作成功');
    fetchOrders();
    fetchStats();
  } catch {
    // Cancelled
  }
};

const handleCancel = async (row: Order) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      type: 'warning',
    });
    await cancelOrder(row.id);
    ElMessage.success('取消成功');
    fetchOrders();
    fetchStats();
  } catch {
    // Cancelled
  }
};

const handleRefund = async (row: Order) => {
  try {
    await ElMessageBox.confirm('确定要退款该订单吗？', '提示', {
      type: 'warning',
    });
    await refundOrder(row.id);
    ElMessage.success('退款成功');
    fetchOrders();
    fetchStats();
  } catch {
    // Cancelled
  }
};

const handleSizeChange = (size: number) => {
  queryForm.pageSize = size;
  fetchOrders();
};

const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchOrders();
};

onMounted(() => {
  fetchOrders();
  fetchStats();
});
</script>

<style scoped lang="scss">
.order-list {
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 20px;

  .el-card {
    height: 100%;
    background: rgba(26, 26, 46, 0.8);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    &:hover {
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
      border-color: rgba(0, 255, 255, 0.6);
      transition: all 0.3s ease;
    }

    .el-card__header {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2);
      color: #00ffff;
      font-weight: bold;
    }
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      margin-bottom: 20px;

      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);

          &:hover {
            box-shadow: 0 0 25px rgba(0, 255, 255, 0.5);
            transform: scale(1.05);
            transition: all 0.3s ease;
          }
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
          }

          .stat-title {
            font-size: 14px;
            color: #8a94a6;
            margin-top: 5px;
          }
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .el-button {
      &.el-button--primary {
        background: linear-gradient(45deg, #00ffff, #0080ff);
        border: none;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);

        &:hover {
          background: linear-gradient(45deg, #00ffff, #00a0ff);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
      }
    }
  }

  .el-form {
    margin-bottom: 20px;

    .el-form-item__label {
      color: #8a94a6;
    }

    .el-input {
      .el-input__wrapper {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #00ffff;

        &:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }

        &.is-focus {
          border-color: #00ffff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }
      }
    }

    .el-select {
      .el-input__wrapper {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #00ffff;

        &:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }

        &.is-focus {
          border-color: #00ffff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }
      }

      .el-select-dropdown {
        background: rgba(26, 26, 46, 0.95);
        border: 1px solid rgba(0, 255, 255, 0.3);
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);

        .el-select-dropdown__item {
          color: #e6e6e6;

          &:hover {
            background: rgba(0, 255, 255, 0.1);
            color: #00ffff;
          }

          &.is-selected {
            background: rgba(0, 255, 255, 0.2);
            color: #00ffff;
          }
        }
      }
    }

    .el-date-picker {
      .el-input__wrapper {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #00ffff;

        &:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }

        &.is-focus {
          border-color: #00ffff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }
      }
    }

    .el-button {
      &.el-button--primary {
        background: linear-gradient(45deg, #00ffff, #0080ff);
        border: none;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);

        &:hover {
          background: linear-gradient(45deg, #00ffff, #00a0ff);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
      }

      &.el-button--default {
        background: rgba(26, 26, 46, 0.8);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: #00ffff;

        &:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }
      }
    }
  }

  .el-table {
    background: rgba(26, 26, 46, 0.8);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;

    .el-table__header-wrapper {
      .el-table__header {
        background: rgba(26, 26, 46, 0.9);

        th {
          background: rgba(26, 26, 46, 0.9);
          color: #00ffff;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }
      }
    }

    .el-table__body-wrapper {
      .el-table__row {
        background: rgba(26, 26, 46, 0.6);
        color: #e6e6e6;

        &:hover {
          background: rgba(26, 26, 46, 0.8);
        }

        &.el-table__row--striped {
          background: rgba(26, 26, 46, 0.4);

          &:hover {
            background: rgba(26, 26, 46, 0.8);
          }
        }

        td {
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
        }
      }
    }

    .el-tag {
      &.el-tag--warning {
        background: rgba(230, 162, 60, 0.2);
        border: 1px solid rgba(230, 162, 60, 0.5);
        color: #e6a23c;
      }

      &.el-tag--success {
        background: rgba(103, 194, 58, 0.2);
        border: 1px solid rgba(103, 194, 58, 0.5);
        color: #67c23a;
      }

      &.el-tag--info {
        background: rgba(144, 147, 153, 0.2);
        border: 1px solid rgba(144, 147, 153, 0.5);
        color: #909399;
      }

      &.el-tag--danger {
        background: rgba(245, 108, 108, 0.2);
        border: 1px solid rgba(245, 108, 108, 0.5);
        color: #f56c6c;
      }
    }

    .el-button {
      &.el-button--primary {
        color: #00ffff;

        &:hover {
          color: #00ffff;
          text-decoration: underline;
        }
      }

      &.el-button--success {
        color: #67c23a;

        &:hover {
          color: #67c23a;
          text-decoration: underline;
        }
      }

      &.el-button--danger {
        color: #f56c6c;

        &:hover {
          color: #f56c6c;
          text-decoration: underline;
        }
      }

      &.el-button--warning {
        color: #e6a23c;

        &:hover {
          color: #e6a23c;
          text-decoration: underline;
        }
      }
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;

    .el-pagination {
      .el-pager {
        li {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: #00ffff;
            color: #00ffff;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
          }

          &.is-active {
            background: #00ffff;
            border-color: #00ffff;
            color: #0f0f1a;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
          }
        }
      }

      .el-pagination__sizes {
        .el-input .el-input__wrapper {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;
        }

        .el-select .el-input__wrapper {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;
        }
      }

      .el-pagination__total {
        color: #8a94a6;
      }
    }
  }

  .el-dialog {
    background: rgba(26, 26, 46, 0.95);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
    backdrop-filter: blur(15px);

    .el-dialog__header {
      border-bottom: 1px solid rgba(0, 255, 255, 0.2);

      .el-dialog__title {
        color: #00ffff;
      }

      .el-dialog__headerbtn {
        .el-dialog__close {
          color: #8a94a6;

          &:hover {
            color: #00ffff;
          }
        }
      }
    }

    .el-dialog__body {
      color: #e6e6e6;

      .el-form {
        .el-form-item__label {
          color: #8a94a6;
        }

        .el-input {
          .el-input__wrapper {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              border-color: rgba(0, 255, 255, 0.6);
              box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
            }

            &.is-focus {
              border-color: #00ffff;
              box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
          }
        }

        .el-input-number {
          .el-input__wrapper {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              border-color: rgba(0, 255, 255, 0.6);
              box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
            }

            &.is-focus {
              border-color: #00ffff;
              box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
          }

          .el-input-number__decrease,
          .el-input-number__increase {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              background: rgba(26, 26, 46, 1);
              border-color: #00ffff;
              color: #00ffff;
            }

            &.is-disabled {
              color: #8a94a6;
              border-color: rgba(0, 255, 255, 0.1);
            }
          }
        }

        .el-select {
          .el-input__wrapper {
            background: rgba(26, 26, 46, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.3);
            color: #00ffff;

            &:hover {
              border-color: rgba(0, 255, 255, 0.6);
              box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
            }

            &.is-focus {
              border-color: #00ffff;
              box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
          }

          .el-select-dropdown {
            background: rgba(26, 26, 46, 0.95);
            border: 1px solid rgba(0, 255, 255, 0.3);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);

            .el-select-dropdown__item {
              color: #e6e6e6;

              &:hover {
                background: rgba(0, 255, 255, 0.1);
                color: #00ffff;
              }

              &.is-selected {
                background: rgba(0, 255, 255, 0.2);
                color: #00ffff;
              }
            }
          }
        }
      }

      .el-descriptions {
        background: rgba(26, 26, 46, 0.6);
        color: #e6e6e6;

        .el-descriptions__label {
          color: #8a94a6;
          font-weight: 600;
        }

        .el-descriptions__content {
          color: #e6e6e6;
        }

        .el-descriptions__cell {
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
          border-right: 1px solid rgba(0, 255, 255, 0.1);
        }

        .el-tag {
          &.el-tag--warning {
            background: rgba(230, 162, 60, 0.2);
            border: 1px solid rgba(230, 162, 60, 0.5);
            color: #e6a23c;
          }

          &.el-tag--success {
            background: rgba(103, 194, 58, 0.2);
            border: 1px solid rgba(103, 194, 58, 0.5);
            color: #67c23a;
          }

          &.el-tag--info {
            background: rgba(144, 147, 153, 0.2);
            border: 1px solid rgba(144, 147, 153, 0.5);
            color: #909399;
          }

          &.el-tag--danger {
            background: rgba(245, 108, 108, 0.2);
            border: 1px solid rgba(245, 108, 108, 0.5);
            color: #f56c6c;
          }
        }
      }
    }

    .el-dialog__footer {
      border-top: 1px solid rgba(0, 255, 255, 0.2);

      .el-button {
        &.el-button--primary {
          background: linear-gradient(45deg, #00ffff, #0080ff);
          border: none;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);

          &:hover {
            background: linear-gradient(45deg, #00ffff, #00a0ff);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
          }
        }

        &.el-button--default {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
          }
        }
      }
    }
  }

  .el-message-box {
    background: rgba(26, 26, 46, 0.95);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
    backdrop-filter: blur(15px);

    .el-message-box__title {
      color: #00ffff;
    }

    .el-message-box__content {
      color: #e6e6e6;
    }

    .el-message-box__footer {
      border-top: 1px solid rgba(0, 255, 255, 0.2);

      .el-button {
        &.el-button--primary {
          background: linear-gradient(45deg, #00ffff, #0080ff);
          border: none;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);

          &:hover {
            background: linear-gradient(45deg, #00ffff, #00a0ff);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
          }
        }

        &.el-button--default {
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;

          &:hover {
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
          }
        }
      }
    }
  }
}
</style>
