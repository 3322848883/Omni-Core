/**
 * 套餐管理服务
 * 提供套餐的 CRUD 操作和统计功能
 */

import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import {
  SubscriptionPlan,
  CreatePlanData,
  UpdatePlanData,
  PlanStats,
  PlanListQuery,
  PlanListResponse,
  PlanGroup
} from '../types/subscription-plan';
import {
  ServiceType,
  isValidServiceType,
  PLAN_GROUPS
} from '@shared/constants';
import { IpType, LineType } from '@shared/constants/ip-type';

/**
 * 生成唯一 ID
 */
function generatePlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 验证服务类型数组
 */
function validateServiceTypes(serviceTypes: ServiceType[]): void {
  if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
    throw new ValidationError(
      'At least one service type is required',
      [{ field: 'serviceTypes', message: 'At least one service type is required' }]
    );
  }

  const invalidTypes = serviceTypes.filter(type => !isValidServiceType(type));
  if (invalidTypes.length > 0) {
    throw new ValidationError(
      `Invalid service types: ${invalidTypes.join(', ')}`,
      [{ field: 'serviceTypes', message: `Invalid service types: ${invalidTypes.join(', ')}` }]
    );
  }
}

/**
 * 验证主服务类型
 */
function validatePrimaryServiceType(
  primaryType: ServiceType,
  serviceTypes: ServiceType[]
): void {
  if (!isValidServiceType(primaryType)) {
    throw new ValidationError(
      `Invalid primary service type: ${primaryType}`,
      [{ field: 'primaryServiceType', message: `Invalid primary service type: ${primaryType}` }]
    );
  }

  if (!serviceTypes.includes(primaryType)) {
    throw new ValidationError(
      'Primary service type must be included in serviceTypes',
      [{ field: 'primaryServiceType', message: 'Primary service type must be included in serviceTypes' }]
    );
  }
}

/**
 * 数据库记录转换为套餐对象
 */
