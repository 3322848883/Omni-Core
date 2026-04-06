<template>
  <div class="payment-statistics">
    <!-- 时间段筛选 -->
    <el-card class="filter-card">
      <div class="filter-container">
        <div class="quick-filters">
          <el-radio-group v-model="timeRangeType" size="default" @change="handleTimeRangeChange">
            <el-radio-button label="today">今日</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="year">本年</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
        </div>
        <div v-show="timeRangeType === 'custom'" class="date-picker-wrapper">
          <el-date-picker
            v-model="customDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
            @change="handleCustomDateChange"
          />
        </div>
        <div class="export-buttons">
          <el-button type="success" :icon="Download" @click="handleExportExcel">
            导出Excel
          </el-button>
          <el-button type="primary" :icon="Document" @click="handleExportCSV">
            导出CSV
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-header">
            <span class="stat-title">今日收入</span>
            <el-tag :type="getChangeType(summary.todayIncomeChange)" size="small">
              {{ formatChange(summary.todayIncomeChange) }}
            </el-tag>
          </div>
          <div class="stat-value">¥{{ formatAmount(summary.todayIncome) }}</div>
          <div class="stat-footer">较昨日</div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-header">
            <span class="stat-title">本周收入</span>
            <el-tag :type="getChangeType(summary.weekIncomeChange)" size="small">
              {{ formatChange(summary.weekIncomeChange) }}
            </el-tag>
          </div>
          <div class="stat-value">¥{{ formatAmount(summary.weekIncome) }}</div>
          <div class="stat-footer">较上周</div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-header">
            <span class="stat-title">本月收入</span>
            <el-tag :type="getChangeType(summary.monthIncomeChange)" size="small">
              {{ formatChange(summary.monthIncomeChange) }}
            </el-tag>
          </div>
          <div class="stat-value">¥{{ formatAmount(summary.monthIncome) }}</div>
          <div class="stat-footer">较上月</div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-header">
            <span class="stat-title">总收入</span>
            <el-tag :type="getChangeType(summary.totalIncomeChange)" size="small">
              {{ formatChange(summary.totalIncomeChange) }}
            </el-tag>
          </div>
          <div class="stat-value">¥{{ formatAmount(summary.totalIncome) }}</div>
          <div class="stat-footer">累计收入</div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-header">
            <span class="stat-title">订单数量</span>
            <el-tag :type="getChangeType(summary.totalOrdersChange)" size="small">
              {{ formatChange(summary.totalOrdersChange) }}
            </el-tag>
          </div>
          <div class="stat-value">{{ formatNumber(summary.totalOrders) }}</div>
          <div class="stat-footer">累计订单</div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-header">
            <span class="stat-title">退款金额</span>
            <el-tag :type="getChangeType(-summary.refundAmountChange)" size="small">
              {{ formatChange(summary.refundAmountChange) }}
            </el-tag>
          </div>
          <div class="stat-value text-danger">¥{{ formatAmount(summary.refundAmount) }}</div>
          <div class="stat-footer">累计退款</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>收入趋势分析（近30天）</span>
              <el-radio-group v-model="trendChartType" size="small">
                <el-radio-button label="income">收入</el-radio-button>
                <el-radio-button label="order">订单</el-radio-button>
                <el-radio-button label="net">净收入</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>支付方式分布</span>
            </div>
          </template>
          <div ref="paymentMethodChartRef" class="chart-container small"></div>
          <!-- 支付方式统计表格 -->
          <div class="payment-method-table">
            <el-table :data="paymentMethodData" size="small" border>
              <el-table-column prop="method" label="支付方式" min-width="100">
                <template #default="{ row }">
                  <el-tag :type="getPaymentMethodTagType(row.method)" size="small">
                    {{ formatPaymentMethod(row.method) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" min-width="100">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="percentage" label="占比" min-width="80">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :stroke-width="8" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单状态分布</span>
            </div>
          </template>
          <div ref="orderStatusChartRef" class="chart-container small"></div>
          <!-- 订单状态统计 -->
          <div class="order-status-list">
            <div
              v-for="item in orderStatusData"
              :key="item.statusCode"
              class="status-item"
            >
              <div class="status-info">
                <el-tag :type="getOrderStatusTagType(item.statusCode)" size="small">
                  {{ item.status }}
                </el-tag>
                <span class="status-count">{{ item.count }} 单</span>
              </div>
              <div class="status-progress">
                <el-progress
                  :percentage="item.percentage"
                  :stroke-width="8"
                  :status="getOrderStatusProgressType(item.statusCode)"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-row :gutter="20" class="table-row">
      <el-col :xs="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>每日收入明细</span>
              <div class="table-summary">
                <span class="summary-item">
                  总收入: <strong class="text-success">¥{{ formatAmount(tableTotalIncome) }}</strong>
                </span>
                <span class="summary-item">
                  总退款: <strong class="text-danger">¥{{ formatAmount(tableTotalRefund) }}</strong>
                </span>
                <span class="summary-item">
                  净收入: <strong class="text-primary">¥{{ formatAmount(tableTotalNetIncome) }}</strong>
                </span>
              </div>
            </div>
          </template>
          <el-table
            :data="tableData"
            border
            stripe
            v-loading="tableLoading"
            :header-cell-style="{ background: '#f5f7fa' }"
          >
            <el-table-column prop="date" label="日期" width="120" align="center" />
            <el-table-column prop="orderCount" label="订单数" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.orderCount }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="incomeAmount" label="收入金额" min-width="150" align="right">
              <template #default="{ row }">
                <span class="amount-success">¥{{ formatAmount(row.incomeAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="refundAmount" label="退款金额" min-width="150" align="right">
              <template #default="{ row }">
                <span class="amount-danger" v-if="row.refundAmount > 0">
                  -¥{{ formatAmount(row.refundAmount) }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="netIncome" label="净收入" min-width="150" align="right">
              <template #default="{ row }">
                <span :class="row.netIncome >= 0 ? 'amount-primary' : 'amount-danger'">
                  ¥{{ formatAmount(row.netIncome) }}
                </span>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="queryParams.page"
              v-model:page-size="queryParams.pageSize"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Document } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import type { ECharts, EChartsOption } from 'echarts';

import {
  getPaymentStatisticsSummary,
  getIncomeTrend,
  getPaymentMethodDistribution,
  getOrderStatusDistribution,
  getDailyIncomeList,
  exportPaymentStatisticsExcel,
  exportPaymentStatisticsCSV,
} from '../../api/payment-statistics';
import type {
  PaymentStatisticsSummary,
  IncomeTrendItem,
  PaymentMethodDistribution,
  OrderStatusDistribution,
  DailyIncomeDetail,
  TimeRangeType,
} from '../../types/payment-statistics';

// 时间范围类型
const timeRangeType = ref<TimeRangeType>('month');
const customDateRange = ref<[string, string] | null>(null);

// 图表类型
const trendChartType = ref<'income' | 'order' | 'net'>('income');

// 图表实例
let trendChart: ECharts | null = null;
let paymentMethodChart: ECharts | null = null;
let orderStatusChart: ECharts | null = null;

const trendChartRef = ref<HTMLElement>();
const paymentMethodChartRef = ref<HTMLElement>();
const orderStatusChartRef = ref<HTMLElement>();

// 统计数据
const summary = reactive<PaymentStatisticsSummary>({
  todayIncome: 0,
  todayIncomeChange: 0,
  weekIncome: 0,
  weekIncomeChange: 0,
  monthIncome: 0,
  monthIncomeChange: 0,
  totalIncome: 0,
  totalIncomeChange: 0,
  totalOrders: 0,
  totalOrdersChange: 0,
  refundAmount: 0,
  refundAmountChange: 0,
});

// 图表数据
const incomeTrendData = ref<IncomeTrendItem[]>([]);
const paymentMethodData = ref<PaymentMethodDistribution[]>([]);
const orderStatusData = ref<OrderStatusDistribution[]>([]);

// 表格数据
const tableData = ref<DailyIncomeDetail[]>([]);
const tableLoading = ref(false);
const total = ref(0);
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  startDate: '',
  endDate: '',
});

// 表格汇总
const tableTotalIncome = computed(() =>
  tableData.value.reduce((sum, item) => sum + item.incomeAmount, 0)
);
const tableTotalRefund = computed(() =>
  tableData.value.reduce((sum, item) => sum + item.refundAmount, 0)
);
const tableTotalNetIncome = computed(() =>
  tableData.value.reduce((sum, item) => sum + item.netIncome, 0)
);

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD');
      const start = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
      return [start, end];
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD');
      const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
      return [start, end];
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD');
      const start = dayjs().subtract(89, 'day').format('YYYY-MM-DD');
      return [start, end];
    },
  },
];

