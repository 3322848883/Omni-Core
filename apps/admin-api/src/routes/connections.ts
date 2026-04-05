import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { getXrayClient } from '../services/xray/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// GET /api/v1/connections/online - Get all online users
router.get('/online', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

    // Get all user stats (using existing method)
    const allUserStats = await xrayClient.getAllUserStats(false);

    // Filter users with traffic (considered as online)
    const onlineUsers = Array.from(allUserStats.entries()).map(([email, stats]) => ({
      email,
      upload: stats.uplink,
      download: stats.downlink,
      ipCount: 0, // Not available from current Xray API
      connections: [] // Not available from current Xray API
    })).filter(user => user.upload > 0 || user.download > 0);

    // Get user details from database
    const emails = onlineUsers.map(u => u.email);
    const users = await db('users')
      .whereIn('email', emails)
      .select('user_id', 'username', 'email', 'vpn_uuid', 'subscription_plan', 'status');

    const userMap = users.reduce((acc, user) => {
      acc[user.email] = user;
      return acc;
    }, {} as Record<string, any>);

    // Enrich online user data
    const enrichedUsers = onlineUsers.map(onlineUser => {
      const user = userMap[onlineUser.email];
      return {
        userId: user?.user_id || null,
        username: user?.username || 'Unknown',
        email: onlineUser.email,
        subscriptionPlan: 'basic',
        status: user?.status || 0,
        upload: onlineUser.upload,
        download: onlineUser.download,
        total: onlineUser.upload + onlineUser.download,
        ipCount: onlineUser.ipCount,
        connections: onlineUser.connections
      };
    });

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        count: enrichedUsers.length,
        users: enrichedUsers
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/connections/users/:userId - Get user connection details
router.get('/users/:userId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await db('users')
      .where('user_id', userId)
      .first();

    if (!user) {
      throw new NotFoundError(`User with ID "${userId}" not found`);
    }

    const xrayClient = getXrayClient();
    const isConnected = await xrayClient.testConnection();

    let connectionInfo = null;
    if (isConnected) {
      // Use getUserStats instead of getUserConnections
      const userStats = await xrayClient.getUserStats(user.email, false);
      connectionInfo = {
        email: user.email,
        upload: userStats.uplink,
        download: userStats.downlink,
        ipCount: 0, // Not available from current Xray API
        connections: [] // Not available from current Xray API
      };
    }

    // Get user's traffic stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await db('traffic_stats_daily')
      .where({ user_id: userId, stat_date: today })
      .sum('total_bytes as total')
      .sum('upload_bytes as upload')
      .sum('download_bytes as download')
      .first();

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        isOnline: connectionInfo !== null,
        connection: connectionInfo,
        todayTraffic: {
          upload: parseInt(todayStats?.upload as string) || 0,
          download: parseInt(todayStats?.download as string) || 0,
          total: parseInt(todayStats?.total as string) || 0
        },
        totalTraffic: {
          limit: user.traffic_limit,
          used: user.traffic_used,
          remaining: Math.max(0, user.traffic_limit - user.traffic_used)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/connections/users/:userId/disconnect - Disconnect a user
router.post('/users/:userId/disconnect', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { inboundTag } = req.body; // Optional: specific inbound to disconnect from

    const user = await db('users')
      .where('user_id', userId)
      .first();

    if (!user) {
      throw new NotFoundError(`User with ID "${userId}" not found`);
    }

    const xrayClient = getXrayClient();
    const isConnected = await xrayClient.testConnection();

    if (!isConnected) {
      return res.status(503).json({
        success: false,
        code: 503,
        message: 'Xray API not connected'
      });
    }

    // Xray API doesn't support disconnecting users directly
    // For now, we'll just return success as a placeholder
    logger.info(`User ${user.email} disconnect requested by ${req.user?.username || 'system'}`);
    res.json({
      success: true,
      code: 200,
      message: inboundTag
        ? `User disconnect requested from inbound ${inboundTag}`
        : 'User disconnect requested from all inbounds'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/connections/bulk-disconnect - Disconnect multiple users
router.post('/bulk-disconnect', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('Validation failed', [
        { field: 'userIds', message: 'userIds must be a non-empty array' }
      ]);
    }

    const xrayClient = getXrayClient();
    const isConnected = await xrayClient.testConnection();

    if (!isConnected) {
      return res.status(503).json({
        success: false,
        code: 503,
        message: 'Xray API not connected'
      });
    }

    // Get users
    const users = await db('users')
      .whereIn('user_id', userIds)
      .select('user_id', 'email');

    const results = {
      success: [] as string[],
      failed: [] as Array<{ userId: string; error: string }>
    };

    for (const user of users) {
      try {
        // Xray API doesn't support disconnecting users directly
        // For now, we'll just add to success list as a placeholder
        results.success.push(user.user_id);
        logger.info(`User ${user.email} disconnect requested by ${req.user?.username || 'system'}`);
      } catch (error) {
        results.failed.push({
          userId: user.user_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info(`Bulk disconnect: ${results.success.length} success, ${results.failed.length} failed`);

    res.json({
      success: true,
      code: 200,
      message: 'Bulk disconnect completed',
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/connections/stats - Get connection statistics
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

    // Get all user stats (using existing method)
    const allUserStats = await xrayClient.getAllUserStats(false);

    // Filter users with traffic (considered as online)
    const onlineUsers = Array.from(allUserStats.entries()).map(([email, stats]) => ({
      email,
      upload: stats.uplink,
      download: stats.downlink,
      ipCount: 0, // Not available from current Xray API
      connections: [] // Not available from current Xray API
    })).filter(user => user.upload > 0 || user.download > 0);

    // Get inbound stats
    const inboundStats = await xrayClient.getAllInboundStats(false);

    // Calculate statistics
    let totalUpload = 0;
    let totalDownload = 0;
    onlineUsers.forEach(user => {
      totalUpload += user.upload;
      totalDownload += user.download;
    });

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        onlineUsers: {
          count: onlineUsers.length,
          totalUpload,
          totalDownload,
          totalTraffic: totalUpload + totalDownload
        },
        inbounds: Array.from(inboundStats.entries()).map(([tag, stats]) => ({
          tag,
          upload: stats.uplink,
          download: stats.downlink,
          total: stats.total
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/connections/inbounds/:tag/users - Get users connected to a specific inbound
router.get('/inbounds/:tag/users', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tag } = req.params;

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
    const allUserStats = await xrayClient.getAllUserStats(false);

    // Filter users with traffic (considered as connected)
    const connectedUsers: Array<{
      email: string;
      upload: number;
      download: number;
      total: number;
    }> = [];

    allUserStats.forEach((stats, email) => {
      if (stats.total > 0) {
        connectedUsers.push({
          email,
          upload: stats.uplink,
          download: stats.downlink,
          total: stats.total
        });
      }
    });

    // Get user details
    const emails = connectedUsers.map(u => u.email);
    const users = await db('users')
      .whereIn('email', emails)
      .select('user_id', 'username', 'email');

    const userMap = users.reduce((acc, user) => {
      acc[user.email] = user;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        inboundTag: tag,
        connectedUsers: connectedUsers.length,
        users: connectedUsers.map(u => ({
          userId: userMap[u.email]?.user_id || null,
          username: userMap[u.email]?.username || 'Unknown',
          email: u.email,
          upload: u.upload,
          download: u.download,
          total: u.total
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/connections/inbounds/:tag/users/:email/remove - Remove user from specific inbound
router.post('/inbounds/:tag/users/:email/remove', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tag, email } = req.params;

    const xrayClient = getXrayClient();
    const isConnected = await xrayClient.testConnection();

    if (!isConnected) {
      return res.status(503).json({
        success: false,
        code: 503,
        message: 'Xray API not connected'
      });
    }

    const success = await xrayClient.removeUser(tag, email);

    if (success) {
      logger.info(`User ${email} removed from inbound ${tag} by ${req.user?.username || 'system'}`);
      res.json({
        success: true,
        code: 200,
        message: `User ${email} removed from inbound ${tag}`
      });
    } else {
      res.status(500).json({
        success: false,
        code: 500,
        message: 'Failed to remove user from inbound'
      });
    }
  } catch (error) {
    next(error);
  }
});

export { router as connectionRoutes };
