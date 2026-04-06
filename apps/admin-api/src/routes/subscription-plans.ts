/**
 * 套餐管理路由
 * 提供套餐的 CRUD 接口
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { ValidationError } from '../utils/errors';
import { db } from '../database';
import {
  ServiceType,
  isValidServiceType,
  ServiceTypeMeta
} from '@shared/constants';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanStats,
  getPlanGroups,
  activatePlan,
  deactivatePlan,
  updatePlansSortOrder,
  getPlanOptions
} from '../services/subscriptionPlanService';
import {
  CreatePlanData,
  UpdatePlanData,
  PlanListQuery
} from '../types/subscription-plan';

const router = Router();

/**
 * GET /api/v1/plans - 获取套餐列表
 * 支持分页和筛选
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: PlanListQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      serviceType: req.query.serviceType as ServiceType,
      group: req.query.group as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      sortBy: req.query.sortBy as PlanListQuery['sortBy'],
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    // 验证 serviceType
    if (query.serviceType && !isValidServiceType(query.serviceType)) {
      throw new ValidationError([
        { field: 'serviceType', message: `Invalid service type. Must be one of: ${Object.values(ServiceType).join(', ')}` }
      ]);
    }

    const result = await getPlans(query);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/plans/groups - 获取所有套餐组
 */
