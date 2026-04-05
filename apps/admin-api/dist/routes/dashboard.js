"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middlewares/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [userStats, nodeStats, orderStats, revenueStats] = await Promise.all([
            (0, database_1.db)('users')
                .count('* as total')
                .first(),
            (0, database_1.db)('nodes')
                .count('* as total')
                .where('status', 'online')
                .count('* as online')
                .first(),
            (0, database_1.db)('orders')
                .count('* as total')
                .where('status', 'pending')
                .count('* as pending')
                .first(),
            (0, database_1.db)('orders')
                .where('status', 'completed')
                .sum('amount as total')
                .first()
        ]);
        const activeUsersResult = await (0, database_1.db)('users')
            .where('status', 1)
            .count('* as active')
            .first();
        const monthlyRevenueResult = await (0, database_1.db)('orders')
            .where('status', 'completed')
            .where('payment_time', '>=', startOfMonth.toISOString())
            .sum('amount as monthly')
            .first();
        const stats = {
            totalUsers: parseInt(userStats?.total) || 0,
            activeUsers: parseInt(activeUsersResult?.active) || 0,
            totalNodes: parseInt(nodeStats?.total) || 0,
            onlineNodes: parseInt(nodeStats?.online) || 0,
            totalOrders: parseInt(orderStats?.total) || 0,
            pendingOrders: parseInt(orderStats?.pending) || 0,
            totalRevenue: parseFloat(revenueStats?.total) || 0,
            monthlyRevenue: parseFloat(monthlyRevenueResult?.monthly) || 0,
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching dashboard stats:', error);
        next(error);
    }
});
router.get('/charts', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { period = '7d' } = req.query;
        const now = new Date();
        let days = 7;
        if (period === '30d')
            days = 30;
        else if (period === '90d')
            days = 90;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const [ordersByDate, revenueByDate, usersByDate] = await Promise.all([
            (0, database_1.db)('orders')
                .select(database_1.db.raw("DATE(created_at) as date, COUNT(*) as count"))
                .where('created_at', '>=', startDate.toISOString())
                .groupBy('date')
                .orderBy('date', 'asc'),
            (0, database_1.db)('orders')
                .select(database_1.db.raw("DATE(payment_time) as date, SUM(amount) as revenue"))
                .where('status', 'completed')
                .where('payment_time', '>=', startDate.toISOString())
                .groupBy('date')
                .orderBy('date', 'asc'),
            (0, database_1.db)('users')
                .select(database_1.db.raw("DATE(created_at) as date, COUNT(*) as count"))
                .where('created_at', '>=', startDate.toISOString())
                .groupBy('date')
                .orderBy('date', 'asc')
        ]);
        const ordersChart = ordersByDate.map((row) => ({
            date: row.date,
            value: parseInt(row.count)
        }));
        const revenueChart = revenueByDate.map((row) => ({
            date: row.date,
            value: parseFloat(row.revenue || 0)
        }));
        const usersChart = usersByDate.map((row) => ({
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching dashboard charts:', error);
        next(error);
    }
});
router.get('/activities', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { limit = '20', offset = '0' } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 20, 100);
        const pageOffset = parseInt(offset) || 0;
        const activities = await (0, database_1.db)('admin_logs')
            .select('admin_logs.*', 'admin_users.username as adminUsername')
            .leftJoin('admin_users', 'admin_logs.admin_id', 'admin_users.id')
            .orderBy('admin_logs.created_at', 'desc')
            .limit(pageLimit)
            .offset(pageOffset);
        const [{ total }] = await (0, database_1.db)('admin_logs').count('* as total');
        res.json({
            success: true,
            data: {
                items: activities,
                total: parseInt(total),
                limit: pageLimit,
                offset: pageOffset
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching dashboard activities:', error);
        next(error);
    }
});
router.get('/alerts', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const alerts = [];
        const now = new Date();
        const [offlineNodes, pendingOrders, expiringSubscriptions] = await Promise.all([
            (0, database_1.db)('nodes').where('status', 'offline').select('id', 'name').limit(5),
            (0, database_1.db)('orders').where('status', 'pending').count('* as count').first(),
            (0, database_1.db)('users')
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
        if (pendingOrders && parseInt(pendingOrders.count) > 10) {
            alerts.push({
                id: 'pending-orders',
                type: 'warning',
                title: '待处理订单',
                message: `有 ${pendingOrders.count} 个待处理订单需要处理`,
                createdAt: now
            });
        }
        if (expiringSubscriptions && parseInt(expiringSubscriptions.count) > 0) {
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching dashboard alerts:', error);
        next(error);
    }
});
exports.dashboardRoutes = router;
//# sourceMappingURL=dashboard.js.map