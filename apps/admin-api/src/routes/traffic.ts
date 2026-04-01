import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { getXrayClient } from '../services/xray/client';
import { getTrafficCollector } from '../services/xray/trafficCollector';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// GET /api/v1/traffic/overview - Get traffic overview statistics
router.get('/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7) + '-01';

    // Today's traffic
    const [todayStats] = await db('traffic_stats_daily')
      .where('stat_date', today)
      .sum('total_bytes as total')
      .sum('upload_bytes as upload')
      .sum('download_bytes as download');

    // This month's traffic
    const [monthStats] = await db('traffic_stats_daily')
      .where('stat_date', '>=', thisMonth)
      .sum('total_bytes as total')
      .sum('upload_bytes as upload')
      .sum('download_bytes as download');

    // Total traffic
    const [totalStats] = await db('traffic_stats_daily')
      .sum('total_bytes as total')
      .sum('upload_bytes as upload')
      .sum('download_bytes as download');

    // Active users today
    const [activeUsersToday] = await db('traffic_stats_daily')
      .where('stat_date', today)
      .countDistinct('user_id as count');

    // Active users this month
    const [activeUsersMonth] = await db('traffic_stats_daily')
      .where('stat_date', '>=', thisMonth)
      .countDistinct('user_id as count');

    // Top traffic users today
    const topUsersToday = await db('traffic_stats_daily')
      .where('stat_date', today)
      .select('user_id')
      .sum('total_bytes as total_bytes')
      .groupBy('user_id')
      .orderBy('total_bytes', 'desc')
      .limit(10);

    // Get real-time stats from Xray if available
    let realtimeStats = null;
    try {
      const xrayClient = getXrayClient();
      const isConnected = await xrayClient.testConnection();
      if (isConnected) {
        const allUserStats = await xrayClient.getAllUserStats(false);
        let realtimeUpload = 0;
        let realtimeDownload = 0;
        allUserStats.forEach(stats => {
          realtimeUpload += stats.uplink;
          realtimeDownload += stats.downlink;
        });
        realtimeStats = {
          upload: realtimeUpload,
          download: realtimeDownload,
          total: realtimeUpload + realtimeDownload,
          activeUsers: allUserStats.size
        };
      }
    } catch (error) {
      logger.warn('Failed to get realtime stats:', error);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        today: {
          total: parseInt(todayStats.total as string) || 0,
          upload: parseInt(todayStats.upload as string) || 0,
          download: parseInt(todayStats.download as string) || 0,
          activeUsers: parseInt(activeUsersToday.count as string) || 0
        },
        thisMonth: {
          total: parseInt(monthStats.total as string) || 0,
          upload: parseInt(monthStats.upload as string) || 0,
          download: parseInt(monthStats.download as string) || 0,
          activeUsers: parseInt(activeUsersMonth.count as string) || 0
        },
        total: {
          total: parseInt(totalStats.total as string) || 0,
          upload: parseInt(totalStats.upload as string) || 0,
          download: parseInt(totalStats.download as string) || 0
        },
        realtime: realtimeStats,
        topUsersToday: topUsersToday.map(u => ({
          userId: u.user_id,
          totalBytes: parseInt(u.total_bytes as string)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/traffic/trend - Get traffic trend over time
router.get('/trend', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const trafficData = await db('traffic_stats_daily')
      .where('stat_date', '>=', startDateStr)
      .select('stat_date')
      .sum('total_bytes as total_bytes')
      .sum('upload_bytes as upload_bytes')
      .sum('download_bytes as download_bytes')
      .countDistinct('user_id as active_users')
      .groupBy('stat_date')
      .orderBy('stat_date', 'asc');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: trafficData.map(day => ({
        date: day.stat_date,
        total: parseInt(day.total_bytes as string) || 0,
        upload: parseInt(day.upload_bytes as string) || 0,
        download: parseInt(day.download_bytes as string) || 0,
        activeUsers: parseInt(day.active_users as string) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/traffic/users - Get traffic by user
router.get('/users', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const userTraffic = await db('traffic_stats_daily')
      .where('stat_date', '>=', startDateStr)
      .select('user_id')
      .sum('total_bytes as total_bytes')
      .sum('upload_bytes as upload_bytes')
      .sum('download_bytes as download_bytes')
      .countDistinct('stat_date as active_days')
      .groupBy('user_id')
      .orderBy('total_bytes', 'desc')
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db('traffic_stats_daily')
      .where('stat_date', '>=', startDateStr)
      .countDistinct('user_id as count')
      .first();
    const total = parseInt(countResult?.count as string) || 0;

    // Get user details
    const userIds = userTraffic.map(u => u.user_id);
    const users = await db('users')
      .whereIn('user_id', userIds)
      .select('user_id', 'username', 'email', 'status');

    const userMap = users.reduce((acc, user) => {
      acc[user.user_id] = user;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        items: userTraffic.map(u => ({
          userId: u.user_id,
          username: userMap[u.user_id]?.username || 'Unknown',
          email: userMap[u.user_id]?.email || 'Unknown',
          status: userMap[u.user_id]?.status || 0,
          totalBytes: parseInt(u.total_bytes as string) || 0,
          uploadBytes: parseInt(u.upload_bytes as string) || 0,
          downloadBytes: parseInt(u.download_bytes as string) || 0,
          activeDays: parseInt(u.active_days as string) || 0
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/traffic/users/:userId - Get traffic for specific user
router.get('/users/:userId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const user = await db('users')
      .where('user_id', userId)
      .where('status', '!=', 3)
      .first();

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const trafficData = await db('traffic_stats_daily')
      .where('user_id', userId)
      .where('stat_date', '>=', startDateStr)
      .orderBy('stat_date', 'asc')
      .select('*');

    const totalStats = trafficData.reduce((acc, day) => ({
      total: acc.total + (day.total_bytes || 0),
      upload: acc.upload + (day.upload_bytes || 0),
      download: acc.download + (day.download_bytes || 0)
    }), { total: 0, upload: 0, download: 0 });

    // Get real-time traffic from Xray
    let realtimeTraffic = null;
    try {
      const xrayClient = getXrayClient();
      const isConnected = await xrayClient.testConnection();
      if (isConnected) {
        realtimeTraffic = await xrayClient.getUserStats(user.email, false);
      }
    } catch (error) {
      logger.warn(`Failed to get realtime traffic for user ${userId}:`, error);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        userId,
        username: user.username,
        email: user.email,
        trafficLimit: user.traffic_limit,
        trafficUsed: user.traffic_used,
        trafficRemaining: Math.max(0, user.traffic_limit - user.traffic_used),
        usagePercent: Math.round((user.traffic_used / user.traffic_limit) * 100),
        period: {
          total: totalStats.total,
          upload: totalStats.upload,
          download: totalStats.download,
          days: trafficData.length
        },
        realtime: realtimeTraffic,
        dailyStats: trafficData.map(day => ({
          date: day.stat_date,
          total: day.total_bytes,
          upload: day.upload_bytes,
          download: day.download_bytes
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/traffic/nodes - Get traffic by node
router.get('/nodes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const nodeTraffic = await db('traffic_stats_node')
      .where('stat_date', '>=', startDateStr)
      .select('node_id')
      .sum('total_bytes as total_bytes')
      .sum('upload_bytes as upload_bytes')
      .sum('download_bytes as download_bytes')
      .groupBy('node_id')
      .orderBy('total_bytes', 'desc');

    // Get node details
    const nodeIds = nodeTraffic.map(n => n.node_id);
    const nodes = await db('nodes')
      .whereIn('id', nodeIds)
      .select('id', 'code', 'name', 'region', 'status');

    const nodeMap = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<string, any>);

    // Get real-time inbound stats from Xray
    let realtimeInboundStats = null;
    try {
      const xrayClient = getXrayClient();
      const isConnected = await xrayClient.testConnection();
      if (isConnected) {
        realtimeInboundStats = await xrayClient.getAllInboundStats(false);
      }
    } catch (error) {
      logger.warn('Failed to get realtime inbound stats:', error);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: nodeTraffic.map(n => {
        const nodeCode = nodeMap[n.node_id]?.code;
        const inboundTag = nodeCode ? `node-${nodeCode}` : null;
        const realtimeStats = inboundTag && realtimeInboundStats ? realtimeInboundStats.get(inboundTag) : null;

        return {
          nodeId: n.node_id,
          code: nodeMap[n.node_id]?.code || 'Unknown',
          name: nodeMap[n.node_id]?.name || 'Unknown',
          region: nodeMap[n.node_id]?.region || 'Unknown',
          status: nodeMap[n.node_id]?.status || 'offline',
          totalBytes: parseInt(n.total_bytes as string) || 0,
          uploadBytes: parseInt(n.upload_bytes as string) || 0,
          downloadBytes: parseInt(n.download_bytes as string) || 0,
          realtime: realtimeStats
        };
      })
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/traffic/nodes/:nodeId - Get traffic for specific node
router.get('/nodes/:nodeId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nodeId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const node = await db('nodes')
      .where('id', nodeId)
      .orWhere('code', nodeId)
      .first();

    if (!node) {
      throw new NotFoundError('Node', nodeId);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const trafficData = await db('traffic_stats_node')
      .where('node_id', node.id)
      .where('stat_date', '>=', startDateStr)
      .orderBy('stat_date', 'asc')
      .select('*');

    const totalStats = trafficData.reduce((acc, day) => ({
      total: acc.total + (day.total_bytes || 0),
      upload: acc.upload + (day.upload_bytes || 0),
      download: acc.download + (day.download_bytes || 0)
    }), { total: 0, upload: 0, download: 0 });

    // Get real-time inbound stats
    let realtimeStats = null;
    try {
      const xrayClient = getXrayClient();
      const isConnected = await xrayClient.testConnection();
      if (isConnected) {
        const inboundTag = `node-${node.code}`;
        const inboundStats = await xrayClient.getAllInboundStats(false);
        realtimeStats = inboundStats.get(inboundTag);
      }
    } catch (error) {
      logger.warn(`Failed to get realtime stats for node ${nodeId}:`, error);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        nodeId: node.id,
        code: node.code,
        name: node.name,
        region: node.region,
        status: node.status,
        period: {
          total: totalStats.total,
          upload: totalStats.upload,
          download: totalStats.download,
          days: trafficData.length
        },
        realtime: realtimeStats,
        dailyStats: trafficData.map(day => ({
          date: day.stat_date,
          total: day.total_bytes,
          upload: day.upload_bytes,
          download: day.download_bytes
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/traffic/record - Record traffic data
router.post('/record', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, nodeId, uploadBytes, downloadBytes, timestamp } = req.body;

    const totalBytes = uploadBytes + downloadBytes;
    const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Update daily stats for user
    const existingUserStat = await db('traffic_stats_daily')
      .where({ user_id: userId, stat_date: date })
      .first();

    if (existingUserStat) {
      await db('traffic_stats_daily')
        .where({ user_id: userId, stat_date: date })
        .update({
          upload_bytes: existingUserStat.upload_bytes + uploadBytes,
          download_bytes: existingUserStat.download_bytes + downloadBytes,
          total_bytes: existingUserStat.total_bytes + totalBytes,
          updated_at: new Date()
        });
    } else {
      await db('traffic_stats_daily').insert({
        user_id: userId,
        stat_date: date,
        upload_bytes: uploadBytes,
        download_bytes: downloadBytes,
        total_bytes: totalBytes
      });
    }

    // Update daily stats for node
    const existingNodeStat = await db('traffic_stats_node')
      .where({ node_id: nodeId, stat_date: date })
      .first();

    if (existingNodeStat) {
      await db('traffic_stats_node')
        .where({ node_id: nodeId, stat_date: date })
        .update({
          upload_bytes: existingNodeStat.upload_bytes + uploadBytes,
          download_bytes: existingNodeStat.download_bytes + downloadBytes,
          total_bytes: existingNodeStat.total_bytes + totalBytes,
          updated_at: new Date()
        });
    } else {
      await db('traffic_stats_node').insert({
        node_id: nodeId,
        stat_date: date,
        upload_bytes: uploadBytes,
        download_bytes: downloadBytes,
        total_bytes: totalBytes
      });
    }

    // Update user's total traffic used
    await db('users')
      .where('user_id', userId)
      .update({
        traffic_used: db.raw('traffic_used + ?', [totalBytes]),
        updated_at: new Date()
      });

    res.json({
      success: true,
      code: 200,
      message: 'Traffic recorded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/traffic/realtime - Get real-time traffic statistics from Xray
router.get('/realtime', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xrayClient = getXrayClient();
    const isConnected = await xrayClient.testConnection();

    if (!isConnected) {
      return res.status(503).json({
        success: false,
        code: 503,
        message: 'Xray API not connected'
      });
    }

    // Get all user stats
    const userStats = await xrayClient.getAllUserStats(false);
    const inboundStats = await xrayClient.getAllInboundStats(false);

    // Calculate totals
    let totalUpload = 0;
    let totalDownload = 0;
    const activeUsers: string[] = [];

    userStats.forEach((stats, email) => {
      totalUpload += stats.uplink;
      totalDownload += stats.downlink;
      if (stats.total > 0) {
        activeUsers.push(email);
      }
    });

    // Get top users by traffic
    const topUsers = Array.from(userStats.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([email, stats]) => ({
        email,
        upload: stats.uplink,
        download: stats.downlink,
        total: stats.total
      }));

    // Get top inbounds by traffic
    const topInbounds = Array.from(inboundStats.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([tag, stats]) => ({
        tag,
        upload: stats.uplink,
        download: stats.downlink,
        total: stats.total
      }));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        timestamp: new Date().toISOString(),
        total: {
          upload: totalUpload,
          download: totalDownload,
          total: totalUpload + totalDownload
        },
        activeUsers: {
          count: activeUsers.length,
          emails: activeUsers
        },
        topUsers,
        inbounds: topInbounds
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/traffic/collect - Manually trigger traffic collection
router.post('/collect', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collector = getTrafficCollector();
    const result = await collector.manualCollect();

    if (result.success) {
      res.json({
        success: true,
        code: 200,
        message: result.message,
        data: {
          collectedCount: result.collectedCount
        }
      });
    } else {
      res.status(500).json({
        success: false,
        code: 500,
        message: result.message
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/traffic/collector/status - Get traffic collector status
router.get('/collector/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collector = getTrafficCollector();
    const status = collector.getStatus();

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: status
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/traffic/collector/start - Start traffic collector
router.post('/collector/start', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collector = getTrafficCollector();
    collector.start();

    res.json({
      success: true,
      code: 200,
      message: 'Traffic collector started'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/traffic/collector/stop - Stop traffic collector
router.post('/collector/stop', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collector = getTrafficCollector();
    collector.stop();

    res.json({
      success: true,
      code: 200,
      message: 'Traffic collector stopped'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/traffic/stats - Get comprehensive traffic statistics
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7) + '-01';

    // Today's traffic
    const [todayStats] = await db('traffic_stats_daily')
      .where('stat_date', today)
      .sum('total_bytes as total')
      .sum('upload_bytes as upload')
      .sum('download_bytes as download');

    // This month's traffic
    const [monthStats] = await db('traffic_stats_daily')
      .where('stat_date', '>=', thisMonth)
      .sum('total_bytes as total')
      .sum('upload_bytes as upload')
      .sum('download_bytes as download');

    // Total traffic
    const [totalStats] = await db('traffic_stats_daily')
      .sum('total_bytes as total')
      .sum('upload_bytes as upload')
      .sum('download_bytes as download');

    // Active users today
    const [activeUsersToday] = await db('traffic_stats_daily')
      .where('stat_date', today)
      .countDistinct('user_id as count');

    // Active users this month
    const [activeUsersMonth] = await db('traffic_stats_daily')
      .where('stat_date', '>=', thisMonth)
      .countDistinct('user_id as count');

    // Top 5 users by traffic
    const topUsers = await db('traffic_stats_daily')
      .select('user_id')
      .sum('total_bytes as total_bytes')
      .groupBy('user_id')
      .orderBy('total_bytes', 'desc')
      .limit(5);

    // Top 5 nodes by traffic
    const topNodes = await db('traffic_stats_node')
      .select('node_id')
      .sum('total_bytes as total_bytes')
      .groupBy('node_id')
      .orderBy('total_bytes', 'desc')
      .limit(5);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        today: {
          total: parseInt(todayStats.total as string) || 0,
          upload: parseInt(todayStats.upload as string) || 0,
          download: parseInt(todayStats.download as string) || 0,
          activeUsers: parseInt(activeUsersToday.count as string) || 0
        },
        thisMonth: {
          total: parseInt(monthStats.total as string) || 0,
          upload: parseInt(monthStats.upload as string) || 0,
          download: parseInt(monthStats.download as string) || 0,
          activeUsers: parseInt(activeUsersMonth.count as string) || 0
        },
        total: {
          total: parseInt(totalStats.total as string) || 0,
          upload: parseInt(totalStats.upload as string) || 0,
          download: parseInt(totalStats.download as string) || 0
        },
        topUsers: topUsers.map(u => ({
          userId: u.user_id,
          totalBytes: parseInt(u.total_bytes as string) || 0
        })),
        topNodes: topNodes.map(n => ({
          nodeId: n.node_id,
          totalBytes: parseInt(n.total_bytes as string) || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as trafficRoutes };
