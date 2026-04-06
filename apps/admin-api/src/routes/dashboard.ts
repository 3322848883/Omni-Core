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
    // Return user distribution by status for pie chart
    const userDistribution = await db('users')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const statusMap: Record<number, string> = {
      0: 'Inactive',
      1: 'Active',
      2: 'Suspended',
      3: 'Expired'
    };

    const formattedDistribution = userDistribution.map((row: any) => ({
      status: statusMap[row.status] || `Status ${row.status}`,
      count: parseInt(row.count)
    }));

    res.json({
      success: true,
      data: formattedDistribution
    });
  } catch (error) {
    logger.error('Error fetching dashboard charts:', error);
    next(error);
  }
});

router.get('/traffic/trend', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = '7' } = req.query;
    const numDays = parseInt(days as string) || 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - numDays * 24 * 60 * 60 * 1000);

    // Get traffic stats from traffic_stats_daily table (aggregate by date)
    const trafficStats = await db('traffic_stats_daily')
      .select('stat_date')
      .sum('upload_bytes as upload_bytes')
      .sum('download_bytes as download_bytes')
      .where('stat_date', '>=', startDate.toISOString().split('T')[0])
      .groupBy('stat_date')
      .orderBy('stat_date', 'asc');

    // Return real traffic stats (empty array if no data)
    const trendData = (trafficStats || []).map((row: any) => ({
      date: row.stat_date,
      upload: Math.round((row.upload_bytes || 0) / (1024 * 1024 * 1024) * 100) / 100, // Convert to GB
      download: Math.round((row.download_bytes || 0) / (1024 * 1024 * 1024) * 100) / 100 // Convert to GB
    }));

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    logger.error('Error fetching traffic trend:', error);
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

    // Action and resource mapping to Chinese
    const actionMap: Record<string, string> = {
      'LOGIN': '登录',
      'LOGOUT': '登出',
      'CREATE': '创建',
      'UPDATE': '更新',
      'DELETE': '删除',
      'ENABLE': '启用',
      'DISABLE': '禁用',
      'SYNC': '同步',
      'RESET': '重置',
      'APPROVE': '审批',
      'REJECT': '拒绝',
      'REFUND': '退款'
    };

    const resourceMap: Record<string, string> = {
      'auth': '认证',
      'user': '用户',
      'users': '用户',
      'node': '节点',
      'nodes': '节点',
      'order': '订单',
      'orders': '订单',
      'plan': '套餐',
      'plans': '套餐',
      'subscription': '订阅',
      'subscriptions': '订阅',
      'config': '配置',
      'settings': '设置',
      'invite': '邀请',
      'invites': '邀请',
      'traffic': '流量',
      'connection': '连接',
      'connections': '连接',
      'ip-pool': 'IP池',
      'ip-pools': 'IP池',
      'system': '系统'
    };

    // Transform to frontend expected format
    const formattedActivities = activities.map((activity: any) => ({
      id: activity.id,
      content: `${activity.adminUsername || '系统'} ${actionMap[activity.action] || activity.action} ${resourceMap[activity.resource] || activity.resource}`,
      time: activity.created_at,
      type: activity.action === 'LOGIN' ? 'success' : 
            activity.action === 'DELETE' ? 'danger' :
            activity.action === 'UPDATE' ? 'warning' : 'primary'
    }));

    res.json({
      success: true,
      data: formattedActivities
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