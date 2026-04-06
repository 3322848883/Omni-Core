import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';

const router: Router = Router();

// 订单状态映射
const ORDER_STATUS_MAP: Record<string, { code: number; label: string }> = {
  pending: { code: 1, label: '待支付' },
  paid: { code: 2, label: '已支付' },
  completed: { code: 3, label: '已完成' },
  cancelled: { code: 4, label: '已取消' },
  expired: { code: 5, label: '已过期' },
  refunded: { code: 6, label: '已退款' },
};

// 支付方式映射
const PAYMENT_METHOD_MAP: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  qrcode: '收款码',
  stripe: 'Stripe',
  bank: '银行卡',
  cash: '现金',
};

/**
 * 格式化日期为 YYYY-MM-DD 字符串（使用本地时区）
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 获取日期的开始时间（00:00:00）
 */
const getStartOfDay = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

/**
 * 获取日期的结束时间（23:59:59）
 */
const getEndOfDay = (date: Date): string => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

/**
 * 获取支付统计汇总数据
 * GET /api/v1/payment-statistics/summary
 */
router.get('/summary', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 本周和上周
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    // 本月和上月
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(monthStart);
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

    // 今日收入
    const todayIncomeResult = await db('orders')
      .where('status', 'in', ['paid', 'completed'])
      .where('payment_time', '>=', getStartOfDay(today))
      .where('payment_time', '<=', getEndOfDay(today))
      .sum('amount as total');
    const todayIncome = parseFloat(todayIncomeResult[0]?.total || '0');

    // 昨日收入
    const yesterdayIncomeResult = await db('orders')
      .where('status', 'in', ['paid', 'completed'])
      .where('payment_time', '>=', getStartOfDay(yesterday))
      .where('payment_time', '<=', getEndOfDay(yesterday))
      .sum('amount as total');
    const yesterdayIncome = parseFloat(yesterdayIncomeResult[0]?.total || '0');

    // 本周收入
    const weekIncomeResult = await db('orders')
      .where('status', 'in', ['paid', 'completed'])
      .where('payment_time', '>=', getStartOfDay(weekStart))
      .where('payment_time', '<=', getEndOfDay(today))
      .sum('amount as total');
    const weekIncome = parseFloat(weekIncomeResult[0]?.total || '0');

    // 上周收入
    const lastWeekIncomeResult = await db('orders')
      .where('status', 'in', ['paid', 'completed'])
      .where('payment_time', '>=', getStartOfDay(lastWeekStart))
      .where('payment_time', '<=', getEndOfDay(lastWeekEnd))
      .sum('amount as total');
    const lastWeekIncome = parseFloat(lastWeekIncomeResult[0]?.total || '0');

    // 本月收入
    const monthIncomeResult = await db('orders')
      .where('status', 'in', ['paid', 'completed'])
      .where('payment_time', '>=', getStartOfDay(monthStart))
      .where('payment_time', '<=', getEndOfDay(today))
      .sum('amount as total');
    const monthIncome = parseFloat(monthIncomeResult[0]?.total || '0');

    // 上月收入
    const lastMonthIncomeResult = await db('orders')
      .where('status', 'in', ['paid', 'completed'])
      .where('payment_time', '>=', getStartOfDay(lastMonthStart))
      .where('payment_time', '<=', getEndOfDay(lastMonthEnd))
      .sum('amount as total');
    const lastMonthIncome = parseFloat(lastMonthIncomeResult[0]?.total || '0');

    // 总收入
    const totalIncomeResult = await db('orders')
      .where('status', 'in', ['paid', 'completed'])
      .sum('amount as total');
    const totalIncome = parseFloat(totalIncomeResult[0]?.total || '0');

    // 总订单数
    const totalOrdersResult = await db('orders').count('* as count');
    const totalOrders = parseInt(totalOrdersResult[0]?.count as string || '0');

    // 退款金额（今日）
    const todayRefundResult = await db('orders')
      .where('status', 'refunded')
      .where('payment_time', '>=', getStartOfDay(today))
      .where('payment_time', '<=', getEndOfDay(today))
      .sum('amount as total');
    const todayRefundAmount = parseFloat(todayRefundResult[0]?.total || '0');

    // 昨日退款金额
    const yesterdayRefundResult = await db('orders')
      .where('status', 'refunded')
      .where('payment_time', '>=', getStartOfDay(yesterday))
      .where('payment_time', '<=', getEndOfDay(yesterday))
      .sum('amount as total');
    const yesterdayRefundAmount = parseFloat(yesterdayRefundResult[0]?.total || '0');

    // 总退款金额
    const refundResult = await db('orders')
      .where('status', 'refunded')
      .sum('amount as total');
    const refundAmount = parseFloat(refundResult[0]?.total || '0');

    // 计算变化率
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        todayIncome,
        todayIncomeChange: calculateChange(todayIncome, yesterdayIncome),
        weekIncome,
        weekIncomeChange: calculateChange(weekIncome, lastWeekIncome),
        monthIncome,
        monthIncomeChange: calculateChange(monthIncome, lastMonthIncome),
        totalIncome,
        totalIncomeChange: 0, // 总收入不需要变化率
        totalOrders,
        totalOrdersChange: 0,
        refundAmount,
        refundAmountChange: calculateChange(todayRefundAmount, yesterdayRefundAmount),
      },
    });
  } catch (error) {
    logger.error('Failed to get payment statistics summary:', error);
    next(error);
  }
});

