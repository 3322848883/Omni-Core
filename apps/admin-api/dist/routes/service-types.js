"use strict";
/**
 * 服务类型统计路由
 * 提供服务类型相关的统计信息
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceTypeRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middlewares/auth");
const constants_1 = require("@shared/constants");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
exports.serviceTypeRoutes = router;
/**
 * GET /api/v1/service-types - 获取所有服务类型列表
 */
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const serviceTypes = Object.values(constants_1.ServiceType).map(type => ({
            type,
            ...constants_1.ServiceTypeMeta[type]
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: serviceTypes
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/service-types/stats - 获取各服务类型的统计信息
 * 包括节点数量、用户数量等
 */
router.get('/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        // 按服务类型统计节点数量
        const nodeStats = await (0, database_1.db)('nodes')
            .select('service_type')
            .count('* as count')
            .groupBy('service_type');
        // 按服务类型统计在线节点数量
        const onlineNodeStats = await (0, database_1.db)('nodes')
            .where('status', 'online')
            .select('service_type')
            .count('* as count')
            .groupBy('service_type');
        // 按服务类型统计总带宽
        const bandwidthStats = await (0, database_1.db)('nodes')
            .whereNotNull('bandwidth_limit')
            .select('service_type')
            .sum('bandwidth_limit as total_bandwidth')
            .groupBy('service_type');
        // 统计各服务类型的总用户数（通过套餐关联）
        // 首先获取各套餐的订阅数
        const subscriptionStats = await (0, database_1.db)('user_subscriptions')
            .join('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.id')
            .where('user_subscriptions.status', 'active')
            .select('subscription_plans.service_type as service_type')
            .count('* as count')
            .groupBy('service_type');
        // 统计各服务类型的活跃连接数
        const connectionStats = await (0, database_1.db)('nodes')
            .select('service_type')
            .sum('active_connections as total_connections')
            .groupBy('service_type');
        // 构建统计结果
        const stats = Object.values(constants_1.ServiceType).map(type => {
            const nodeCount = nodeStats.find(s => s.service_type === type)?.count || 0;
            const onlineCount = onlineNodeStats.find(s => s.service_type === type)?.count || 0;
            const bandwidth = bandwidthStats.find(s => s.service_type === type)?.total_bandwidth || 0;
            const userCount = subscriptionStats.find(s => s.service_type === type)?.count || 0;
            const connections = connectionStats.find(s => s.service_type === type)?.total_connections || 0;
            return {
                serviceType: type,
                label: constants_1.ServiceTypeMeta[type].label,
                description: constants_1.ServiceTypeMeta[type].description,
                color: constants_1.ServiceTypeMeta[type].color,
                icon: constants_1.ServiceTypeMeta[type].icon,
                priority: constants_1.ServiceTypeMeta[type].priority,
                nodes: {
                    total: parseInt(nodeCount) || 0,
                    online: parseInt(onlineCount) || 0,
                    offline: (parseInt(nodeCount) || 0) - (parseInt(onlineCount) || 0)
                },
                users: {
                    total: parseInt(userCount) || 0
                },
                connections: {
                    total: parseInt(connections) || 0
                },
                bandwidth: {
                    totalLimit: parseInt(bandwidth) || 0,
                    unit: 'Mbps'
                }
            };
        });
        // 计算总计
        const totalStats = {
            nodes: stats.reduce((sum, s) => sum + s.nodes.total, 0),
            onlineNodes: stats.reduce((sum, s) => sum + s.nodes.online, 0),
            users: stats.reduce((sum, s) => sum + s.users.total, 0),
            connections: stats.reduce((sum, s) => sum + s.connections.total, 0),
            bandwidth: stats.reduce((sum, s) => sum + s.bandwidth.totalLimit, 0)
        };
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                byType: stats,
                totals: totalStats
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/service-types/:type/stats - 获取指定服务类型的详细统计
 */
router.get('/:type/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { type } = req.params;
        // 验证服务类型
        if (!(0, constants_1.isValidServiceType)(type)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'type', message: `Invalid service type. Must be one of: ${Object.values(constants_1.ServiceType).join(', ')}` }
            ]);
        }
        const serviceType = type;
        // 获取该类型的节点统计
        const nodeStats = await (0, database_1.db)('nodes')
            .where('service_type', serviceType)
            .select(database_1.db.raw('COUNT(*) as total'), database_1.db.raw("SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online"), database_1.db.raw("SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline"), database_1.db.raw("SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance"), database_1.db.raw('SUM(active_connections) as total_connections'), database_1.db.raw('AVG(load_percent) as avg_load'), database_1.db.raw('SUM(bandwidth_limit) as total_bandwidth'), database_1.db.raw('SUM(max_users) as total_capacity'), database_1.db.raw('SUM(current_users) as current_users'))
            .first();
        // 按地区分布
        const regionDistribution = await (0, database_1.db)('nodes')
            .where('service_type', serviceType)
            .select('region')
            .count('* as count')
            .groupBy('region')
            .orderBy('count', 'desc');
        // 按协议分布
        const protocolDistribution = await (0, database_1.db)('nodes')
            .where('service_type', serviceType)
            .select('protocol')
            .count('* as count')
            .groupBy('protocol');
        // 获取该类型的用户统计
        const userStats = await (0, database_1.db)('user_subscriptions')
            .join('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.id')
            .where('subscription_plans.service_type', serviceType)
            .select(database_1.db.raw('COUNT(*) as total'), database_1.db.raw("SUM(CASE WHEN user_subscriptions.status = 'active' THEN 1 ELSE 0 END) as active"), database_1.db.raw("SUM(CASE WHEN user_subscriptions.status = 'expired' THEN 1 ELSE 0 END) as expired"))
            .first();
        // 获取该类型的套餐数量
        const planCount = await (0, database_1.db)('subscription_plans')
            .where('service_type', serviceType)
            .count('* as count')
            .first();
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                serviceType,
                label: constants_1.ServiceTypeMeta[serviceType].label,
                description: constants_1.ServiceTypeMeta[serviceType].description,
                nodes: {
                    total: parseInt(nodeStats?.total) || 0,
                    online: parseInt(nodeStats?.online) || 0,
                    offline: parseInt(nodeStats?.offline) || 0,
                    maintenance: parseInt(nodeStats?.maintenance) || 0,
                    connections: parseInt(nodeStats?.total_connections) || 0,
                    averageLoad: parseFloat(nodeStats?.avg_load) || 0,
                    totalBandwidth: parseInt(nodeStats?.total_bandwidth) || 0,
                    capacity: {
                        total: parseInt(nodeStats?.total_capacity) || 0,
                        used: parseInt(nodeStats?.current_users) || 0,
                        available: (parseInt(nodeStats?.total_capacity) || 0) - (parseInt(nodeStats?.current_users) || 0)
                    }
                },
                users: {
                    total: parseInt(userStats?.total) || 0,
                    active: parseInt(userStats?.active) || 0,
                    expired: parseInt(userStats?.expired) || 0
                },
                plans: {
                    total: parseInt(planCount?.count) || 0
                },
                distribution: {
                    byRegion: regionDistribution.map(r => ({
                        region: r.region,
                        count: parseInt(r.count)
                    })),
                    byProtocol: protocolDistribution.map(p => ({
                        protocol: p.protocol,
                        count: parseInt(p.count)
                    }))
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/service-types/:type/nodes - 获取指定服务类型的节点列表
 */
router.get('/:type/nodes', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { type } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        // 验证服务类型
        if (!(0, constants_1.isValidServiceType)(type)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'type', message: `Invalid service type. Must be one of: ${Object.values(constants_1.ServiceType).join(', ')}` }
            ]);
        }
        const serviceType = type;
        // 获取总数
        const [countResult] = await (0, database_1.db)('nodes')
            .where('service_type', serviceType)
            .count('* as count');
        const total = parseInt(countResult.count);
        // 获取节点列表
        const nodes = await (0, database_1.db)('nodes')
            .where('service_type', serviceType)
            .select('*')
            .orderBy('priority', 'desc')
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                serviceType,
                items: nodes.map(node => ({
                    id: node.id,
                    code: node.code,
                    name: node.name,
                    region: node.region,
                    country: node.country,
                    city: node.city,
                    host: node.host,
                    port: node.port,
                    protocol: node.protocol,
                    status: node.status,
                    healthScore: node.health_score,
                    loadPercent: node.load_percent,
                    activeConnections: node.active_connections,
                    maxConnections: node.max_connections,
                    serviceGroup: node.service_group,
                    isPremium: node.is_premium,
                    qosLevel: node.qos_level,
                    bandwidthLimit: node.bandwidth_limit,
                    maxUsers: node.max_users,
                    currentUsers: node.current_users
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/service-types/groups - 获取服务类型分组信息
 */
router.get('/groups/all', auth_1.authMiddleware, async (req, res, next) => {
    try {
        // 获取每个组的统计
        const groupsWithStats = await Promise.all(constants_1.PLAN_GROUPS.map(async (group) => {
            // 获取该组包含的服务类型
            const serviceTypes = [...group.serviceTypes];
            // 统计该组的节点数
            const nodeCount = await (0, database_1.db)('nodes')
                .whereIn('service_type', serviceTypes)
                .count('* as count')
                .first();
            // 统计该组的用户数
            const userCount = await (0, database_1.db)('user_subscriptions')
                .join('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.id')
                .whereIn('subscription_plans.service_type', serviceTypes)
                .where('user_subscriptions.status', 'active')
                .count('* as count')
                .first();
            // 统计该组的套餐数
            const planCount = await (0, database_1.db)('subscription_plans')
                .whereIn('service_type', serviceTypes)
                .count('* as count')
                .first();
            return {
                id: group.id,
                name: group.name,
                description: group.description,
                serviceTypes,
                icon: group.icon,
                color: group.color,
                recommendedFor: [...group.recommendedFor],
                stats: {
                    nodes: parseInt(nodeCount?.count) || 0,
                    users: parseInt(userCount?.count) || 0,
                    plans: parseInt(planCount?.count) || 0
                }
            };
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: groupsWithStats
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/service-types/overview - 获取服务类型概览（用于仪表盘）
 */
router.get('/overview/dashboard', auth_1.authMiddleware, async (req, res, next) => {
    try {
        // 获取各服务类型的关键指标
        const overview = await Promise.all(Object.values(constants_1.ServiceType).map(async (type) => {
            // 节点统计
            const nodeStats = await (0, database_1.db)('nodes')
                .where('service_type', type)
                .select(database_1.db.raw('COUNT(*) as total'), database_1.db.raw("SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online"))
                .first();
            // 活跃用户数
            const userStats = await (0, database_1.db)('user_subscriptions')
                .join('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.id')
                .where('subscription_plans.service_type', type)
                .where('user_subscriptions.status', 'active')
                .count('* as count')
                .first();
            // 今日流量（简化处理，实际需要查询流量表）
            // 这里返回模拟数据
            return {
                serviceType: type,
                label: constants_1.ServiceTypeMeta[type].label,
                color: constants_1.ServiceTypeMeta[type].color,
                icon: constants_1.ServiceTypeMeta[type].icon,
                nodes: {
                    total: parseInt(nodeStats?.total) || 0,
                    online: parseInt(nodeStats?.online) || 0
                },
                activeUsers: parseInt(userStats?.count) || 0,
                health: parseInt(nodeStats?.total) > 0
                    ? Math.round((parseInt(nodeStats?.online) || 0) / parseInt(nodeStats?.total) * 100)
                    : 100
            };
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: overview
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=service-types.js.map