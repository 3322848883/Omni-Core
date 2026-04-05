"use strict";
/**
 * 套餐管理路由
 * 提供套餐的 CRUD 接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionPlanRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const errors_1 = require("../utils/errors");
const constants_1 = require("@shared/constants");
const subscriptionPlanService_1 = require("../services/subscriptionPlanService");
const router = (0, express_1.Router)();
exports.subscriptionPlanRoutes = router;
/**
 * GET /api/v1/plans - 获取套餐列表
 * 支持分页和筛选
 */
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const query = {
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            serviceType: req.query.serviceType,
            group: req.query.group,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        // 验证 serviceType
        if (query.serviceType && !(0, constants_1.isValidServiceType)(query.serviceType)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'serviceType', message: `Invalid service type. Must be one of: ${Object.values(constants_1.ServiceType).join(', ')}` }
            ]);
        }
        const result = await (0, subscriptionPlanService_1.getPlans)(query);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/plans/groups - 获取所有套餐组
 */
router.get('/groups', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const groups = await (0, subscriptionPlanService_1.getPlanGroups)();
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: groups
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/plans/options - 获取套餐选项（用于下拉选择）
 */
router.get('/options', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const serviceType = req.query.serviceType;
        // 验证 serviceType
        if (serviceType && !(0, constants_1.isValidServiceType)(serviceType)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'serviceType', message: `Invalid service type. Must be one of: ${Object.values(constants_1.ServiceType).join(', ')}` }
            ]);
        }
        const options = await (0, subscriptionPlanService_1.getPlanOptions)(serviceType);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: options
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/plans/service-types - 获取服务类型列表
 */
router.get('/service-types', auth_1.authMiddleware, async (req, res, next) => {
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
 * GET /api/v1/plans/:id - 获取套餐详情
 */
router.get('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const plan = await (0, subscriptionPlanService_1.getPlanById)(id);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: plan
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/plans - 创建套餐
 */
router.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const data = req.body;
        // 基本验证
        if (!data.name || data.name.trim() === '') {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'name', message: 'Plan name is required' }
            ]);
        }
        if (data.price === undefined || data.price < 0) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'price', message: 'Price must be a non-negative number' }
            ]);
        }
        if (!data.durationDays || data.durationDays < 1) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'durationDays', message: 'Duration days must be at least 1' }
            ]);
        }
        if (!data.trafficLimit || data.trafficLimit < 1) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'trafficLimit', message: 'Traffic limit must be at least 1 byte' }
            ]);
        }
        if (!data.allowedServiceTypes || !Array.isArray(data.allowedServiceTypes) || data.allowedServiceTypes.length === 0) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'allowedServiceTypes', message: 'At least one service type is required' }
            ]);
        }
        if (!data.primaryServiceType) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'primaryServiceType', message: 'Primary service type is required' }
            ]);
        }
        const plan = await (0, subscriptionPlanService_1.createPlan)(data, req.user?.username);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'Plan created successfully',
            data: plan
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/plans/:id - 更新套餐
 */
router.put('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        // 验证数值字段
        if (data.price !== undefined && data.price < 0) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'price', message: 'Price must be a non-negative number' }
            ]);
        }
        if (data.durationDays !== undefined && data.durationDays < 1) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'durationDays', message: 'Duration days must be at least 1' }
            ]);
        }
        if (data.trafficLimit !== undefined && data.trafficLimit < 1) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'trafficLimit', message: 'Traffic limit must be at least 1 byte' }
            ]);
        }
        const plan = await (0, subscriptionPlanService_1.updatePlan)(id, data, req.user?.username);
        res.json({
            success: true,
            code: 200,
            message: 'Plan updated successfully',
            data: plan
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/v1/plans/:id - 删除套餐
 */
router.delete('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        await (0, subscriptionPlanService_1.deletePlan)(id, req.user?.username);
        res.json({
            success: true,
            code: 200,
            message: 'Plan deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/plans/:id/activate - 激活套餐
 */
router.post('/:id/activate', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const plan = await (0, subscriptionPlanService_1.activatePlan)(id, req.user?.username);
        res.json({
            success: true,
            code: 200,
            message: 'Plan activated successfully',
            data: plan
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/plans/:id/deactivate - 停用套餐
 */
router.post('/:id/deactivate', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const plan = await (0, subscriptionPlanService_1.deactivatePlan)(id, req.user?.username);
        res.json({
            success: true,
            code: 200,
            message: 'Plan deactivated successfully',
            data: plan
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/plans/:id/stats - 获取套餐统计信息
 */
router.get('/:id/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const stats = await (0, subscriptionPlanService_1.getPlanStats)(id);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/v1/plans/sort-order - 批量更新套餐排序
 */
router.put('/sort-order', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { sortData } = req.body;
        if (!Array.isArray(sortData)) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'sortData', message: 'sortData must be an array' }
            ]);
        }
        if (sortData.some(item => !item.id || typeof item.sortOrder !== 'number')) {
            throw new errors_1.ValidationError('Validation failed', [
                { field: 'sortData', message: 'Each item must have id and sortOrder' }
            ]);
        }
        await (0, subscriptionPlanService_1.updatePlansSortOrder)(sortData, req.user?.username);
        res.json({
            success: true,
            code: 200,
            message: 'Sort order updated successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=subscription-plans.js.map