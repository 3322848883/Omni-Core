/**
 * 支付统计相关类型定义
 */

// 统计卡片数据
export interface PaymentStatisticsSummary {
  todayIncome: number;
  todayIncomeChange: number; // 百分比变化
  weekIncome: number;
  weekIncomeChange: number;
  monthIncome: number;
  monthIncomeChange: number;
  totalIncome: number;
  totalIncomeChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  refundAmount: number;
  refundAmountChange: number;
}

// 收入趋势数据点
export interface IncomeTrendItem {
  date: string;
  income: number;
  refund: number;
  netIncome: number;
  orderCount: number;
}

// 支付方式分布
export interface PaymentMethodDistribution {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

// 订单状态分布
export interface OrderStatusDistribution {
  status: string;
  statusCode: number;
  count: number;
  percentage: number;
}

// 每日收入明细
export interface DailyIncomeDetail {
  date: string;
  orderCount: number;
  incomeAmount: number;
  refundAmount: number;
  netIncome: number;
}

// 每日收入明细查询参数
export interface DailyIncomeQuery {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

// 每日收入明细列表响应
export interface DailyIncomeListResponse {
  list: DailyIncomeDetail[];
  total: number;
  page: number;
  pageSize: number;
}

// 收入趋势响应
export interface IncomeTrendResponse {
  data: IncomeTrendItem[];
  totalIncome: number;
  totalRefund: number;
  totalNetIncome: number;
}

// 支付方式分析响应
export interface PaymentMethodAnalysisResponse {
  methods: PaymentMethodDistribution[];
  totalAmount: number;
  totalCount: number;
}

// 订单状态分布响应
export interface OrderStatusDistributionResponse {
  statuses: OrderStatusDistribution[];
  totalCount: number;
}

// 时间段类型
export type TimeRangeType = 'today' | 'week' | 'month' | 'year' | 'custom';

// 统计查询参数
export interface StatisticsQueryParams {
  timeRange?: TimeRangeType;
  startDate?: string;
  endDate?: string;
}