// 格式化金额
const formatAmount = (amount: number): string => {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// 格式化数字
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

// 格式化变化率
const formatChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

// 获取变化标签类型
const getChangeType = (change: number): 'success' | 'danger' | 'info' => {
  if (change > 0) return 'success';
  if (change < 0) return 'danger';
  return 'info';
};

// 格式化支付方式
const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    qrcode: '收款码',
    stripe: 'Stripe',
    bank: '银行卡',
    cash: '现金',
  };
  return methodMap[method] || method || '未知';
};

// 获取支付方式标签类型
const getPaymentMethodTagType = (method: string): string => {
  const typeMap: Record<string, string> = {
    alipay: 'primary',
    wechat: 'success',
    qrcode: 'warning',
    bank: 'info',
    cash: '',
  };
  return typeMap[method] || '';
};

// 获取订单状态标签类型
const getOrderStatusTagType = (statusCode: number): string => {
  const typeMap: Record<number, string> = {
    1: 'warning', // pending
    2: 'success', // paid
    3: 'info', // cancelled
    4: 'danger', // refunded
  };
  return typeMap[statusCode] || 'info';
};

// 获取订单状态进度条类型
const getOrderStatusProgressType = (statusCode: number): string => {
  const typeMap: Record<number, string> = {
    1: '', // pending
    2: 'success', // paid
    3: '', // cancelled
    4: 'exception', // refunded
  };
  return typeMap[statusCode] || '';
};

