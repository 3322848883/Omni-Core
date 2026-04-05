<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="24" color="#fff">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header>
            <span>流量趋势</span>
          </template>
          <div class="chart-container">
            <v-chart v-if="hasTrafficData" class="chart" :option="trafficChartOption" autoresize />
            <el-empty v-else description="暂无流量数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header>
            <span>用户分布</span>
          </template>
          <div class="chart-container">
            <v-chart v-if="hasUserData" class="chart" :option="userChartOption" autoresize />
            <el-empty v-else description="暂无用户数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Activities -->
    <el-card class="activity-card">
      <template #header>
        <span>最近活动</span>
      </template>
      <el-timeline v-if="activities.length > 0">
        <el-timeline-item
          v-for="activity in activities"
          :key="activity.id"
          :type="activity.type"
          :timestamp="activity.time"
        >
          {{ activity.content }}
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无活动记录" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { ElMessage } from 'element-plus';
import {
  getDashboardStats,
  getTrafficTrend,
  getUserDistribution,
  getRecentActivities,
  type DashboardStats,
  type TrafficTrend,
  type UserDistribution,
  type RecentActivity,
} from '../../api/dashboard';

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
]);

// Stats data
const stats = ref([
  { title: '总用户数', value: '0', icon: 'User', color: '#409EFF' },
  { title: '今日流量', value: '0 GB', icon: 'DataLine', color: '#67C23A' },
  { title: '在线用户', value: '0', icon: 'UserFilled', color: '#E6A23C' },
  { title: '本月收入', value: '$0', icon: 'Money', color: '#F56C6C' },
]);

// Traffic data
const trafficData = ref<TrafficTrend[]>([]);
const hasTrafficData = computed(() => trafficData.value.length > 0);

// Traffic chart option
const trafficChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: trafficData.value.map(item => item.date),
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '上传',
      type: 'line',
      data: trafficData.value.map(item => item.upload),
      smooth: true,
    },
    {
      name: '下载',
      type: 'line',
      data: trafficData.value.map(item => item.download),
      smooth: true,
    },
  ],
}));

// User distribution data
const userDistribution = ref<UserDistribution[]>([]);
const hasUserData = computed(() => userDistribution.value.length > 0);

// User chart option
const userChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      data: userDistribution.value.map(item => ({
        value: item.count,
        name: item.status,
      })),
    },
  ],
}));

// Activities
const activities = ref<RecentActivity[]>([]);

// Format bytes to human readable
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
};

// Load dashboard data
const loadDashboardData = async () => {
  try {
    // Load stats
    const dashboardStats: DashboardStats = await getDashboardStats();
    stats.value = [
      { title: '总用户数', value: dashboardStats.totalUsers.toString(), icon: 'User', color: '#409EFF' },
      { title: '今日流量', value: formatBytes(dashboardStats.todayTotal), icon: 'DataLine', color: '#67C23A' },
      { title: '在线用户', value: dashboardStats.activeUsers.toString(), icon: 'UserFilled', color: '#E6A23C' },
      { title: '本月收入', value: `$${dashboardStats.monthlyRevenue}`, icon: 'Money', color: '#F56C6C' },
      { title: '总节点数', value: dashboardStats.totalNodes.toString(), icon: 'Monitor', color: '#909399' },
      { title: '在线节点', value: dashboardStats.onlineNodes.toString(), icon: 'Connection', color: '#67C23A' },
      { title: '总订单数', value: dashboardStats.totalOrders.toString(), icon: 'ShoppingCart', color: '#E6A23C' },
      { title: '待处理订单', value: dashboardStats.pendingOrders.toString(), icon: 'Timer', color: '#F56C6C' },
    ];

    // Load traffic trend
    try {
      const trend = await getTrafficTrend(7);
      trafficData.value = trend || [];
    } catch (error) {
      console.log('No traffic data available');
      trafficData.value = [];
    }

    // Load user distribution
    try {
      const distribution = await getUserDistribution();
      userDistribution.value = distribution || [];
    } catch (error) {
      console.log('No user distribution data available');
      userDistribution.value = [];
    }

    // Load recent activities
    try {
      const acts = await getRecentActivities();
      activities.value = acts || [];
    } catch (error) {
      console.log('No activities available');
      activities.value = [];
    }
  } catch (error) {
    ElMessage.error('加载仪表盘数据失败');
    console.error('Failed to load dashboard data:', error);
  }
};

// Load data on mount
onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped lang="scss">
.dashboard {
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

  .chart-row {
    margin-bottom: 20px;

    .chart-container {
      height: 300px;

      .chart {
        width: 100%;
        height: 100%;
      }
    }
  }

  .activity-card {
    .el-timeline {
      padding-left: 10px;

      .el-timeline-item {
        .el-timeline-item__node {
          background: #00ffff;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .el-timeline-item__content {
          color: #e6e6e6;
        }

        .el-timeline-item__timestamp {
          color: #8a94a6;
        }
      }
    }
  }

  .el-empty {
    color: #8a94a6;
  }
}
</style>
