<template>
  <div class="plan-stats">
    <!-- Header -->
    <el-card class="header-card">
      <div class="header-content">
        <div>
          <h2>套餐统计报表</h2>
          <p class="subtitle">查看套餐订阅趋势和收入统计</p>
        </div>
        <div class="header-actions">
          <el-select v-model="selectedPlan" placeholder="全部套餐" clearable style="width: 200px">
            <el-option
              v-for="plan in plans"
              :key="plan.id"
              :label="plan.name"
              :value="plan.id"
            />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
          <el-button type="primary" @click="fetchStats" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Summary Cards -->
    <el-row :gutter="20" class="summary-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-content">
            <div class="summary-icon" style="background-color: #409eff;">
              <el-icon :size="24" color="#fff"><User /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-value">{{ summary.totalSubscribers }}</div>
              <div class="summary-label">总订阅用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-content">
            <div class="summary-icon" style="background-color: #67c23a;">
              <el-icon :size="24" color="#fff"><Wallet /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-value">${{ summary.totalRevenue.toFixed(2) }}</div>
              <div class="summary-label">总收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-content">
            <div class="summary-icon" style="background-color: #e6a23c;">
              <el-icon :size="24" color="#fff"><TrendCharts /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-value">{{ summary.newSubscribers }}</div>
              <div class="summary-label">新增订阅</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-content">
            <div class="summary-icon" style="background-color: #909399;">
              <el-icon :size="24" color="#fff"><Money /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-value">${{ summary.avgRevenuePerUser.toFixed(2) }}</div>
              <div class="summary-label">客单价</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订阅用户趋势</span>
              <el-radio-group v-model="subscriberTimeRange" size="small">
                <el-radio-button label="7d">近7天</el-radio-button>
                <el-radio-button label="30d">近30天</el-radio-button>
                <el-radio-button label="90d">近90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="subscriberChartRef" class="chart-container"></div>
          <el-empty v-if="!hasSubscriberData" description="暂无订阅数据" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>收入统计</span>
            </div>
          </template>
          <div ref="revenueChartRef" class="chart-container"></div>
          <el-empty v-if="!hasRevenueData" description="暂无收入数据" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>套餐分布</span>
            </div>
          </template>
          <div ref="distributionChartRef" class="chart-container"></div>
          <el-empty v-if="!hasDistributionData" description="暂无套餐分布数据" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Top Plans Table -->
    <el-card class="top-plans-card">
      <template #header>
        <div class="card-header">
          <span>热门套餐排行</span>
        </div>
      </template>
      <el-table :data="topPlans" stripe v-loading="loading">
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="name" label="套餐名称" />
        <el-table-column prop="subscriberCount" label="订阅数" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.subscriberCount }} 人</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="revenue" label="收入" width="150">
          <template #default="{ row }">
            <span class="price">${{ row.revenue.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="conversionRate" label="转化率" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.conversionRate" :color="getConversionColor(row.conversionRate)" />
          </template>
        </el-table-column>
        <el-table-column prop="growth" label="增长率" width="120">
          <template #default="{ row }">
            <span :class="{ 'growth-up': row.growth > 0, 'growth-down': row.growth < 0 }">
              {{ row.growth > 0 ? '+' : '' }}{{ row.growth }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="topPlans.length === 0 && !loading" description="暂无套餐数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts';
import { Refresh, User, Wallet, TrendCharts, Money } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getPlans, getPlansOverviewStats, type PlansOverviewStats, type Plan } from '@/api/plans';

const route = useRoute();

// Data
const plans = ref<Plan[]>([]);
const selectedPlan = ref(route.query.planId as string || '');
const dateRange = ref<[Date, Date]>([new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()]);
const subscriberTimeRange = ref('30d');
const loading = ref(false);

// Summary
const summary = reactive({
  totalSubscribers: 0,
  totalRevenue: 0,
  newSubscribers: 0,
  avgRevenuePerUser: 0,
});

// Stats data
const statsData = ref<PlansOverviewStats | null>(null);

// Top plans
const topPlans = ref<PlansOverviewStats['topPlans']>([]);

// Chart refs
const subscriberChartRef = ref<HTMLDivElement>();
const revenueChartRef = ref<HTMLDivElement>();
const distributionChartRef = ref<HTMLDivElement>();

let subscriberChart: echarts.ECharts | null = null;
let revenueChart: echarts.ECharts | null = null;
let distributionChart: echarts.ECharts | null = null;

// Computed
const hasSubscriberData = computed(() => {
  return statsData.value?.subscriberTrend && statsData.value.subscriberTrend.length > 0;
});

const hasRevenueData = computed(() => {
  return statsData.value?.revenueTrend && statsData.value.revenueTrend.length > 0;
});

const hasDistributionData = computed(() => {
  return statsData.value?.plansDistribution && statsData.value.plansDistribution.length > 0;
});

const getConversionColor = (rate: number): string => {
  if (rate >= 30) return '#67c23a';
  if (rate >= 20) return '#e6a23c';
  return '#f56c6c';
};

// Load plans list
const loadPlans = async () => {
  try {
    const response = await getPlans({ limit: 100 });
    plans.value = response.data?.items || [];
  } catch (error) {
    console.error('Failed to load plans:', error);
    plans.value = [];
  }
};

// Initialize charts with real data
const initCharts = () => {
  if (!statsData.value) return;

  // Subscriber trend chart
  if (subscriberChartRef.value && hasSubscriberData.value) {
    subscriberChart = echarts.init(subscriberChartRef.value);
    const trendData = statsData.value.subscriberTrend;
    const dates = trendData.map(item => item.date);
    const newSubscribers = trendData.map(item => item.newSubscribers);
    const totalSubscribers = trendData.map(item => item.totalSubscribers);

    subscriberChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: '用户数' },
      series: [
        {
          name: '新增订阅',
          type: 'bar',
          data: newSubscribers,
          itemStyle: { color: '#409eff' },
        },
        {
          name: '累计订阅',
          type: 'line',
          smooth: true,
          data: totalSubscribers,
          itemStyle: { color: '#67c23a' },
        },
      ],
    });
  }

  // Revenue chart
  if (revenueChartRef.value && hasRevenueData.value) {
    revenueChart = echarts.init(revenueChartRef.value);
    const revenueData = statsData.value.revenueTrend;
    const months = revenueData.map(item => item.month);
    const revenues = revenueData.map(item => item.revenue);
    const cumulative = revenueData.map(item => item.cumulative);

    revenueChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: months,
      },
      yAxis: { type: 'value', name: '收入 (USD)' },
      series: [
        {
          name: '月收入',
          type: 'bar',
          data: revenues,
          itemStyle: { color: '#67c23a' },
        },
        {
          name: '累计收入',
          type: 'line',
          smooth: true,
          data: cumulative,
          itemStyle: { color: '#409eff' },
        },
      ],
    });
  }

  // Distribution chart
  if (distributionChartRef.value && hasDistributionData.value) {
    distributionChart = echarts.init(distributionChartRef.value);
    const distributionData = statsData.value.plansDistribution;

    distributionChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
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
            label: { show: true, fontSize: 16, fontWeight: 'bold' },
          },
          data: distributionData.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: ['#409eff', '#67c23a', '#e6a23c', '#909399', '#f56c6c', '#dcdfe6'][index % 6]
            }
          })),
        },
      ],
    });
  }
};

