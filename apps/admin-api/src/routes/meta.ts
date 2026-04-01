import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  IpType,
  LineType,
  RotationStrategy,
  IpTypeMeta,
  LineTypeMeta,
  RotationStrategyMeta,
  PRESET_ISPS
} from '../shared/constants/ip-assets';

const router = Router();

/**
 * GET /api/v1/meta/ip-types - 获取IP类型定义
 */
router.get('/ip-types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipTypes = Object.values(IpType).map(type => ({
      value: type,
      label: IpTypeMeta[type].label,
      description: IpTypeMeta[type].description,
      costLevel: IpTypeMeta[type].costLevel,
      priceMultiplier: IpTypeMeta[type].priceMultiplier,
      typicalBandwidth: IpTypeMeta[type].typicalBandwidth,
      typicalTraffic: IpTypeMeta[type].typicalTraffic,
      useCases: IpTypeMeta[type].useCases
    }));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: ipTypes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/meta/line-types - 获取线路类型定义
 */
router.get('/line-types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: lineTypes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/meta/rotation-strategies - 获取轮换策略定义
 */
router.get('/rotation-strategies', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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
 * GET /api/v1/meta/isp-presets - 获取ISP预设列表
 */
router.get('/isp-presets', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

/**
 * GET /api/v1/meta/ip-metadata - 获取IP元数据（兼容前端）
 */
router.get('/ip-metadata', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipTypes = Object.values(IpType).map(type => ({
      value: type,
      label: IpTypeMeta[type].label,
      description: IpTypeMeta[type].description,
      icon: 'OfficeBuilding' // Default icon for frontend
    }));

    const lineTypes = Object.values(LineType).map(type => ({
      value: type,
      label: LineTypeMeta[type].label,
      description: LineTypeMeta[type].description,
      priority: LineTypeMeta[type].priority
    }));

    const isps = PRESET_ISPS.map(isp => ({
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
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/meta/all - 获取所有元数据（用于前端初始化）
 */
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipTypes = Object.values(IpType).map(type => ({
      value: type,
      label: IpTypeMeta[type].label,
      description: IpTypeMeta[type].description,
      costLevel: IpTypeMeta[type].costLevel,
      priceMultiplier: IpTypeMeta[type].priceMultiplier,
      typicalBandwidth: IpTypeMeta[type].typicalBandwidth,
      typicalTraffic: IpTypeMeta[type].typicalTraffic,
      useCases: IpTypeMeta[type].useCases
    }));

    const lineTypes = Object.values(LineType).map(type => ({
      value: type,
      label: LineTypeMeta[type].label,
      description: LineTypeMeta[type].description,
      priority: LineTypeMeta[type].priority,
      costMultiplier: LineTypeMeta[type].costMultiplier,
      sla: LineTypeMeta[type].sla,
      typicalLatency: LineTypeMeta[type].typicalLatency
    }));

    const rotationStrategies = Object.values(RotationStrategy).map(strategy => ({
      value: strategy,
      label: RotationStrategyMeta[strategy].label,
      description: RotationStrategyMeta[strategy].description
    }));

    const ispPresets = PRESET_ISPS.map(isp => ({
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
  } catch (error) {
    next(error);
  }
});

export { router as metaRoutes };
