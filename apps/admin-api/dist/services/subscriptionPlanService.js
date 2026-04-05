"use strict";
/**
 * 套餐管理服务
 * 提供套餐的 CRUD 操作和统计功能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlans = getPlans;
exports.getPlanById = getPlanById;
exports.createPlan = createPlan;
exports.updatePlan = updatePlan;
exports.deletePlan = deletePlan;
exports.getPlanStats = getPlanStats;
exports.getPlanGroups = getPlanGroups;
exports.activatePlan = activatePlan;
exports.deactivatePlan = deactivatePlan;
exports.updatePlansSortOrder = updatePlansSortOrder;
exports.getPlanOptions = getPlanOptions;
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const constants_1 = require("@shared/constants");
/**
 * 生成唯一 ID
 */
function generatePlanId() {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * 验证服务类型数组
 */
function validateServiceTypes(serviceTypes) {
    if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
        throw new errors_1.ValidationError('At least one service type is required', [{ field: 'serviceTypes', message: 'At least one service type is required' }]);
    }
    const invalidTypes = serviceTypes.filter(type => !(0, constants_1.isValidServiceType)(type));
    if (invalidTypes.length > 0) {
        throw new errors_1.ValidationError(`Invalid service types: ${invalidTypes.join(', ')}`, [{ field: 'serviceTypes', message: `Invalid service types: ${invalidTypes.join(', ')}` }]);
    }
}
/**
 * 验证主服务类型
 */
function validatePrimaryServiceType(primaryType, serviceTypes) {
    if (!(0, constants_1.isValidServiceType)(primaryType)) {
        throw new errors_1.ValidationError(`Invalid primary service type: ${primaryType}`, [{ field: 'primaryServiceType', message: `Invalid primary service type: ${primaryType}` }]);
    }
    if (!serviceTypes.includes(primaryType)) {
        throw new errors_1.ValidationError('Primary service type must be included in serviceTypes', [{ field: 'primaryServiceType', message: 'Primary service type must be included in serviceTypes' }]);
    }
}
/**
 * 数据库记录转换为套餐对象
 */
function dbRecordToPlan(record) {
    return {
        id: record.id,
        name: record.name,
        description: record.description || '',
        group: record.group_id || 'standard',
        price: record.price,
        durationDays: record.duration_days,
        trafficLimit: record.traffic_limit,
        serviceTypes: JSON.parse(record.service_types || '[]'),
        primaryServiceType: record.primary_service_type || constants_1.ServiceType.STANDARD,
        priorityBoost: record.priority_boost || 0,
        guaranteedBandwidth: record.guaranteed_bandwidth || 0,
        maxConnections: record.max_connections || 3,
        features: JSON.parse(record.features || '[]'),
        isActive: record.is_active === 1 || record.is_active === true,
        sortOrder: record.sort_order || 0,
        createdAt: record.created_at,
        updatedAt: record.updated_at
    };
}
/**
 * 获取套餐列表
 */
