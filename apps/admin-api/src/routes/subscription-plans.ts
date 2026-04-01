/**
 * 套餐管理路由
 * 提供套餐的 CRUD 接口
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { ValidationError } from '../utils/errors';
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
