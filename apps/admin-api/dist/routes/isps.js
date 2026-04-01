"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ispRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middlewares/auth");
const ip_assets_1 = require("../shared/constants/ip-assets");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
exports.ispRoutes = router;
// 有效的ISP类型
const VALID_ISP_TYPES = ['starlink', 'cable', 'fiber', 'mobile'];
/**
 * GET /api/v1/isps - 获取ISP列表
 * Query参数: page, limit, country, type, isActive
 */
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const country = req.query.country;
        const type = req.query.type;
        const isActive = req.query.isActive;
        const search = req.query.search;
        let query = (0, database_1.db)('isps');
        // 应用筛选条件
        if (country) {
            query = query.where('country', country);
        }
        if (type && VALID_ISP_TYPES.includes(type)) {
            query = query.where('type', type);
        }
        if (isActive !== undefined) {
            const isActiveBool = isActive === 'true' || isActive === '1';
            query = query.where('is_active', isActiveBool);
        }
        if (search) {
            query = query.where(function () {
                this.where('name', 'like', `%${search}%`)
                    .orWhere('display_name', 'like', `%${search}%`);
            });
        }
        // 获取总数
        const [countResult] = await query.clone().count('* as count');
        const total = parseInt(countResult.count);
        // 获取列表
        const isps = await query
            .select('*')
            .orderBy('reputation', 'desc')
            .orderBy('name', 'asc')
            .limit(limit)
            .offset(offset);
        // 获取每个ISP的节点使用统计
        const ispsWithStats = await Promise.all(isps.map(async (isp) => {
            const nodeCount = await (0, database_1.db)('nodes')
                .where('isp_name', isp.name)
                .count('id as count')
                .first();
            return {
                id: isp.id,
                name: isp.name,
                displayName: isp.display_name,
                country: isp.country,
                type: isp.type,
                reputation: isp.reputation,
                features: JSON.parse(isp.features || '[]'),
                isActive: isp.is_active,
                nodeCount: parseInt(nodeCount?.count || '0', 10),
                createdAt: isp.created_at,
                updatedAt: isp.updated_at
            };
        }));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                items: ispsWithStats,
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
 * GET /api/v1/isps/:id - 获取ISP详情
 */
