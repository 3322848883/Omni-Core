"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nodeService_1 = require("@/services/nodeService");
const nodeFilterService_1 = require("@/services/nodeFilterService");
const auth_1 = require("@/middlewares/auth");
const AppError_1 = require("@/errors/AppError");
const response_1 = require("@/utils/response");
const logger_1 = __importDefault(require("@/utils/logger"));
const ip_type_1 = require("@/constants/ip-type");
const validation_1 = require("@/middlewares/validation");
const router = (0, express_1.Router)();
const nodeFilterService = new nodeFilterService_1.NodeFilterService();
/**
 * GET /api/v1/nodes/accessible - 获取用户可访问的节点列表（兼容前端）
 * 与 /nodes 功能相同，但使用不同的路径
 */
router.get('/accessible', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            throw new AppError_1.UnauthorizedError('Unauthorized');
        }
        // 获取节点列表（带用户权限过滤）
        const nodes = await nodeService_1.nodeService.getNodes(undefined, userId);
        // 构建响应数据
        const responseData = nodes.map(node => ({
            id: node.id,
            code: node.code,
            name: node.name,
            region: node.region,
            country: node.country,
            city: node.city,
            latitude: node.latitude,
            longitude: node.longitude,
            host: node.host,
            port: node.port,
            protocol: node.protocol,
            status: node.status,
            healthScore: node.healthScore,
            loadPercent: node.loadPercent,
            activeConnections: node.activeConnections,
            maxConnections: node.maxConnections,
            priority: node.priority,
            isBackup: node.isBackup,
            serviceType: node.serviceType,
            // IP资产管理新字段
            ipType: node.ipType,
            ipTypeLabel: node.ipTypeLabel,
            lineType: node.lineType,
            lineTypeLabel: node.lineTypeLabel,
            ispName: node.ispName,
            ipScore: node.ipScore,
            supportsIPv6: node.supportsIPv6,
            // 服务类型标签和颜色
            serviceTypeLabel: nodeService_1.nodeService.getServiceTypeLabel(node.serviceType),
            serviceTypeColor: nodeService_1.nodeService.getServiceTypeColor(node.serviceType)
        }));
        logger_1.default.info(`User ${userId} fetched ${nodes.length} accessible nodes`);
        (0, response_1.successResponse)(res, responseData, 'Accessible nodes fetched successfully');
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/nodes - 获取节点列表
 * Query参数: region, ipType, lineType, ispName
 * 响应包含IP资产管理新字段
 */
