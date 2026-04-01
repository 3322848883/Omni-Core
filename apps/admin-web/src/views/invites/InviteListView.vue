<template>
  <div class="invite-list">
    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon :size="24" color="#fff"><Ticket /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalCodes }}</div>
              <div class="stat-title">总邀请码</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon :size="24" color="#fff"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeCodes }}</div>
              <div class="stat-title">有效邀请码</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon :size="24" color="#fff"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUses }}</div>
              <div class="stat-title">总使用次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #F56C6C;">
              <el-icon :size="24" color="#fff"><Present /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalRewardDays }}</div>
              <div class="stat-title">总奖励天数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>邀请码列表</span>
          <el-button type="primary" @click="handleCreate">生成邀请码</el-button>
        </div>
      </template>

      <!-- Search Form -->
      <el-form :model="queryForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="邀请码/创建者" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="有效" :value="1" />
            <el-option label="已禁用" :value="2" />
            <el-option label="已过期" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table :data="inviteList" v-loading="loading" stripe>
        <el-table-column prop="code" label="邀请码" width="180">
          <template #default="{ row }">
            <el-tag size="large" type="primary" class="invite-code">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建者" width="120" />
        <el-table-column prop="maxUses" label="最大使用次数" width="120" />
        <el-table-column prop="usedCount" label="已使用" width="100">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round((row.usedCount / row.maxUses) * 100)" 
              :status="row.usedCount >= row.maxUses ? 'success' : ''"
            />
            <span class="use-count">{{ row.usedCount }} / {{ row.maxUses }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rewardDays" label="奖励天数" width="100" />
        <el-table-column prop="rewardTraffic" label="奖励流量" width="120">
          <template #default="{ row }">
            {{ formatTraffic(row.rewardTraffic) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expireAt" label="过期时间" width="180">
          <template #default="{ row }">
            {{ row.expireAt || '永不过期' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button 
              :type="row.status === 2 ? 'success' : 'warning'" 
              link 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 2 ? '启用' : '禁用' }}
            </el-button>
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

    <!-- Invite Records -->
    <el-card class="records-card">
      <template #header>
        <div class="card-header">
          <span>邀请记录</span>
          <el-button type="primary" link @click="fetchInviteRecords">刷新</el-button>
        </div>
      </template>
      <el-table :data="inviteRecords" v-loading="recordsLoading" stripe>
        <el-table-column prop="inviteCode" label="邀请码" width="150" />
        <el-table-column prop="inviterName" label="邀请人" width="120" />
        <el-table-column prop="inviteeName" label="被邀请人" width="120" />
        <el-table-column prop="rewardDays" label="奖励天数" width="100" />
        <el-table-column prop="rewardTraffic" label="奖励流量" width="120">
          <template #default="{ row }">
            {{ formatTraffic(row.rewardTraffic) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getRecordStatusType(row.status)">
              {{ getRecordStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="completedAt" label="完成时间" width="180">
          <template #default="{ row }">
            {{ row.completedAt || '-' }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="recordsQuery.page"
          v-model:page-size="recordsQuery.pageSize"
          :total="recordsTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleRecordsSizeChange"
          @current-change="handleRecordsPageChange"
        />
      </div>
    </el-card>

    <!-- Create Dialog -->
    <el-dialog v-model="formVisible" title="生成邀请码" width="500px">
      <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="最大使用次数" prop="maxUses">
          <el-input-number v-model="formData.maxUses" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="奖励天数" prop="rewardDays">
          <el-input-number v-model="formData.rewardDays" :min="0" :max="365" />
        </el-form-item>
        <el-form-item label="奖励流量(GB)" prop="rewardTraffic">
          <el-input-number v-model="formData.rewardTraffic" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="过期时间" prop="expireAt">
          <el-date-picker
            v-model="formData.expireAt"
            type="datetime"
            placeholder="选择过期时间（可选）"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">生成</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="邀请码详情" width="600px">
      <el-descriptions :column="2" border v-if="currentInvite">
        <el-descriptions-item label="邀请码">
          <el-tag size="large" type="primary">{{ currentInvite.code }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentInvite.status)">
            {{ getStatusText(currentInvite.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建者">{{ currentInvite.creatorName }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentInvite.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="使用次数">{{ currentInvite.usedCount }} / {{ currentInvite.maxUses }}</el-descriptions-item>
        <el-descriptions-item label="剩余次数">{{ currentInvite.maxUses - currentInvite.usedCount }}</el-descriptions-item>
        <el-descriptions-item label="奖励天数">{{ currentInvite.rewardDays }} 天</el-descriptions-item>
        <el-descriptions-item label="奖励流量">{{ formatTraffic(currentInvite.rewardTraffic) }}</el-descriptions-item>
        <el-descriptions-item label="过期时间" :span="2">
          {{ currentInvite.expireAt || '永不过期' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Ticket, CircleCheck, User, Present } from '@element-plus/icons-vue';
import { getInviteCodes, getInviteCodeById, createInviteCode, deleteInviteCode, enableInviteCode, disableInviteCode, getInviteRecords, getInviteStats } from '@api/invites';
import type { InviteCode, InviteRecord, InviteQuery, InviteRecordQuery, InviteStats, CreateInviteCodeData } from '../../types/invite';
import type { FormInstance, FormRules } from 'element-plus';

const loading = ref(false);
const recordsLoading = ref(false);
const inviteList = ref<InviteCode[]>([]);
const inviteRecords = ref<InviteRecord[]>([]);
const total = ref(0);
const recordsTotal = ref(0);
const formVisible = ref(false);
const detailVisible = ref(false);
const currentInvite = ref<InviteCode | null>(null);
const formRef = ref<FormInstance>();

const stats = reactive<InviteStats>({
  totalCodes: 0,
  activeCodes: 0,
  totalUses: 0,
  totalRewardDays: 0,
  totalRewardTraffic: 0,
});

const queryForm = reactive<InviteQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: undefined,
});

const recordsQuery = reactive<InviteRecordQuery>({
  page: 1,
  pageSize: 10,
});

const formData = reactive<CreateInviteCodeData>({
  maxUses: 10,
  rewardDays: 30,
  rewardTraffic: 100,
  expireAt: undefined,
});

const formRules: FormRules = {
  maxUses: [{ required: true, message: '请输入最大使用次数', trigger: 'blur' }],
  rewardDays: [{ required: true, message: '请输入奖励天数', trigger: 'blur' }],
  rewardTraffic: [{ required: true, message: '请输入奖励流量', trigger: 'blur' }],
};

const fetchInvites = async () => {
  loading.value = true;
  try {
    const res = await getInviteCodes(queryForm);
    inviteList.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const fetchInviteRecords = async () => {
  recordsLoading.value = true;
  try {
    const res = await getInviteRecords(recordsQuery);
    inviteRecords.value = res.list;
    recordsTotal.value = res.total;
  } finally {
    recordsLoading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const res = await getInviteStats();
    Object.assign(stats, res);
  } catch (error) {
    // Use default values
  }
};

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    1: 'success',
    2: 'danger',
    3: 'info',
  };
  return map[status] || 'info';
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '有效',
    2: '已禁用',
    3: '已过期',
  };
  return map[status] || '未知';
};

const getRecordStatusType = (status: number) => {
  const map: Record<number, string> = {
    1: 'warning',
    2: 'success',
    3: 'info',
  };
  return map[status] || 'info';
};

const getRecordStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '待完成',
    2: '已完成',
    3: '已取消',
  };
  return map[status] || '未知';
};

const formatTraffic = (bytes: number) => {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
};

const handleSearch = () => {
  queryForm.page = 1;
  fetchInvites();
};

const handleReset = () => {
  queryForm.keyword = '';
  queryForm.status = undefined;
  queryForm.page = 1;
  fetchInvites();
};

const handleCreate = () => {
  Object.assign(formData, {
    maxUses: 10,
    rewardDays: 30,
    rewardTraffic: 100,
    expireAt: undefined,
  });
  formVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = {
          ...formData,
          rewardTraffic: formData.rewardTraffic * 1024 * 1024 * 1024,
          expireAt: formData.expireAt ? new Date(formData.expireAt).toISOString() : undefined,
        };
        await createInviteCode(submitData);
        ElMessage.success('邀请码生成成功');
        formVisible.value = false;
        fetchInvites();
        fetchStats();
      } catch (error) {
        ElMessage.error('生成失败');
      }
    }
  });
};

const handleView = async (row: InviteCode) => {
  try {
    const res = await getInviteCodeById(row.id);
    currentInvite.value = res;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取详情失败');
  }
};

const handleToggleStatus = async (row: InviteCode) => {
  const action = row.status === 2 ? '启用' : '禁用';
  try {
    await ElMessageBox.confirm(`确定要${action}该邀请码吗？`, '提示', {
      type: 'warning',
    });
    if (row.status === 2) {
      await enableInviteCode(row.id);
    } else {
      await disableInviteCode(row.id);
    }
    ElMessage.success(`${action}成功`);
    fetchInvites();
    fetchStats();
  } catch {
    // Cancelled
  }
};

const handleDelete = async (row: InviteCode) => {
  try {
    await ElMessageBox.confirm('确定要删除该邀请码吗？此操作不可恢复。', '警告', {
      type: 'error',
    });
    await deleteInviteCode(row.id);
    ElMessage.success('删除成功');
    fetchInvites();
    fetchStats();
  } catch {
    // Cancelled
  }
};

const handleSizeChange = (size: number) => {
  queryForm.pageSize = size;
  fetchInvites();
};

const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchInvites();
};

const handleRecordsSizeChange = (size: number) => {
  recordsQuery.pageSize = size;
  fetchInviteRecords();
};

const handleRecordsPageChange = (page: number) => {
  recordsQuery.page = page;
  fetchInviteRecords();
};

onMounted(() => {
  fetchInvites();
  fetchInviteRecords();
  fetchStats();
});
</script>

<style scoped lang="scss">
.invite-list {
  min-height: calc(100vh - 120px);

  .el-card {
    height: 100%;
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

  .invite-code {
    font-family: monospace;
    font-size: 14px;
  }

  .use-count {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
    display: block;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .records-card {
    margin-top: 20px;
  }
}
</style>
