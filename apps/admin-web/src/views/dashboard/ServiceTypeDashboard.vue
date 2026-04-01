<template>
  <div class="service-type-dashboard">
    <!-- Header -->
    <el-card class="header-card">
      <div class="header-content">
        <div>
          <h2>服务类型监控仪表盘</h2>
          <p class="subtitle">实时监控各服务类型的运行状态和性能指标</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Service Type Overview Cards -->
    <el-row :gutter="20" class="overview-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="type in serviceTypes" :key="type">
        <el-card
          class="service-card"
          :class="{ 'is-premium': isPremiumType(type) }"
          shadow="hover"
        >
          <div class="service-header">
            <div
              class="service-icon"
              :style="{ backgroundColor: getServiceTypeBgColor(type), color: getServiceTypeColor(type) }"
            >
              <el-icon :size="28">
                <component :is="getIconComponent(getServiceTypeIcon(type))" />
              </el-icon>
            </div>
            <div class="service-info">
              <h3>{{ getServiceTypeLabel(type) }}</h3>
              <el-tag
                :type="getNodeCount(type) > 0 ? 'success' : 'info'"
                size="small"
                effect="dark"
              >
                {{ getNodeCount(type) > 0 ? '运行中' : '无节点' }}
              </el-tag>
            </div>
          </div>

          <div class="service-metrics">
            <div class="metric">
              <div class="metric-value" :style="{ color: getServiceTypeColor(type) }">
                {{ getNodeCount(type) }}
              </div>
              <div class="metric-label">节点</div>
            </div>
            <div class="metric">
              <div class="metric-value" :style="{ color: getServiceTypeColor(type) }">
                {{ getUserCount(type) }}
              </div>
              <div class="metric-label">用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Distribution Charts -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>节点分布</span>
            </div>
          </template>
          <div ref="nodeDistributionChartRef" class="chart-container"></div>
          <el-empty v-if="!hasData" description="暂无数据" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>服务类型统计</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item v-for="type in serviceTypes" :key="type" :label="getServiceTypeLabel(type)">
              {{ getNodeCount(type) }} 节点 / {{ getUserCount(type) }} 用户
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue';
import * as echarts from 'echarts';
import { Refresh } from '@element-plus/icons-vue';
import {
  ServiceType,
  getAllServiceTypes,
  getServiceTypeLabel,
  getServiceTypeColor,
  getServiceTypeBgColor,
  getServiceTypeIcon,
} from '@shared/constants/service-type.mjs';
import { getIconComponent } from '@utils/icon-map';
import { getNodeStats } from '@api/nodes';
import { ElMessage } from 'element-plus';

const serviceTypes = getAllServiceTypes();

// Chart refs
const nodeDistributionChartRef = ref<HTMLDivElement>();
let nodeDistributionChart: echarts.ECharts | null = null;

// Service metrics from API
const serviceTypeStats = reactive<Record<ServiceType, { nodeCount: number; userCount: number }>>({
  [ServiceType.STANDARD]: { nodeCount: 0, userCount: 0 },
  [ServiceType.DEDICATED_LINE]: { nodeCount: 0, userCount: 0 },
  [ServiceType.EXCLUSIVE]: { nodeCount: 0, userCount: 0 },
  [ServiceType.STATIC_RESIDENTIAL]: { nodeCount: 0, userCount: 0 },
});

const hasData = computed(() => {
  return Object.values(serviceTypeStats).some(stat => stat.nodeCount > 0);
});

const getNodeCount = (type: ServiceType): number => {
  return serviceTypeStats[type]?.nodeCount || 0;
};

const getUserCount = (type: ServiceType): number => {
  return serviceTypeStats[type]?.userCount || 0;
};

const isPremiumType = (type: ServiceType): boolean => {
  return type === ServiceType.DEDICATED_LINE || type === ServiceType.EXCLUSIVE || type === ServiceType.STATIC_RESIDENTIAL;
};

const fetchData = async () => {
  try {
    const res = await getNodeStats();
    
    // Get service type distribution from API
    const serviceTypeDist = res.serviceTypeDistribution || {};
    
    serviceTypeStats[ServiceType.STANDARD] = { 
      nodeCount: serviceTypeDist['standard'] || 0, 
      userCount: 0 
    };
    serviceTypeStats[ServiceType.DEDICATED_LINE] = { 
      nodeCount: serviceTypeDist['dedicated_line'] || 0, 
      userCount: 0 
    };
    serviceTypeStats[ServiceType.EXCLUSIVE] = { 
      nodeCount: serviceTypeDist['exclusive'] || 0, 
      userCount: 0 
    };
    serviceTypeStats[ServiceType.STATIC_RESIDENTIAL] = { 
      nodeCount: serviceTypeDist['static_residential'] || 0, 
      userCount: 0 
    };
    
    nextTick(() => {
      initCharts();
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    ElMessage.error('获取统计数据失败');
  }
};

const initCharts = () => {
  if (!hasData.value) return;
  
  // Node distribution pie chart
  if (nodeDistributionChartRef.value) {
    if (nodeDistributionChart) {
      nodeDistributionChart.dispose();
    }
    nodeDistributionChart = echarts.init(nodeDistributionChartRef.value);
    nodeDistributionChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '5%' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: serviceTypes
          .filter(type => getNodeCount(type) > 0)
          .map((type) => ({
            value: getNodeCount(type),
            name: getServiceTypeLabel(type),
            itemStyle: { color: getServiceTypeColor(type) },
          })),
      }],
    });
  }
};

const refreshData = () => {
  fetchData();
};

// Lifecycle
onMounted(() => {
  fetchData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  nodeDistributionChart?.dispose();
});

const handleResize = () => {
  nodeDistributionChart?.resize();
};
</script>

<style scoped lang="scss">
.service-type-dashboard {
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

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }
  }

  .overview-row {
    margin-bottom: 20px;

    .service-card {
      margin-bottom: 20px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
      }

      &.is-premium {
        border: 1px solid #f59e0b;
      }

      .service-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .service-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .service-info {
          h3 {
            margin: 0 0 4px 0;
            font-size: 18px;
            color: #303133;
          }
        }
      }

      .service-metrics {
        display: flex;
        justify-content: space-around;
        padding: 12px 0;
        background-color: #f5f7fa;
        border-radius: 8px;

        .metric {
          text-align: center;

          .metric-value {
            font-size: 24px;
            font-weight: 600;
          }

          .metric-label {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }

  .charts-row {
    margin-bottom: 20px;

    .chart-container {
      height: 300px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
}
</style>
