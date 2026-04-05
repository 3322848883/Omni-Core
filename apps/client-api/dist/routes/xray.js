"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xrayRoutes = void 0;
const express_1 = require("express");
const xray_1 = require("@/services/xray");
const subscription_1 = require("@/services/subscription");
const healthCheck_1 = require("@/services/healthCheck");
const response_1 = require("@/utils/response");
const constants_1 = require("@/constants");
const database_1 = __importDefault(require("@/config/database"));
const logger_1 = __importDefault(require("@/utils/logger"));
const nodeFilterService_1 = require("@/services/nodeFilterService");
const router = (0, express_1.Router)();
exports.xrayRoutes = router;
/**
 * GET /xray/config - 获取 Xray 配置（管理员）
 */
router.get('/config', async (req, res) => {
    try {
        // 获取所有节点和用户信息
        const nodes = await (0, database_1.default)('nodes').where({ is_active: true }).select('*');
        const users = await (0, database_1.default)('users').where({ status: 1 }).select('*');
        // 转换为用户配置格式
        const userConfigs = users.map((user) => ({
            userId: user.user_id,
            email: user.email,
            uuid: user.vpn_uuid || xray_1.xrayService.generateUUID(),
            trafficLimit: user.traffic_limit,
            trafficUsed: user.traffic_used,
            expireDate: user.expire_date,
            isActive: user.status === 1,
        }));
        // 生成配置
        const config = await xray_1.xrayService.generateConfig(nodes, userConfigs);
        (0, response_1.successResponse)(res, config, '获取 Xray 配置成功');
    }
    catch (error) {
        logger_1.default.error('Failed to get Xray config:', error);
        (0, response_1.errorResponse)(res, '获取 Xray 配置失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取 Xray 配置失败' }]);
    }
});
/**
 * POST /xray/config - 更新 Xray 配置（管理员）
 */
router.post('/config', async (req, res) => {
    try {
        const config = req.body;
        // 验证配置
        xray_1.xrayService.validateConfig(config);
        // 保存配置
        await xray_1.xrayService.saveConfig(config);
        (0, response_1.successResponse)(res, null, 'Xray 配置已更新');
    }
    catch (error) {
        logger_1.default.error('Failed to update Xray config:', error);
        (0, response_1.errorResponse)(res, error instanceof Error ? error.message : '配置更新失败', constants_1.ErrorCode.VALIDATION_ERROR, constants_1.HttpStatus.BAD_REQUEST, [{ field: 'config', message: error instanceof Error ? error.message : '配置更新失败' }]);
    }
});
/**
 * POST /xray/reload - 热重载 Xray 配置（管理员）
 */
router.post('/reload', async (req, res) => {
    try {
        await xray_1.xrayService.reloadConfig();
        (0, response_1.successResponse)(res, null, 'Xray 配置已重载');
    }
    catch (error) {
        logger_1.default.error('Failed to reload Xray config:', error);
        (0, response_1.errorResponse)(res, '配置重载失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '配置重载失败' }]);
    }
});
/**
 * GET /xray/traffic - 获取流量统计（管理员）
 */
router.get('/traffic', async (req, res) => {
    try {
        const { userId, nodeId, startDate, endDate } = req.query;
        let query = (0, database_1.default)('traffic_logs').select('*');
        if (userId) {
            query = query.where('user_id', userId);
        }
        if (nodeId) {
            query = query.where('node_id', nodeId);
        }
        if (startDate) {
            query = query.where('recorded_at', '>=', startDate);
        }
        if (endDate) {
            query = query.where('recorded_at', '<=', endDate);
        }
        const logs = await query.orderBy('recorded_at', 'desc').limit(1000);
        (0, response_1.successResponse)(res, logs, '获取流量统计成功');
    }
    catch (error) {
        logger_1.default.error('Failed to get traffic stats:', error);
        (0, response_1.errorResponse)(res, '获取流量统计失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取流量统计失败' }]);
    }
});
/**
 * GET /xray/nodes/:id/health - 获取节点健康状态
 */