// 初始化收入趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value) return;

  trendChart = echarts.init(trendChartRef.value);
  updateTrendChart();
};

// 更新收入趋势图表
const updateTrendChart = () => {
  if (!trendChart || incomeTrendData.value.length === 0) return;

  const dates = incomeTrendData.value.map(item => item.date);
  let series: echarts.SeriesOption[] = [];

  if (trendChartType.value === 'income') {
    series = [
      {
        name: '收入',
        type: 'line',
        data: incomeTrendData.value.map(item => item.income),
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
          ]),
        },
        itemStyle: { color: '#409EFF' },
      },
      {
        name: '退款',
        type: 'line',
        data: incomeTrendData.value.map(item => item.refund),
        smooth: true,
        itemStyle: { color: '#F56C6C' },
        lineStyle: { type: 'dashed' },
      },
    ];
  } else if (trendChartType.value === 'order') {
    series = [
      {
        name: '订单数',
        type: 'line',
        data: incomeTrendData.value.map(item => item.orderCount),
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' },
          ]),
        },
        itemStyle: { color: '#67C23A' },
      },
    ];
  } else {
    series = [
      {
        name: '净收入',
        type: 'line',
        data: incomeTrendData.value.map(item => item.netIncome),
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' },
          ]),
        },
        itemStyle: { color: '#E6A23C' },
      },
    ];
  }

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        let html = `<div style="font-weight:600;margin-bottom:5px">${params[0].axisValue}</div>`;
        params.forEach((param: any) => {
          const value = trendChartType.value === 'order'
            ? param.value
            : `¥${Number(param.value).toFixed(2)}`;
          html += `<div style="display:flex;align-items:center;margin:3px 0">
            <span style="display:inline-block;width:10px;height:10px;background:${param.color};border-radius:50%;margin-right:5px"></span>
            <span>${param.seriesName}: <strong>${value}</strong></span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      data: series.map(s => s.name as string),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#DCDFE6' } },
      axisLabel: { color: '#606266' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#EBEEF5' } },
      axisLabel: {
        color: '#606266',
        formatter: (value: number): string => {
          if (trendChartType.value === 'order') return String(value);
          return value >= 1000 ? `¥${(value / 1000).toFixed(0)}k` : `¥${value}`;
        },
      },
    },
    series,
  };

  trendChart.setOption(option, true);
};

// 初始化支付方式分布图表
const initPaymentMethodChart = () => {
  if (!paymentMethodChartRef.value) return;

  paymentMethodChart = echarts.init(paymentMethodChartRef.value);
  updatePaymentMethodChart();
};

// 更新支付方式分布图表
const updatePaymentMethodChart = () => {
  if (!paymentMethodChart || paymentMethodData.value.length === 0) return;

  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'];

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `<div style="font-weight:600">${params.name}</div>
                <div>金额: ¥${Number(params.value).toFixed(2)}</div>
                <div>占比: ${params.percent}%</div>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      formatter: (name: string) => {
        const item = paymentMethodData.value.find(d => formatPaymentMethod(d.method) === name);
        return item ? `${name} (${item.percentage}%)` : name;
      },
    },
    series: [
      {
        name: '支付方式',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: { show: false },
        data: paymentMethodData.value.map((item, index) => ({
          value: item.amount,
          name: formatPaymentMethod(item.method),
          itemStyle: { color: colors[index % colors.length] },
        })),
      },
    ],
  };

  paymentMethodChart.setOption(option);
};

