<template>
  <div class="service-type-list">
    <!-- Header -->
    <el-card class="header-card">
      <div class="header-content">
        <div>
          <h2>服务类型管理</h2>
          <p class="subtitle">管理系统支持的服务类型及其配置</p>
        </div>
        <el-button type="primary" :loading="loading" @click="handleRefresh">
          <el-icon v-if="!loading"><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </el-card>

    <!-- Service Type Cards -->
    <el-row :gutter="20" class="cards-row">
      <el-col
        v-for="type in serviceTypes"
        :key="type"
        :xs="24"
        :sm="12"
        :lg="8"
        class="card-col"
      >
        <ServiceTypeCard
          :type="type"
          v-model:enabled="enabledMap[type]"
          :stats="statsMap[type]"
          @edit="handleEdit"
          @view-nodes="handleViewNodes"
        />
      </el-col>
    </el-row>

    <!-- Overview Stats -->
    <el-card class="overview-card">
      <template #header>
        <div class="card-header">
          <span>全局统计</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="overview-stat">
            <div class="stat-icon" style="background-color: #409eff;">
              <el-icon :size="24" color="#fff"><Collection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalStats.totalNodes }}</div>
              <div class="stat-label">总节点数</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="overview-stat">
            <div class="stat-icon" style="background-color: #67c23a;">
              <el-icon :size="24" color="#fff"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalStats.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="overview-stat">
            <div class="stat-icon" style="background-color: #e6a23c;">
              <el-icon :size="24" color="#fff"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalStats.activeUsers }}</div>
              <div class="stat-label">在线用户</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="overview-stat">
            <div class="stat-icon" style="background-color: #909399;">
              <el-icon :size="24" color="#fff"><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatTraffic(totalStats.totalTraffic) }}</div>
              <div class="stat-label">今日总流量</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Service Type Distribution Chart -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>节点分布</span>
            </div>
          </template>
          <div ref="nodeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户分布</span>
            </div>
          </template>
          <div ref="userChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Edit Dialog -->
    <ServiceTypeEditDialog
      v-model="editDialogVisible"
      :service-type="editingType"
      @submit="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Refresh, Collection, User, TrendCharts, DataLine } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import ServiceTypeCard from '@components/service-types/ServiceTypeCard.vue';
import ServiceTypeEditDialog from '@components/service-types/ServiceTypeEditDialog.vue';
import { ServiceType, ServiceTypeMeta, getAllServiceTypes } from '@shared/constants/service-type.mjs';
import * as nodesApi from '@api/nodes';

const router = useRouter();

// Service types
const serviceTypes = getAllServiceTypes();

// Enabled status map
const enabledMap = reactive<Record<ServiceType, boolean>>({
  [ServiceType.STANDARD]: true,
  [ServiceType.DEDICATED_LINE]: true,
  [ServiceType.EXCLUSIVE]: true,
  [ServiceType.STATIC_RESIDENTIAL]: true,
});

// Stats map
interface TypeStats {
  nodeCount: number;
  userCount: number;
  activeUsers: number;
  trafficUsed: number;
}

const statsMap = reactive<Record<ServiceType, TypeStats>>({
  [ServiceType.STANDARD]: { nodeCount: 0, userCount: 0, activeUsers: 0, trafficUsed: 0 },
  [ServiceType.DEDICATED_LINE]: { nodeCount: 0, userCount: 0, activeUsers: 0, trafficUsed: 0 },
  [ServiceType.EXCLUSIVE]: { nodeCount: 0, userCount: 0, activeUsers: 0, trafficUsed: 0 },
  [ServiceType.STATIC_RESIDENTIAL]: { nodeCount: 0, userCount: 0, activeUsers: 0, trafficUsed: 0 },
});

// Total stats
const totalStats = reactive({
  totalNodes: 0,
  totalUsers: 0,
  activeUsers: 0,
  totalTraffic: 0,
});

// Loading state
const loading = ref(false);

// Edit dialog
const editDialogVisible = ref(false);
const editingType = ref<ServiceType | null>(null);

// Chart refs
const nodeChartRef = ref<HTMLDivElement>();
const userChartRef = ref<HTMLDivElement>();
let nodeChart: echarts.ECharts | null = null;
let userChart: echarts.ECharts | null = null;

