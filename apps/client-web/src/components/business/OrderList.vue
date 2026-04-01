<template>
  <div class="order-list">
    <el-table :data="orders" v-loading="loading" stripe>
      <el-table-column label="订单号" min-width="180">
        <template #default="{ row }">
          <span class="order-no">{{ row.orderNo }}</span>
        </template>
      </el-table-column>

      <el-table-column label="套餐" min-width="150">
        <template #default="{ row }">
          <span>{{ row.planName }}</span>
        </template>
      </el-table-column>

      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span class="order-amount">{{ formatCurrency(row.amount, row.currency) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          <span>{{ formatDate(row.createdAt) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending'"
            type="primary"
            size="small"
            @click="emit('pay', row)"
          >
            支付
          </el-button>
          <el-button
            v-if="row.status === 'pending'"
            size="small"
            @click="emit('cancel', row)"
          >
            取消
          </el-button>
          <el-button
            v-else
            type="primary"
            link
            size="small"
            @click="emit('view-detail', row)"
          >
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-if="showPagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { formatDate, formatCurrency } from '@/utils/format';
import type { Order, OrderStatus } from '@/types/order';

interface Props {
  orders: Order[];
  loading?: boolean;
  total?: number;
  showPagination?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  total: 0,
  showPagination: true,
});

const emit = defineEmits<{
  pay: [order: Order];
  cancel: [order: Order];
  'view-detail': [order: Order];
  'page-change': [page: number];
  'size-change': [size: number];
}>();

const currentPage = ref(1);
const pageSize = ref(20);

const getStatusType = (status: OrderStatus) => {
  const types: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    refunded: 'info',
    cancelled: 'info',
  };
  return types[status] || 'info';
};

const getStatusText = (status: OrderStatus) => {
  const texts: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    refunded: '已退款',
    cancelled: '已取消',
  };
  return texts[status] || status;
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  emit('size-change', size);
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  emit('page-change', page);
};
</script>

<style scoped lang="scss">
.order-list {
  .order-no {
    font-family: monospace;
    color: #606266;
  }

  .order-amount {
    font-weight: 600;
    color: #f56c6c;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