async function getPlans(query = {}) {
    const { page = 1, limit = 20, serviceType, group, isActive, sortBy = 'sortOrder', sortOrder = 'asc' } = query;
    const offset = (page - 1) * limit;
    let dbQuery = (0, database_1.db)('subscription_plans');
    // 应用筛选条件
    if (serviceType) {
        dbQuery = dbQuery.where('primary_service_type', serviceType);
    }
    if (group) {
        dbQuery = dbQuery.where('group_id', group);
    }
    if (isActive !== undefined) {
        dbQuery = dbQuery.where('is_active', isActive);
    }
    // 获取总数
    const [countResult] = await dbQuery.clone().count('* as count');
    const total = parseInt(countResult.count);
    // 构建排序
    const orderByMap = {
        price: 'price',
        durationDays: 'duration_days',
        createdAt: 'created_at',
        sortOrder: 'sort_order'
    };
    const orderColumn = orderByMap[sortBy] || 'sort_order';
    const orderDirection = sortOrder === 'desc' ? 'desc' : 'asc';
    // 查询数据
    const records = await dbQuery
        .select('*')
        .orderBy(orderColumn, orderDirection)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
    return {
        items: records.map(dbRecordToPlan),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
}
/**
 * 根据 ID 获取套餐
 */
async function getPlanById(id) {
    const record = await (0, database_1.db)('subscription_plans')
        .where('id', id)
        .first();
    if (!record) {
        throw new errors_1.NotFoundError(`Subscription plan not found: ${id}`);
    }
    return dbRecordToPlan(record);
}
/**
 * 创建套餐
 */
async function createPlan(data, operator) {
    // 验证必填字段
    if (!data.name || data.name.trim() === '') {
        throw new errors_1.ValidationError('Plan name is required', [{ field: 'name', message: 'Plan name is required' }]);
    }
    if (data.price === undefined || data.price < 0) {
        throw new errors_1.ValidationError('Price must be a non-negative number', [{ field: 'price', message: 'Price must be a non-negative number' }]);
    }
    if (!data.durationDays || data.durationDays < 1) {
        throw new errors_1.ValidationError('Duration days must be at least 1', [{ field: 'durationDays', message: 'Duration days must be at least 1' }]);
    }
    if (!data.trafficLimit || data.trafficLimit < 1) {
        throw new errors_1.ValidationError('Traffic limit must be at least 1 byte', [{ field: 'trafficLimit', message: 'Traffic limit must be at least 1 byte' }]);
    }
    // 验证服务类型
    validateServiceTypes(data.serviceTypes);
    validatePrimaryServiceType(data.primaryServiceType, data.serviceTypes);
    // 检查名称是否已存在
    const existingPlan = await (0, database_1.db)('subscription_plans')
        .where('name', data.name)
        .first();
    if (existingPlan) {
        throw new errors_1.ValidationError('Plan name already exists', [{ field: 'name', message: 'Plan name already exists' }]);
    }
    const now = new Date();
    const planId = generatePlanId();
    const insertData = {
        id: planId,
        name: data.name.trim(),
        description: data.description || '',
        group_id: data.group || 'standard',
        price: data.price,
        duration_days: data.durationDays,
        traffic_limit: data.trafficLimit,
        service_types: JSON.stringify(data.serviceTypes),
        primary_service_type: data.primaryServiceType,
        priority_boost: data.priorityBoost || 0,
        guaranteed_bandwidth: data.guaranteedBandwidth || 0,
        max_connections: data.maxConnections || 3,
        features: JSON.stringify(data.features || []),
        is_active: data.isActive !== false,
        sort_order: data.sortOrder || 0,
        created_at: now,
        updated_at: now
    };
    const [record] = await (0, database_1.db)('subscription_plans')
        .insert(insertData)
        .returning('*');
    logger_1.logger.info(`Subscription plan created: ${data.name} by ${operator || 'system'}`);
    return dbRecordToPlan(record);
}
/**
 * 更新套餐
 */
async function updatePlan(id, data, operator) {
    // 检查套餐是否存在
    const existingPlan = await (0, database_1.db)('subscription_plans')
        .where('id', id)
        .first();
    if (!existingPlan) {
        throw new errors_1.NotFoundError(`Subscription plan not found: ${id}`);
    }
    // 验证服务类型
    if (data.serviceTypes !== undefined) {
        validateServiceTypes(data.serviceTypes);
    }
    if (data.primaryServiceType !== undefined) {
        const serviceTypes = data.serviceTypes || JSON.parse(existingPlan.service_types || '[]');
        validatePrimaryServiceType(data.primaryServiceType, serviceTypes);
    }
    // 验证数值字段
    if (data.price !== undefined && data.price < 0) {
        throw new errors_1.ValidationError('Price must be a non-negative number', [{ field: 'price', message: 'Price must be a non-negative number' }]);
    }
    if (data.durationDays !== undefined && data.durationDays < 1) {
        throw new errors_1.ValidationError('Duration days must be at least 1', [{ field: 'durationDays', message: 'Duration days must be at least 1' }]);
    }
    if (data.trafficLimit !== undefined && data.trafficLimit < 1) {
        throw new errors_1.ValidationError('Traffic limit must be at least 1 byte', [{ field: 'trafficLimit', message: 'Traffic limit must be at least 1 byte' }]);
    }
    // 检查名称是否冲突
    if (data.name !== undefined && data.name !== existingPlan.name) {
        const nameExists = await (0, database_1.db)('subscription_plans')
            .where('name', data.name)
            .whereNot('id', id)
            .first();
        if (nameExists) {
            throw new errors_1.ValidationError('Plan name already exists', [{ field: 'name', message: 'Plan name already exists' }]);
        }
    }
    // 构建更新数据
    const updateData = {
        updated_at: new Date()
    };
    if (data.name !== undefined)
        updateData.name = data.name.trim();
    if (data.description !== undefined)
        updateData.description = data.description;
    if (data.group !== undefined)
        updateData.group_id = data.group;
    if (data.price !== undefined)
        updateData.price = data.price;
    if (data.durationDays !== undefined)
        updateData.duration_days = data.durationDays;
    if (data.trafficLimit !== undefined)
        updateData.traffic_limit = data.trafficLimit;
    if (data.serviceTypes !== undefined)
        updateData.service_types = JSON.stringify(data.serviceTypes);
    if (data.primaryServiceType !== undefined)
        updateData.primary_service_type = data.primaryServiceType;
    if (data.priorityBoost !== undefined)
        updateData.priority_boost = data.priorityBoost;
    if (data.guaranteedBandwidth !== undefined)
        updateData.guaranteed_bandwidth = data.guaranteedBandwidth;
    if (data.maxConnections !== undefined)
        updateData.max_connections = data.maxConnections;
    if (data.features !== undefined)
        updateData.features = JSON.stringify(data.features);
    if (data.isActive !== undefined)
        updateData.is_active = data.isActive;
    if (data.sortOrder !== undefined)
        updateData.sort_order = data.sortOrder;
    const [record] = await (0, database_1.db)('subscription_plans')
        .where('id', id)
        .update(updateData)
        .returning('*');
    logger_1.logger.info(`Subscription plan updated: ${existingPlan.name} by ${operator || 'system'}`);
    return dbRecordToPlan(record);
}
/**
 * 删除套餐
 */
async function deletePlan(id, operator) {
    // 检查套餐是否存在
    const existingPlan = await (0, database_1.db)('subscription_plans')
        .where('id', id)
        .first();
    if (!existingPlan) {
        throw new errors_1.NotFoundError(`Subscription plan not found: ${id}`);
    }
    // 检查是否有活跃的订阅
    const activeSubscriptions = await (0, database_1.db)('user_subscriptions')
        .where('plan_id', id)
        .where('status', 'active')
        .count('* as count')
        .first();
    const activeCount = parseInt(activeSubscriptions?.count) || 0;
    if (activeCount > 0) {
        throw new errors_1.ValidationError(`Cannot delete plan with ${activeCount} active subscriptions`, [{ field: 'id', message: `Cannot delete plan with ${activeCount} active subscriptions` }]);
    }
    await (0, database_1.db)('subscription_plans')
        .where('id', id)
        .delete();
    logger_1.logger.info(`Subscription plan deleted: ${existingPlan.name} by ${operator || 'system'}`);
}
/**
 * 获取套餐统计信息
 */
async function getPlanStats(id) {
    // 检查套餐是否存在
    const plan = await getPlanById(id);
    // 获取订阅统计
    const subscriptionStats = await (0, database_1.db)('user_subscriptions')
        .where('plan_id', id)
        .select(database_1.db.raw('COUNT(*) as total'), database_1.db.raw('SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active'), database_1.db.raw('SUM(CASE WHEN status = "expired" THEN 1 ELSE 0 END) as expired'))
        .first();
    // 获取收入统计
    const revenueStats = await (0, database_1.db)('orders')
        .where('plan_id', id)
        .where('status', 'completed')
        .select(database_1.db.raw('COALESCE(SUM(amount), 0) as total_revenue'), database_1.db.raw('COALESCE(SUM(CASE WHEN created_at >= DATE("now", "start of month") THEN amount ELSE 0 END), 0) as monthly_revenue'))
        .first();
    // 获取平均订阅时长
    const durationStats = await (0, database_1.db)('user_subscriptions')
        .where('plan_id', id)
        .whereNotNull('end_date')
        .select(database_1.db.raw('AVG(julianday(end_date) - julianday(start_date)) as avg_duration'))
        .first();
    // 按服务类型统计订阅（这里主要是该套餐的服务类型）
    const subscriptionsByServiceType = {
        [constants_1.ServiceType.STANDARD]: 0,
        [constants_1.ServiceType.DEDICATED_LINE]: 0,
        [constants_1.ServiceType.EXCLUSIVE]: 0,
        [constants_1.ServiceType.STATIC_RESIDENTIAL]: 0
    };
    // 该套餐的订阅都计入其主要服务类型
    subscriptionsByServiceType[plan.primaryServiceType] = parseInt(subscriptionStats?.total) || 0;
    // 获取增长趋势（最近6个月）
    const growthTrend = await (0, database_1.db)('user_subscriptions')
        .where('plan_id', id)
        .where('created_at', '>=', database_1.db.raw('DATE("now", "-6 months")'))
        .select(database_1.db.raw('strftime("%Y-%m", created_at) as period'), database_1.db.raw('COUNT(*) as new_subscriptions'))
        .groupBy('period')
        .orderBy('period');
    const formattedTrend = growthTrend.map(item => ({
        period: item.period,
        newSubscriptions: parseInt(item.new_subscriptions) || 0,
        churnedSubscriptions: 0, // 简化处理，实际需要计算到期未续费
        netGrowth: parseInt(item.new_subscriptions) || 0
    }));
    // 计算留存率（简化计算：活跃订阅 / 总订阅）
    const total = parseInt(subscriptionStats?.total) || 0;
    const active = parseInt(subscriptionStats?.active) || 0;
    const retentionRate = total > 0 ? (active / total) * 100 : 0;
    return {
        planId: id,
        planName: plan.name,
        totalSubscriptions: total,
        activeSubscriptions: active,
        expiredSubscriptions: parseInt(subscriptionStats?.expired) || 0,
        totalRevenue: parseFloat(revenueStats?.total_revenue) || 0,
        monthlyRevenue: parseFloat(revenueStats?.monthly_revenue) || 0,
        averageSubscriptionDuration: parseFloat(durationStats?.avg_duration) || 0,
        userRetentionRate: parseFloat(retentionRate.toFixed(2)),
        subscriptionsByServiceType,
        growthTrend: formattedTrend
    };
}
/**
 * 获取所有套餐组
 */
async function getPlanGroups() {
    // 获取每个组的套餐数量
    const groupCounts = await (0, database_1.db)('subscription_plans')
        .select('group_id')
        .count('* as count')
        .groupBy('group_id');
    const countMap = new Map(groupCounts.map(g => [g.group_id, parseInt(g.count)]));
    return constants_1.PLAN_GROUPS.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        serviceTypes: [...group.serviceTypes],
        icon: group.icon,
        color: group.color,
        recommendedFor: [...group.recommendedFor],
        planCount: countMap.get(group.id) || 0
    }));
}
/**
 * 激活套餐
 */
async function activatePlan(id, operator) {
    return updatePlan(id, { isActive: true }, operator);
}
/**
 * 停用套餐
 */
async function deactivatePlan(id, operator) {
    return updatePlan(id, { isActive: false }, operator);
}
/**
 * 批量更新套餐排序
 */
async function updatePlansSortOrder(sortData, operator) {
    const trx = await database_1.db.transaction();
    try {
        for (const item of sortData) {
            await trx('subscription_plans')
                .where('id', item.id)
                .update({
                sort_order: item.sortOrder,
                updated_at: new Date()
            });
        }
        await trx.commit();
        logger_1.logger.info(`Plans sort order updated by ${operator || 'system'}`);
    }
    catch (error) {
        await trx.rollback();
        throw error;
    }
}
/**
 * 获取套餐选项（用于下拉选择）
 */
async function getPlanOptions(serviceType) {
    let query = (0, database_1.db)('subscription_plans')
        .where('is_active', true)
        .select('id', 'name', 'price');
    if (serviceType) {
        query = query.where('primary_service_type', serviceType);
    }
    const plans = await query.orderBy('sort_order', 'asc');
    return plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price
    }));
}
//# sourceMappingURL=subscriptionPlanService.js.map