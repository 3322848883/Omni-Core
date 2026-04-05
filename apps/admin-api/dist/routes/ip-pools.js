"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipPoolRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middlewares/auth");
const ip_pool_1 = require("../services/ip-pool");
const ip_reputation_1 = require("../services/ip-reputation");
const ip_assets_1 = require("../shared/constants/ip-assets");
const router = (0, express_1.Router)();
exports.ipPoolRoutes = router;
const ipPoolService = (0, ip_pool_1.getIPPoolService)();
const ipReputationService = (0, ip_reputation_1.getIPReputationService)();
/**
 * GET /api/v1/ip-pools - 获取IP池列表
 * Query参数: page, limit, nodeId, ipType, isActive
 */
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const nodeId = req.query.nodeId;
        const ipType = req.query.ipType;
        const isActive = req.query.isActive;
        const options = { page, limit };
        if (nodeId)
            options.nodeId = nodeId;
        if (ipType && (0, ip_assets_1.isValidIpType)(ipType))
            options.ipType = ipType;
        if (isActive !== undefined)
            options.isActive = isActive === 'true' || isActive === '1';
        const result = await ipPoolService.listIPPools(options);
        // 获取每个IP池的节点信息
        const itemsWithNodeInfo = await Promise.all(result.items.map(async (pool) => {
            const node = await (0, database_1.db)('nodes')
                .where('id', pool.nodeId)
                .first('code', 'name', 'status');
            const ipStats = await (0, database_1.db)('ip_pool_ips')
                .where('pool_id', pool.id)
                .select(database_1.db.raw('COUNT(*) as total'), database_1.db.raw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active"), database_1.db.raw("SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked"))
                .first();
            return {
                id: pool.id,
                name: pool.name,
                nodeId: pool.nodeId,
                nodeCode: node?.code || null,
                nodeName: node?.name || null,
                nodeStatus: node?.status || null,
                ipType: pool.ipType,
                ipTypeLabel: ip_assets_1.IpTypeMeta[pool.ipType]?.label || pool.ipType,
                rotationStrategy: pool.rotationStrategy,
                rotationStrategyLabel: ip_assets_1.RotationStrategyMeta[pool.rotationStrategy]?.label || pool.rotationStrategy,
                rotationInterval: pool.rotationInterval,
                currentIndex: pool.currentIndex,
                lastRotationAt: pool.lastRotationAt,
                isActive: pool.isActive,
                ipStats: {
                    total: parseInt(ipStats?.total || '0', 10),
                    active: parseInt(ipStats?.active || '0', 10),
                    blocked: parseInt(ipStats?.blocked || '0', 10)
                },
                createdAt: pool.createdAt,
                updatedAt: pool.updatedAt
            };
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                items: itemsWithNodeInfo,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit),
                    hasNext: page * limit < result.total,
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
 * GET /api/v1/ip-pools/:id - 获取IP池详情
 */
router.get('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const poolStatus = await ipPoolService.getIPPoolStatus(id);
        if (!poolStatus) {
            throw new errors_1.NotFoundError(`IP Pool with ID "${id}" not found`);
        }
        const node = await (0, database_1.db)('nodes')
            .where('id', poolStatus.pool.nodeId)
            .first('code', 'name', 'status', 'current_ip');
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                id: poolStatus.pool.id,
                name: poolStatus.pool.name,
                nodeId: poolStatus.pool.nodeId,
                nodeCode: node?.code || null,
                nodeName: node?.name || null,
                nodeStatus: node?.status || null,
                currentNodeIp: node?.current_ip || null,
                ipType: poolStatus.pool.ipType,
                ipTypeLabel: ip_assets_1.IpTypeMeta[poolStatus.pool.ipType]?.label || poolStatus.pool.ipType,
                rotationStrategy: poolStatus.pool.rotationStrategy,
                rotationStrategyLabel: ip_assets_1.RotationStrategyMeta[poolStatus.pool.rotationStrategy]?.label || poolStatus.pool.rotationStrategy,
                rotationInterval: poolStatus.pool.rotationInterval,
                currentIndex: poolStatus.pool.currentIndex,
                lastRotationAt: poolStatus.pool.lastRotationAt,
                nextRotationAt: poolStatus.nextRotationAt,
                isActive: poolStatus.pool.isActive,
                ipStats: {
                    total: poolStatus.ips.length,
                    active: poolStatus.activeIpCount,
                    blocked: poolStatus.blockedIpCount,
                    inactive: poolStatus.ips.length - poolStatus.activeIpCount - poolStatus.blockedIpCount
                },
                currentIp: poolStatus.currentIp,
                ips: poolStatus.ips.map(ip => ({
                    id: ip.id,
                    ip: ip.ip,
                    status: ip.status,
                    score: ip.score,
                    usageCount: ip.usageCount,
                    assignedAt: ip.assignedAt,
                    releasedAt: ip.releasedAt,
                    createdAt: ip.createdAt
                })),
                createdAt: poolStatus.pool.createdAt,
                updatedAt: poolStatus.pool.updatedAt
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/ip-pools - 创建IP池
 */
router.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { name, nodeId, ipType, ips, rotationStrategy = ip_assets_1.RotationStrategy.ROUND_ROBIN, rotationInterval = 86400 } = req.body;
        // 验证必填字段
        if (!name || !nodeId || !ipType || !ips || !Array.isArray(ips) || ips.length === 0) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'name', message: 'Name is required' },
                { field: 'nodeId', message: 'Node ID is required' },
                { field: 'ipType', message: 'IP type is required' },
                { field: 'ips', message: 'IPs array is required and must not be empty' }
            ].filter(e => {
                if (e.field === 'name')
                    return !name;
                if (e.field === 'nodeId')
                    return !nodeId;
                if (e.field === 'ipType')
                    return !ipType;
                if (e.field === 'ips')
                    return !ips || !Array.isArray(ips) || ips.length === 0;
                return false;
            }));
        }
        // 验证IP类型
        if (!(0, ip_assets_1.isValidIpType)(ipType)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'ipType', message: `Invalid IP type. Must be one of: ${Object.values(ip_assets_1.IpType).join(', ')}` }
            ]);
        }
        // 验证轮换策略
        if (!(0, ip_assets_1.isValidRotationStrategy)(rotationStrategy)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'rotationStrategy', message: `Invalid rotation strategy. Must be one of: ${Object.values(ip_assets_1.RotationStrategy).join(', ')}` }
            ]);
        }
        // 验证节点是否存在
        const node = await (0, database_1.db)('nodes')
            .where('id', nodeId)
            .first();
        if (!node) {
            throw new errors_1.NotFoundError(`Node with ID "${nodeId}" not found`);
        }
        // 检查节点是否已有IP池
        if (node.ip_pool_id) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'nodeId', message: 'Node already has an IP pool. Please delete the existing pool first.' }
            ]);
        }
        // 验证IP格式
        const invalidIps = ips.filter(ip => !isValidIP(ip));
        if (invalidIps.length > 0) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'ips', message: `Invalid IP addresses: ${invalidIps.join(', ')}` }
            ]);
        }
        const pool = await ipPoolService.createIPPool({
            name,
            nodeId,
            ipType,
            ips,
            rotationStrategy,
            rotationInterval
        });
        logger_1.logger.info(`IP pool created: ${pool.id} for node ${nodeId} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'IP pool created successfully',
            data: {
                id: pool.id,
                name: pool.name,
                nodeId: pool.nodeId,
                ipType: pool.ipType,
                ipTypeLabel: ip_assets_1.IpTypeMeta[pool.ipType]?.label || pool.ipType,
                rotationStrategy: pool.rotationStrategy,
                rotationInterval: pool.rotationInterval,
                currentIndex: pool.currentIndex,
                isActive: pool.isActive,
                createdAt: pool.createdAt,
                updatedAt: pool.updatedAt
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/ip-pools/:id - 更新IP池
 */
router.put('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, rotationStrategy, rotationInterval, isActive } = req.body;
        const pool = await ipPoolService.getIPPool(id);
        if (!pool) {
            throw new errors_1.NotFoundError(`IP Pool with ID "${id}" not found`);
        }
        // 验证轮换策略
        if (rotationStrategy !== undefined && !(0, ip_assets_1.isValidRotationStrategy)(rotationStrategy)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'rotationStrategy', message: `Invalid rotation strategy. Must be one of: ${Object.values(ip_assets_1.RotationStrategy).join(', ')}` }
            ]);
        }
        const updates = {};
        if (name !== undefined)
            updates.name = name;
        if (rotationStrategy !== undefined)
            updates.rotationStrategy = rotationStrategy;
        if (rotationInterval !== undefined)
            updates.rotationInterval = rotationInterval;
        const updatedPool = await ipPoolService.updateIPPool(id, updates);
        // 如果更新了激活状态
        if (isActive !== undefined) {
            await ipPoolService.setPoolActive(id, isActive);
        }
        logger_1.logger.info(`IP pool updated: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'IP pool updated successfully',
            data: {
                id: updatedPool?.id,
                name: updatedPool?.name,
                nodeId: updatedPool?.nodeId,
                ipType: updatedPool?.ipType,
                ipTypeLabel: ip_assets_1.IpTypeMeta[updatedPool?.ipType]?.label || updatedPool?.ipType,
                rotationStrategy: updatedPool?.rotationStrategy,
                rotationStrategyLabel: ip_assets_1.RotationStrategyMeta[updatedPool?.rotationStrategy]?.label || updatedPool?.rotationStrategy,
                rotationInterval: updatedPool?.rotationInterval,
                currentIndex: updatedPool?.currentIndex,
                isActive: isActive !== undefined ? isActive : updatedPool?.isActive,
                createdAt: updatedPool?.createdAt,
                updatedAt: updatedPool?.updatedAt
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/v1/ip-pools/:id - 删除IP池
 */
router.delete('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = await ipPoolService.getIPPool(id);
        if (!pool) {
            throw new errors_1.NotFoundError(`IP Pool with ID "${id}" not found`);
        }
        await ipPoolService.deleteIPPool(id);
        logger_1.logger.info(`IP pool deleted: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'IP pool deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/ip-pools/:id/rotate - 手动轮换IP
 */
router.post('/:id/rotate', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = await ipPoolService.getIPPool(id);
        if (!pool) {
            throw new errors_1.NotFoundError(`IP Pool with ID "${id}" not found`);
        }
        const result = await ipPoolService.manualRotate(id);
        if (result.success) {
            logger_1.logger.info(`IP pool rotated: ${id}, ${result.previousIp} -> ${result.newIp} by ${req.user?.username || 'system'}`);
            res.json({
                success: true,
                code: 200,
                message: 'IP rotated successfully',
                data: {
                    poolId: result.poolId,
                    previousIp: result.previousIp,
                    newIp: result.newIp,
                    rotatedAt: result.rotatedAt
                }
            });
        }
        else {
            res.status(500).json({
                success: false,
                code: 500,
                message: result.error || 'Failed to rotate IP'
            });
        }
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/ip-pools/:id/ips - 添加IP到池
 */
router.post('/:id/ips', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { ip } = req.body;
        if (!ip) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'ip', message: 'IP address is required' }
            ]);
        }
        if (!isValidIP(ip)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'ip', message: 'Invalid IP address format' }
            ]);
        }
        const pool = await ipPoolService.getIPPool(id);
        if (!pool) {
            throw new errors_1.NotFoundError(`IP Pool with ID "${id}" not found`);
        }
        const ipRecord = await ipPoolService.addIPToPool(id, ip);
        logger_1.logger.info(`IP added to pool: ${ip} -> ${id} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'IP added to pool successfully',
            data: {
                id: ipRecord.id,
                poolId: ipRecord.poolId,
                ip: ipRecord.ip,
                status: ipRecord.status,
                score: ipRecord.score,
                createdAt: ipRecord.createdAt
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/v1/ip-pools/:id/ips/:ipId - 从池中移除IP
 */
router.delete('/:id/ips/:ipId', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id, ipId } = req.params;
        const pool = await ipPoolService.getIPPool(id);
        if (!pool) {
            throw new errors_1.NotFoundError(`IP Pool with ID "${id}" not found`);
        }
        // 获取IP地址
        const ipRecord = await (0, database_1.db)('ip_pool_ips')
            .where({ id: ipId, pool_id: id })
            .first('ip');
        if (!ipRecord) {
            throw new errors_1.NotFoundError(`IP Record with ID "${ipId}" not found`);
        }
        await ipPoolService.removeIPFromPool(id, ipRecord.ip);
        logger_1.logger.info(`IP removed from pool: ${ipRecord.ip} from ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'IP removed from pool successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/ip-pools/:id/refresh-scores - 刷新IP池内所有IP的评分
 */
router.post('/:id/refresh-scores', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = await ipPoolService.getIPPool(id);
        if (!pool) {
            throw new errors_1.NotFoundError(`IP Pool with ID "${id}" not found`);
        }
        await ipPoolService.refreshIPScores(id);
        logger_1.logger.info(`IP scores refreshed for pool: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'IP scores refreshed successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/ip-pools/meta/rotation-strategies - 获取轮换策略列表
 */
router.get('/meta/rotation-strategies', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const strategies = Object.values(ip_assets_1.RotationStrategy).map(strategy => ({
            value: strategy,
            label: ip_assets_1.RotationStrategyMeta[strategy].label,
            description: ip_assets_1.RotationStrategyMeta[strategy].description
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: strategies
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 验证IP地址格式
 */
function isValidIP(ip) {
    // IPv4验证
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6验证（简化版）
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
//# sourceMappingURL=ip-pools.js.map