<template>
  <div class="traffic-page">
    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" v-loading="statsLoading">
          <div class="stat-content">
            <div class="stat-icon today">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">今日使用</div>
              <div class="stat-value">{{ formatTraffic(realtimeStats?.todayUsed || 0) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" v-loading="statsLoading">
          <div class="stat-content">
            <div class="stat-icon month">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">本月使用</div>
              <div class="stat-value">{{ formatTraffic(realtimeStats?.monthUsed || 0) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" v-loading="statsLoading">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总流量</div>
              <div class="stat-value">{{ formatTraffic(realtimeStats?.totalLimit || 0) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" v-loading="statsLoading">
          <div class="stat-content">
            <div class="stat-icon remaining">
              <el-icon><PieChart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">剩余流量</div>
              <div class="stat-value">{{ formatTraffic(realtimeStats?.remaining || 0) }}</div>
            </div>
          </div>
          <el-progress
            :percentage="realtimeStats?.usagePercent || 0"
            :status="(realtimeStats?.usagePercent || 0) > 80 ? 'exception' : ''"
            :show-text="false"
            class="usage-progress"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- Traffic Chart -->
    <el-card class="chart-card" v-loading="chartLoading">
      <template #header>
        <div class="card-header">
          <span>流量趋势</span>
          <div class="filter-controls">
            <el-radio-group v-model="dateRange" size="small" @change="handleDateRangeChange">
              <el-radio-button label="7">近7天</el-radio-button>
              <el-radio-button label="30">近30天</el-radio-button>
              <el-radio-button label="90">近90天</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-model="customDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              value-format="YYYY-MM-DD"
              @change="handleCustomDateChange"
            />
          </div>
        </div>
      </template>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>

    <!-- Traffic Details Table -->
    <el-card class="table-card" v-loading="tableLoading">
      <template #header>
        <div class="card-header">
          <span>流量明细</span>
          <el-button type="primary" size="small" @click="exportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </template>
      <el-table :data="trafficDetails" stripe style="width: 100%">
        <el-table-column prop="date" label="日期" min-width="120" />
        <el-table-column label="上传" min-width="120">
          <template #default="{ row }">
            <span class="upload-text">{{ formatTraffic(row.upload) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="下载" min-width="120">
          <template #default="{ row }">
            <span class="download-text">{{ formatTraffic(row.download) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总计" min-width="120">
          <template #default="{ row }">
            <span class="total-text">{{ formatTraffic(row.total) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="占比" min-width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="calculatePercent(row.total)"
              :show-text="true"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Calendar,
  DataLine,
  CircleCheck,
  PieChart,
  Download,
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import * as trafficApi from '@/api/traffic';
import type { TrafficStats, RealtimeTraffic } from '@/types/traffic';
import { formatTraffic } from '@/utils/format';

// Stats
const statsLoading = ref(false);
const realtimeStats = ref<RealtimeTraffic | null>(null);

// Chart
const chartLoading = ref(false);
const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;
const trafficTrend = ref<TrafficStats[]>([]);
const dateRange = ref('7');
const customDateRange = ref<[string, string] | null>(null);

// Table
const tableLoading = ref(false);
const trafficDetails = computed(() => trafficTrend.value.slice().reverse());

const maxTotal = computed(() => {
  if (trafficTrend.value.length === 0) return 1;
  return Math.max(...trafficTrend.value.map((item) => item.total));
});

const calculatePercent = (total: number): number => {
  if (maxTotal.value === 0) return 0;
  return Math.round((total / maxTotal.value) * 100);
};

const initChart = () => {
  if (!chartRef.value) return;

  chart = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chart) return;

  const dates = trafficTrend.value.map((item) => item.date);
  const uploads = trafficTrend.value.map((item) =>
    parseFloat((item.upload / 1024 / 1024 / 1024).toFixed(2))
  );
  const downloads = trafficTrend.value.map((item) =>
    parseFloat((item.download / 1024 / 1024 / 1024).toFixed(2))
  );
  const totals = trafficTrend.value.map((item) =>
    parseFloat((item.total / 1024 / 1024 / 1024).toFixed(2))
  );

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: unknown) => {
        const p = params as Array<{ axisValue: string; seriesName: string; value: number; color: string }>;
        let result = `<div style="font-weight:600;margin-bottom:5px">${p[0].axisValue}</div>`;
        p.forEach((param) => {
          const value = param.value;
          result += `<div style="display:flex;align-items:center;gap:8px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color}"></span>
            <span>${param.seriesName}:</span>
            <span style="font-weight:600">${value} GB</span>
          </div>`;
        });
        return result;
      },
    },
    legend: {
      data: ['上传', '下载', '总计'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: '流量 (GB)',
      axisLabel: {
        formatter: '{value} GB',
      },
    },
    series: [
      {
        name: '上传',
        type: 'line',
        data: uploads,
        smooth: true,
        areaStyle: {
          opacity: 0.1,
        },
        itemStyle: { color: '#67C23A' },
        lineStyle: { width: 2 },
      },
      {
        name: '下载',
        type: 'line',
        data: downloads,
        smooth: true,
        areaStyle: {
          opacity: 0.1,
        },
        itemStyle: { color: '#409EFF' },
        lineStyle: { width: 2 },
      },
      {
        name: '总计',
        type: 'line',
        data: totals,
        smooth: true,
        itemStyle: { color: '#E6A23C' },
        lineStyle: { width: 2, type: 'dashed' },
      },
    ],
  });
};

const fetchRealtimeStats = async () => {
  statsLoading.value = true;
  try {
    realtimeStats.value = await trafficApi.getRealtimeTraffic();
  } finally {
    statsLoading.value = false;
  }
};

const fetchTrafficTrend = async () => {
  chartLoading.value = true;
  tableLoading.value = true;
  try {
    const days = parseInt(dateRange.value);
    trafficTrend.value = await trafficApi.getTrafficTrend(days);
    updateChart();
  } finally {
    chartLoading.value = false;
    tableLoading.value = false;
  }
};

const fetchTrafficStats = async () => {
  if (!customDateRange.value) return;

  chartLoading.value = true;
  tableLoading.value = true;
  try {
    trafficTrend.value = await trafficApi.getTrafficStats({
      startDate: customDateRange.value[0],
      endDate: customDateRange.value[1],
      groupBy: 'day',
    });
    updateChart();
  } finally {
    chartLoading.value = false;
    tableLoading.value = false;
  }
};

const handleDateRangeChange = () => {
  customDateRange.value = null;
  fetchTrafficTrend();
};

const handleCustomDateChange = () => {
  if (customDateRange.value) {
    fetchTrafficStats();
  }
};

const exportData = () => {
  const data = trafficDetails.value.map((item) => ({
    日期: item.date,
    上传: formatTraffic(item.upload),
    下载: formatTraffic(item.download),
    总计: formatTraffic(item.total),
  }));

  const csvContent = [
    Object.keys(data[0] || {}).join(','),
    ...data.map((row) => Object.values(row).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `流量统计_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  ElMessage.success('数据导出成功');
};

onMounted(() => {
  fetchRealtimeStats();
  fetchTrafficTrend();
  initChart();
  window.addEventListener('resize', () => chart?.resize());
});

onUnmounted(() => {
  chart?.dispose();
  window.removeEventListener('resize', () => chart?.resize());
});
</script>

<style scoped lang="scss">
.traffic-page {
  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      margin-bottom: 20px;

      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;

          .el-icon {
            font-size: 28px;
          }

          &.today {
            background-color: #ecf5ff;
            color: #409eff;
          }

          &.month {
            background-color: #f0f9eb;
            color: #67c23a;
          }

          &.total {
            background-color: #f5f7fa;
            color: #909399;
          }

          &.remaining {
            background-color: #fdf6ec;
            color: #e6a23c;
          }
        }

        .stat-info {
          .stat-label {
            color: #909399;
            font-size: 14px;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 22px;
            font-weight: 600;
            color: #303133;
          }
        }
      }

      .usage-progress {
        margin-top: 12px;
      }
    }
  }

  .chart-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      .filter-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
    }

    .chart-container {
      height: 350px;
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .upload-text {
      color: #67c23a;
      font-weight: 500;
    }

    .download-text {
      color: #409eff;
      font-weight: 500;
    }

    .total-text {
      color: #303133;
      font-weight: 600;
    }
  }
}
</style>
