<template>
  <div class="ip-pool-detail">
    <!-- Header Actions -->
    <div class="header-actions">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <div class="action-buttons">
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>编辑
        </el-button>
        <el-button :type="pool?.status === IpPoolStatus.ENABLED ? 'warning' : 'success'" @click="handleToggleStatus">
          <el-icon><Switch /></el-icon>
          {{ pool?.status === IpPoolStatus.ENABLED ? '禁用' : '启用' }}
        </el-button>
        <el-button type="info" @click="handleRotate">
          <el-icon><Refresh /></el-icon>手动轮换
        </el-button>
        <el-button type="success" @click="handleRefreshScores">
          <el-icon><DataLine /></el-icon>刷新评分
        </el-button>
      </div>
    </div>

    <!-- Basic Info Card -->
    <el-card class="info-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><Collection /></el-icon>
            {{ pool?.name }}
            <el-tag
              :type="pool?.status === IpPoolStatus.ENABLED ? 'success' : 'info'"
              size="small"
              class="status-tag"
            >
              {{ pool?.status === IpPoolStatus.ENABLED ? '已启用' : '已禁用' }}
            </el-tag>
          </span>
          <span class="update-time">更新时间: {{ formatDate(pool?.updatedAt || '') }}</span>
        </div>
      </template>

      <el-descriptions :column="4" border>
        <el-descriptions-item label="IP池ID" :span="2">{{ pool?.id }}</el-descriptions-item>
        <el-descriptions-item label="关联节点" :span="2">{{ pool?.nodeName }}</el-descriptions-item>
        <el-descriptions-item label="IP类型">
          <el-tag :type="getIpTypeTagType(pool?.ipType ?? IpType.IPV4)">
            {{ getIpTypeLabel(pool?.ipType ?? IpType.IPV4) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="轮换策略">
          {{ pool?.rotationStrategy ? getRotationStrategyLabel(pool.rotationStrategy) : '轮询' }}
        </el-descriptions-item>
        <el-descriptions-item label="轮换间隔">{{ pool?.rotationInterval }} 分钟</el-descriptions-item>
        <el-descriptions-item label="IP总数">{{ pool?.ipCount }} 个</el-descriptions-item>
        <el-descriptions-item label="活跃IP">{{ pool?.activeIpCount }} 个</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(pool?.createdAt || '') }}</el-descriptions-item>
      </el-descriptions>

      <div class="description-section" v-if="pool?.description">
        <div class="label">描述</div>
        <div class="content">{{ pool.description }}</div>
      </div>
    </el-card>

    <!-- IP Statistics -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon :size="28" color="#67c23a"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ activeIpCount }}</div>
              <div class="stat-title">活跃IP</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon info">
              <el-icon :size="28" color="#909399"><InfoFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ inactiveIpCount }}</div>
              <div class="stat-title">空闲IP</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon danger">
              <el-icon :size="28" color="#f56c6c"><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ blockedIpCount }}</div>
              <div class="stat-title">已封锁</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- IP List Card -->
    <el-card class="ip-list-card">
      <template #header>
        <div class="card-header">
          <span>IP地址列表</span>
          <div class="header-actions-right">
            <el-input
              v-model="ipSearchKeyword"
              placeholder="搜索IP地址"
              clearable
              style="width: 200px"
              @keyup.enter="handleIpSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="showAddIpDialog = true">
              <el-icon><Plus /></el-icon>添加IP
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredIpList"
        v-loading="ipLoading"
        stripe
        row-key="id"
      >
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="ip" label="IP地址" min-width="150">
          <template #default="{ row }">
            <div class="ip-cell">
              <el-icon><MapLocation /></el-icon>
              <span class="ip-address">{{ row.ip }}</span>
              <el-tag
                v-if="isCurrentIp(row.ip)"
                type="success"
                size="small"
                effect="dark"
              >
                当前
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getIpStatusType(row.status)" size="small">
              {{ getIpStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="150">
          <template #default="{ row }">
            <div class="score-cell">
              <el-progress
                :percentage="row.score"
                :color="getScoreColor(row.score)"
                :stroke-width="8"
                :show-text="false"
                style="width: 60px"
              />
              <span class="score-value" :style="{ color: getScoreColor(row.score) }">
                {{ row.score }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="useCount" label="使用次数" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.useCount }} 次</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUsedAt" label="最后使用" width="160">
          <template #default="{ row }">
            {{ row.lastUsedAt ? formatDate(row.lastUsedAt) : '从未使用' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleSetCurrentIp(row)"
              :disabled="isCurrentIp(row.ip)"
            >
              设为当前
            </el-button>
            <el-button type="danger" link size="small" @click="handleRemoveIp(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="ipQuery.page"
          v-model:page-size="ipQuery.pageSize"
          :total="pool?.ips?.length || 0"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleIpSizeChange"
          @current-change="handleIpPageChange"
        />
      </div>
    </el-card>

    <!-- Add IP Dialog -->
    <el-dialog v-model="showAddIpDialog" title="添加IP地址" width="500px">
      <el-form :model="addIpForm" label-width="80px">
        <el-form-item label="IP地址">
          <el-input
            v-model="addIpForm.ip"
            placeholder="输入IP地址"
            @keyup.enter="handleAddIp"
          />
        </el-form-item>
        <el-form-item>
          <div class="form-tip">支持批量添加，每行一个IP地址</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddIpDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddIp" :loading="addingIp">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  Edit,
  Switch,
  Refresh,
  DataLine,
  Collection,
  CircleCheck,
  InfoFilled,
  CircleClose,
  MapLocation,
  Search,
  Plus,
} from '@element-plus/icons-vue';
import {
  getIpPoolById,
  enableIpPool,
  disableIpPool,
  rotateIpPool,
  refreshIpScores,
  addIpToPool,
  removeIpFromPool,
} from '@api/ip-pools';
import type { IpPoolDetail, IpAddress } from '../../types/ip-pool';
import {
  IpPoolStatus,
  IpStatus,
  IpType,
  getIpTypeLabel,
  getRotationStrategyLabel,
  getIpStatusType,
  getIpStatusText,
  getScoreColor,
  getIpTypeTagType,
} from '../../types/ip-pool';

const route = useRoute();
const router = useRouter();
const poolId = computed(() => route.params.id as string);

const loading = ref(false);
const ipLoading = ref(false);
const pool = ref<IpPoolDetail | null>(null);
const currentIp = ref<string>('');

const ipSearchKeyword = ref('');
const showAddIpDialog = ref(false);
const addingIp = ref(false);

const addIpForm = reactive({
  ip: '',
});

const ipQuery = reactive({
  page: 1,
  pageSize: 20,
});

const activeIpCount = computed(() => {
  return pool.value?.ips.filter((ip) => ip.status === IpStatus.ACTIVE).length || 0;
});

const inactiveIpCount = computed(() => {
  return pool.value?.ips.filter((ip) => ip.status === IpStatus.INACTIVE).length || 0;
});

const blockedIpCount = computed(() => {
  return pool.value?.ips.filter((ip) => ip.status === IpStatus.BLOCKED).length || 0;
});

const filteredIpList = computed(() => {
  if (!pool.value?.ips) return [];
  let list = [...pool.value.ips];

  if (ipSearchKeyword.value) {
    const keyword = ipSearchKeyword.value.toLowerCase();
    list = list.filter((ip) => ip.ip.toLowerCase().includes(keyword));
  }

  // Pagination
  const start = (ipQuery.page - 1) * ipQuery.pageSize;
  const end = start + ipQuery.pageSize;
  return list.slice(start, end);
});

const fetchPool = async () => {
  loading.value = true;
  try {
    const res = await getIpPoolById(poolId.value);
    pool.value = res;
  } catch (error) {
    ElMessage.error('获取IP池详情失败');
  } finally {
    loading.value = false;
  }
};

const isCurrentIp = (ip: string): boolean => {
  return ip === currentIp.value;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleEdit = () => {
  router.push(`/ip-pools/${poolId.value}/edit`);
};

const handleToggleStatus = async () => {
  if (!pool.value) return;

  try {
    if (pool.value.status === IpPoolStatus.ENABLED) {
      await ElMessageBox.confirm('确定要禁用该IP池吗？', '确认禁用', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      await disableIpPool(poolId.value);
      ElMessage.success('IP池已禁用');
    } else {
      await enableIpPool(poolId.value);
      ElMessage.success('IP池已启用');
    }
    fetchPool();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

const handleRotate = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要手动轮换IP池 "${pool.value?.name}" 吗？`,
      '确认轮换',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await rotateIpPool(poolId.value);
    ElMessage.success('IP池轮换成功');
    // Simulate getting new current IP
    if (pool.value?.ips.length) {
      const randomIp = pool.value.ips[Math.floor(Math.random() * pool.value.ips.length)];
      currentIp.value = randomIp.ip;
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('轮换失败');
    }
  }
};

const handleRefreshScores = async () => {
  try {
    await refreshIpScores(poolId.value);
    ElMessage.success('IP评分刷新成功');
    fetchPool();
  } catch (error) {
    ElMessage.error('刷新失败');
  }
};

const handleIpSearch = () => {
  ipQuery.page = 1;
};

const handleSetCurrentIp = (ip: IpAddress) => {
  currentIp.value = ip.ip;
  ElMessage.success(`已将 ${ip.ip} 设为当前使用IP`);
};

const handleRemoveIp = async (ip: IpAddress) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除IP地址 "${ip.ip}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await removeIpFromPool(poolId.value, ip.id);
    ElMessage.success('IP地址已删除');
    fetchPool();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleAddIp = async () => {
  if (!addIpForm.ip.trim()) {
    ElMessage.warning('请输入IP地址');
    return;
  }

  addingIp.value = true;
  try {
    await addIpToPool(poolId.value, addIpForm.ip.trim());
    ElMessage.success('IP地址添加成功');
    showAddIpDialog.value = false;
    addIpForm.ip = '';
    fetchPool();
  } catch (error) {
    ElMessage.error('添加失败');
  } finally {
    addingIp.value = false;
  }
};

const handleIpSizeChange = (size: number) => {
  ipQuery.pageSize = size;
  ipQuery.page = 1;
};

const handleIpPageChange = (page: number) => {
  ipQuery.page = page;
};

onMounted(() => {
  fetchPool();
});
</script>

<style scoped lang="scss">
.ip-pool-detail {
  min-height: calc(100vh - 120px);

  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .action-buttons {
      display: flex;
      gap: 8px;
    }
  }

  .info-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        font-weight: 600;

        .status-tag {
          margin-left: 8px;
        }
      }

      .update-time {
        font-size: 13px;
        color: #909399;
      }
    }

    .description-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      .label {
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .content {
        font-size: 14px;
        color: #303133;
        line-height: 1.6;
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 4px;
      }
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
          width: 56px;
          height: 56px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;

          &.success {
            background-color: #f0f9eb;
          }

          &.info {
            background-color: #f4f4f5;
          }

          &.danger {
            background-color: #fef0f0;
          }
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
            margin-top: 4px;
          }
        }
      }
    }
  }

  .ip-list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions-right {
        display: flex;
        gap: 12px;
      }
    }

    .ip-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .ip-address {
        font-family: monospace;
        font-size: 14px;
      }
    }

    .score-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .score-value {
        font-weight: 600;
        font-size: 14px;
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .form-tip {
    color: #909399;
    font-size: 13px;
  }
}
</style>
