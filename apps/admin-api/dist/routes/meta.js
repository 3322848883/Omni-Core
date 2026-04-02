"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const ip_assets_1 = require("../shared/constants/ip-assets");
const router = (0, express_1.Router)();
exports.metaRoutes = router;
/**
 * GET /api/v1/meta/ip-types - 获取IP类型定义
 */
router.get('/ip-types', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const ipTypes = Object.values(ip_assets_1.IpType).map(type => ({
            value: type,
            label: ip_assets_1.IpTypeMeta[type].label,
            description: ip_assets_1.IpTypeMeta[type].description,
            costLevel: ip_assets_1.IpTypeMeta[type].costLevel,
            priceMultiplier: ip_assets_1.IpTypeMeta[type].priceMultiplier,
            typicalBandwidth: ip_assets_1.IpTypeMeta[type].typicalBandwidth,
            typicalTraffic: ip_assets_1.IpTypeMeta[type].typicalTraffic,
            useCases: ip_assets_1.IpTypeMeta[type].useCases
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: ipTypes
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/meta/line-types - 获取线路类型定义
 */
router.get('/line-types', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const lineTypes = Object.values(ip_assets_1.LineType).map(type => ({
            value: type,
            label: ip_assets_1.LineTypeMeta[type].label,
            description: ip_assets_1.LineTypeMeta[type].description,
            priority: ip_assets_1.LineTypeMeta[type].priority,
            costMultiplier: ip_assets_1.LineTypeMeta[type].costMultiplier,
            sla: ip_assets_1.LineTypeMeta[type].sla,
            typicalLatency: ip_assets_1.LineTypeMeta[type].typicalLatency
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: lineTypes
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/meta/rotation-strategies - 获取轮换策略定义
 */
router.get('/rotation-strategies', auth_1.authMiddleware, async (req, res, next) => {
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
 * GET /api/v1/meta/isp-presets - 获取ISP预设列表
 */
router.get('/isp-presets', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const presets = ip_assets_1.PRESET_ISPS.map(isp => ({
            id: isp.id,
            name: isp.name,
            displayName: isp.displayName,
            country: isp.country,
            type: isp.type,
            reputation: isp.reputation,
            features: isp.features
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: presets
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/meta/ip-metadata - 获取IP元数据（兼容前端）
 */
router.get('/ip-metadata', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const ipTypes = Object.values(ip_assets_1.IpType).map(type => ({
            value: type,
            label: ip_assets_1.IpTypeMeta[type].label,
            description: ip_assets_1.IpTypeMeta[type].description,
            icon: 'OfficeBuilding' // Default icon for frontend
        }));
        const lineTypes = Object.values(ip_assets_1.LineType).map(type => ({
            value: type,
            label: ip_assets_1.LineTypeMeta[type].label,
            description: ip_assets_1.LineTypeMeta[type].description,
            priority: ip_assets_1.LineTypeMeta[type].priority
        }));
        const isps = ip_assets_1.PRESET_ISPS.map(isp => ({
            code: isp.id,
            name: isp.displayName || isp.name,
            country: isp.country,
            type: isp.type
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                ipTypes,
                lineTypes,
                isps
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/meta/all - 获取所有元数据（用于前端初始化）
 */
router.get('/all', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const ipTypes = Object.values(ip_assets_1.IpType).map(type => ({
            value: type,
            label: ip_assets_1.IpTypeMeta[type].label,
            description: ip_assets_1.IpTypeMeta[type].description,
            costLevel: ip_assets_1.IpTypeMeta[type].costLevel,
            priceMultiplier: ip_assets_1.IpTypeMeta[type].priceMultiplier,
            typicalBandwidth: ip_assets_1.IpTypeMeta[type].typicalBandwidth,
            typicalTraffic: ip_assets_1.IpTypeMeta[type].typicalTraffic,
            useCases: ip_assets_1.IpTypeMeta[type].useCases
        }));
        const lineTypes = Object.values(ip_assets_1.LineType).map(type => ({
            value: type,
            label: ip_assets_1.LineTypeMeta[type].label,
            description: ip_assets_1.LineTypeMeta[type].description,
            priority: ip_assets_1.LineTypeMeta[type].priority,
            costMultiplier: ip_assets_1.LineTypeMeta[type].costMultiplier,
            sla: ip_assets_1.LineTypeMeta[type].sla,
            typicalLatency: ip_assets_1.LineTypeMeta[type].typicalLatency
        }));
        const rotationStrategies = Object.values(ip_assets_1.RotationStrategy).map(strategy => ({
            value: strategy,
            label: ip_assets_1.RotationStrategyMeta[strategy].label,
            description: ip_assets_1.RotationStrategyMeta[strategy].description
        }));
        const ispPresets = ip_assets_1.PRESET_ISPS.map(isp => ({
            id: isp.id,
            name: isp.name,
            displayName: isp.displayName,
            country: isp.country,
            type: isp.type,
            reputation: isp.reputation,
            features: isp.features
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                ipTypes,
                lineTypes,
                rotationStrategies,
                ispPresets
            }
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=meta.js.map