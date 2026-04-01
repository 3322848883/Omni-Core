<template>
  <div class="traffic-monitor">
    <!-- Overview Stats -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409EFF;">
              <el-icon :size="24" color="#fff"><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatTraffic(overview.todayTotal) }}</div>
              <div class="stat-title">今日流量</div>
              <div class="stat-detail">
                <span class="upload">↑ {{ formatTraffic(overview.todayUpload) }}</span>
                <span class="download">↓ {{ formatTraffic(overview.todayDownload) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <el-icon :size="24" color="#fff"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatTraffic(overview.monthTotal) }}</div>
              <div class="stat-title">本月流量</div>
              <div class="stat-detail">
                <span class="upload">↑ {{ formatTraffic(overview.monthUpload) }}</span>
                <span class="download">↓ {{ formatTraffic(overview.monthDownload) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <el-icon :size="24" color="#fff"><PieChartIcon /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatTraffic(overview.totalTraffic) }}</div>
              <div class="stat-title">总流量</div>
              <div class="stat-detail">
                <span class="upload">↑ {{ formatTraffic(overview.totalUpload) }}</span>
                <span class="download">↓ {{ formatTraffic(overview.totalDownload) }}</span>
              </div>
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
            <div class="card-header">
              <span>流量趋势</span>
              <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
                <el-radio-button label="7d">近7天</el-radio-button>
                <el-radio-button label="30d">近30天</el-radio-button>
                <el-radio-button label="90d">近90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="trafficChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header>
            <span>节点流量分布</span>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="nodeChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Node Traffic Stats -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>节点流量排行</span>
          <el-button type="primary" link @click="refreshData">刷新</el-button>
        </div>
      </template>
      <el-table :data="nodeStats" v-loading="loading" stripe>
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="nodeName" label="节点名称" min-width="150" />
        <el-table-column prop="upload" label="上传" width="120">
          <template #default="{ row }">
            <span class="upload-text">↑ {{ formatTraffic(row.upload) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="download" label="下载" width="120">
          <template #default="{ row }">
            <span class="download-text">↓ {{ formatTraffic(row.download) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total" label="总流量" width="120">
          <template #default="{ row }">
            <strong>{{ formatTraffic(row.total) }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="userCount" label="用户数" width="100" />
        <el-table-column label="占比" width="150">
          <template #default="{ row }">
            <el-progress :percentage="getNodePercentage(row.total)" :color="getProgressColor" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- User Traffic Stats -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户流量排行</span>
          <el-button type="primary" link @click="refreshData">刷新</el-button>
        </div>
      </template>
      <el-table :data="userStats" v-loading="loading" stripe>
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="upload" label="上传" width="120">
          <template #default="{ row }">
            <span class="upload-text">↑ {{ formatTraffic(row.upload) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="download" label="下载" width="120">
          <template #default="{ row }">
            <span class="download-text">↓ {{ formatTraffic(row.download) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total" label="总流量" width="120">
          <template #default="{ row }">
            <strong>{{ formatTraffic(row.total) }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="nodeCount" label="使用节点数" width="100" />
      </el-table>
    </el-card>

    <!-- Traffic Records -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>流量记录</span>
          <el-button type="primary" link @click="refreshData">刷新</el-button>
        </div>
      </template>
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="用户">
          <el-input v-model="queryForm.userId" placeholder="用户ID" clearable />
        </el-form-item>
        <el-form-item label="节点">
          <el-input v-model="queryForm.nodeId" placeholder="节点ID" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="trafficRecords" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="nodeName" label="节点" width="150" />
        <el-table-column prop="upload" label="上传" width="120">
          <template #default="{ row }">
            <span class="upload-text">↑ {{ formatTraffic(row.upload) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="download" label="下载" width="120">
          <template #default="{ row }">
            <span class="download-text">↓ {{ formatTraffic(row.download) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total" label="总流量" width="120">
          <template #default="{ row }">
            <strong>{{ formatTraffic(row.total) }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="recordedAt" label="记录时间" width="180" />
      </el-table>
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
import { ref, reactive, onMounted, computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { DataLine, TrendCharts, PieChart as PieChartIcon } from '@element-plus/icons-vue';
import { getTrafficRecords, getTrafficStats, getTrafficOverview, getNodeTrafficStats, getUserTrafficStats } from '@api/traffic';
import type { TrafficRecord, TrafficStats, TrafficOverview, NodeTrafficStats, UserTrafficStats, TrafficQuery } from '../../types/traffic';

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
]);

const loading = ref(false);
const timeRange = ref('7d');
const trafficRecords = ref<TrafficRecord[]>([]);
const trafficStats = ref<TrafficStats[]>([]);
const nodeStats = ref<NodeTrafficStats[]>([]);
const userStats = ref<UserTrafficStats[]>([]);
const total = ref(0);

const overview = reactive<TrafficOverview>({
  todayUpload: 0,
  todayDownload: 0,
  todayTotal: 0,
  monthUpload: 0,
  monthDownload: 0,
  monthTotal: 0,
  totalUpload: 0,
  totalDownload: 0,
  totalTraffic: 0,
});

const queryForm = reactive<TrafficQuery>({
  page: 1,
  pageSize: 20,
  userId: '',
  nodeId: '',
});

const trafficChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: { data: ['上传', '下载'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trafficStats.value.map(s => s.date),
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => formatTraffic(value),
    },
  },
  series: [
    {
      name: '上传',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: trafficStats.value.map(s => s.upload),
      itemStyle: { color: '#67C23A' },
    },
    {
      name: '下载',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: trafficStats.value.map(s => s.download),
      itemStyle: { color: '#409EFF' },
    },
  ],
}));

const nodeChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
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
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: nodeStats.value.slice(0, 10).map(n => ({
        name: n.nodeName,
        value: n.total,
      })),
    },
  ],
}));

const getProgressColor = (percentage: number) => {
  if (percentage < 30) return '#67C23A';
  if (percentage < 70) return '#E6A23C';
  return '#F56C6C';
};

const getNodePercentage = (total: number) => {
  const max = Math.max(...nodeStats.value.map(n => n.total), 1);
  return Math.round((total / max) * 100);
};

const formatTraffic = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getDateRange = (range: string) => {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [records, stats, nodeTraffic, userTraffic, ov] = await Promise.all([
      getTrafficRecords(queryForm),
      getTrafficStats(getDateRange(timeRange.value)),
      getNodeTrafficStats(getDateRange(timeRange.value)),
      getUserTrafficStats(getDateRange(timeRange.value)),
      getTrafficOverview(),
    ]);
    trafficRecords.value = records.list;
    total.value = records.total;
    trafficStats.value = stats;
    nodeStats.value = nodeTraffic.sort((a, b) => b.total - a.total);
    userStats.value = userTraffic.sort((a, b) => b.total - a.total).slice(0, 10);
    Object.assign(overview, ov);
  } finally {
    loading.value = false;
  }
};

const handleTimeRangeChange = () => {
  fetchData();
};

const handleSearch = () => {
  queryForm.page = 1;
  fetchData();
};

const handleReset = () => {
  queryForm.userId = '';
  queryForm.nodeId = '';
  queryForm.page = 1;
  fetchData();
};

const handleSizeChange = (size: number) => {
  queryForm.pageSize = size;
  fetchData();
};

const handlePageChange = (page: number) => {
  queryForm.page = page;
  fetchData();
};

const refreshData = () => {
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.traffic-monitor {
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
          flex: 1;

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

          .stat-detail {
            margin-top: 8px;
            font-size: 12px;

            .upload {
              color: #67C23A;
              margin-right: 15px;
            }

            .download {
              color: #409EFF;
            }
          }
        }
      }
    }
  }

  .chart-row {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-container {
      height: 350px;

      .chart {
        width: 100%;
        height: 100%;
      }
    }
  }

  .table-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .search-form {
      margin-bottom: 20px;
    }

    .upload-text {
      color: #67C23A;
    }

    .download-text {
      color: #409EFF;
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