router.get('/nodes/:id/health', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 100 } = req.query;
        const history = await healthCheck_1.healthCheckService.getHealthHistory(id, parseInt(limit, 10));
        (0, response_1.successResponse)(res, history, '获取健康状态成功');
    }
    catch (error) {
        logger_1.default.error('Failed to get health history:', error);
        (0, response_1.errorResponse)(res, '获取健康状态失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取健康状态失败' }]);
    }
});
/**
 * POST /xray/nodes/:id/test - 测试节点
 */
router.post('/nodes/:id/test', async (req, res) => {
    try {
        const { id } = req.params;
        // 获取节点信息
        const node = await (0, database_1.default)('nodes').where({ id }).first();
        if (!node) {
            return (0, response_1.errorResponse)(res, '节点不存在', constants_1.ErrorCode.NOT_FOUND, constants_1.HttpStatus.NOT_FOUND, [{ field: 'id', message: '节点不存在' }]);
        }
        // 执行健康检查
        const result = await healthCheck_1.healthCheckService.checkNodeStatus(id, node.host, node.port);
        // 执行延迟测试
        const latencyResult = await healthCheck_1.healthCheckService.testLatency(id, node.host, node.port);
        (0, response_1.successResponse)(res, {
            health: result,
            latency: latencyResult,
        }, '节点测试完成');
    }
    catch (error) {
        logger_1.default.error('Failed to test node:', error);
        (0, response_1.errorResponse)(res, '节点测试失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '节点测试失败' }]);
    }
});
/**
 * GET /xray/nodes/:id/latency - 获取节点延迟历史
 */
router.get('/nodes/:id/latency', async (req, res) => {
    try {
        const { id } = req.params;
        const { hours = 24 } = req.query;
        const history = await healthCheck_1.healthCheckService.getLatencyHistory(id, parseInt(hours, 10));
        (0, response_1.successResponse)(res, history, '获取延迟历史成功');
    }
    catch (error) {
        logger_1.default.error('Failed to get latency history:', error);
        (0, response_1.errorResponse)(res, '获取延迟历史失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取延迟历史失败' }]);
    }
});
/**
 * GET /subscription/config - 获取订阅配置（用户）
 */
router.get('/subscription/config', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return (0, response_1.errorResponse)(res, '未授权', constants_1.ErrorCode.UNAUTHORIZED, constants_1.HttpStatus.UNAUTHORIZED, [{ field: 'authorization', message: '未授权' }]);
        }
        // 使用新的 generateSubscriptionConfig 方法
        const config = await subscription_1.subscriptionService.generateSubscriptionConfig(user.user_id);
        // 如果没有可访问的节点，返回 404
        if (!config || config.nodes.length === 0) {
            return (0, response_1.errorResponse)(res, '没有可访问的节点', constants_1.ErrorCode.NOT_FOUND, constants_1.HttpStatus.NOT_FOUND, [{ field: 'nodes', message: '没有可访问的节点' }]);
        }
        // 生成 Base64 订阅内容
        const subscriptionContent = subscription_1.subscriptionService.generateBase64Subscription(config);
        // 设置响应头
        const headers = subscription_1.subscriptionService.generateSubscriptionHeader(config);
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(subscriptionContent);
    }
    catch (error) {
        logger_1.default.error('Failed to get subscription config:', error);
        (0, response_1.errorResponse)(res, '获取订阅配置失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取订阅配置失败' }]);
    }
});
/**
 * GET /subscription/qr - 获取订阅二维码（用户）
 */
router.get('/subscription/qr', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return (0, response_1.errorResponse)(res, '未授权', constants_1.ErrorCode.UNAUTHORIZED, constants_1.HttpStatus.UNAUTHORIZED, [{ field: 'authorization', message: '未授权' }]);
        }
        // 获取用户信息
        const userInfo = await (0, database_1.default)('users').where({ user_id: user.user_id }).first();
        if (!userInfo) {
            return (0, response_1.errorResponse)(res, '用户不存在', constants_1.ErrorCode.NOT_FOUND, constants_1.HttpStatus.NOT_FOUND, [{ field: 'user', message: '用户不存在' }]);
        }
        // 生成订阅 URL
        const subscriptionUrl = `${req.protocol}://${req.get('host')}/subscription/config`;
        // 生成二维码
        const qrCode = await subscription_1.subscriptionService.generateQRCode(subscriptionUrl);
        (0, response_1.successResponse)(res, { qrCode, url: subscriptionUrl }, '获取二维码成功');
    }
    catch (error) {
        logger_1.default.error('Failed to generate subscription QR:', error);
        (0, response_1.errorResponse)(res, '生成二维码失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '生成二维码失败' }]);
    }
});
/**
 * GET /subscription/clash - 获取 Clash 配置（用户）
 */