// 初始化订单状态分布图表
const initOrderStatusChart = () => {
  if (!orderStatusChartRef.value) return;

  orderStatusChart = echarts.init(orderStatusChartRef.value);
  updateOrderStatusChart();
};

// 更新订单状态分布图表
const updateOrderStatusChart = () => {
  if (!orderStatusChart || orderStatusData.value.length === 0) return;

  const colors: Record<number, string> = {
    1: '#E6A23C', // pending - warning
    2: '#67C23A', // paid - success
    3: '#909399', // cancelled - info
    4: '#F56C6C', // refunded - danger
  };

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0];
        return `<div style="font-weight:600">${data.name}</div>
                <div>订单数: ${data.value}</div>
                <div>占比: ${orderStatusData.value[data.dataIndex]?.percentage}%</div>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: orderStatusData.value.map(item => item.status),
      axisLine: { lineStyle: { color: '#DCDFE6' } },
      axisLabel: { color: '#606266' },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#EBEEF5' } },
      axisLabel: { color: '#606266' },
    },
    series: [
      {
        name: '订单数',
        type: 'bar',
        barWidth: '50%',
        data: orderStatusData.value.map((item) => ({
          value: item.count,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colors[item.statusCode] || '#409EFF' },
              { offset: 1, color: colors[item.statusCode] ? `${colors[item.statusCode]}80` : '#409EFF80' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        })),
      },
    ],
  };

  orderStatusChart.setOption(option);
};

// 获取统计数据
const fetchSummaryData = async () => {
  try {
    const data = await getPaymentStatisticsSummary();
    Object.assign(summary, data);
  } catch (error) {
    ElMessage.error('获取统计数据失败');
  }
};

// 获取收入趋势数据
const fetchIncomeTrend = async () => {
  try {
    const data = await getIncomeTrend(30);
    incomeTrendData.value = data.data;
    nextTick(() => {
      updateTrendChart();
    });
  } catch (error) {
    ElMessage.error('获取收入趋势失败');
  }
};

// 获取支付方式分布
const fetchPaymentMethodDistribution = async () => {
  try {
    const params = getQueryParams();
    const data = await getPaymentMethodDistribution(params);
    paymentMethodData.value = data.methods;
    nextTick(() => {
      updatePaymentMethodChart();
    });
  } catch (error) {
    ElMessage.error('获取支付方式分布失败');
  }
};

// 获取订单状态分布
const fetchOrderStatusDistribution = async () => {
  try {
    const params = getQueryParams();
    const data = await getOrderStatusDistribution(params);
    orderStatusData.value = data.statuses;
    nextTick(() => {
      updateOrderStatusChart();
    });
  } catch (error) {
    ElMessage.error('获取订单状态分布失败');
  }
};

// 获取查询参数
const getQueryParams = () => {
  const params: { startDate?: string; endDate?: string } = {};

  if (timeRangeType.value === 'custom' && customDateRange.value) {
    params.startDate = customDateRange.value[0];
    params.endDate = customDateRange.value[1];
  } else {
    const now = dayjs();
    switch (timeRangeType.value) {
      case 'today':
        params.startDate = now.startOf('day').format('YYYY-MM-DD');
        params.endDate = now.endOf('day').format('YYYY-MM-DD');
        break;
      case 'week':
        params.startDate = now.startOf('week').format('YYYY-MM-DD');
        params.endDate = now.endOf('day').format('YYYY-MM-DD');
        break;
      case 'month':
        params.startDate = now.startOf('month').format('YYYY-MM-DD');
        params.endDate = now.endOf('day').format('YYYY-MM-DD');
        break;
      case 'year':
        params.startDate = now.startOf('year').format('YYYY-MM-DD');
        params.endDate = now.endOf('day').format('YYYY-MM-DD');
        break;
    }
  }

  return params;
};

// 获取表格数据
const fetchTableData = async () => {
  tableLoading.value = true;
  try {
    const dateParams = getQueryParams();
    const data = await getDailyIncomeList({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      startDate: dateParams.startDate,
      endDate: dateParams.endDate,
    });
    tableData.value = data.list;
    total.value = data.total;
  } catch (error) {
    ElMessage.error('获取收入明细失败');
  } finally {
    tableLoading.value = false;
  }
};

// 处理时间范围变化
const handleTimeRangeChange = () => {
  if (timeRangeType.value !== 'custom') {
    customDateRange.value = null;
    refreshData();
  }
};

// 处理自定义日期变化
const handleCustomDateChange = () => {
  if (customDateRange.value) {
    refreshData();
  }
};

// 刷新所有数据
const refreshData = () => {
  fetchPaymentMethodDistribution();
  fetchOrderStatusDistribution();
  fetchTableData();
};

// 处理导出Excel
const handleExportExcel = async () => {
  try {
    const params = getQueryParams();
    const blob = await exportPaymentStatisticsExcel(params);
    downloadFile(blob, `支付统计_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    ElMessage.success('Excel导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

// 处理导出CSV
const handleExportCSV = async () => {
  try {
    const params = getQueryParams();
    const blob = await exportPaymentStatisticsCSV(params);
    downloadFile(blob, `支付统计_${dayjs().format('YYYY-MM-DD')}.csv`);
    ElMessage.success('CSV导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

// 下载文件
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// 分页处理
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  queryParams.page = 1;
  fetchTableData();
};

const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  fetchTableData();
};

// 监听图表类型变化
watch(trendChartType, () => {
  updateTrendChart();
});

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  trendChart?.resize();
  paymentMethodChart?.resize();
  orderStatusChart?.resize();
};

onMounted(() => {
  fetchSummaryData();
  fetchIncomeTrend();
  fetchPaymentMethodDistribution();
  fetchOrderStatusDistribution();
  fetchTableData();

  nextTick(() => {
    initTrendChart();
    initPaymentMethodChart();
    initOrderStatusChart();
  });

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  paymentMethodChart?.dispose();
  orderStatusChart?.dispose();
});
</script>

<style scoped lang="scss">
.payment-statistics {
  padding: 20px;

  .filter-card {
    margin-bottom: 20px;

    .filter-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;

      .quick-filters {
        flex-shrink: 0;
      }

      .date-picker-wrapper {
        flex: 1;
        min-width: 280px;
      }

      .export-buttons {
        margin-left: auto;
        display: flex;
        gap: 8px;
      }
    }
  }

  .stat-row {
    margin-bottom: 0;

    .el-col {
      margin-bottom: 20px;
    }
  }

  .stat-card {
    height: 100%;

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .stat-title {
        font-size: 14px;
        color: #606266;
      }
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;

      &.text-danger {
        color: #f56c6c;
      }
    }

    .stat-footer {
      font-size: 12px;
      color: #909399;
    }
  }

  .chart-row {
    margin-top: 0;
    margin-bottom: 20px;

    .el-col {
      margin-bottom: 20px;
    }
  }

  .table-row {
    margin-top: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;

    .table-summary {
      display: flex;
      gap: 20px;
      font-size: 14px;
      font-weight: normal;

      .summary-item {
        strong {
          margin-left: 4px;
        }
      }
    }
  }

  .chart-container {
    height: 350px;

    &.small {
      height: 250px;
    }
  }

  .payment-method-table {
    margin-top: 16px;
  }

  .order-status-list {
    margin-top: 16px;

    .status-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .status-info {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 120px;

        .status-count {
          color: #606266;
          font-size: 13px;
        }
      }

      .status-progress {
        flex: 1;
        margin-left: 16px;
      }
    }
  }

  .amount-success {
    color: #67c23a;
    font-weight: 600;
  }

  .amount-danger {
    color: #f56c6c;
    font-weight: 600;
  }

  .amount-primary {
    color: #409eff;
    font-weight: 600;
  }

  .text-success {
    color: #67c23a;
  }

  .text-danger {
    color: #f56c6c;
  }

  .text-primary {
    color: #409eff;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .payment-statistics {
    padding: 10px;

    .filter-card {
      .filter-container {
        flex-direction: column;
        align-items: stretch;

        .export-buttons {
          margin-left: 0;
          justify-content: flex-end;
        }
      }
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;

      .table-summary {
        flex-wrap: wrap;
        gap: 10px;
      }
    }
  }
}
</style>