// Fetch stats from API
const fetchStats = async () => {
  loading.value = true;
  try {
    const params: { startDate?: string; endDate?: string; planId?: string } = {};

    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
      params.startDate = dateRange.value[0].toISOString().split('T')[0];
      params.endDate = dateRange.value[1].toISOString().split('T')[0];
    }

    if (selectedPlan.value) {
      params.planId = selectedPlan.value;
    }

    const response = await getPlansOverviewStats(params);
    const data = response.data;

    // Update summary with safe access
    if (data) {
      summary.totalSubscribers = data.totalSubscribers || 0;
      summary.totalRevenue = data.totalRevenue || 0;
      summary.newSubscribers = data.newSubscribers || 0;
      summary.avgRevenuePerUser = data.avgRevenuePerUser || 0;
      topPlans.value = data.topPlans || [];
      statsData.value = data;
    } else {
      // Reset to defaults if no data
      summary.totalSubscribers = 0;
      summary.totalRevenue = 0;
      summary.newSubscribers = 0;
      summary.avgRevenuePerUser = 0;
      topPlans.value = [];
      statsData.value = null;
    }

    nextTick(() => {
      initCharts();
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    ElMessage.error('获取统计数据失败');
    // Reset data on error
    summary.totalSubscribers = 0;
    summary.totalRevenue = 0;
    summary.newSubscribers = 0;
    summary.avgRevenuePerUser = 0;
    topPlans.value = [];
    statsData.value = null;
  } finally {
    loading.value = false;
  }
};

// Watch for time range changes
watch(subscriberTimeRange, () => {
  // In real implementation, this would refetch data with different time range
  nextTick(() => {
    initCharts();
  });
});

// Lifecycle
onMounted(() => {
  loadPlans();
  fetchStats();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  subscriberChart?.dispose();
  revenueChart?.dispose();
  distributionChart?.dispose();
});

const handleResize = () => {
  subscriberChart?.resize();
  revenueChart?.resize();
  distributionChart?.resize();
};
</script>

<style scoped lang="scss">
.plan-stats {
  min-height: calc(100vh - 120px);

  .el-card {
    height: 100%;
  }

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

  .summary-row {
    margin-bottom: 20px;

    .summary-card {
      margin-bottom: 20px;

      .summary-content {
        display: flex;
        align-items: center;

        .summary-icon {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
        }

        .summary-info {
          .summary-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }

          .summary-label {
            font-size: 14px;
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
      height: 350px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .top-plans-card {
    .price {
      font-weight: 600;
      color: #f56c6c;
    }

    .growth-up {
      color: #67c23a;
    }

    .growth-down {
      color: #f56c6c;
    }
  }
}
</style>
