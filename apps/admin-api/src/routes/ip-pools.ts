import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { authMiddleware } from '../middlewares/auth';
import { getIPPoolService } from '../services/ip-pool';
import { getIPReputationService } from '../services/ip-reputation';
import {
  IpType,
  LineType,
  isValidIpType,
  IpTypeMeta
} from '../shared/constants/ip-type';
import {
  RotationStrategy,
  isValidRotationStrategy,
  RotationStrategyMeta
} from '../shared/constants/ip-assets';

const router = Router();
const ipPoolService = getIPPoolService();
const ipReputationService = getIPReputationService();

/**
 * GET /api/v1/ip-pools - 获取IP池列表
 * Query参数: page, limit, nodeId, ipType, isActive
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const nodeId = req.query.nodeId as string;
    const ipType = req.query.ipType as string;
    const isActive = req.query.isActive as string;

    const options: any = { page, limit };
    if (nodeId) options.nodeId = nodeId;
    if (ipType && isValidIpType(ipType)) options.ipType = ipType;
    if (isActive !== undefined) options.isActive = isActive === 'true' || isActive === '1';

    const result = await ipPoolService.listIPPools(options);

    // 获取每个IP池的节点信息
    const itemsWithNodeInfo = await Promise.all(
      result.items.map(async (pool) => {
        const node = await db('nodes')
          .where('id', pool.nodeId)
          .first('code', 'name', 'status');

        const ipStats = await db('ip_pool_ips')
          .where('pool_id', pool.id)
          .select(
            db.raw('COUNT(*) as total'),
            db.raw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active"),
            db.raw("SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked")
          )
          .first();

        return {
          id: pool.id,
          name: pool.name,
          nodeId: pool.nodeId,
          nodeCode: node?.code || null,
          nodeName: node?.name || null,
          nodeStatus: node?.status || null,
          ipType: pool.ipType,
          ipTypeLabel: pool.ipType ? IpTypeMeta[pool.ipType]?.label : undefined,
          rotationStrategy: pool.rotationStrategy,
          rotationStrategyLabel: pool.rotationStrategy ? RotationStrategyMeta[pool.rotationStrategy]?.label : undefined,
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
      })
    );

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
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/ip-pools/:id - 获取IP池详情
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const poolStatus = await ipPoolService.getIPPoolStatus(id);

    if (!poolStatus) {
      throw new NotFoundError('IP Pool', id);
    }

    const node = await db('nodes')
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
        ipTypeLabel: poolStatus.pool.ipType ? IpTypeMeta[poolStatus.pool.ipType]?.label : undefined,
        rotationStrategy: poolStatus.pool.rotationStrategy,
        rotationStrategyLabel: poolStatus.pool.rotationStrategy ? RotationStrategyMeta[poolStatus.pool.rotationStrategy]?.label : undefined,
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
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/ip-pools - 创建IP池
 */
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      nodeId,
      ipType,
      ips,
      rotationStrategy = RotationStrategy.ROUND_ROBIN,
      rotationInterval = 86400
    } = req.body;

    // 验证必填字段
    if (!name || !nodeId || !ipType || !ips || !Array.isArray(ips) || ips.length === 0) {
      throw new ValidationError([
        { field: 'name', message: 'Name is required' },
        { field: 'nodeId', message: 'Node ID is required' },
        { field: 'ipType', message: 'IP type is required' },
        { field: 'ips', message: 'IPs array is required and must not be empty' }
      ].filter(e => {
        if (e.field === 'name') return !name;
        if (e.field === 'nodeId') return !nodeId;
        if (e.field === 'ipType') return !ipType;
        if (e.field === 'ips') return !ips || !Array.isArray(ips) || ips.length === 0;
        return false;
      }));
    }

    // 验证IP类型
    if (!isValidIpType(ipType)) {
      throw new ValidationError([
        { field: 'ipType', message: `Invalid IP type. Must be one of: ${Object.values(IpType).join(', ')}` }
      ]);
    }

    // 验证轮换策略
    if (!isValidRotationStrategy(rotationStrategy)) {
      throw new ValidationError([
        { field: 'rotationStrategy', message: `Invalid rotation strategy. Must be one of: ${Object.values(RotationStrategy).join(', ')}` }
      ]);
    }

    // 验证节点是否存在
    const node = await db('nodes')
      .where('id', nodeId)
      .first();

    if (!node) {
      throw new NotFoundError('Node', nodeId);
    }

    // 检查节点是否已有IP池
    if (node.ip_pool_id) {
      throw new ValidationError([
        { field: 'nodeId', message: 'Node already has an IP pool. Please delete the existing pool first.' }
      ]);
    }

    // 验证IP格式
    const invalidIps = ips.filter(ip => !isValidIP(ip));
    if (invalidIps.length > 0) {
      throw new ValidationError([
        { field: 'ips', message: `Invalid IP addresses: ${invalidIps.join(', ')}` }
      ]);
    }

    const pool = await ipPoolService.createIPPool({
      enabled: true,
      name,
      nodeId,
      ipType,
      ips,
      rotationStrategy,
      rotationInterval
    });

    logger.info(`IP pool created: ${pool.id} for node ${nodeId} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'IP pool created successfully',
      data: {
        id: pool.id,
        name: pool.name,
        nodeId: pool.nodeId,
        ipType: pool.ipType,
        ipTypeLabel: IpTypeMeta[pool.ipType]?.label || pool.ipType,
        rotationStrategy: pool.rotationStrategy,
        rotationInterval: pool.rotationInterval,
        currentIndex: pool.currentIndex,
        isActive: pool.isActive,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/ip-pools/:id - 更新IP池
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, rotationStrategy, rotationInterval, isActive } = req.body;

    const pool = await ipPoolService.getIPPool(id);
    if (!pool) {
      throw new NotFoundError('IP Pool', id);
    }

    // 验证轮换策略
    if (rotationStrategy !== undefined && !isValidRotationStrategy(rotationStrategy)) {
      throw new ValidationError([
        { field: 'rotationStrategy', message: `Invalid rotation strategy. Must be one of: ${Object.values(RotationStrategy).join(', ')}` }
      ]);
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (rotationStrategy !== undefined) updates.rotationStrategy = rotationStrategy;
    if (rotationInterval !== undefined) updates.rotationInterval = rotationInterval;

    const updatedPool = await ipPoolService.updateIPPool(id, updates);

    // 如果更新了激活状态
    if (isActive !== undefined) {
      await ipPoolService.setPoolActive(id, isActive);
    }

    logger.info(`IP pool updated: ${id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'IP pool updated successfully',
      data: {
        id: updatedPool?.id,
        name: updatedPool?.name,
        nodeId: updatedPool?.nodeId,
        ipType: updatedPool?.ipType,
        ipTypeLabel: IpTypeMeta[updatedPool?.ipType as IpType]?.label || updatedPool?.ipType,
        rotationStrategy: updatedPool?.rotationStrategy,
        rotationStrategyLabel: RotationStrategyMeta[updatedPool?.rotationStrategy as RotationStrategy]?.label || updatedPool?.rotationStrategy,
        rotationInterval: updatedPool?.rotationInterval,
        currentIndex: updatedPool?.currentIndex,
        isActive: isActive !== undefined ? isActive : updatedPool?.isActive,
        createdAt: updatedPool?.createdAt,
        updatedAt: updatedPool?.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/ip-pools/:id - 删除IP池
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pool = await ipPoolService.getIPPool(id);
    if (!pool) {
      throw new NotFoundError('IP Pool', id);
    }

    await ipPoolService.deleteIPPool(id);

    logger.info(`IP pool deleted: ${id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'IP pool deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/ip-pools/:id/rotate - 手动轮换IP
 */
router.post('/:id/rotate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pool = await ipPoolService.getIPPool(id);
    if (!pool) {
      throw new NotFoundError('IP Pool', id);
    }

    const result = await ipPoolService.manualRotate(id);

    if (result.success) {
      logger.info(`IP pool rotated: ${id}, ${result.previousIp} -> ${result.newIp} by ${req.user?.username || 'system'}`);

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
    } else {
      res.status(500).json({
        success: false,
        code: 500,
        message: result.error || 'Failed to rotate IP'
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/ip-pools/:id/ips - 添加IP到池
 */
router.post('/:id/ips', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { ip } = req.body;

    if (!ip) {
      throw new ValidationError([
        { field: 'ip', message: 'IP address is required' }
      ]);
    }

    if (!isValidIP(ip)) {
      throw new ValidationError([
        { field: 'ip', message: 'Invalid IP address format' }
      ]);
    }

    const pool = await ipPoolService.getIPPool(id);
    if (!pool) {
      throw new NotFoundError('IP Pool', id);
    }

    const ipRecord = await ipPoolService.addIPToPool(id, ip);

    logger.info(`IP added to pool: ${ip} -> ${id} by ${req.user?.username || 'system'}`);

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
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/ip-pools/:id/ips/:ipId - 从池中移除IP
 */
router.delete('/:id/ips/:ipId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, ipId } = req.params;

    const pool = await ipPoolService.getIPPool(id);
    if (!pool) {
      throw new NotFoundError('IP Pool', id);
    }

    // 获取IP地址
    const ipRecord = await db('ip_pool_ips')
      .where({ id: ipId, pool_id: id })
      .first('ip');

    if (!ipRecord) {
      throw new NotFoundError('IP Record', ipId);
    }

    await ipPoolService.removeIPFromPool(id, ipRecord.ip);

    logger.info(`IP removed from pool: ${ipRecord.ip} from ${id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'IP removed from pool successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/ip-pools/:id/refresh-scores - 刷新IP池内所有IP的评分
 */
router.post('/:id/refresh-scores', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pool = await ipPoolService.getIPPool(id);
    if (!pool) {
      throw new NotFoundError('IP Pool', id);
    }

    await ipPoolService.refreshIPScores(id);

    logger.info(`IP scores refreshed for pool: ${id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'IP scores refreshed successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/ip-pools/meta/rotation-strategies - 获取轮换策略列表
 */
router.get('/meta/rotation-strategies', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategies = Object.values(RotationStrategy).map(strategy => ({
      value: strategy,
      label: RotationStrategyMeta[strategy].label,
      description: RotationStrategyMeta[strategy].description
    }));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: strategies
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 验证IP地址格式
 */
function isValidIP(ip: string): boolean {
  // IPv4验证
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6验证（简化版）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export { router as ipPoolRoutes };
