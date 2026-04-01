import { Router, Request, Response, NextFunction } from 'express';
import { nodeService } from '@/services/nodeService';
import { NodeFilterService } from '@/services/nodeFilterService';
import { authenticate } from '@/middlewares/auth';
import { UnauthorizedError } from '@/errors/AppError';
import { successResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { IpType, LineType, IpTypeMeta, LineTypeMeta, RotationStrategy, RotationStrategyMeta } from '@/constants/ip-type';
import { validate, NodeValidation } from '@/middlewares/validation';

const router = Router();
const nodeFilterService = new NodeFilterService();

/**
 * GET /api/v1/nodes/accessible - 获取用户可访问的节点列表（兼容前端）
 * 与 /nodes 功能相同，但使用不同的路径
 */
router.get('/accessible', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    // 获取节点列表（带用户权限过滤）
    const nodes = await nodeService.getNodes(undefined, userId);

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
      serviceTypeLabel: nodeService.getServiceTypeLabel(node.serviceType),
      serviceTypeColor: nodeService.getServiceTypeColor(node.serviceType)
    }));

    logger.info(`User ${userId} fetched ${nodes.length} accessible nodes`);

    successResponse(res, responseData, 'Accessible nodes fetched successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/nodes - 获取节点列表
 * Query参数: region, ipType, lineType, ispName
 * 响应包含IP资产管理新字段
 */
router.get('/', authenticate, validate(NodeValidation.list), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.user_id;
    const { region, ipType, lineType, ispName } = req.query;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    // 获取节点列表（带用户权限过滤）
    let nodes = await nodeService.getNodes(region as string, userId);

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
      serviceTypeLabel: nodeService.getServiceTypeLabel(node.serviceType),
      serviceTypeColor: nodeService.getServiceTypeColor(node.serviceType)
    }));

    logger.info(`User ${userId} fetched ${nodes.length} nodes`);

    successResponse(res, responseData, 'Nodes fetched successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/nodes/:id - 获取节点详情
 */
router.get('/:id', authenticate, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    const node = await nodeService.getNodeById(id, userId);

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
      serviceTypeLabel: nodeService.getServiceTypeLabel(node.serviceType),
      serviceTypeColor: nodeService.getServiceTypeColor(node.serviceType)
    };

    successResponse(res, responseData, 'Node fetched successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/nodes/:id/config - 获取节点配置
 * 订阅生成增强 - 节点名称格式："地区 [ISP] [IP类型] [线路类型]"
 */
router.get('/:id/config', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    const config = await nodeService.generateNodeConfig(id, userId);

    successResponse(res, config, 'Node config generated successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/nodes/:id/test - 测试节点连接
 */
router.post('/:id/test', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    const result = await nodeService.testNodeConnection(id);

    successResponse(res, result, 'Node connection test completed');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/nodes/filter/options - 获取节点筛选选项
 */
router.get('/filter/options', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    // 获取用户可访问的节点
    const nodes = await nodeService.getNodes(undefined, userId);

    // 提取筛选选项
    const regions = [...new Set(nodes.map(n => n.region))].sort();
    const ipTypes = [...new Set(nodes.filter(n => n.ipType).map(n => n.ipType))].sort();
    const lineTypes = [...new Set(nodes.filter(n => n.lineType).map(n => n.lineType))].sort();
    const ispNames = [...new Set(nodes.filter(n => n.ispName).map(n => n.ispName as string))].sort();

    successResponse(res, {
      regions,
      ipTypes: ipTypes.map(type => ({
        value: type,
        label: IpTypeMeta[type as IpType]?.label || type
      })),
      lineTypes: lineTypes.map(type => ({
        value: type,
        label: LineTypeMeta[type as LineType]?.label || type
      })),
      ispNames
    }, 'Filter options fetched successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/nodes/stats/overview - 获取节点统计概览
 */
router.get('/stats/overview', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    const stats = await nodeService.getAccessibleNodeCount(userId);

    successResponse(res, stats, 'Node statistics fetched successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/nodes/meta/ip-types - 获取IP类型定义
 */
router.get('/meta/ip-types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipTypes = Object.values(IpType).map(type => ({
      value: type,
      label: IpTypeMeta[type]?.label || type,
      description: IpTypeMeta[type]?.description || '',
      costLevel: (IpTypeMeta[type] as any)?.costLevel || 'low',
      priceMultiplier: (IpTypeMeta[type] as any)?.priceMultiplier || 1,
      typicalBandwidth: (IpTypeMeta[type] as any)?.typicalBandwidth || '',
      typicalTraffic: (IpTypeMeta[type] as any)?.typicalTraffic || '',
      useCases: (IpTypeMeta[type] as any)?.useCases || []
    }));

    successResponse(res, ipTypes, 'IP types fetched successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/nodes/meta/line-types - 获取线路类型定义
 */
router.get('/meta/line-types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lineTypes = Object.values(LineType).map(type => ({
      value: type,
      label: LineTypeMeta[type].label,
      description: LineTypeMeta[type].description,
      priority: LineTypeMeta[type].priority,
      costMultiplier: LineTypeMeta[type].costMultiplier,
      sla: LineTypeMeta[type].sla,
      typicalLatency: LineTypeMeta[type].typicalLatency
    }));

    successResponse(res, lineTypes, 'Line types fetched successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/nodes/meta/rotation-strategies - 获取轮换策略定义
 */
router.get('/meta/rotation-strategies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategies = Object.values(RotationStrategy).map(strategy => ({
      value: strategy,
      label: RotationStrategyMeta[strategy].label,
      description: RotationStrategyMeta[strategy].description
    }));

    successResponse(res, strategies, 'Rotation strategies fetched successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