router.get('/groups', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await getPlanGroups();

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: groups
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/plans/options - 获取套餐选项（用于下拉选择）
 */
router.get('/options', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceType = req.query.serviceType as ServiceType;

    // 验证 serviceType
    if (serviceType && !isValidServiceType(serviceType)) {
      throw new ValidationError([
        { field: 'serviceType', message: `Invalid service type. Must be one of: ${Object.values(ServiceType).join(', ')}` }
      ]);
    }

    const options = await getPlanOptions(serviceType);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: options
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/plans/service-types - 获取服务类型列表
 */
router.get('/service-types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceTypes = Object.values(ServiceType).map(type => ({
      type,
      ...ServiceTypeMeta[type]
    }));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: serviceTypes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/plans/:id - 获取套餐详情
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/plans - 创建套餐
 */
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: CreatePlanData = req.body;

    // 基本验证
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError([
        { field: 'name', message: 'Plan name is required' }
      ]);
    }

    if (data.price === undefined || data.price < 0) {
      throw new ValidationError([
        { field: 'price', message: 'Price must be a non-negative number' }
      ]);
    }

    if (!data.durationDays || data.durationDays < 1) {
      throw new ValidationError([
        { field: 'durationDays', message: 'Duration days must be at least 1' }
      ]);
    }

    if (!data.trafficLimit || data.trafficLimit < 1) {
      throw new ValidationError([
        { field: 'trafficLimit', message: 'Traffic limit must be at least 1 byte' }
      ]);
    }

    if (!data.serviceTypes || !Array.isArray(data.serviceTypes) || data.serviceTypes.length === 0) {
      throw new ValidationError([
        { field: 'serviceTypes', message: 'At least one service type is required' }
      ]);
    }

    if (!data.primaryServiceType) {
      throw new ValidationError([
        { field: 'primaryServiceType', message: 'Primary service type is required' }
      ]);
    }

    const plan = await createPlan(data, req.user?.username);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Plan created successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/plans/:id - 更新套餐
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data: UpdatePlanData = req.body;

    // 验证数值字段
    if (data.price !== undefined && data.price < 0) {
      throw new ValidationError([
        { field: 'price', message: 'Price must be a non-negative number' }
      ]);
    }

    if (data.durationDays !== undefined && data.durationDays < 1) {
      throw new ValidationError([
        { field: 'durationDays', message: 'Duration days must be at least 1' }
      ]);
    }

    if (data.trafficLimit !== undefined && data.trafficLimit < 1) {
      throw new ValidationError([
        { field: 'trafficLimit', message: 'Traffic limit must be at least 1 byte' }
      ]);
    }

    const plan = await updatePlan(id, data, req.user?.username);

    res.json({
      success: true,
      code: 200,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/plans/:id - 删除套餐
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await deletePlan(id, req.user?.username);

    res.json({
      success: true,
      code: 200,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/plans/:id/activate - 激活套餐
 */
router.post('/:id/activate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const plan = await activatePlan(id, req.user?.username);

    res.json({
      success: true,
      code: 200,
      message: 'Plan activated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/plans/:id/deactivate - 停用套餐
 */
router.post('/:id/deactivate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const plan = await deactivatePlan(id, req.user?.username);

    res.json({
      success: true,
      code: 200,
      message: 'Plan deactivated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/plans/stats/overview - 获取套餐统计概览
 */
router.get('/stats/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, planId } = req.query;

    // Get all plans
    let plansQuery = db('subscription_plans').where('is_active', true);
    if (planId) {
      plansQuery = plansQuery.where('id', planId);
    }
    const plans = await plansQuery.select('id', 'name', 'price');

    // Get all subscriptions with plan info
    let subscriptionsQuery = db('user_subscriptions')
      .join('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.id')
      .select(
        'user_subscriptions.*',
        'subscription_plans.name as plan_name',
        'subscription_plans.price as plan_price'
      );

    if (planId) {
      subscriptionsQuery = subscriptionsQuery.where('user_subscriptions.plan_id', planId);
    }

    if (startDate) {
      subscriptionsQuery = subscriptionsQuery.where('user_subscriptions.created_at', '>=', startDate);
    }

    if (endDate) {
      subscriptionsQuery = subscriptionsQuery.where('user_subscriptions.created_at', '<=', endDate);
    }

    const subscriptions = await subscriptionsQuery;

    // Calculate total subscribers (unique users)
    const uniqueUsers = new Set(subscriptions.map(s => s.user_id));
    const totalSubscribers = uniqueUsers.size;

    // Calculate total revenue
    const totalRevenue = subscriptions.reduce((sum, s) => sum + parseFloat(s.plan_price || 0), 0);

    // Calculate new subscribers (created in the last 30 days if no date range specified)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSubscribers = subscriptions.filter(s => {
      const createdAt = new Date(s.created_at);
      return createdAt >= thirtyDaysAgo;
    }).length;

    // Calculate average revenue per user
    const avgRevenuePerUser = totalSubscribers > 0 ? totalRevenue / totalSubscribers : 0;

    // Plans distribution
    const planCounts: Record<string, number> = {};
    subscriptions.forEach(s => {
      const planName = s.plan_name || 'Unknown';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });
    const plansDistribution = Object.entries(planCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Revenue trend (by month)
    const revenueByMonth: Record<string, { revenue: number; cumulative: number }> = {};
    let cumulativeRevenue = 0;
    subscriptions.forEach(s => {
      const month = new Date(s.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!revenueByMonth[month]) {
        revenueByMonth[month] = { revenue: 0, cumulative: 0 };
      }
      revenueByMonth[month].revenue += parseFloat(s.plan_price || 0);
    });

    // Sort months and calculate cumulative
    const sortedMonths = Object.keys(revenueByMonth).sort();
    const revenueTrend = sortedMonths.map(month => {
      cumulativeRevenue += revenueByMonth[month].revenue;
      return {
        month,
        revenue: Math.round(revenueByMonth[month].revenue * 100) / 100,
        cumulative: Math.round(cumulativeRevenue * 100) / 100
      };
    });

    // Subscriber trend (by date)
    const subscribersByDate: Record<string, { newSubscribers: number; totalSubscribers: number }> = {};
    subscriptions.forEach(s => {
      const date = new Date(s.created_at).toISOString().split('T')[0];
      if (!subscribersByDate[date]) {
        subscribersByDate[date] = { newSubscribers: 0, totalSubscribers: 0 };
      }
      subscribersByDate[date].newSubscribers += 1;
    });

    // Calculate cumulative subscribers
    const sortedDates = Object.keys(subscribersByDate).sort();
    let runningTotal = 0;
    const subscriberTrend = sortedDates.map(date => {
      runningTotal += subscribersByDate[date].newSubscribers;
      return {
        date,
        newSubscribers: subscribersByDate[date].newSubscribers,
        totalSubscribers: runningTotal
      };
    });

    // Top plans
    const planStats: Record<string, { name: string; subscriberCount: number; revenue: number }> = {};
    subscriptions.forEach(s => {
      const planName = s.plan_name || 'Unknown';
      if (!planStats[planName]) {
        planStats[planName] = { name: planName, subscriberCount: 0, revenue: 0 };
      }
      planStats[planName].subscriberCount += 1;
      planStats[planName].revenue += parseFloat(s.plan_price || 0);
    });

    const topPlans = Object.values(planStats)
      .map(p => ({
        name: p.name,
        subscriberCount: p.subscriberCount,
        revenue: Math.round(p.revenue * 100) / 100,
        conversionRate: Math.round((p.subscriberCount / (subscriptions.length || 1)) * 100),
        growth: 0 // Would need historical data to calculate
      }))
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, 10);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        totalSubscribers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        newSubscribers,
        avgRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
        plansDistribution,
        revenueTrend,
        subscriberTrend,
        topPlans
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/plans/:id/stats - 获取套餐统计信息
 */
router.get('/:id/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stats = await getPlanStats(id);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/plans/sort-order - 批量更新套餐排序
 */
router.put('/sort-order', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sortData } = req.body;

    if (!Array.isArray(sortData)) {
      throw new ValidationError([
        { field: 'sortData', message: 'sortData must be an array' }
      ]);
    }

    if (sortData.some(item => !item.id || typeof item.sortOrder !== 'number')) {
      throw new ValidationError([
        { field: 'sortData', message: 'Each item must have id and sortOrder' }
      ]);
    }

    await updatePlansSortOrder(sortData, req.user?.username);

    res.json({
      success: true,
      code: 200,
      message: 'Sort order updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as subscriptionPlanRoutes };
