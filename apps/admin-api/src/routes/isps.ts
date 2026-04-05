import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { authMiddleware } from '../middlewares/auth';
import { PRESET_ISPS, ISP } from '../shared/constants/ip-assets';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 有效的ISP类型
const VALID_ISP_TYPES = ['starlink', 'cable', 'fiber', 'mobile'] as const;
type ISPType = typeof VALID_ISP_TYPES[number];

/**
 * GET /api/v1/isps - 获取ISP列表
 * Query参数: page, limit, country, type, isActive
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const country = req.query.country as string;
    const type = req.query.type as string;
    const isActive = req.query.isActive as string;
    const search = req.query.search as string;

    let query = db('isps');

    // 应用筛选条件
    if (country) {
      query = query.where('country', country);
    }

    if (type && VALID_ISP_TYPES.includes(type as ISPType)) {
      query = query.where('type', type);
    }

    if (isActive !== undefined) {
      const isActiveBool = isActive === 'true' || isActive === '1';
      query = query.where('is_active', isActiveBool);
    }

    if (search) {
      query = query.where(function() {
        this.where('name', 'like', `%${search}%`)
          .orWhere('display_name', 'like', `%${search}%`);
      });
    }

    // 获取总数
    const [countResult] = await query.clone().count('* as count');
    const total = parseInt(countResult.count as string);

    // 获取列表
    const isps = await query
      .select('*')
      .orderBy('reputation', 'desc')
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset);

    // 获取每个ISP的节点使用统计
    const ispsWithStats = await Promise.all(
      isps.map(async (isp) => {
        const nodeCount = await db('nodes')
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
          nodeCount: parseInt(nodeCount?.count as string || '0', 10),
          createdAt: isp.created_at,
          updatedAt: isp.updated_at
        };
      })
    );

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
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/isps/:id - 获取ISP详情
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const isp = await db('isps')
      .where('id', id)
      .first();

    if (!isp) {
      throw new NotFoundError(`ISP with ID "${id}" not found`);
    }

    // 获取使用该ISP的节点
    const nodes = await db('nodes')
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
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/isps - 创建ISP
 */
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      displayName,
      country,
      type,
      reputation = 80,
      features = [],
      isActive = true
    } = req.body;

    // 验证必填字段
    if (!name || !displayName || !country || !type) {
      throw new ValidationError('Validation failed', [
        { field: 'name', message: 'Name is required' },
        { field: 'displayName', message: 'Display name is required' },
        { field: 'country', message: 'Country is required' },
        { field: 'type', message: 'Type is required' }
      ].filter(e => {
        if (e.field === 'name') return !name;
        if (e.field === 'displayName') return !displayName;
        if (e.field === 'country') return !country;
        if (e.field === 'type') return !type;
        return false;
      }));
    }

    // 验证ISP类型
    if (!VALID_ISP_TYPES.includes(type as ISPType)) {
      throw new ValidationError('Validation failed', [
        { field: 'type', message: `Invalid type. Must be one of: ${VALID_ISP_TYPES.join(', ')}` }
      ]);
    }

    // 验证声誉值
    if (typeof reputation !== 'number' || reputation < 0 || reputation > 100) {
      throw new ValidationError('Validation failed', [
        { field: 'reputation', message: 'Reputation must be a number between 0 and 100' }
      ]);
    }

    // 检查名称是否已存在
    const existingISP = await db('isps')
      .where('name', name)
      .first();

    if (existingISP) {
      throw new ValidationError('Validation failed', [
        { field: 'name', message: 'ISP with this name already exists' }
      ]);
    }

    const now = new Date();
    const [isp] = await db('isps').insert({
      id: uuidv4(),
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

    logger.info(`ISP created: ${name} by ${req.user?.username || 'system'}`);

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
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/isps/:id - 更新ISP
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      displayName,
      country,
      type,
      reputation,
      features,
      isActive
    } = req.body;

    const isp = await db('isps')
      .where('id', id)
      .first();

    if (!isp) {
      throw new NotFoundError(`ISP with ID "${id}" not found`);
    }

    // 验证ISP类型
    if (type !== undefined && !VALID_ISP_TYPES.includes(type as ISPType)) {
      throw new ValidationError('Validation failed', [
        { field: 'type', message: `Invalid type. Must be one of: ${VALID_ISP_TYPES.join(', ')}` }
      ]);
    }

    // 验证声誉值
    if (reputation !== undefined && (typeof reputation !== 'number' || reputation < 0 || reputation > 100)) {
      throw new ValidationError('Validation failed', [
        { field: 'reputation', message: 'Reputation must be a number between 0 and 100' }
      ]);
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (displayName !== undefined) updateData.display_name = displayName;
    if (country !== undefined) updateData.country = country;
    if (type !== undefined) updateData.type = type;
    if (reputation !== undefined) updateData.reputation = reputation;
    if (features !== undefined) updateData.features = JSON.stringify(features);
    if (isActive !== undefined) updateData.is_active = isActive;

    const [updatedISP] = await db('isps')
      .where('id', id)
      .update(updateData)
      .returning('*');

    logger.info(`ISP updated: ${updatedISP.name} by ${req.user?.username || 'system'}`);

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
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/isps/:id - 删除ISP
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const isp = await db('isps')
      .where('id', id)
      .first();

    if (!isp) {
      throw new NotFoundError(`ISP with ID "${id}" not found`);
    }

    // 检查是否有节点正在使用该ISP
    const nodesUsingISP = await db('nodes')
      .where('isp_name', isp.name)
      .count('id as count')
      .first();

    const nodeCount = parseInt(nodesUsingISP?.count as string || '0', 10);

    if (nodeCount > 0) {
      throw new ValidationError('Validation failed', [
        { field: 'isp', message: `Cannot delete ISP that is being used by ${nodeCount} nodes. Please reassign those nodes first.` }
      ]);
    }

    await db('isps')
      .where('id', id)
      .delete();

    logger.info(`ISP deleted: ${isp.name} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'ISP deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/isps/seed - 初始化预设ISP数据
 */
router.post('/seed', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seeded: string[] = [];
    const skipped: string[] = [];

    for (const preset of PRESET_ISPS) {
      const existing = await db('isps')
        .where('name', preset.name)
        .first();

      if (existing) {
        skipped.push(preset.name);
        continue;
      }

      const now = new Date();
      await db('isps').insert({
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

    logger.info(`ISP seed completed: ${seeded.length} seeded, ${skipped.length} skipped by ${req.user?.username || 'system'}`);

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
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/isps/meta/types - 获取ISP类型列表
 */
router.get('/meta/types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/isps/meta/countries - 获取ISP国家列表
 */
router.get('/meta/countries', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countries = await db('isps')
      .distinct('country')
      .select('country')
      .orderBy('country');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: countries.map(c => c.country)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/isps/preset/list - 获取预设ISP列表（用于选择）
 */
router.get('/preset/list', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const presets = PRESET_ISPS.map(isp => ({
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
  } catch (error) {
    next(error);
  }
});

export { router as ispRoutes };