/**
 * 获取收入趋势数据
 * GET /api/v1/payment-statistics/income-trend
 */
router.get('/income-trend', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // 获取日期范围内的订单数据
    const orders = await db('orders')
      .where('status', 'in', ['paid', 'completed', 'refunded'])
      .where('payment_time', '>=', startDate.toISOString())
      .where('payment_time', '<=', endDate.toISOString())
      .select('amount', 'status', 'payment_time');

    // 按日期分组统计
    const dailyData: Record<string, { income: number; refund: number; orderCount: number; netIncome: number }> = {};

    // 初始化日期范围
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = formatDate(date);
      dailyData[dateStr] = { income: 0, refund: 0, orderCount: 0, netIncome: 0 };
    }

    // 统计订单数据
    orders.forEach((order) => {
      const dateStr = formatDate(new Date(order.payment_time));
      if (dailyData[dateStr]) {
        if (order.status === 'refunded') {
          dailyData[dateStr].refund += parseFloat(order.amount);
        } else {
          dailyData[dateStr].income += parseFloat(order.amount);
          dailyData[dateStr].orderCount += 1;
        }
        dailyData[dateStr].netIncome = dailyData[dateStr].income - dailyData[dateStr].refund;
      }
    });

    // 转换为数组格式
    const data = Object.entries(dailyData).map(([date, stats]) => ({
      date,
      income: stats.income,
      refund: stats.refund,
      orderCount: stats.orderCount,
      netIncome: stats.netIncome,
    }));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        days,
        data,
      },
    });
  } catch (error) {
    logger.error('Failed to get income trend:', error);
    next(error);
  }
});

/**
 * 获取支付方式分布
 * GET /api/v1/payment-statistics/payment-methods
 */
router.get('/payment-methods', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db('orders')
      .where('status', 'in', ['paid', 'completed'])
      .whereNotNull('payment_method');

    if (startDate) {
      query = query.where('payment_time', '>=', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.where('payment_time', '<=', `${endDate}T23:59:59.999Z`);
    }

    const results = await query
      .select('payment_method')
      .sum('amount as total')
      .groupBy('payment_method');

    // 计算总金额
    const totalAmount = results.reduce((sum, item) => sum + parseFloat(item.total || '0'), 0);

    // 格式化数据
    const methods = results.map((item) => {
      const amount = parseFloat(item.total || '0');
      return {
        method: item.payment_method || 'unknown',
        amount,
        percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
      };
    });

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        methods,
        totalAmount,
      },
    });
  } catch (error) {
    logger.error('Failed to get payment method distribution:', error);
    next(error);
  }
});

/**
 * 获取订单状态分布
 * GET /api/v1/payment-statistics/order-status
 */
router.get('/order-status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db('orders');

    if (startDate) {
      query = query.where('created_at', '>=', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.where('created_at', '<=', `${endDate}T23:59:59.999Z`);
    }

    const results = await query
      .select('status')
      .count('* as count')
      .groupBy('status');

    // 计算总订单数
    const totalCount = results.reduce((sum, item) => sum + parseInt(item.count as string || '0'), 0);

    // 格式化数据
    const statuses = results.map((item) => {
      const count = parseInt(item.count as string || '0');
      const statusInfo = ORDER_STATUS_MAP[item.status] || { code: 0, label: item.status };
      return {
        statusCode: statusInfo.code,
        status: statusInfo.label,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      };
    });

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        statuses,
        totalCount,
      },
    });
  } catch (error) {
    logger.error('Failed to get order status distribution:', error);
    next(error);
  }
});