router.get('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const isp = await (0, database_1.db)('isps')
            .where('id', id)
            .first();
        if (!isp) {
            throw new errors_1.NotFoundError('ISP', id);
        }
        // 获取使用该ISP的节点
        const nodes = await (0, database_1.db)('nodes')
            .where('isp_name', isp.name)
            .select('id', 'code', 'name', 'status', 'region', 'country');
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                id: isp.id,
                name: isp.name,
                displayName: isp.display_name,
                country: isp.country,
                type: isp.type,
                reputation: isp.reputation,
                features: JSON.parse(isp.features || '[]'),
                isActive: isp.is_active,
                nodes: nodes.map(node => ({
                    id: node.id,
                    code: node.code,
                    name: node.name,
                    status: node.status,
                    region: node.region,
                    country: node.country
                })),
                nodeCount: nodes.length,
                createdAt: isp.created_at,
                updatedAt: isp.updated_at
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/isps - 创建ISP
 */
router.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { name, displayName, country, type, reputation = 80, features = [], isActive = true } = req.body;
        // 验证必填字段
        if (!name || !displayName || !country || !type) {
            throw new errors_1.ValidationError([
                { field: 'name', message: 'Name is required' },
                { field: 'displayName', message: 'Display name is required' },
                { field: 'country', message: 'Country is required' },
                { field: 'type', message: 'Type is required' }
            ].filter(e => {
                if (e.field === 'name')
                    return !name;
                if (e.field === 'displayName')
                    return !displayName;
                if (e.field === 'country')
                    return !country;
                if (e.field === 'type')
                    return !type;
                return false;
            }));
        }
        // 验证ISP类型
        if (!VALID_ISP_TYPES.includes(type)) {
            throw new errors_1.ValidationError([
                { field: 'type', message: `Invalid type. Must be one of: ${VALID_ISP_TYPES.join(', ')}` }
            ]);
        }
        // 验证声誉值
        if (typeof reputation !== 'number' || reputation < 0 || reputation > 100) {
            throw new errors_1.ValidationError([
                { field: 'reputation', message: 'Reputation must be a number between 0 and 100' }
            ]);
        }
        // 检查名称是否已存在
        const existingISP = await (0, database_1.db)('isps')
            .where('name', name)
            .first();
        if (existingISP) {
            throw new errors_1.ValidationError([
                { field: 'name', message: 'ISP with this name already exists' }
            ]);
        }
        const now = new Date();
        const [isp] = await (0, database_1.db)('isps').insert({
            id: (0, uuid_1.v4)(),
            name,
            display_name: displayName,
            country,
            type,
            reputation,
            features: JSON.stringify(features),
            is_active: isActive,
            created_at: now,
            updated_at: now
        }).returning('*');
        logger_1.logger.info(`ISP created: ${name} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'ISP created successfully',
            data: {
                id: isp.id,
                name: isp.name,
                displayName: isp.display_name,
                country: isp.country,
                type: isp.type,
                reputation: isp.reputation,
                features: JSON.parse(isp.features || '[]'),
                isActive: isp.is_active,
                createdAt: isp.created_at,
                updatedAt: isp.updated_at
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/isps/:id - 更新ISP
 */
router.put('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { displayName, country, type, reputation, features, isActive } = req.body;
        const isp = await (0, database_1.db)('isps')
            .where('id', id)
            .first();
        if (!isp) {
            throw new errors_1.NotFoundError('ISP', id);
        }
        // 验证ISP类型
        if (type !== undefined && !VALID_ISP_TYPES.includes(type)) {
            throw new errors_1.ValidationError([
                { field: 'type', message: `Invalid type. Must be one of: ${VALID_ISP_TYPES.join(', ')}` }
            ]);
        }
        // 验证声誉值
        if (reputation !== undefined && (typeof reputation !== 'number' || reputation < 0 || reputation > 100)) {
            throw new errors_1.ValidationError([
                { field: 'reputation', message: 'Reputation must be a number between 0 and 100' }
            ]);
        }
        const updateData = {
            updated_at: new Date()
        };
        if (displayName !== undefined)
            updateData.display_name = displayName;
        if (country !== undefined)
            updateData.country = country;
        if (type !== undefined)
            updateData.type = type;
        if (reputation !== undefined)
            updateData.reputation = reputation;
        if (features !== undefined)
            updateData.features = JSON.stringify(features);
        if (isActive !== undefined)
            updateData.is_active = isActive;
        const [updatedISP] = await (0, database_1.db)('isps')
            .where('id', id)
            .update(updateData)
            .returning('*');
        logger_1.logger.info(`ISP updated: ${updatedISP.name} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'ISP updated successfully',
            data: {
                id: updatedISP.id,
                name: updatedISP.name,
                displayName: updatedISP.display_name,
                country: updatedISP.country,
                type: updatedISP.type,
                reputation: updatedISP.reputation,
                features: JSON.parse(updatedISP.features || '[]'),
                isActive: updatedISP.is_active,
                createdAt: updatedISP.created_at,
                updatedAt: updatedISP.updated_at
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/v1/isps/:id - 删除ISP
 */
router.delete('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const isp = await (0, database_1.db)('isps')
            .where('id', id)
            .first();
        if (!isp) {
            throw new errors_1.NotFoundError('ISP', id);
        }
        // 检查是否有节点正在使用该ISP
        const nodesUsingISP = await (0, database_1.db)('nodes')
            .where('isp_name', isp.name)
            .count('id as count')
            .first();
        const nodeCount = parseInt(nodesUsingISP?.count || '0', 10);
        if (nodeCount > 0) {
            throw new errors_1.ValidationError([
                { field: 'isp', message: `Cannot delete ISP that is being used by ${nodeCount} nodes. Please reassign those nodes first.` }
            ]);
        }
        await (0, database_1.db)('isps')
            .where('id', id)
            .delete();
        logger_1.logger.info(`ISP deleted: ${isp.name} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'ISP deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/isps/seed - 初始化预设ISP数据
 */
router.post('/seed', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const seeded = [];
        const skipped = [];
        for (const preset of ip_assets_1.PRESET_ISPS) {
            const existing = await (0, database_1.db)('isps')
                .where('name', preset.name)
                .first();
            if (existing) {
                skipped.push(preset.name);
                continue;
            }
            const now = new Date();
            await (0, database_1.db)('isps').insert({
                id: preset.id,
                name: preset.name,
                display_name: preset.displayName,
                country: preset.country,
                type: preset.type,
                reputation: preset.reputation,
                features: JSON.stringify(preset.features),
                is_active: true,
                created_at: now,
                updated_at: now
            });
            seeded.push(preset.name);
        }
        logger_1.logger.info(`ISP seed completed: ${seeded.length} seeded, ${skipped.length} skipped by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'ISP seed completed',
            data: {
                seeded,
                skipped,
                totalSeeded: seeded.length,
                totalSkipped: skipped.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/isps/meta/types - 获取ISP类型列表
 */
router.get('/meta/types', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const types = [
            { value: 'starlink', label: '卫星网络', description: 'Starlink等卫星互联网服务' },
            { value: 'cable', label: '有线网络', description: '传统有线电视网络' },
            { value: 'fiber', label: '光纤网络', description: '光纤宽带网络' },
            { value: 'mobile', label: '移动网络', description: '4G/5G移动网络' }
        ];
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: types
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/isps/meta/countries - 获取ISP国家列表
 */
router.get('/meta/countries', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const countries = await (0, database_1.db)('isps')
            .distinct('country')
            .select('country')
            .orderBy('country');
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: countries.map(c => c.country)
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/isps/preset/list - 获取预设ISP列表（用于选择）
 */
router.get('/preset/list', auth_1.authMiddleware, async (req, res, next) => {
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
//# sourceMappingURL=isps.js.map