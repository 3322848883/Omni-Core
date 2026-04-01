import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { getXrayClient } from '../services/xray/client';
import { getNodeConfigCache } from '../services/cache';
import { XrayConfigGenerator } from '../services/xray/config';
import { authMiddleware } from '../middlewares/auth';
import { validate, NodeValidation } from '../middlewares/validation';
import { ServiceType, isValidServiceType } from '../shared/constants';
import {
  IpType,
  LineType,
  isValidIpType,
  isValidLineType,
  IpTypeMeta,
  LineTypeMeta,
  getIPScoreLabel
} from '../shared/constants/ip-assets';
import { getIPReputationService } from '../services/ip-reputation';
import { getIPPoolService } from '../services/ip-pool';

const router = Router();
const ipReputationService = getIPReputationService();
const ipPoolService = getIPPoolService();

// GET /api/v1/nodes - Get all nodes with pagination and filters
router.get('/', authMiddleware, validate(NodeValidation.list), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const region = req.query.region as string;
    const protocol = req.query.protocol as string;
    const serviceType = req.query.serviceType as string;
    const serviceGroup = req.query.serviceGroup as string;
    const isPremium = req.query.isPremium as string;
    const minQosLevel = req.query.minQosLevel as string;
    // 新增筛选参数
    const ipType = req.query.ipType as string;
    const lineType = req.query.lineType as string;
    const ispName = req.query.ispName as string;
    const minIpScore = req.query.minIpScore as string;
    const supportsIPv6 = req.query.supportsIPv6 as string;

    let query = db('nodes');

    if (status) {
      query = query.where('status', status);
    }

    if (region) {
      query = query.where('region', region);
    }

    if (protocol) {
      query = query.where('protocol', protocol);
    }

    // 服务类型筛选
    if (serviceType && isValidServiceType(serviceType)) {
      query = query.where('service_type', serviceType);
    }

    if (serviceGroup) {
      query = query.where('service_group', serviceGroup);
    }

    if (isPremium !== undefined) {
      const isPremiumBool = isPremium === 'true' || isPremium === '1';
      query = query.where('is_premium', isPremiumBool);
    }

    if (minQosLevel) {
      const qosLevel = parseInt(minQosLevel);
      if (!isNaN(qosLevel)) {
        query = query.where('qos_level', '>=', qosLevel);
      }
    }

    // 新增筛选条件
    if (ipType && isValidIpType(ipType)) {
      query = query.where('ip_type', ipType);
    }

    if (lineType && isValidLineType(lineType)) {
      query = query.where('line_type', lineType);
    }

    if (ispName) {
      query = query.where('isp_name', ispName);
    }

    if (minIpScore) {
      const score = parseInt(minIpScore);
      if (!isNaN(score)) {
        query = query.where('ip_score', '>=', score);
      }
    }

    if (supportsIPv6 !== undefined) {
      const supportsIPv6Bool = supportsIPv6 === 'true' || supportsIPv6 === '1';
      query = query.where('supports_ipv6', supportsIPv6Bool);
    }

    const [countResult] = await query.clone().count('* as count');
    const total = parseInt(countResult.count as string);

    const nodes = await query
      .select('*')
      .orderBy('priority', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        items: nodes.map(node => ({
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
          healthScore: node.health_score,
          loadPercent: node.load_percent,
          activeConnections: node.active_connections,
          maxConnections: node.max_connections,
          priority: node.priority,
          isBackup: node.is_backup,
          // 服务类型相关字段
          serviceType: node.service_type || ServiceType.STANDARD,
          serviceGroup: node.service_group || 'default',
          isPremium: node.is_premium || false,
          qosLevel: node.qos_level || 1,
          bandwidthLimit: node.bandwidth_limit || 0,
          maxUsers: node.max_users || 10000,
          currentUsers: node.current_users || 0,
          // IP资产管理新字段
          ipType: node.ip_type || IpType.DATACENTER,
          ipTypeLabel: IpTypeMeta[(node.ip_type as IpType) || IpType.DATACENTER]?.label || '机房',
          lineType: node.line_type || LineType.STANDARD,
          lineTypeLabel: LineTypeMeta[(node.line_type as LineType) || LineType.STANDARD]?.label || '标准线路',
          ispName: node.isp_name || null,
          ipScore: node.ip_score,
          ipScoreLabel: node.ip_score ? getIPScoreLabel(node.ip_score).label : null,
          supportsIPv6: node.supports_ipv6 || false,
          ipPoolId: node.ip_pool_id || null,
          currentIp: node.current_ip || null,
          ipRotationEnabled: node.ip_rotation_enabled || false,
          ipRotationInterval: node.ip_rotation_interval,
          lastIpRotationAt: node.last_ip_rotation_at,
          createdAt: node.created_at,
          updatedAt: node.updated_at
        })),
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

// GET /api/v1/nodes/:id - Get node by ID
router.get('/:id', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    // 获取IP池信息（如果有）
    let ipPoolInfo = null;
    if (node.ip_pool_id) {
      const poolStatus = await ipPoolService.getIPPoolStatus(node.ip_pool_id);
      if (poolStatus) {
        ipPoolInfo = {
          id: poolStatus.pool.id,
          name: poolStatus.pool.name,
          ipType: poolStatus.pool.ipType,
          rotationStrategy: poolStatus.pool.rotationStrategy,
          rotationInterval: poolStatus.pool.rotationInterval,
          activeIpCount: poolStatus.activeIpCount,
          blockedIpCount: poolStatus.blockedIpCount,
          currentIp: poolStatus.currentIp,
          nextRotationAt: poolStatus.nextRotationAt
        };
      }
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
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
        healthScore: node.health_score,
        loadPercent: node.load_percent,
        activeConnections: node.active_connections,
        maxConnections: node.max_connections,
        priority: node.priority,
        isBackup: node.is_backup,
        // 服务类型相关字段
        serviceType: node.service_type || ServiceType.STANDARD,
        serviceGroup: node.service_group || 'default',
        isPremium: node.is_premium || false,
        qosLevel: node.qos_level || 1,
        bandwidthLimit: node.bandwidth_limit || 0,
        maxUsers: node.max_users || 10000,
        currentUsers: node.current_users || 0,
        // IP资产管理新字段
        ipType: node.ip_type || IpType.DATACENTER,
        ipTypeLabel: IpTypeMeta[(node.ip_type as IpType) || IpType.DATACENTER]?.label || '机房',
        ipTypeDescription: IpTypeMeta[(node.ip_type as IpType) || IpType.DATACENTER]?.description || '',
        lineType: node.line_type || LineType.STANDARD,
        lineTypeLabel: LineTypeMeta[(node.line_type as LineType) || LineType.STANDARD]?.label || '标准线路',
        lineTypeDescription: LineTypeMeta[(node.line_type as LineType) || LineType.STANDARD]?.description || '',
        ispName: node.isp_name || null,
        ipScore: node.ip_score,
        ipScoreLabel: node.ip_score ? getIPScoreLabel(node.ip_score).label : null,
        ipScoreColor: node.ip_score ? getIPScoreLabel(node.ip_score).color : null,
        supportsIPv6: node.supports_ipv6 || false,
        ipPoolId: node.ip_pool_id || null,
        ipPoolInfo,
        currentIp: node.current_ip || null,
        ipRotationEnabled: node.ip_rotation_enabled || false,
        ipRotationInterval: node.ip_rotation_interval,
        lastIpRotationAt: node.last_ip_rotation_at,
        createdAt: node.created_at,
        updatedAt: node.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/nodes - Create new node
router.post('/', authMiddleware, validate(NodeValidation.create), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      code,
      name,
      region,
      country,
      city,
      latitude,
      longitude,
      host,
      port,
      protocol,
      maxConnections = 10000,
      priority = 1,
      isBackup = false,
      // 服务类型相关字段
      serviceType = ServiceType.STANDARD,
      serviceGroup = 'default',
      isPremium = false,
      bandwidthLimit = 0,
      qosLevel = 1,
      maxUsers = 10000,
      // IP资产管理新字段
      ipType = IpType.DATACENTER,
      lineType = LineType.STANDARD,
      ispName,
      supportsIPv6 = false,
      ipPoolConfig
    } = req.body;

    // 验证 serviceType 是否有效
    if (!isValidServiceType(serviceType)) {
      throw new ValidationError([
        { field: 'serviceType', message: `Invalid service type. Must be one of: ${Object.values(ServiceType).join(', ')}` }
      ]);
    }

    // 验证 ipType 是否有效
    if (!isValidIpType(ipType)) {
      throw new ValidationError([
        { field: 'ipType', message: `Invalid IP type. Must be one of: ${Object.values(IpType).join(', ')}` }
      ]);
    }

    // 验证 lineType 是否有效
    if (!isValidLineType(lineType)) {
      throw new ValidationError([
        { field: 'lineType', message: `Invalid line type. Must be one of: ${Object.values(LineType).join(', ')}` }
      ]);
    }

    // 验证数值字段
    if (bandwidthLimit !== undefined && (typeof bandwidthLimit !== 'number' || bandwidthLimit < 0)) {
      throw new ValidationError([
        { field: 'bandwidthLimit', message: 'Bandwidth limit must be a non-negative number' }
      ]);
    }

    if (qosLevel !== undefined && (typeof qosLevel !== 'number' || qosLevel < 1 || qosLevel > 5)) {
      throw new ValidationError([
        { field: 'qosLevel', message: 'QoS level must be between 1 and 5' }
      ]);
    }

    if (maxUsers !== undefined && (typeof maxUsers !== 'number' || maxUsers < 1)) {
      throw new ValidationError([
        { field: 'maxUsers', message: 'Max users must be a positive number' }
      ]);
    }

    // 验证IP池配置
    if (ipPoolConfig && ipPoolConfig.enabled) {
      if (!ipPoolConfig.ips || !Array.isArray(ipPoolConfig.ips) || ipPoolConfig.ips.length === 0) {
        throw new ValidationError([
          { field: 'ipPoolConfig.ips', message: 'IP pool must contain at least one IP address' }
        ]);
      }
    }

    const existingNode = await db('nodes')
      .where('code', code)
      .first();

    if (existingNode) {
      throw new ValidationError([
        { field: 'code', message: 'Node code already exists' }
      ]);
    }

    const [node] = await db('nodes').insert({
      code,
      name,
      region: region || 'Unknown',
      country: country || 'Unknown',
      city: city || 'Unknown',
      latitude: latitude || null,
      longitude: longitude || null,
      host,
      port,
      protocol,
      status: 'offline',
      health_score: null,
      load_percent: null,
      active_connections: 0,
      max_connections: maxConnections,
      priority,
      is_backup: isBackup,
      // 服务类型相关字段
      service_type: serviceType,
      service_group: serviceGroup,
      is_premium: isPremium,
      bandwidth_limit: bandwidthLimit,
      qos_level: qosLevel,
      max_users: maxUsers,
      current_users: 0,
      // IP资产管理新字段
      ip_type: ipType,
      line_type: lineType,
      isp_name: ispName || null,
      ip_score: null,
      supports_ipv6: supportsIPv6,
      ip_pool_id: null,
      current_ip: null,
      ip_rotation_enabled: ipPoolConfig?.enabled || false,
      ip_rotation_interval: ipPoolConfig?.rotationInterval || 86400,
      last_ip_rotation_at: null
    }).returning('*');

    // 如果配置了IP池，创建IP池
    if (ipPoolConfig && ipPoolConfig.enabled) {
      try {
        const pool = await ipPoolService.createIPPool({
          enabled: true,
          name: `${name} IP Pool`,
          nodeId: node.id,
          ipType,
          ips: ipPoolConfig.ips,
          rotationStrategy: ipPoolConfig.rotationStrategy || 'round_robin',
          rotationInterval: ipPoolConfig.rotationInterval || 86400
        });

        // 更新节点的IP池ID
        await db('nodes')
          .where('id', node.id)
          .update({
            ip_pool_id: pool.id,
            current_ip: ipPoolConfig.ips[0],
            updated_at: new Date()
          });

        node.ip_pool_id = pool.id;
        node.current_ip = ipPoolConfig.ips[0];
      } catch (poolError) {
        logger.error(`Failed to create IP pool for node ${node.id}`, poolError);
        // 继续返回节点创建成功的响应，但记录错误
      }
    }

    // 缓存节点配置
    const nodeCache = getNodeConfigCache();
    await nodeCache.setNodeConfig(node.id, {
      id: node.id,
      code: node.code,
      name: node.name,
      address: node.host,
      port: node.port,
      protocol: node.protocol,
      config: {},
      status: node.status,
      trafficLimit: node.traffic_limit || 0,
      trafficUsed: node.traffic_used || 0,
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Node created: ${code} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Node created successfully',
      data: {
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
        healthScore: node.health_score,
        loadPercent: node.load_percent,
        activeConnections: node.active_connections,
        maxConnections: node.max_connections,
        priority: node.priority,
        isBackup: node.is_backup,
        // 服务类型相关字段
        serviceType: node.service_type || ServiceType.STANDARD,
        serviceGroup: node.service_group || 'default',
        isPremium: node.is_premium || false,
        qosLevel: node.qos_level || 1,
        bandwidthLimit: node.bandwidth_limit || 0,
        maxUsers: node.max_users || 10000,
        currentUsers: node.current_users || 0,
        // IP资产管理新字段
        ipType: node.ip_type || IpType.DATACENTER,
        ipTypeLabel: IpTypeMeta[(node.ip_type as IpType) || IpType.DATACENTER]?.label || '机房',
        lineType: node.line_type || LineType.STANDARD,
        lineTypeLabel: LineTypeMeta[(node.line_type as LineType) || LineType.STANDARD]?.label || '标准线路',
        ispName: node.isp_name || null,
        ipScore: node.ip_score,
        supportsIPv6: node.supports_ipv6 || false,
        ipPoolId: node.ip_pool_id || null,
        currentIp: node.current_ip || null,
        ipRotationEnabled: node.ip_rotation_enabled || false,
        ipRotationInterval: node.ip_rotation_interval,
        lastIpRotationAt: node.last_ip_rotation_at,
        createdAt: node.created_at,
        updatedAt: node.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/nodes/:id - Update node
router.put('/:id', authMiddleware, validate(NodeValidation.update), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name,
      region,
      country,
      city,
      latitude,
      longitude,
      host,
      port,
      protocol,
      maxConnections,
      priority,
      isBackup,
      // 服务类型相关字段
      serviceType,
      serviceGroup,
      isPremium,
      bandwidthLimit,
      qosLevel,
      maxUsers,
      // IP资产管理新字段
      ipType,
      lineType,
      ispName,
      supportsIPv6,
      ipRotationEnabled,
      ipRotationInterval
    } = req.body;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    // 验证 serviceType 是否有效
    if (serviceType !== undefined && !isValidServiceType(serviceType)) {
      throw new ValidationError([
        { field: 'serviceType', message: `Invalid service type. Must be one of: ${Object.values(ServiceType).join(', ')}` }
      ]);
    }

    // 验证 ipType 是否有效
    if (ipType !== undefined && !isValidIpType(ipType)) {
      throw new ValidationError([
        { field: 'ipType', message: `Invalid IP type. Must be one of: ${Object.values(IpType).join(', ')}` }
      ]);
    }

    // 验证 lineType 是否有效
    if (lineType !== undefined && !isValidLineType(lineType)) {
      throw new ValidationError([
        { field: 'lineType', message: `Invalid line type. Must be one of: ${Object.values(LineType).join(', ')}` }
      ]);
    }

    // 验证数值字段
    if (bandwidthLimit !== undefined && (typeof bandwidthLimit !== 'number' || bandwidthLimit < 0)) {
      throw new ValidationError([
        { field: 'bandwidthLimit', message: 'Bandwidth limit must be a non-negative number' }
      ]);
    }

    if (qosLevel !== undefined && (typeof qosLevel !== 'number' || qosLevel < 1 || qosLevel > 5)) {
      throw new ValidationError([
        { field: 'qosLevel', message: 'QoS level must be between 1 and 5' }
      ]);
    }

    if (maxUsers !== undefined && (typeof maxUsers !== 'number' || maxUsers < 1)) {
      throw new ValidationError([
        { field: 'maxUsers', message: 'Max users must be a positive number' }
      ]);
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (region !== undefined) updateData.region = region;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (host !== undefined) updateData.host = host;
    if (port !== undefined) updateData.port = port;
    if (protocol !== undefined) updateData.protocol = protocol;
    if (maxConnections !== undefined) updateData.max_connections = maxConnections;
    if (priority !== undefined) updateData.priority = priority;
    if (isBackup !== undefined) updateData.is_backup = isBackup;
    // 服务类型相关字段
    if (serviceType !== undefined) updateData.service_type = serviceType;
    if (serviceGroup !== undefined) updateData.service_group = serviceGroup;
    if (isPremium !== undefined) updateData.is_premium = isPremium;
    if (bandwidthLimit !== undefined) updateData.bandwidth_limit = bandwidthLimit;
    if (qosLevel !== undefined) updateData.qos_level = qosLevel;
    if (maxUsers !== undefined) updateData.max_users = maxUsers;
    // IP资产管理新字段
    if (ipType !== undefined) updateData.ip_type = ipType;
    if (lineType !== undefined) updateData.line_type = lineType;
    if (ispName !== undefined) updateData.isp_name = ispName;
    if (supportsIPv6 !== undefined) updateData.supports_ipv6 = supportsIPv6;
    if (ipRotationEnabled !== undefined) updateData.ip_rotation_enabled = ipRotationEnabled;
    if (ipRotationInterval !== undefined) updateData.ip_rotation_interval = ipRotationInterval;

    await db('nodes')
      .where('id', node.id)
      .update(updateData);

    // Fetch the updated node
    const updatedNode = await db('nodes')
      .where('id', node.id)
      .first();

    // 更新缓存
    const nodeCache = getNodeConfigCache();
    await nodeCache.setNodeConfig(updatedNode.id, {
      id: updatedNode.id,
      code: updatedNode.code,
      name: updatedNode.name,
      address: updatedNode.host,
      port: updatedNode.port,
      protocol: updatedNode.protocol,
      config: {},
      status: updatedNode.status,
      trafficLimit: updatedNode.traffic_limit || 0,
      trafficUsed: updatedNode.traffic_used || 0,
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Node updated: ${node.code} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Node updated successfully',
      data: {
        id: updatedNode.id,
        code: updatedNode.code,
        name: updatedNode.name,
        region: updatedNode.region,
        country: updatedNode.country,
        city: updatedNode.city,
        latitude: updatedNode.latitude,
        longitude: updatedNode.longitude,
        host: updatedNode.host,
        port: updatedNode.port,
        protocol: updatedNode.protocol,
        status: updatedNode.status,
        healthScore: updatedNode.health_score,
        loadPercent: updatedNode.load_percent,
        activeConnections: updatedNode.active_connections,
        maxConnections: updatedNode.max_connections,
        priority: updatedNode.priority,
        isBackup: updatedNode.is_backup,
        // 服务类型相关字段
        serviceType: updatedNode.service_type || ServiceType.STANDARD,
        serviceGroup: updatedNode.service_group || 'default',
        isPremium: updatedNode.is_premium || false,
        qosLevel: updatedNode.qos_level || 1,
        bandwidthLimit: updatedNode.bandwidth_limit || 0,
        maxUsers: updatedNode.max_users || 10000,
        currentUsers: updatedNode.current_users || 0,
        // IP资产管理新字段
        ipType: updatedNode.ip_type || IpType.DATACENTER,
        ipTypeLabel: IpTypeMeta[(updatedNode.ip_type as IpType) || IpType.DATACENTER]?.label || '机房',
        lineType: updatedNode.line_type || LineType.STANDARD,
        lineTypeLabel: LineTypeMeta[(updatedNode.line_type as LineType) || LineType.STANDARD]?.label || '标准线路',
        ispName: updatedNode.isp_name || null,
        ipScore: updatedNode.ip_score,
        supportsIPv6: updatedNode.supports_ipv6 || false,
        ipPoolId: updatedNode.ip_pool_id || null,
        currentIp: updatedNode.current_ip || null,
        ipRotationEnabled: updatedNode.ip_rotation_enabled || false,
        ipRotationInterval: updatedNode.ip_rotation_interval,
        lastIpRotationAt: updatedNode.last_ip_rotation_at,
        createdAt: updatedNode.created_at,
        updatedAt: updatedNode.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/nodes/:id - Delete node
router.delete('/:id', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    // 如果节点有关联的IP池，先删除IP池
    if (node.ip_pool_id) {
      try {
        await ipPoolService.deleteIPPool(node.ip_pool_id);
      } catch (poolError) {
        logger.error(`Failed to delete IP pool for node ${node.id}`, poolError);
      }
    }

    await db('nodes')
      .where('id', node.id)
      .delete();

    // 删除缓存
    const nodeCache = getNodeConfigCache();
    await nodeCache.deleteNodeConfig(node.id);

    logger.info(`Node deleted: ${node.code} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Node deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/nodes/:id/enable - Enable node
router.post('/:id/enable', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    await db('nodes')
      .where('id', node.id)
      .update({
        status: 'online',
        updated_at: new Date()
      });

    // 更新缓存
    const nodeCache = getNodeConfigCache();
    await nodeCache.updateNodeStatus(node.id, 'online');

    logger.info(`Node enabled: ${node.code} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Node enabled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/nodes/:id/disable - Disable node
router.post('/:id/disable', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    await db('nodes')
      .where('id', node.id)
      .update({
        status: 'offline',
        updated_at: new Date()
      });

    // 更新缓存
    const nodeCache = getNodeConfigCache();
    await nodeCache.updateNodeStatus(node.id, 'offline');

    logger.info(`Node disabled: ${node.code} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Node disabled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/nodes/:id/check-ip - Check node IP reputation
router.post('/:id/check-ip', authMiddleware, validate(NodeValidation.checkIp), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { ip: customIp } = req.body;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    // 使用自定义IP或节点的当前IP/主机地址
    const ipToCheck = customIp || node.current_ip || node.host;

    if (!ipToCheck) {
      throw new ValidationError([
        { field: 'ip', message: 'No IP address available to check. Please provide an IP or ensure node has a host.' }
      ]);
    }

    const reputation = await ipReputationService.checkIP(ipToCheck);

    // Map to frontend expected format
    const scoreLabel = getIPScoreLabel(reputation.score);
    
    res.json({
      success: true,
      code: 200,
      message: 'IP reputation check completed',
      data: {
        success: true,
        ipAddress: reputation.ip,
        ipType: reputation.isResidential ? IpType.RESIDENTIAL_STATIC : (reputation.isDatacenter ? IpType.DATACENTER : IpType.DATACENTER),
        isp: reputation.isp || 'Unknown',
        country: reputation.country || 'Unknown',
        region: reputation.country || 'Unknown',
        city: 'Unknown',
        score: reputation.score,
        reputationStatus: scoreLabel.label,
        blacklistCount: reputation.abuseRecords || 0,
        latency: 0,
        message: `IP检测完成: ${reputation.ip} - 评分: ${reputation.score}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/nodes/:id/refresh-ip-score - Refresh node IP score
router.post('/:id/refresh-ip-score', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    const ipToCheck = node.current_ip || node.host;

    if (!ipToCheck) {
      throw new ValidationError([
        { field: 'ip', message: 'No IP address available to check' }
      ]);
    }

    const reputation = await ipReputationService.refreshNodeIPScore(node.id, ipToCheck);

    if (!reputation) {
      throw new Error('Failed to refresh IP score');
    }

    // Map to frontend expected format
    const scoreLabel = getIPScoreLabel(reputation.score);
    const oldScoreLabel = getIPScoreLabel(node.ip_score || 0);
    
    res.json({
      success: true,
      code: 200,
      message: 'IP score refreshed successfully',
      data: {
        success: true,
        oldScore: node.ip_score || 0,
        newScore: reputation.score,
        status: scoreLabel.label,
        checkedAt: reputation.checkedAt,
        message: `评分已刷新: ${node.ip_score || 0} → ${reputation.score}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/nodes/:id/test - Test node connection
router.post('/:id/test', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    // Test connection to node
    const startTime = Date.now();
    let success = false;
    let latency = 0;
    let error = null;

    try {
      // Try to connect to node's Xray service
      const xrayClient = getXrayClient();
      await xrayClient.testConnection();
      latency = Date.now() - startTime;
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      logger.warn(`Connection test failed for node ${node.code}:`, err);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        success,
        latency,
        error
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/nodes/:id/health - Get node health status
router.get('/:id/health', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    // 尝试连接 Xray API 获取真实状态
    const xrayClient = getXrayClient();
    let xrayStatus = null;
    let isConnected = false;

    try {
      xrayStatus = await xrayClient.getNodeStatus();
      isConnected = true;
    } catch (error) {
      logger.warn(`Failed to get Xray status for node ${node.code}:`, error);
    }

    const healthStatus = {
      nodeId: node.id,
      code: node.code,
      status: node.status,
      healthScore: node.health_score || 0,
      loadPercent: node.load_percent || 0,
      activeConnections: node.active_connections || 0,
      maxConnections: node.max_connections,
      // 服务类型相关字段
      serviceType: node.service_type || ServiceType.STANDARD,
      serviceGroup: node.service_group || 'default',
      isPremium: node.is_premium || false,
      qosLevel: node.qos_level || 1,
      bandwidthLimit: node.bandwidth_limit || 0,
      maxUsers: node.max_users || 10000,
      currentUsers: node.current_users || 0,
      // IP资产管理新字段
      ipType: node.ip_type || IpType.DATACENTER,
      lineType: node.line_type || LineType.STANDARD,
      ispName: node.isp_name || null,
      ipScore: node.ip_score,
      supportsIPv6: node.supports_ipv6 || false,
      currentIp: node.current_ip || null,
      lastChecked: new Date().toISOString(),
      xrayConnected: isConnected,
      xrayStatus: xrayStatus,
      checks: {
        connectivity: node.status === 'online',
        latency: node.health_score ? node.health_score > 60 : false,
        load: node.load_percent ? node.load_percent < 80 : true,
        xrayApi: isConnected,
        ipScore: node.ip_score ? node.ip_score >= 60 : true
      }
    };

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: healthStatus
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/nodes/meta/regions - Get all regions
router.get('/meta/regions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const regions = await db('nodes')
      .distinct('region')
      .select('region')
      .orderBy('region');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: regions.map(r => r.region)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/nodes/meta/service-groups - Get all service groups
router.get('/meta/service-groups', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await db('nodes')
      .distinct('service_group')
      .select('service_group')
      .orderBy('service_group');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: groups.map(g => g.service_group || 'default')
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/nodes/meta/ip-types - Get all IP types
router.get('/meta/ip-types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

// GET /api/v1/nodes/meta/line-types - Get all line types
router.get('/meta/line-types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

// GET /api/v1/nodes/meta/isp-names - Get all ISP names
router.get('/meta/isp-names', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ispNames = await db('nodes')
      .distinct('isp_name')
      .whereNotNull('isp_name')
      .select('isp_name')
      .orderBy('isp_name');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: ispNames.map(i => i.isp_name).filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/nodes/stats/overview - Get node statistics
router.get('/stats/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalNodes = await db('nodes').count('* as count').first();
    const onlineNodes = await db('nodes').where('status', 'online').count('* as count').first();
    const offlineNodes = await db('nodes').where('status', 'offline').count('* as count').first();
    const maintenanceNodes = await db('nodes').where('status', 'maintenance').count('* as count').first();

    const totalConnections = await db('nodes')
      .sum('active_connections as total')
      .first();

    const protocolDistribution = await db('nodes')
      .select('protocol')
      .count('* as count')
      .groupBy('protocol');

    const regionDistribution = await db('nodes')
      .select('region')
      .count('* as count')
      .groupBy('region');

    // 按服务类型统计
    const serviceTypeDistribution = await db('nodes')
      .select('service_type')
      .count('* as count')
      .groupBy('service_type');

    // 按是否高级服务统计
    const premiumStats = await db('nodes')
      .select('is_premium')
      .count('* as count')
      .groupBy('is_premium');

    // 按IP类型统计
    const ipTypeDistribution = await db('nodes')
      .select('ip_type')
      .count('* as count')
      .groupBy('ip_type');

    // 按线路类型统计
    const lineTypeDistribution = await db('nodes')
      .select('line_type')
      .count('* as count')
      .groupBy('line_type');

    // IP评分统计
    const ipScoreStats = await db('nodes')
      .whereNotNull('ip_score')
      .select(
        db.raw("CASE WHEN ip_score >= 90 THEN 'excellent' WHEN ip_score >= 75 THEN 'good' WHEN ip_score >= 60 THEN 'fair' WHEN ip_score >= 40 THEN 'poor' ELSE 'critical' END as score_range"),
        db.raw('COUNT(*) as count')
      )
      .groupBy('score_range');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        total: parseInt(totalNodes?.count as string) || 0,
        online: parseInt(onlineNodes?.count as string) || 0,
        offline: parseInt(offlineNodes?.count as string) || 0,
        maintenance: parseInt(maintenanceNodes?.count as string) || 0,
        totalConnections: parseInt(totalConnections?.total as string) || 0,
        protocolDistribution: protocolDistribution.reduce((acc, curr) => {
          acc[curr.protocol] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>),
        regionDistribution: regionDistribution.reduce((acc, curr) => {
          acc[curr.region] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>),
        serviceTypeDistribution: serviceTypeDistribution.reduce((acc, curr) => {
          acc[curr.service_type || ServiceType.STANDARD] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>),
        premiumStats: {
          premium: premiumStats.find(p => p.is_premium === 1)?.count || 0,
          standard: premiumStats.find(p => p.is_premium === 0)?.count || 0
        },
        ipTypeDistribution: ipTypeDistribution.reduce((acc, curr) => {
          acc[curr.ip_type || IpType.DATACENTER] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>),
        lineTypeDistribution: lineTypeDistribution.reduce((acc, curr) => {
          acc[curr.line_type || LineType.STANDARD] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>),
        ipScoreDistribution: ipScoreStats.reduce((acc, curr) => {
          acc[curr.score_range] = parseInt(curr.count as string);
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/nodes/:id/sync - Sync node configuration to Xray
router.post('/:id/sync', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    // 获取节点配置
    const nodeConfig = JSON.parse(node.config || '{}');

    // 构建 Xray 入站配置
    const xrayClient = getXrayClient();
    const inboundConfig = buildInboundConfig(node, nodeConfig);

    // 添加/更新入站
    const success = await xrayClient.addInbound(inboundConfig);

    if (success) {
      logger.info(`Node ${node.code} synced to Xray`);
      res.json({
        success: true,
        code: 200,
        message: 'Node synced to Xray successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        code: 500,
        message: 'Failed to sync node to Xray'
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/nodes/reload - Hot reload all nodes configuration
router.post('/reload', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xrayClient = getXrayClient();

    // 获取所有在线节点
    const nodes = await db('nodes')
      .where('status', 'online')
      .select('*');

    // 构建入站配置
    const inbounds = nodes.map(node => {
      const nodeConfig = JSON.parse(node.config || '{}');
      return buildInboundConfig(node, nodeConfig);
    });

    // 热重载配置
    const success = await xrayClient.hotReloadConfig({ inbounds });

    if (success) {
      // 更新缓存
      const nodeCache = getNodeConfigCache();
      for (const node of nodes) {
        await nodeCache.setNodeConfig(node.id, {
          id: node.id,
          code: node.code,
          name: node.name,
          address: node.host,
          port: node.port,
          protocol: node.protocol,
          config: JSON.parse(node.config || '{}'),
          status: node.status,
          trafficLimit: node.traffic_limit || 0,
          trafficUsed: node.traffic_used || 0,
          updatedAt: new Date().toISOString(),
        });
      }

      logger.info(`All nodes configuration reloaded by ${req.user?.username || 'system'}`);
      res.json({
        success: true,
        code: 200,
        message: 'All nodes configuration reloaded successfully',
        data: {
          reloadedCount: nodes.length
        }
      });
    } else {
      res.status(500).json({
        success: false,
        code: 500,
        message: 'Failed to reload nodes configuration'
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/nodes/:id/config - Get node Xray configuration
router.get('/:id/config', authMiddleware, validate(NodeValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    const nodeConfig = JSON.parse(node.config || '{}');
    const inboundConfig = buildInboundConfig(node, nodeConfig);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        nodeId: node.id,
        code: node.code,
        xrayConfig: inboundConfig
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/nodes/:id/config - Update node Xray configuration
router.put('/:id/config', authMiddleware, validate(NodeValidation.updateConfig), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { config: newConfig } = req.body;

    const node = await db('nodes')
      .where('id', id)
      .orWhere('code', id)
      .first();

    if (!node) {
      throw new NotFoundError('Node', id);
    }

    // 更新数据库
    await db('nodes')
      .where('id', node.id)
      .update({
        config: JSON.stringify(newConfig),
        updated_at: new Date()
      });

    // 如果节点在线，同步到 Xray
    if (node.status === 'online') {
      const xrayClient = getXrayClient();
      const inboundConfig = buildInboundConfig(
        { ...node, config: JSON.stringify(newConfig) },
        newConfig
      );
      await xrayClient.addInbound(inboundConfig);
    }

    logger.info(`Node ${node.code} config updated by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Node configuration updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/nodes/xray/status - Get Xray service status
router.get('/xray/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const xrayClient = getXrayClient();

    const isConnected = await xrayClient.testConnection();
    const nodeStatus = isConnected ? await xrayClient.getNodeStatus() : null;
    const inbounds = isConnected ? await xrayClient.getInbounds() : [];

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        connected: isConnected,
        status: nodeStatus,
        inbounds: inbounds.map(inbound => ({
          tag: inbound.tag,
          protocol: inbound.protocol,
          port: inbound.port
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// 辅助函数：构建入站配置
function buildInboundConfig(node: any, nodeConfig: any): any {
  const baseConfig = {
    tag: `node-${node.code}`,
    port: node.port,
    protocol: node.protocol,
    settings: {},
    streamSettings: {},
    sniffing: {
      enabled: true,
      destOverride: ['http', 'tls']
    }
  };

  switch (node.protocol.toLowerCase()) {
    case 'vless':
      baseConfig.settings = {
        clients: [],
        decryption: 'none'
      };
      baseConfig.streamSettings = {
        network: nodeConfig.network || 'tcp',
        security: nodeConfig.security || 'none',
        ...(nodeConfig.security === 'reality' && {
          realitySettings: nodeConfig.realitySettings
        }),
        ...(nodeConfig.security === 'tls' && {
          tlsSettings: nodeConfig.tlsSettings
        }),
        ...(nodeConfig.network === 'ws' && {
          wsSettings: nodeConfig.wsSettings
        })
      };
      break;

    case 'vmess':
      baseConfig.settings = {
        clients: []
      };
      baseConfig.streamSettings = {
        network: nodeConfig.network || 'tcp',
        security: nodeConfig.security || 'none',
        ...(nodeConfig.security === 'tls' && {
          tlsSettings: nodeConfig.tlsSettings
        }),
        ...(nodeConfig.network === 'ws' && {
          wsSettings: nodeConfig.wsSettings
        })
      };
      break;

    case 'trojan':
      baseConfig.settings = {
        clients: []
      };
      baseConfig.streamSettings = {
        network: nodeConfig.network || 'tcp',
        security: 'tls',
        tlsSettings: nodeConfig.tlsSettings || {}
      };
      break;

    case 'shadowsocks':
      baseConfig.settings = {
        clients: [],
        method: nodeConfig.method || 'aes-256-gcm'
      };
      break;

    default:
      throw new Error(`Unsupported protocol: ${node.protocol}`);
  }

  return baseConfig;
}

export { router as nodeRoutes };
