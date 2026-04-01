<template>
  <div class="ip-pool-list">
    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409eff;">
              <el-icon :size="24" color="#fff"><Collection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPools }}</div>
              <div class="stat-title">总IP池数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67c23a;">
              <el-icon :size="24" color="#fff"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.enabledPools }}</div>
              <div class="stat-title">已启用</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6a23c;">
              <el-icon :size="24" color="#fff"><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.disabledPools }}</div>
              <div class="stat-title">已禁用</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #909399;">
              <el-icon :size="24" color="#fff"><MapLocation /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalIps }}</div>
              <div class="stat-title">总IP数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>IP池列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>创建IP池
          </el-button>
        </div>
      </template>

      <!-- Filters -->
      <el-form :model="queryForm" inline class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="搜索名称/节点"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="IP类型">
          <el-select v-model="queryForm.ipType" placeholder="全部类型" clearable style="width: 120px;">
            <el-option label="IPv4" :value="IpType.IPV4" />
            <el-option label="IPv6" :value="IpType.IPV6" />
            <el-option label="混合" :value="IpType.MIXED" />
          </el-select>
        </el-form-item>
        <el-form-item label="轮换策略">
          <el-select v-model="queryForm.rotationStrategy" placeholder="全部策略" clearable style="width: 140px;">
            <el-option label="轮询" :value="RotationStrategy.ROUND_ROBIN" />
            <el-option label="随机" :value="RotationStrategy.RANDOM" />
            <el-option label="最少使用" :value="RotationStrategy.LEAST_USED" />
            <el-option label="质量优先" :value="RotationStrategy.QUALITY_FIRST" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 120px;">
            <el-option label="已启用" :value="IpPoolStatus.ENABLED" />
            <el-option label="已禁用" :value="IpPoolStatus.DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshRight /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table
        :data="poolList"
        v-loading="loading"
        stripe
        row-key="id"
      >
        <el-table-column prop="name" label="IP池名称" width="180" show-overflow-tooltip />
        <el-table-column prop="nodeName" label="关联节点" width="150" show-overflow-tooltip />
        <el-table-column label="IP数量" width="120">
          <template #default="{ row }">
            <el-tooltip :content="`活跃: ${row.activeIpCount} / 总数: ${row.ipCount}`" placement="top">
              <div class="ip-count-cell">
                <el-progress
                  :percentage="row.ipCount > 0 ? Math.round((row.activeIpCount / row.ipCount) * 100) : 0"
                  :color="getIpCountColor(row)"
                  :stroke-width="6"
                  :show-text="false"
                  style="width: 40px;"
                />
                <span class="ip-count-text">{{ row.activeIpCount }}/{{ row.ipCount }}</span>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="IP类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getIpTypeTagType(row.ipType)">
              {{ getIpTypeLabel(row.ipType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="轮换策略" width="120">
          <template #default="{ row }">
            <el-tooltip :content="`轮换间隔: ${row.rotationInterval}分钟`" placement="top">
              <el-tag size="small" effect="plain">
                {{ getRotationStrategyLabel(row.rotationStrategy) }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="IpPoolStatus.ENABLED"
              :inactive-value="IpPoolStatus.DISABLED"
              @change="(val: number) => handleToggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">
              <el-icon><View /></el-icon>详情
            </el-button>
            <el-button type="primary" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-dropdown @command="(cmd: string) => handleCommand(cmd, row)">
              <el-button type="primary" link>
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rotate">
                    <el-icon><Refresh /></el-icon>手动轮换
                  </el-dropdown-item>
                  <el-dropdown-item command="refresh">
                    <el-icon><DataLine /></el-icon>刷新评分
                  </el-dropdown-item>
                  <el-dropdown-item divided command="delete" style="color: #f56c6c;">
                    <el-icon><Delete /></el-icon>删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
import {
  Collection,
  CircleCheck,
  CircleClose,
  MapLocation,
  Plus,
  Search,
  RefreshRight,
  View,
  Edit,
  ArrowDown,
  Refresh,
  DataLine,
  Delete,
} from '@element-plus/icons-vue';
import {
  getIpPools,
  deleteIpPool,
  enableIpPool,
  disableIpPool,
  rotateIpPool,
  refreshIpScores,
  getIpPoolStats,
} from '@api/ip-pools';
import type { IpPool, IpPoolQuery, IpPoolStats } from '../../types/ip-pool';
import {
  IpType,
  RotationStrategy,
  IpPoolStatus,
  getIpTypeLabel,
  getRotationStrategyLabel,
} from '../../types/ip-pool';

const router = useRouter();

const loading = ref(false);
const poolList = ref<IpPool[]>([]);
const total = ref(0);

const stats = reactive<IpPoolStats>({
  totalPools: 0,
  enabledPools: 0,
  disabledPools: 0,
  totalIps: 0,
  activeIps: 0,
});

const queryForm = reactive<IpPoolQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  nodeId: undefined,
  ipType: undefined,
  rotationStrategy: undefined,
  status: undefined,
});

const fetchPools = async () => {
  loading.value = true;
  try {
    const res = await getIpPools(queryForm);
    poolList.value = res.list;
    total.value = res.total;
  } catch (error) {
    ElMessage.error('获取IP池列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const res = await getIpPoolStats();
    Object.assign(stats, res);
  } catch (error) {
    // Use default values
  }
};

const getIpTypeTagType = (type: IpType): string => {
  const map: Record<IpType, string> = {
    [IpType.IPV4]: 'primary',
    [IpType.IPV6]: 'success',
    [IpType.MIXED]: 'warning',
  };
  return map[type] || 'info';
};

const getIpCountColor = (row: IpPool): string => {
  const ratio = row.ipCount > 0 ? row.activeIpCount / row.ipCount : 0;
  if (ratio >= 0.8) return '#67c23a';
  if (ratio >= 0.5) return '#e6a23c';
  return '#f56c6c';
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleSearch = () => {
  queryForm.page = 1;
  fetchPools();
};

const handleReset = () => {
  queryForm.keyword = '';
  queryForm.nodeId = undefined;
  queryForm.ipType = undefined;
  queryForm.rotationStrategy = undefined;
  queryForm.status = undefined;
  queryForm.page = 1;
  fetchPools();
};

const handleCreate = () => {
  router.push('/ip-pools/create');
};

const handleView = (row: IpPool) => {
  router.push(`/ip-pools/${row.id}`);
};

const handleEdit = (row: IpPool) => {
  router.push(`/ip-pools/${row.id}/edit`);
};

const handleToggleStatus = async (row: IpPool, status: number) => {
  try {
    if (status === IpPoolStatus.ENABLED) {
      await enableIpPool(row.id);
      ElMessage.success('IP池已启用');
    } else {
      await disableIpPool(row.id);
      ElMessage.success('IP池已禁用');
    }
    fetchStats();
  } catch (error) {
    row.status = status === IpPoolStatus.ENABLED ? IpPoolStatus.DISABLED : IpPoolStatus.ENABLED;
    ElMessage.error('操作失败');
  }
};

const handleCommand = async (command: string, row: IpPool) => {
  switch (command) {
    case 'rotate':
      await handleRotate(row);
      break;
    case 'refresh':
      await handleRefresh(row);
      break;
    case 'delete':
      await handleDelete(row);
      break;
  }
};

const handleRotate = async (row: IpPool) => {
  try {
    await ElMessageBox.confirm(
      `确定要手动轮换IP池 "${row.name}" 吗？`,
      '确认轮换',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await rotateIpPool(row.id);
    ElMessage.success('IP池轮换成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('轮换失败');
    }
  }
};

const handleRefresh = async (row: IpPool) => {
  try {
    await refreshIpScores(row.id);
    ElMessage.success('IP评分刷新成功');
    fetchPools();
  } catch (error) {
    ElMessage.error('刷新失败');
  }
};

const handleDelete = async (row: IpPool) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除IP池 "${row.name}" 吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
      }
    );
    await deleteIpPool(row.id);
    ElMessage.success('删除成功');
    fetchPools();
    fetchStats();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleSizeChange = (size: number) => {
  queryForm.pageSize = size;
  fetchPools();
};

const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchPools();
};

onMounted(() => {
  fetchPools();
  fetchStats();
});
</script>

<style scoped lang="scss">
.ip-pool-list {
  min-height: calc(100vh - 120px);

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
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
          }

          .stat-title {
            font-size: 14px;
            color: #909399;
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
  }

  .filter-form {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .ip-count-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .ip-count-text {
      font-size: 13px;
      color: #606266;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