function dbRecordToPlan(record: any): SubscriptionPlan {
  return {
    id: record.id,
    name: record.name,
    description: record.description || '',
    primaryServiceType: record.primary_service_type || ServiceType.STANDARD,
    allowedServiceTypes: JSON.parse(record.service_types || '[]'),
    trafficLimit: record.traffic_limit,
    durationDays: record.duration_days,
    price: record.price,
    currency: record.currency || 'CNY',
    features: JSON.parse(record.features || '[]'),
    ipType: record.ip_type || IpType.DATACENTER,
    lineType: record.line_type || LineType.STANDARD,
    group: record.group_id || 'standard',
    serviceTypes: JSON.parse(record.service_types || '[]'),
    priorityBoost: record.priority_boost || 0,
    guaranteedBandwidth: record.guaranteed_bandwidth || 0,
    maxConnections: record.max_connections || 3,
    isActive: record.is_active === 1 || record.is_active === true,
    sortOrder: record.sort_order || 0,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

/**
 * 获取套餐列表
 */
export async function getPlans(query: PlanListQuery = {}): Promise<PlanListResponse> {
  const {
    page = 1,
    limit = 20,
    serviceType,
    group,
    isActive,
    sortBy = 'sortOrder',
    sortOrder = 'asc'
  } = query;

  const offset = (page - 1) * limit;

  let dbQuery = db('subscription_plans');

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
  const total = parseInt(countResult.count as string);

  // 构建排序
  const orderByMap: Record<string, string> = {
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
    total,
    page,
    pageSize: limit,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * 根据 ID 获取套餐
 */
export async function getPlanById(id: string): Promise<SubscriptionPlan> {
  const record = await db('subscription_plans')
    .where('id', id)
    .first();

  if (!record) {
    throw new NotFoundError(`Subscription plan not found: ${id}`);
  }

  return dbRecordToPlan(record);
}

/**
 * 创建套餐
 */
export async function createPlan(
  data: CreatePlanData,
  operator?: string
): Promise<SubscriptionPlan> {
  // 验证必填字段
  if (!data.name || data.name.trim() === '') {
    throw new ValidationError(
      'Plan name is required',
      [{ field: 'name', message: 'Plan name is required' }]
    );
  }

  if (data.price === undefined || data.price < 0) {
    throw new ValidationError(
      'Price must be a non-negative number',
      [{ field: 'price', message: 'Price must be a non-negative number' }]
    );
  }

  if (!data.durationDays || data.durationDays < 1) {
    throw new ValidationError(
      'Duration days must be at least 1',
      [{ field: 'durationDays', message: 'Duration days must be at least 1' }]
    );
  }

  if (!data.trafficLimit || data.trafficLimit < 1) {
    throw new ValidationError(
      'Traffic limit must be at least 1 byte',
      [{ field: 'trafficLimit', message: 'Traffic limit must be at least 1 byte' }]
    );
  }

  // 验证服务类型
  const serviceTypes = data.serviceTypes || [];
  const primaryServiceType = data.primaryServiceType || data.serviceTypes?.[0] || ServiceType.STANDARD;
  validateServiceTypes(serviceTypes);
  validatePrimaryServiceType(primaryServiceType, serviceTypes);

  // 检查名称是否已存在
  const existingPlan = await db('subscription_plans')
    .where('name', data.name)
    .first();

  if (existingPlan) {
    throw new ValidationError(
      'Plan name already exists',
      [{ field: 'name', message: 'Plan name already exists' }]
    );
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
    service_types: JSON.stringify(serviceTypes),
    primary_service_type: primaryServiceType,
    priority_boost: data.priorityBoost || 0,
    guaranteed_bandwidth: data.guaranteedBandwidth || 0,
    max_connections: data.maxConnections || 3,
    features: JSON.stringify(data.features || []),
    is_active: data.isActive !== false,
    sort_order: data.sortOrder || 0,
    created_at: now,
    updated_at: now
  };

  const [record] = await db('subscription_plans')
    .insert(insertData)
    .returning('*');

  logger.info(`Subscription plan created: ${data.name} by ${operator || 'system'}`);

  return dbRecordToPlan(record);
}

/**
 * 更新套餐
 */
export async function updatePlan(
  id: string,
  data: UpdatePlanData,
  operator?: string
): Promise<SubscriptionPlan> {
  // 检查套餐是否存在
  const existingPlan = await db('subscription_plans')
    .where('id', id)
    .first();

  if (!existingPlan) {
    throw new NotFoundError(`Subscription plan not found: ${id}`);
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
    throw new ValidationError(
      'Price must be a non-negative number',
      [{ field: 'price', message: 'Price must be a non-negative number' }]
    );
  }

  if (data.durationDays !== undefined && data.durationDays < 1) {
    throw new ValidationError(
      'Duration days must be at least 1',
      [{ field: 'durationDays', message: 'Duration days must be at least 1' }]
    );
  }

  if (data.trafficLimit !== undefined && data.trafficLimit < 1) {
    throw new ValidationError(
      'Traffic limit must be at least 1 byte',
      [{ field: 'trafficLimit', message: 'Traffic limit must be at least 1 byte' }]
    );
  }

  // 检查名称是否冲突
  if (data.name !== undefined && data.name !== existingPlan.name) {
    const nameExists = await db('subscription_plans')
      .where('name', data.name)
      .whereNot('id', id)
      .first();

    if (nameExists) {
      throw new ValidationError(
        'Plan name already exists',
        [{ field: 'name', message: 'Plan name already exists' }]
      );
    }
  }

  // 构建更新数据
  const updateData: any = {
    updated_at: new Date()
  };

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.group !== undefined) updateData.group_id = data.group;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.durationDays !== undefined) updateData.duration_days = data.durationDays;
  if (data.trafficLimit !== undefined) updateData.traffic_limit = data.trafficLimit;
  if (data.serviceTypes !== undefined) updateData.service_types = JSON.stringify(data.serviceTypes);
  if (data.primaryServiceType !== undefined) updateData.primary_service_type = data.primaryServiceType;
  if (data.priorityBoost !== undefined) updateData.priority_boost = data.priorityBoost;
  if (data.guaranteedBandwidth !== undefined) updateData.guaranteed_bandwidth = data.guaranteedBandwidth;
  if (data.maxConnections !== undefined) updateData.max_connections = data.maxConnections;
  if (data.features !== undefined) updateData.features = JSON.stringify(data.features);
  if (data.isActive !== undefined) updateData.is_active = data.isActive;
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;

  const [record] = await db('subscription_plans')
    .where('id', id)
    .update(updateData)
    .returning('*');

  logger.info(`Subscription plan updated: ${existingPlan.name} by ${operator || 'system'}`);

  return dbRecordToPlan(record);
}

/**
 * 删除套餐
 */
export async function deletePlan(
  id: string,
  operator?: string
): Promise<void> {
  // 检查套餐是否存在
  const existingPlan = await db('subscription_plans')
    .where('id', id)
    .first();

  if (!existingPlan) {
    throw new NotFoundError(`Subscription plan not found: ${id}`);
  }

  // 检查是否有活跃的订阅
  const activeSubscriptions = await db('user_subscriptions')
    .where('plan_id', id)
    .where('status', 'active')
    .count('* as count')
    .first();

  const activeCount = parseInt(activeSubscriptions?.count as string) || 0;

  if (activeCount > 0) {
    throw new ValidationError(
      `Cannot delete plan with ${activeCount} active subscriptions`,
      [{ field: 'id', message: `Cannot delete plan with ${activeCount} active subscriptions` }]
    );
  }

  await db('subscription_plans')
    .where('id', id)
    .delete();

  logger.info(`Subscription plan deleted: ${existingPlan.name} by ${operator || 'system'}`);
}

/**
 * 获取套餐统计信息
 */
export async function getPlanStats(id: string): Promise<PlanStats> {
  // 检查套餐是否存在
  const plan = await getPlanById(id);

  // 获取订阅统计
  const subscriptionStats = await db('user_subscriptions')
    .where('plan_id', id)
    .select(
      db.raw('COUNT(*) as total'),
      db.raw('SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active'),
      db.raw('SUM(CASE WHEN status = "expired" THEN 1 ELSE 0 END) as expired')
    )
    .first();

  // 获取收入统计
  const revenueStats = await db('orders')
    .where('plan_id', id)
    .where('status', 'completed')
    .select(
      db.raw('COALESCE(SUM(amount), 0) as total_revenue'),
      db.raw('COALESCE(SUM(CASE WHEN created_at >= DATE("now", "start of month") THEN amount ELSE 0 END), 0) as monthly_revenue')
    )
    .first();

  // 获取平均订阅时长
  const durationStats = await db('user_subscriptions')
    .where('plan_id', id)
    .whereNotNull('end_date')
    .select(
      db.raw('AVG(julianday(end_date) - julianday(start_date)) as avg_duration')
    )
    .first();

  // 按服务类型统计订阅（这里主要是该套餐的服务类型）
  const subscriptionsByServiceType: Record<ServiceType, number> = {
    [ServiceType.STANDARD]: 0,
    [ServiceType.DEDICATED_LINE]: 0,
    [ServiceType.EXCLUSIVE]: 0,
    [ServiceType.STATIC_RESIDENTIAL]: 0
  };

  // 该套餐的订阅都计入其主要服务类型
  subscriptionsByServiceType[plan.primaryServiceType] = parseInt(subscriptionStats?.total as string) || 0;

  // 获取增长趋势（最近6个月）
  const growthTrend = await db('user_subscriptions')
    .where('plan_id', id)
    .where('created_at', '>=', db.raw('DATE("now", "-6 months")'))
    .select(
      db.raw('strftime("%Y-%m", created_at) as period'),
      db.raw('COUNT(*) as new_subscriptions')
    )
    .groupBy('period')
    .orderBy('period');

  const formattedTrend = growthTrend.map(item => ({
    period: item.period,
    newSubscriptions: parseInt(item.new_subscriptions as string) || 0,
    churnedSubscriptions: 0, // 简化处理，实际需要计算到期未续费
    netGrowth: parseInt(item.new_subscriptions as string) || 0
  }));

  // 计算留存率（简化计算：活跃订阅 / 总订阅）
  const total = parseInt(subscriptionStats?.total as string) || 0;
  const active = parseInt(subscriptionStats?.active as string) || 0;
  const retentionRate = total > 0 ? (active / total) * 100 : 0;

  return {
    totalPlans: 1,
    activePlans: active > 0 ? 1 : 0,
    totalSubscriptions: total,
    revenue: parseFloat(revenueStats?.total_revenue as string) || 0
  };
}

/**
 * 获取所有套餐组
 */
export async function getPlanGroups(): Promise<PlanGroup[]> {
  // 获取每个组的套餐数量
  const groupCounts = await db('subscription_plans')
    .select('group_id')
    .count('* as count')
    .groupBy('group_id');

  const countMap = new Map(
    groupCounts.map(g => [g.group_id, parseInt(g.count as string)])
  );

  return PLAN_GROUPS.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    serviceTypes: [...group.serviceTypes],
    ipTypes: [],
    lineTypes: [],
    icon: group.icon,
    color: group.color,
    recommendedFor: [...group.recommendedFor]
  }));
}

/**
 * 激活套餐
 */
export async function activatePlan(
  id: string,
  operator?: string
): Promise<SubscriptionPlan> {
  return updatePlan(id, { isActive: true }, operator);
}

/**
 * 停用套餐
 */
export async function deactivatePlan(
  id: string,
  operator?: string
): Promise<SubscriptionPlan> {
  return updatePlan(id, { isActive: false }, operator);
}

/**
 * 批量更新套餐排序
 */
export async function updatePlansSortOrder(
  sortData: { id: string; sortOrder: number }[],
  operator?: string
): Promise<void> {
  const trx = await db.transaction();

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
    logger.info(`Plans sort order updated by ${operator || 'system'}`);
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

/**
 * 获取套餐选项（用于下拉选择）
 */
export async function getPlanOptions(
  serviceType?: ServiceType
): Promise<Array<{ id: string; name: string; price: number }>> {
  let query = db('subscription_plans')
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