/**
 * 获取每日收入明细
 * GET /api/v1/payment-statistics/daily-income
 */
router.get('/daily-income', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const { startDate, endDate } = req.query;

    // 构建日期范围
    let dateStart = startDate as string;
    let dateEnd = endDate as string;

    if (!dateStart || !dateEnd) {
      const now = new Date();
      dateEnd = now.toISOString().split('T')[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateStart = monthStart.toISOString().split('T')[0];
    }

    // 获取日期范围内的订单数据
    let query = db('orders')
      .where('status', 'in', ['paid', 'completed', 'refunded'])
      .where('payment_time', '>=', `${dateStart}T00:00:00.000Z`)
      .where('payment_time', '<=', `${dateEnd}T23:59:59.999Z`);

    const orders = await query.select('amount', 'status', 'payment_time');

    // 按日期分组统计
    const dailyData: Record<string, { orderCount: number; incomeAmount: number; refundAmount: number; netIncome: number }> = {};

    orders.forEach((order) => {
      const dateStr = formatDate(new Date(order.payment_time));
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { orderCount: 0, incomeAmount: 0, refundAmount: 0, netIncome: 0 };
      }

      if (order.status === 'refunded') {
        dailyData[dateStr].refundAmount += parseFloat(order.amount);
      } else {
        dailyData[dateStr].incomeAmount += parseFloat(order.amount);
        dailyData[dateStr].orderCount += 1;
      }
      dailyData[dateStr].netIncome = dailyData[dateStr].incomeAmount - dailyData[dateStr].refundAmount;
    });

    // 转换为数组并排序
    let list = Object.entries(dailyData).map(([date, stats]) => ({
      date,
      ...stats,
    }));
    list.sort((a, b) => b.date.localeCompare(a.date));

    // 分页
    const total = list.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedList = list.slice(startIndex, endIndex);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        list: paginatedList,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    logger.error('Failed to get daily income list:', error);
    next(error);
  }
});

/**
 * 导出支付统计数据为Excel
 * GET /api/v1/payment-statistics/export/excel
 */
router.get('/export/excel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    // 获取数据
    let query = db('orders')
      .where('status', 'in', ['paid', 'completed', 'refunded']);

    if (startDate) {
      query = query.where('payment_time', '>=', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.where('payment_time', '<=', `${endDate}T23:59:59.999Z`);
    }

    const orders = await query
      .select('order_no', 'amount', 'status', 'payment_method', 'payment_time')
      .orderBy('payment_time', 'desc');

    // CSV格式，Excel可以直接打开
    const headers = ['订单号', '金额', '状态', '支付方式', '支付时间'];
    const rows = orders.map((order) => [
      order.order_no,
      order.amount,
      ORDER_STATUS_MAP[order.status]?.label || order.status,
      PAYMENT_METHOD_MAP[order.payment_method] || order.payment_method || '-',
      order.payment_time ? new Date(order.payment_time).toLocaleString('zh-CN') : '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // 使用 application/vnd.ms-excel 让浏览器默认用 Excel 打开
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=payment_statistics_${Date.now()}.xls`);
    res.send('\ufeff' + csvContent); // BOM for Excel
  } catch (error) {
    logger.error('Failed to export payment statistics:', error);
    next(error);
  }
});

/**
 * 导出支付统计数据为CSV
 * GET /api/v1/payment-statistics/export/csv
 */
router.get('/export/csv', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    // 获取数据
    let query = db('orders')
      .where('status', 'in', ['paid', 'completed', 'refunded']);

    if (startDate) {
      query = query.where('payment_time', '>=', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.where('payment_time', '<=', `${endDate}T23:59:59.999Z`);
    }

    const orders = await query
      .select('order_no', 'amount', 'status', 'payment_method', 'payment_time')
      .orderBy('payment_time', 'desc');

    const headers = ['订单号', '金额', '状态', '支付方式', '支付时间'];
    const rows = orders.map((order) => [
      order.order_no,
      order.amount,
      ORDER_STATUS_MAP[order.status]?.label || order.status,
      PAYMENT_METHOD_MAP[order.payment_method] || order.payment_method || '-',
      order.payment_time ? new Date(order.payment_time).toLocaleString('zh-CN') : '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=payment_statistics_${Date.now()}.csv`);
    res.send('\ufeff' + csvContent);
  } catch (error) {
    logger.error('Failed to export payment statistics CSV:', error);
    next(error);
  }
});

export default router;