router.get('/', auth_1.authenticate, (0, validation_1.validate)(validation_1.NodeValidation.list), async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { region, ipType, lineType, ispName } = req.query;
        if (!userId) {
            throw new AppError_1.UnauthorizedError('Unauthorized');
        }
        // 获取节点列表（带用户权限过滤）
        let nodes = await nodeService_1.nodeService.getNodes(region, userId);
        // 应用额外的筛选条件
        if (ipType) {
            nodes = nodes.filter(node => node.ipType === ipType);
        }
        if (lineType) {
            nodes = nodes.filter(node => node.lineType === lineType);
        }
        if (ispName) {
            nodes = nodes.filter(node => node.ispName === ispName);
        }
        // 构建响应数据
        const responseData = nodes.map(node => ({
            id: node.id,
            code: node.code,
            name: node.name,
            region: node.region,
            country: node.country,
            city: node.city,
            latitude: node.latitude,
            longitude: node.longitude,
            host: node.host,
            port: node.port,
            protocol: node.protocol,
            status: node.status,
            healthScore: node.healthScore,
            loadPercent: node.loadPercent,
            activeConnections: node.activeConnections,
            maxConnections: node.maxConnections,
            priority: node.priority,
            isBackup: node.isBackup,
            serviceType: node.serviceType,
            // IP资产管理新字段
            ipType: node.ipType,
            ipTypeLabel: node.ipTypeLabel,
            lineType: node.lineType,
            lineTypeLabel: node.lineTypeLabel,
            ispName: node.ispName,
            ipScore: node.ipScore,
            supportsIPv6: node.supportsIPv6,
            // 服务类型标签和颜色
            serviceTypeLabel: nodeService_1.nodeService.getServiceTypeLabel(node.serviceType),
            serviceTypeColor: nodeService_1.nodeService.getServiceTypeColor(node.serviceType)
        }));
        logger_1.default.info(`User ${userId} fetched ${nodes.length} nodes`);
        (0, response_1.successResponse)(res, responseData, 'Nodes fetched successfully');
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/nodes/:id - 获取节点详情
 */
router.get('/:id', auth_1.authenticate, (0, validation_1.validate)(validation_1.NodeValidation.byId), async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { id } = req.params;
        if (!userId) {
            throw new AppError_1.UnauthorizedError('Unauthorized');
        }
        const node = await nodeService_1.nodeService.getNodeById(id, userId);
        const responseData = {
            id: node.id,
            code: node.code,
            name: node.name,
            region: node.region,
            country: node.country,
            city: node.city,
            latitude: node.latitude,
            longitude: node.longitude,
            host: node.host,
            port: node.port,
            protocol: node.protocol,
            status: node.status,
            healthScore: node.healthScore,
            loadPercent: node.loadPercent,
            activeConnections: node.activeConnections,
            maxConnections: node.maxConnections,
            priority: node.priority,
            isBackup: node.isBackup,
            serviceType: node.serviceType,
            // IP资产管理新字段
            ipType: node.ipType,
            ipTypeLabel: node.ipTypeLabel,
            lineType: node.lineType,
            lineTypeLabel: node.lineTypeLabel,
            ispName: node.ispName,
            ipScore: node.ipScore,
            supportsIPv6: node.supportsIPv6,
            // 服务类型标签和颜色
            serviceTypeLabel: nodeService_1.nodeService.getServiceTypeLabel(node.serviceType),
            serviceTypeColor: nodeService_1.nodeService.getServiceTypeColor(node.serviceType)
        };
        (0, response_1.successResponse)(res, responseData, 'Node fetched successfully');
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/nodes/:id/config - 获取节点配置
 * 订阅生成增强 - 节点名称格式："地区 [ISP] [IP类型] [线路类型]"
 */
router.get('/:id/config', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { id } = req.params;
        if (!userId) {
            throw new AppError_1.UnauthorizedError('Unauthorized');
        }
        const config = await nodeService_1.nodeService.generateNodeConfig(id, userId);
        (0, response_1.successResponse)(res, config, 'Node config generated successfully');
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/nodes/:id/test - 测试节点连接
 */
router.post('/:id/test', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const { id } = req.params;
        if (!userId) {
            throw new AppError_1.UnauthorizedError('Unauthorized');
        }
        const result = await nodeService_1.nodeService.testNodeConnection(id);
        (0, response_1.successResponse)(res, result, 'Node connection test completed');
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/nodes/filter/options - 获取节点筛选选项
 */
router.get('/filter/options', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            throw new AppError_1.UnauthorizedError('Unauthorized');
        }
        // 获取用户可访问的节点
        const nodes = await nodeService_1.nodeService.getNodes(undefined, userId);
        // 提取筛选选项
        const regions = [...new Set(nodes.map(n => n.region))].sort();
        const ipTypes = [...new Set(nodes.filter(n => n.ipType).map(n => n.ipType))].sort();
        const lineTypes = [...new Set(nodes.filter(n => n.lineType).map(n => n.lineType))].sort();
        const ispNames = [...new Set(nodes.filter(n => n.ispName).map(n => n.ispName))].sort();
        (0, response_1.successResponse)(res, {
            regions,
            ipTypes: ipTypes.map(type => ({
                value: type,
                label: ip_type_1.IpTypeMeta[type]?.label || type
            })),
            lineTypes: lineTypes.map(type => ({
                value: type,
                label: ip_type_1.LineTypeMeta[type]?.label || type
            })),
            ispNames
        }, 'Filter options fetched successfully');
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/nodes/stats/overview - 获取节点统计概览
 */
router.get('/stats/overview', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            throw new AppError_1.UnauthorizedError('Unauthorized');
        }
        const stats = await nodeService_1.nodeService.getAccessibleNodeCount(userId);
        (0, response_1.successResponse)(res, stats, 'Node statistics fetched successfully');
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/nodes/meta/ip-types - 获取IP类型定义
 */
router.get('/meta/ip-types', async (req, res, next) => {
    try {
        const ipTypes = Object.values(ip_type_1.IpType).map(type => ({
            value: type,
            label: ip_type_1.IpTypeMeta[type].label,
            description: ip_type_1.IpTypeMeta[type].description,
            costLevel: ip_type_1.IpTypeMeta[type].costLevel,
            priceMultiplier: ip_type_1.IpTypeMeta[type].priceMultiplier,
            typicalBandwidth: ip_type_1.IpTypeMeta[type].typicalBandwidth,
            typicalTraffic: ip_type_1.IpTypeMeta[type].typicalTraffic,
            useCases: ip_type_1.IpTypeMeta[type].useCases
        }));
        (0, response_1.successResponse)(res, ipTypes, 'IP types fetched successfully');
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/nodes/meta/line-types - 获取线路类型定义
 */
router.get('/meta/line-types', async (req, res, next) => {
    try {
        const lineTypes = Object.values(ip_type_1.LineType).map(type => ({
            value: type,
            label: ip_type_1.LineTypeMeta[type].label,
            description: ip_type_1.LineTypeMeta[type].description,
            priority: ip_type_1.LineTypeMeta[type].priority,
            costMultiplier: ip_type_1.LineTypeMeta[type].costMultiplier,
            sla: ip_type_1.LineTypeMeta[type].sla,
            typicalLatency: ip_type_1.LineTypeMeta[type].typicalLatency
        }));
        (0, response_1.successResponse)(res, lineTypes, 'Line types fetched successfully');
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/nodes/meta/rotation-strategies - 获取轮换策略定义
 */
router.get('/meta/rotation-strategies', async (req, res, next) => {
    try {
        const strategies = Object.values(ip_type_1.RotationStrategy).map(strategy => ({
            value: strategy,
            label: ip_type_1.RotationStrategyMeta[strategy].label,
            description: ip_type_1.RotationStrategyMeta[strategy].description
        }));
        (0, response_1.successResponse)(res, strategies, 'Rotation strategies fetched successfully');
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=nodes.js.map