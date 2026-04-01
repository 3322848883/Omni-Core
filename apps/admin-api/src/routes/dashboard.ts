import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { authMiddleware } from '../middlewares/auth';
import { logger } from '../utils/logger';

const router = Router();

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalNodes: number;
  onlineNodes: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

interface Activity {
  id: number;
  action: string;
  resource: string;
  adminUsername: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  createdAt: Date;
}

router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      userStats,
      nodeStats,
      orderStats,
      revenueStats
    ] = await Promise.all([
      db('users')
        .count('* as total')
        .first(),
      db('nodes')
        .count('* as total')
        .where('status', 'online')
        .count('* as online')
        .first(),
      db('orders')
        .count('* as total')
        .where('status', 'pending')
        .count('* as pending')
        .first(),
      db('orders')
        .where('status', 'completed')
        .sum('amount as total')
        .first()
    ]);

    const activeUsersResult = await db('users')
      .where('status', 1)
      .count('* as active')
      .first();

    const monthlyRevenueResult = await db('orders')
      .where('status', 'completed')
      .where('payment_time', '>=', startOfMonth.toISOString())
      .sum('amount as monthly')
      .first();

    const stats: DashboardStats = {
      totalUsers: parseInt(userStats?.total as string) || 0,
      activeUsers: parseInt(activeUsersResult?.active as string) || 0,
      totalNodes: parseInt(nodeStats?.total as string) || 0,
      onlineNodes: parseInt(nodeStats?.online as string) || 0,
      totalOrders: parseInt(orderStats?.total as string) || 0,
      pendingOrders: parseInt(orderStats?.pending as string) || 0,
      totalRevenue: parseFloat(revenueStats?.total as string) || 0,
      monthlyRevenue: parseFloat(monthlyRevenueResult?.monthly as string) || 0,
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    next(error);
  }
});

router.get('/charts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = '7d' } = req.query;
    const now = new Date();
    let days = 7;

    if (period === '30d') days = 30;
    else if (period === '90d') days = 90;

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [
      ordersByDate,
      revenueByDate,
      usersByDate
    ] = await Promise.all([
      db('orders')
        .select(db.raw("DATE(created_at) as date, COUNT(*) as count"))
        .where('created_at', '>=', startDate.toISOString())
        .groupBy('date')
        .orderBy('date', 'asc'),

      db('orders')
        .select(db.raw("DATE(payment_time) as date, SUM(amount) as revenue"))
        .where('status', 'completed')
        .where('payment_time', '>=', startDate.toISOString())
        .groupBy('date')
        .orderBy('date', 'asc'),

      db('users')
        .select(db.raw("DATE(created_at) as date, COUNT(*) as count"))
        .where('created_at', '>=', startDate.toISOString())
        .groupBy('date')
        .orderBy('date', 'asc')
    ]);

    const ordersChart: ChartDataPoint[] = ordersByDate.map((row: any) => ({
      date: row.date,
      value: parseInt(row.count)
    }));

    const revenueChart: ChartDataPoint[] = revenueByDate.map((row: any) => ({
      date: row.date,
      value: parseFloat(row.revenue || 0)
    }));

    const usersChart: ChartDataPoint[] = usersByDate.map((row: any) => ({
      date: row.date,
      value: parseInt(row.count)
    }));

    res.json({
      success: true,
      data: {
        orders: ordersChart,
        revenue: revenueChart,
        users: usersChart
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard charts:', error);
    next(error);
  }
});

router.get('/activities', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '20', offset = '0' } = req.query;
    const pageLimit = Math.min(parseInt(limit as string) || 20, 100);
    const pageOffset = parseInt(offset as string) || 0;

    const activities = await db('admin_logs')
      .select(
        'admin_logs.*',
        'admin_users.username as adminUsername'
      )
      .leftJoin('admin_users', 'admin_logs.admin_id', 'admin_users.id')
      .orderBy('admin_logs.created_at', 'desc')
      .limit(pageLimit)
      .offset(pageOffset);

    const [{ total }] = await db('admin_logs').count('* as total');

    res.json({
      success: true,
      data: {
        items: activities,
        total: parseInt(total as string),
        limit: pageLimit,
        offset: pageOffset
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard activities:', error);
    next(error);
  }
});

router.get('/alerts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts: Alert[] = [];
    const now = new Date();

    const [
      offlineNodes,
      pendingOrders,
      expiringSubscriptions
    ] = await Promise.all([
      db('nodes').where('status', 'offline').select('id', 'name').limit(5),
      db('orders').where('status', 'pending').count('* as count').first(),
      db('users')
        .where('expire_date', '<=', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
        .where('expire_date', '>=', now)
        .count('* as count')
        .first()
    ]);

    if (offlineNodes && offlineNodes.length > 0) {
      alerts.push({
        id: 'offline-nodes',
        type: 'error',
        title: '节点离线',
        message: `${offlineNodes.length} 个节点当前离线，请检查网络连接`,
        createdAt: now
      });
    }

    if (pendingOrders && parseInt(pendingOrders.count as string) > 10) {
      alerts.push({
        id: 'pending-orders',
        type: 'warning',
        title: '待处理订单',
        message: `有 ${pendingOrders.count} 个待处理订单需要处理`,
        createdAt: now
      });
    }

    if (expiringSubscriptions && parseInt(expiringSubscriptions.count as string) > 0) {
      alerts.push({
        id: 'expiring-subscriptions',
        type: 'info',
        title: '即将到期',
        message: `${expiringSubscriptions.count} 个订阅将在7天内到期`,
        createdAt: now
      });
    }

    alerts.push({
      id: 'system-status',
      type: 'info',
      title: '系统正常',
      message: '所有系统组件运行正常',
      createdAt: now
    });

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Error fetching dashboard alerts:', error);
    next(error);
  }
});

export const dashboardRoutes = router;