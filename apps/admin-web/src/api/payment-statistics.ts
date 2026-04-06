import request from '@utils/request';
import type {
  PaymentStatisticsSummary,
  IncomeTrendResponse,
  PaymentMethodAnalysisResponse,
  OrderStatusDistributionResponse,
  DailyIncomeListResponse,
  DailyIncomeQuery,
  StatisticsQueryParams,
  TimeRangeType,
} from '../types/payment-statistics';

/**
 * 获取支付统计汇总数据
 * @returns 统计卡片数据
 */
export const getPaymentStatisticsSummary = (): Promise<PaymentStatisticsSummary> => {
  return request.get('/payment-statistics/summary');
};

/**
 * 获取收入趋势数据
 * @param days 天数，默认30天
 * @returns 收入趋势数据
 */
export const getIncomeTrend = (days: number = 30): Promise<IncomeTrendResponse> => {
  return request.get('/payment-statistics/income-trend', { params: { days } });
};

/**
 * 获取支付方式分布
 * @param params 查询参数
 * @returns 支付方式分布数据
 */
export const getPaymentMethodDistribution = (params?: StatisticsQueryParams): Promise<PaymentMethodAnalysisResponse> => {
  return request.get('/payment-statistics/payment-methods', { params });
};

/**
 * 获取订单状态分布
 * @param params 查询参数
 * @returns 订单状态分布数据
 */
export const getOrderStatusDistribution = (params?: StatisticsQueryParams): Promise<OrderStatusDistributionResponse> => {
  return request.get('/payment-statistics/order-status', { params });
};

/**
 * 获取每日收入明细
 * @param params 查询参数
 * @returns 每日收入明细列表
 */
export const getDailyIncomeList = (params: DailyIncomeQuery): Promise<DailyIncomeListResponse> => {
  return request.get('/payment-statistics/daily-income', { params });
};

/**
 * 导出支付统计数据为Excel
 * @param params 查询参数
 * @returns Blob数据
 */
export const exportPaymentStatisticsExcel = (params?: StatisticsQueryParams): Promise<Blob> => {
  return request.get('/payment-statistics/export/excel', {
    params,
    responseType: 'blob',
  });
};

/**
 * 导出支付统计数据为CSV
 * @param params 查询参数
 * @returns Blob数据
 */
export const exportPaymentStatisticsCSV = (params?: StatisticsQueryParams): Promise<Blob> => {
  return request.get('/payment-statistics/export/csv', {
    params,
    responseType: 'blob',
  });
};