router.get('/subscription/clash', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return (0, response_1.errorResponse)(res, '未授权', constants_1.ErrorCode.UNAUTHORIZED, constants_1.HttpStatus.UNAUTHORIZED, [{ field: 'authorization', message: '未授权' }]);
        }
        // 使用新的 generateSubscriptionConfig 方法
        const config = await subscription_1.subscriptionService.generateSubscriptionConfig(user.user_id);
        // 如果没有可访问的节点，返回 404
        if (!config || config.nodes.length === 0) {
            return (0, response_1.errorResponse)(res, '没有可访问的节点', constants_1.ErrorCode.NOT_FOUND, constants_1.HttpStatus.NOT_FOUND, [{ field: 'nodes', message: '没有可访问的节点' }]);
        }
        const clashConfig = subscription_1.subscriptionService.generateClashConfig(config);
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${user.user_id}.yaml"`);
        res.send(Buffer.from(clashConfig, 'base64').toString('utf-8'));
    }
    catch (error) {
        logger_1.default.error('Failed to get Clash config:', error);
        (0, response_1.errorResponse)(res, '获取 Clash 配置失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取 Clash 配置失败' }]);
    }
});
/**
 * GET /nodes/:id/config - 获取节点配置（用户）
 */
router.get('/nodes/:id/config', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return (0, response_1.errorResponse)(res, '未授权', constants_1.ErrorCode.UNAUTHORIZED, constants_1.HttpStatus.UNAUTHORIZED, [{ field: 'authorization', message: '未授权' }]);
        }
        // 检查用户是否有权限访问该节点
        const accessCheck = await nodeFilterService_1.nodeFilterService.checkUserNodeAccess(id, user.user_id);
        if (!accessCheck.allowed) {
            return (0, response_1.errorResponse)(res, accessCheck.reason || '无权访问该节点', constants_1.ErrorCode.FORBIDDEN, constants_1.HttpStatus.FORBIDDEN, [{ field: 'id', message: accessCheck.reason || '无权访问该节点' }]);
        }
        // 获取节点信息
        const node = await (0, database_1.default)('nodes').where({ id, is_active: true }).first();
        if (!node) {
            return (0, response_1.errorResponse)(res, '节点不存在', constants_1.ErrorCode.NOT_FOUND, constants_1.HttpStatus.NOT_FOUND, [{ field: 'id', message: '节点不存在' }]);
        }
        // 获取用户信息
        const userInfo = await (0, database_1.default)('users').where({ user_id: user.user_id }).first();
        if (!userInfo) {
            return (0, response_1.errorResponse)(res, '用户不存在', constants_1.ErrorCode.NOT_FOUND, constants_1.HttpStatus.NOT_FOUND, [{ field: 'user', message: '用户不存在' }]);
        }
        // 生成分享链接
        const nodeConfig = {
            id: node.id,
            name: node.name,
            protocol: node.protocol,
            host: node.host,
            port: node.port,
            security: node.security,
            network: node.network,
            path: node.path,
            serviceName: node.service_name,
            flow: node.flow,
            encryption: node.encryption,
        };
        const shareLink = subscription_1.subscriptionService.generateNodeLink(nodeConfig, userInfo.vpn_uuid, userInfo.email);
        // 生成二维码
        const qrCode = await subscription_1.subscriptionService.generateQRCode(shareLink);
        (0, response_1.successResponse)(res, {
            link: shareLink,
            qrCode,
            node: {
                id: node.id,
                name: node.name,
                protocol: node.protocol,
                host: node.host,
                port: node.port,
            },
        }, '获取节点配置成功');
    }
    catch (error) {
        logger_1.default.error('Failed to get node config:', error);
        (0, response_1.errorResponse)(res, '获取节点配置失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取节点配置失败' }]);
    }
});
/**
 * GET /nodes/:id/latency - 测试节点延迟（用户）
 */
