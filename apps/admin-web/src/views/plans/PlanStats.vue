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
          <el-button type="primary" @click="fetchStats">
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
      <el-table :data="topPlans" stripe>
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts';
import { Refresh, User, Wallet, TrendCharts, Money } from '@element-plus/icons-vue';
import { PRESET_PLANS } from '@shared/constants/service-type.mjs';

const route = useRoute();

// Data
const plans = PRESET_PLANS.map((p) => ({ id: p.id, name: p.name }));
const selectedPlan = ref(route.query.planId as string || '');
const dateRange = ref<[Date, Date]>([new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()]);
const subscriberTimeRange = ref('30d');

// Summary
const summary = reactive({
  totalSubscribers: 1730,
  totalRevenue: 45680.5,
  newSubscribers: 156,
  avgRevenuePerUser: 26.4,
});

// Top plans
const topPlans = ref([
  { name: '专线-标准版', subscriberCount: 450, revenue: 22495.5, conversionRate: 35, growth: 12.5 },
  { name: '标准-专业版', subscriberCount: 380, revenue: 7596.2, conversionRate: 28, growth: 8.3 },
  { name: '专线-入门版', subscriberCount: 290, revenue: 8697.1, conversionRate: 22, growth: -2.1 },
  { name: '标准-轻量版', subscriberCount: 250, revenue: 2497.5, conversionRate: 18, growth: 5.7 },
  { name: '专线-高级版', subscriberCount: 180, revenue: 14398.2, conversionRate: 15, growth: 18.9 },
]);

// Chart refs
const subscriberChartRef = ref<HTMLDivElement>();
const revenueChartRef = ref<HTMLDivElement>();
const distributionChartRef = ref<HTMLDivElement>();

let subscriberChart: echarts.ECharts | null = null;
let revenueChart: echarts.ECharts | null = null;
let distributionChart: echarts.ECharts | null = null;

const getConversionColor = (rate: number): string => {
  if (rate >= 30) return '#67c23a';
  if (rate >= 20) return '#e6a23c';
  return '#f56c6c';
};

const initCharts = () => {
  // Subscriber trend chart
  if (subscriberChartRef.value) {
    subscriberChart = echarts.init(subscriberChartRef.value);
    const days = subscriberTimeRange.value === '7d' ? 7 : subscriberTimeRange.value === '30d' ? 30 : 90;
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - i - 1));
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    subscriberChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: '用户数' },
      series: [
        {
          name: '新增订阅',
          type: 'bar',
          data: Array.from({ length: days }, () => Math.floor(Math.random() * 20) + 5),
          itemStyle: { color: '#409eff' },
        },
        {
          name: '累计订阅',
          type: 'line',
          smooth: true,
          data: Array.from({ length: days }, (_, i) => 1500 + i * 5 + Math.floor(Math.random() * 50)),
          itemStyle: { color: '#67c23a' },
        },
      ],
    });
  }

  // Revenue chart
  if (revenueChartRef.value) {
    revenueChart = echarts.init(revenueChartRef.value);
    revenueChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      },
      yAxis: { type: 'value', name: '收入 (USD)' },
      series: [
        {
          name: '月收入',
          type: 'bar',
          data: [3200, 4500, 5200, 6100, 7200, 8500],
          itemStyle: { color: '#67c23a' },
        },
        {
          name: '累计收入',
          type: 'line',
          smooth: true,
          data: [3200, 7700, 12900, 19000, 26200, 34700],
          itemStyle: { color: '#409eff' },
        },
      ],
    });
  }

  // Distribution chart
  if (distributionChartRef.value) {
    distributionChart = echarts.init(distributionChartRef.value);
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
          data: [
            { value: 450, name: '专线-标准版', itemStyle: { color: '#409eff' } },
            { value: 380, name: '标准-专业版', itemStyle: { color: '#67c23a' } },
            { value: 290, name: '专线-入门版', itemStyle: { color: '#e6a23c' } },
            { value: 250, name: '标准-轻量版', itemStyle: { color: '#909399' } },
            { value: 180, name: '专线-高级版', itemStyle: { color: '#f56c6c' } },
            { value: 180, name: '其他', itemStyle: { color: '#dcdfe6' } },
          ],
        },
      ],
    });
  }
};

const fetchStats = () => {
  // Mock API call
  nextTick(() => {
    initCharts();
  });
};

// Watch for time range changes
watch(subscriberTimeRange, () => {
  nextTick(() => {
    initCharts();
  });
});

// Lifecycle
onMounted(() => {
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
