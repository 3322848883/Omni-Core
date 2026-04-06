<template>
  <div class="plan-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>套餐管理</span>
          <div class="header-actions">
            <el-button @click="$router.push('/plans/stats')">
              <el-icon><TrendCharts /></el-icon>
              统计报表
            </el-button>
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              创建套餐
            </el-button>
          </div>
        </div>
      </template>

      <!-- Filters -->
      <el-form :model="queryForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="套餐名称" clearable />
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="queryForm.serviceType" placeholder="全部" clearable>
            <el-option
              v-for="type in serviceTypes"
              :key="type"
              :label="getServiceTypeLabel(type)"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table :data="planList" v-loading="loading" stripe>
        <el-table-column prop="name" label="套餐名称" width="180" />
        <el-table-column label="服务类型" width="200">
          <template #default="{ row }">
            <div class="service-types">
              <el-tag
                v-for="type in row.serviceTypes"
                :key="type"
                size="small"
                :color="getServiceTypeBgColor(type)"
                :style="{ color: getServiceTypeColor(type), marginRight: '4px', marginBottom: '4px' }"
              >
                {{ getServiceTypeLabel(type) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            <span class="price">${{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="durationDays" label="时长" width="100">
          <template #default="{ row }">
            {{ row.durationDays }} 天
          </template>
        </el-table-column>
        <el-table-column prop="trafficLimit" label="流量" width="120">
          <template #default="{ row }">
            {{ formatTraffic(row.trafficLimit) }}
          </template>
        </el-table-column>
        <el-table-column prop="maxConnections" label="设备数" width="90">
          <template #default="{ row }">
            {{ row.maxConnections }} 台
          </template>
        </el-table-column>
        <el-table-column prop="subscriberCount" label="订阅数" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.subscriberCount || 0 }} 人</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isEnabled" label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.isEnabled" @change="(val: boolean) => handleToggleEnable(row, val)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleViewStats(row)">统计</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, TrendCharts } from '@element-plus/icons-vue';
import {
  ServiceType,
  getAllServiceTypes,
  getServiceTypeLabel,
  getServiceTypeColor,
  getServiceTypeBgColor,
} from '@shared/constants/service-type.mjs';
import { getPlans, togglePlanStatus, deletePlan } from '@/api/plans';

interface Plan {
  id: string;
  name: string;
  serviceTypes: ServiceType[];
  primaryType: ServiceType;
  price: number;
  durationDays: number;
  trafficLimit: number;
  maxConnections: number;
  priorityBoost: number;
  guaranteedBandwidth: number;
  features: string[];
  isEnabled: boolean;
  subscriberCount?: number;
}

const router = useRouter();
const loading = ref(false);
const planList = ref<Plan[]>([]);
const total = ref(0);

const serviceTypes = getAllServiceTypes();

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  serviceType: undefined as ServiceType | undefined,
  status: undefined as number | undefined,
});

const fetchPlans = async () => {
  loading.value = true;
  try {
    const res = await getPlans({
      page: queryForm.page,
      limit: queryForm.limit,
      serviceType: queryForm.serviceType,
      isActive: queryForm.status !== undefined ? queryForm.status === 1 : undefined,
    });

    // Transform API data to match component interface
    planList.value = res.items.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      serviceTypes: item.serviceType ? [item.serviceType] : ['standard'],
      primaryType: item.serviceType || 'standard',
      price: Number(item.price),
      durationDays: item.durationDays,
      trafficLimit: item.maxTrafficGb ? item.maxTrafficGb * 1024 * 1024 * 1024 : 0,
      maxConnections: item.maxDevices,
      subscriberCount: 0, // TODO: get from API
      isEnabled: item.isActive,
      description: item.description,
      features: item.features || [],
    }));

    total.value = res.pagination.total;
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    ElMessage.error('获取套餐列表失败');
  } finally {
    loading.value = false;
  }
};

const formatTraffic = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(0)} GB`;
};

const handleSearch = () => {
  queryForm.page = 1;
  fetchPlans();
};

const handleReset = () => {
  queryForm.keyword = '';
  queryForm.serviceType = undefined;
  queryForm.status = undefined;
  queryForm.page = 1;
  fetchPlans();
};

const handleCreate = () => {
  router.push('/plans/create');
};

const handleEdit = (row: Plan) => {
  router.push(`/plans/${row.id}/edit`);
};

const handleViewStats = (row: Plan) => {
  router.push(`/plans/stats?planId=${row.id}`);
};

const handleToggleEnable = async (row: Plan, enabled: boolean) => {
  try {
    await togglePlanStatus(row.id, enabled);
    ElMessage.success(enabled ? '套餐已启用' : '套餐已禁用');
  } catch (error) {
    row.isEnabled = !enabled;
    ElMessage.error('操作失败');
  }
};

const handleDelete = async (row: Plan) => {
  try {
    await ElMessageBox.confirm('确定要删除该套餐吗？此操作不可恢复。', '警告', {
      type: 'error',
    });
    await deletePlan(row.id);
    ElMessage.success('删除成功');
    fetchPlans();
  } catch {
    // Cancelled
  }
};

const handleSizeChange = (size: number) => {
  queryForm.pageSize = size;
  fetchPlans();
};

const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchPlans();
};

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped lang="scss">
.plan-list {
  min-height: calc(100vh - 120px);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .service-types {
    display: flex;
    flex-wrap: wrap;
  }

  .price {
    font-weight: 600;
    color: #f56c6c;
    font-size: 16px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