router.get('/nodes/:id/latency', async (req, res) => {
    try {
        const { id } = req.params;
        // 获取节点信息
        const node = await (0, database_1.default)('nodes').where({ id, is_active: true }).first();
        if (!node) {
            return (0, response_1.errorResponse)(res, '节点不存在', constants_1.ErrorCode.NOT_FOUND, constants_1.HttpStatus.NOT_FOUND, [{ field: 'id', message: '节点不存在' }]);
        }
        // 执行延迟测试
        const result = await healthCheck_1.healthCheckService.testLatency(id, node.host, node.port);
        (0, response_1.successResponse)(res, result, '延迟测试完成');
    }
    catch (error) {
        logger_1.default.error('Failed to test latency:', error);
        (0, response_1.errorResponse)(res, '延迟测试失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '延迟测试失败' }]);
    }
});
/**
 * GET /traffic/realtime - 获取实时流量（用户）
 */
router.get('/traffic/realtime', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return (0, response_1.errorResponse)(res, '未授权', constants_1.ErrorCode.UNAUTHORIZED, constants_1.HttpStatus.UNAUTHORIZED, [{ field: 'authorization', message: '未授权' }]);
        }
        // 查询 Xray 流量统计
        const stats = await xray_1.xrayService.queryUserTraffic(user.email);
        if (!stats) {
            return (0, response_1.successResponse)(res, {
                upload: 0,
                download: 0,
                total: 0,
            }, '获取实时流量成功');
        }
        (0, response_1.successResponse)(res, {
            upload: stats.upload,
            download: stats.download,
            total: stats.total,
        }, '获取实时流量成功');
    }
    catch (error) {
        logger_1.default.error('Failed to get realtime traffic:', error);
        (0, response_1.errorResponse)(res, '获取实时流量失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取实时流量失败' }]);
    }
});
/**
 * GET /traffic/usage - 获取流量使用情况（用户）
 */
router.get('/traffic/usage', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return (0, response_1.errorResponse)(res, '未授权', constants_1.ErrorCode.UNAUTHORIZED, constants_1.HttpStatus.UNAUTHORIZED, [{ field: 'authorization', message: '未授权' }]);
        }
        // 获取用户信息
        const userInfo = await (0, database_1.default)('users').where({ user_id: user.user_id }).first();
        if (!userInfo) {
            return (0, response_1.errorResponse)(res, '用户不存在', constants_1.ErrorCode.NOT_FOUND, constants_1.HttpStatus.NOT_FOUND, [{ field: 'user', message: '用户不存在' }]);
        }
        // 获取今日流量
        const today = new Date().toISOString().split('T')[0];
        const todayStats = await (0, database_1.default)('traffic_daily')
            .where({ user_id: userInfo.id, date: today })
            .sum('total as total')
            .first();
        // 获取本月流量
        const now = new Date();
        const monthStats = await (0, database_1.default)('traffic_monthly')
            .where({
            user_id: userInfo.id,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        })
            .first();
        (0, response_1.successResponse)(res, {
            total: userInfo.traffic_limit,
            used: userInfo.traffic_used,
            remaining: Math.max(0, userInfo.traffic_limit - userInfo.traffic_used),
            percentage: userInfo.traffic_limit > 0
                ? Math.round((userInfo.traffic_used / userInfo.traffic_limit) * 100)
                : 0,
            today: parseInt(todayStats?.total, 10) || 0,
            month: monthStats?.total || 0,
        }, '获取流量使用情况成功');
    }
    catch (error) {
        logger_1.default.error('Failed to get traffic usage:', error);
        (0, response_1.errorResponse)(res, '获取流量使用情况失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR, [{ field: 'general', message: '获取流量使用情况失败' }]);
    }
});
//# sourceMappingURL=xray.js.map