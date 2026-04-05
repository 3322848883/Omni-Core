"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const client_1 = require("../services/xray/client");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.connectionRoutes = router;
// GET /api/v1/connections/online - Get all online users
router.get('/online', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const xrayClient = (0, client_1.getXrayClient)();
        const isConnected = await xrayClient.testConnection();
        if (!isConnected) {
            return res.status(503).json({
                success: false,
                code: 503,
                message: 'Xray API not connected'
            });
        }
        // Get online users from Xray
        const onlineUsers = await xrayClient.getOnlineUsers();
        // Get user details from database
        const emails = onlineUsers.map(u => u.email);
        const users = await (0, database_1.db)('users')
            .whereIn('email', emails)
            .select('user_id', 'username', 'email', 'vpn_uuid', 'subscription_plan', 'status');
        const userMap = users.reduce((acc, user) => {
            acc[user.email] = user;
            return acc;
        }, {});
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/connections/users/:userId - Get user connection details
router.get('/users/:userId', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await (0, database_1.db)('users')
            .where('user_id', userId)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', userId);
        }
        const xrayClient = (0, client_1.getXrayClient)();
        const isConnected = await xrayClient.testConnection();
        let connectionInfo = null;
        if (isConnected) {
            connectionInfo = await xrayClient.getUserConnections(user.email);
        }
        // Get user's traffic stats
        const today = new Date().toISOString().split('T')[0];
        const todayStats = await (0, database_1.db)('traffic_stats_daily')
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
                    upload: parseInt(todayStats?.upload) || 0,
                    download: parseInt(todayStats?.download) || 0,
                    total: parseInt(todayStats?.total) || 0
                },
                totalTraffic: {
                    limit: user.traffic_limit,
                    used: user.traffic_used,
                    remaining: Math.max(0, user.traffic_limit - user.traffic_used)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/connections/users/:userId/disconnect - Disconnect a user
router.post('/users/:userId/disconnect', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { inboundTag } = req.body; // Optional: specific inbound to disconnect from
        const user = await (0, database_1.db)('users')
            .where('user_id', userId)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', userId);
        }
        const xrayClient = (0, client_1.getXrayClient)();
        const isConnected = await xrayClient.testConnection();
        if (!isConnected) {
            return res.status(503).json({
                success: false,
                code: 503,
                message: 'Xray API not connected'
            });
        }
        // Disconnect user
        const success = await xrayClient.disconnectUser(user.email, inboundTag);
        if (success) {
            logger_1.logger.info(`User ${user.email} disconnected by ${req.user?.username || 'system'}`);
            res.json({
                success: true,
                code: 200,
                message: inboundTag
                    ? `User disconnected from inbound ${inboundTag}`
                    : 'User disconnected from all inbounds'
            });
        }
        else {
            res.status(500).json({
                success: false,
                code: 500,
                message: 'Failed to disconnect user'
            });
        }
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/connections/bulk-disconnect - Disconnect multiple users
router.post('/bulk-disconnect', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new errors_1.ValidationError([
                { field: 'userIds', message: 'userIds must be a non-empty array' }
            ]);
        }
        const xrayClient = (0, client_1.getXrayClient)();
        const isConnected = await xrayClient.testConnection();
        if (!isConnected) {
            return res.status(503).json({
                success: false,
                code: 503,
                message: 'Xray API not connected'
            });
        }
        // Get users
        const users = await (0, database_1.db)('users')
            .whereIn('user_id', userIds)
            .select('user_id', 'email');
        const results = {
            success: [],
            failed: []
        };
        for (const user of users) {
            try {
                const success = await xrayClient.disconnectUser(user.email);
                if (success) {
                    results.success.push(user.user_id);
                }
                else {
                    results.failed.push({ userId: user.user_id, error: 'Disconnect failed' });
                }
            }
            catch (error) {
                results.failed.push({
                    userId: user.user_id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        logger_1.logger.info(`Bulk disconnect: ${results.success.length} success, ${results.failed.length} failed`);
        res.json({
            success: true,
            code: 200,
            message: 'Bulk disconnect completed',
            data: results
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/connections/stats - Get connection statistics
router.get('/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const xrayClient = (0, client_1.getXrayClient)();
        const isConnected = await xrayClient.testConnection();
        if (!isConnected) {
            return res.status(503).json({
                success: false,
                code: 503,
                message: 'Xray API not connected'
            });
        }
        // Get online users
        const onlineUsers = await xrayClient.getOnlineUsers();
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/connections/inbounds/:tag/users - Get users connected to a specific inbound
router.get('/inbounds/:tag/users', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { tag } = req.params;
        const xrayClient = (0, client_1.getXrayClient)();
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
        const connectedUsers = [];
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
        const users = await (0, database_1.db)('users')
            .whereIn('email', emails)
            .select('user_id', 'username', 'email');
        const userMap = users.reduce((acc, user) => {
            acc[user.email] = user;
            return acc;
        }, {});
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
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/connections/inbounds/:tag/users/:email/remove - Remove user from specific inbound
router.post('/inbounds/:tag/users/:email/remove', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { tag, email } = req.params;
        const xrayClient = (0, client_1.getXrayClient)();
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
            logger_1.logger.info(`User ${email} removed from inbound ${tag} by ${req.user?.username || 'system'}`);
            res.json({
                success: true,
                code: 200,
                message: `User ${email} removed from inbound ${tag}`
            });
        }
        else {
            res.status(500).json({
                success: false,
                code: 500,
                message: 'Failed to remove user from inbound'
            });
        }
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=connections.js.map