// Fetch stats from real API
const fetchStats = async () => {
  loading.value = true;
  try {
    // Get node stats from API
    const nodeStats = await nodesApi.getNodeStats();

    // Get service type distribution from API
    const serviceTypeDist = nodeStats.serviceTypeDistribution || {};

    // Map API response to stats format
    const apiData: Record<ServiceType, TypeStats> = {
      [ServiceType.STANDARD]: {
        nodeCount: serviceTypeDist['standard'] || 0,
        userCount: 0, // API doesn't provide user count per service type yet
        activeUsers: 0,
        trafficUsed: 0,
      },
      [ServiceType.DEDICATED_LINE]: {
        nodeCount: serviceTypeDist['dedicated_line'] || 0,
        userCount: 0,
        activeUsers: 0,
        trafficUsed: 0,
      },
      [ServiceType.EXCLUSIVE]: {
        nodeCount: serviceTypeDist['exclusive'] || 0,
        userCount: 0,
        activeUsers: 0,
        trafficUsed: 0,
      },
      [ServiceType.STATIC_RESIDENTIAL]: {
        nodeCount: serviceTypeDist['static_residential'] || 0,
        userCount: 0,
        activeUsers: 0,
        trafficUsed: 0,
      },
    };

    Object.assign(statsMap, apiData);

    // Calculate totals
    totalStats.totalNodes = nodeStats.total || 0;
    totalStats.totalUsers = 0; // Not provided by this API
    totalStats.activeUsers = nodeStats.totalConnections || 0;
    totalStats.totalTraffic = 0;

    // Update charts
    nextTick(() => {
      initCharts();
    });

    ElMessage.success('统计数据已刷新');
  } catch (error) {
    ElMessage.error('获取统计数据失败');
    console.error('Failed to fetch stats:', error);
  } finally {
    loading.value = false;
  }
};

// Initialize charts
const initCharts = () => {
  if (nodeChartRef.value) {
    nodeChart = echarts.init(nodeChartRef.value);
    const nodeOption = {
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data: serviceTypes.map((type) => ({
            value: statsMap[type].nodeCount,
            name: ServiceTypeMeta[type].label,
            itemStyle: { color: ServiceTypeMeta[type].color },
          })),
        },
      ],
    };
    nodeChart.setOption(nodeOption);
  }

  if (userChartRef.value) {
    userChart = echarts.init(userChartRef.value);
    const userOption = {
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data: serviceTypes.map((type) => ({
            value: statsMap[type].userCount,
            name: ServiceTypeMeta[type].label,
            itemStyle: { color: ServiceTypeMeta[type].color },
          })),
        },
      ],
    };
    userChart.setOption(userOption);
  }
};

// Handle refresh
const handleRefresh = () => {
  fetchStats();
};

// Handle edit
const handleEdit = (type: ServiceType) => {
  editingType.value = type;
  editDialogVisible.value = true;
};

// Handle save
const handleSave = (data: {
  type: ServiceType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  priority: number;
}) => {
  // In a real app, you would save to backend
  // For now, just update the local ServiceTypeMeta (in memory only)
  ServiceTypeMeta[data.type] = {
    ...ServiceTypeMeta[data.type],
    label: data.label,
    description: data.description,
    color: data.color,
    bgColor: data.bgColor,
    icon: data.icon,
    priority: data.priority,
  };
  ElMessage.success('服务类型配置已更新');
};

// Handle view nodes
const handleViewNodes = (type: ServiceType) => {
  router.push({
    path: '/nodes',
    query: { serviceType: type },
  });
};

// Format traffic
const formatTraffic = (bytes: number): string => {
  if (bytes === 0) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb < 1) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (gb < 1024) return `${gb.toFixed(2)} GB`;
  return `${(gb / 1024).toFixed(2)} TB`;
};

// Lifecycle
onMounted(() => {
  fetchStats();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  nodeChart?.dispose();
  userChart?.dispose();
});

const handleResize = () => {
  nodeChart?.resize();
  userChart?.resize();
};
</script>

<style scoped lang="scss">
.service-type-list {
  min-height: calc(100vh - 120px);

  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }

      .subtitle {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .cards-row {
    margin-bottom: 20px;

    .card-col {
      margin-bottom: 20px;
    }
  }

  .overview-card {
    margin-bottom: 20px;

    .overview-stat {
      display: flex;
      align-items: center;
      padding: 16px;
      background-color: #f5f7fa;
      border-radius: 8px;

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }

      .stat-info {
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
  }

  .charts-row {
    .chart-container {
      height: 300px;
    }
  }

  .card-header {
    font-weight: 600;
  }
}
</style>
