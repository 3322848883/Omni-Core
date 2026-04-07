import db from '@/config/database';
import { Node, NodeConnectionConfig, ConnectionTestResult } from '@/types/user';
import { NotFoundError, ForbiddenError } from '@/errors/AppError';
import logger from '@/utils/logger';
import { ServiceType, ServiceTypeMeta } from '@/constants/service-type';
import { nodeFilterService } from './nodeFilterService';
import {
  IpType,
  LineType,
  IpTypeMeta,
  LineTypeMeta
} from '@/constants/ip-type';

/**
 * Node Service - 处理节点相关的业务逻辑
 */
export class NodeService {
  /**
   * 获取节点列表
   * @param region - 可选的区域筛选
   * @param userId - 可选的用户ID，用于过滤用户有权限访问的节点
   * @returns 节点列表
   */
  async getNodes(region?: string, userId?: string): Promise<Node[]> {
    try {
      let query = db('nodes')
        .where('status', 'online')
        .orderBy('priority', 'desc')
        .orderBy('health_score', 'desc');

      if (region) {
        query = query.where({ region });
      }

      const nodes = await query.select(
        'id',
        'code',
        'name',
        'region',
        'country',
        'city',
        'latitude',
        'longitude',
        'host',
        'port',
        'protocol',
        'status',
        'health_score as healthScore',
        'load_percent as loadPercent',
        'active_connections as activeConnections',
        'max_connections as maxConnections',
        'priority',
        'is_backup as isBackup',
        'service_type as serviceType',
        // IP资产管理新字段
        'ip_type as ipType',
        'line_type as lineType',
        'isp_name as ispName',
        'ip_score as ipScore',
        'supports_ipv6 as supportsIPv6'
      );

      // 如果提供了用户ID，根据用户服务类型过滤节点
      if (userId) {
        const userServiceTypes = await nodeFilterService.getUserEffectiveServiceTypes(userId);
        let filteredNodes = nodeFilterService.filterNodesByUserServiceTypes(
          nodes as Node[],
          userServiceTypes
        );

        // 获取用户订阅信息以进行IP类型和线路类型过滤
        const userSubscription = await this.getUserSubscriptionInfo(userId);
        if (userSubscription) {
          filteredNodes = this.filterNodesBySubscription(
            filteredNodes,
            userSubscription
          );
        }

        return filteredNodes.map(node => this.enhanceNodeInfo(node));
      }

      return nodes.map(node => this.enhanceNodeInfo(node as Node));
    } catch (error) {
      logger.error('Failed to get nodes:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取节点详情
   * @param nodeId - 节点ID
   * @param userId - 可选的用户ID，用于权限检查
   * @returns 节点详情
   */
  async getNodeById(nodeId: string, userId?: string): Promise<Node> {
    try {
      const node = await db('nodes')
        .where({ id: nodeId })
        .first(
          'id',
          'code',
          'name',
          'region',
          'country',
          'city',
          'latitude',
          'longitude',
          'host',
          'port',
          'protocol',
          'status',
          'health_score as healthScore',
          'load_percent as loadPercent',
          'active_connections as activeConnections',
          'max_connections as maxConnections',
          'priority',
          'is_backup as isBackup',
          'service_type as serviceType',
          // IP资产管理新字段
          'ip_type as ipType',
          'line_type as lineType',
          'isp_name as ispName',
          'ip_score as ipScore',
          'supports_ipv6 as supportsIPv6'
        );

      if (!node) {
        throw new NotFoundError('Node', nodeId);
      }

      // 如果提供了用户ID，检查访问权限
      if (userId) {
        const accessCheck = await this.checkNodeAccess(nodeId, userId);
        if (!accessCheck.allowed) {
          throw new ForbiddenError(accessCheck.reason || '无权访问该节点');
        }
      }

      return this.enhanceNodeInfo(node as Node);
    } catch (error) {
      logger.error(`Failed to get node ${nodeId}:`, error);
      throw error;
    }
  }

  /**
   * 生成节点配置
   * @param nodeId - 节点ID
   * @param userId - 用户ID
   * @returns 节点连接配置
   */
  async generateNodeConfig(nodeId: string, userId: string): Promise<NodeConnectionConfig> {
    try {
      // 检查用户是否有权限访问该节点
      const accessCheck = await this.checkNodeAccess(nodeId, userId);
      if (!accessCheck.allowed) {
        throw new ForbiddenError(accessCheck.reason || '无权访问该节点');
      }

      // 获取节点信息
      const node = await this.getNodeById(nodeId);

      // 获取用户信息
      const user = await db('users')
        .where({ user_id: userId })
        .first('vpn_uuid as vpnUuid');

      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // 构建增强的节点名称
      const enhancedName = this.buildNodeDisplayName(node);

      // 构建配置
      const config: Record<string, unknown> = {
        v: '2',
        ps: enhancedName,
        add: node.host,
        port: node.port.toString(),
        id: user.vpnUuid,
        aid: '0',
        scy: 'auto',
        net: 'tcp',
        type: 'none',
        host: '',
        path: '',
        tls: 'none',
        sni: '',
      };

      // 根据协议类型调整配置
      if (node.protocol === 'vmess') {
        config.net = 'ws';
        config.path = '/ws';
      } else if (node.protocol === 'vless') {
        config.flow = 'xtls-rprx-vision';
        config.tls = 'tls';
      }

      // 生成配置URL
      const configString = Buffer.from(JSON.stringify(config)).toString('base64');
      const url = `${node.protocol}://${configString}`;

      return {
        id: node.id,
        name: enhancedName,
        protocol: node.protocol,
        host: node.host || '',
        port: node.port,
        config,
        url,
      };
    } catch (error) {
      logger.error(`Failed to generate config for node ${nodeId}:`, error);
      throw error;
    }
  }

  /**
   * 测试节点连接
   * @param nodeId - 节点ID
   * @returns 连接测试结果
   */
  async testNodeConnection(nodeId: string): Promise<ConnectionTestResult> {
    try {
      const node = await this.getNodeById(nodeId);

      // 模拟连接测试（实际实现中应该使用真实的网络测试）
      const startTime = Date.now();

      // 这里可以实现真实的连接测试逻辑
      // 例如：尝试建立 TCP 连接或发送探测请求
      const isReachable = await this.checkNodeReachability(node);

      const latency = Date.now() - startTime;

      return {
        nodeId: node.id,
        success: isReachable,
        latency: isReachable ? latency : -1,
        message: isReachable
          ? `Connection successful, latency: ${latency}ms`
          : 'Connection failed',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to test connection for node ${nodeId}:`, error);
      return {
        nodeId,
        success: false,
        latency: -1,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * 检查节点访问权限（私有方法）
   * @param nodeId - 节点ID
   * @param userId - 用户ID
   * @returns 访问检查结果
   */
  private async checkNodeAccess(
    nodeId: string,
    userId: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    currentTypes?: ServiceType[];
    requiredType?: ServiceType;
  }> {
    return await nodeFilterService.checkUserNodeAccess(nodeId, userId);
  }

  /**
   * 获取用户可访问的节点数量统计
   * @param userId - 用户ID
   * @returns 可访问节点统计
   */
  async getAccessibleNodeCount(userId: string): Promise<{
    total: number;
    byType: Record<ServiceType, number>;
  }> {
    return await nodeFilterService.getAccessibleNodeCount(userId);
  }

  /**
   * 获取节点的服务类型标签
   * @param serviceType - 服务类型
   * @returns 服务类型标签
   */
  getServiceTypeLabel(serviceType?: string): string {
    const type = (serviceType as ServiceType) || ServiceType.VPN_BASIC;
    return ServiceTypeMeta[type]?.label || type;
  }

  /**
   * 获取节点的服务类型颜色
   * @param serviceType - 服务类型
   * @returns 服务类型颜色
   */
  getServiceTypeColor(serviceType?: string): string {
    const type = (serviceType as ServiceType) || ServiceType.VPN_BASIC;
    return ServiceTypeMeta[type]?.color || '#666666';
  }

  /**
   * 获取用户订阅信息
   * @param userId - 用户ID
   * @returns 订阅信息
   */
  private async getUserSubscriptionInfo(userId: string): Promise<{
    allowedIpTypes?: string[];
    allowedLineTypes?: string[];
    minIpScore?: number;
  } | null> {
    try {
      const subscription = await db('user_subscriptions')
        .join('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.id')
        .where('user_subscriptions.user_id', userId)
        .where('user_subscriptions.status', 'active')
        .where('user_subscriptions.end_date', '>', db.fn.now())
        .first(
          'subscription_plans.allowed_ip_types as allowedIpTypes',
          'subscription_plans.allowed_line_types as allowedLineTypes',
          'subscription_plans.min_ip_score as minIpScore'
        );

      if (!subscription) {
        return null;
      }

      return {
        allowedIpTypes: subscription.allowedIpTypes ? JSON.parse(subscription.allowedIpTypes) : undefined,
        allowedLineTypes: subscription.allowedLineTypes ? JSON.parse(subscription.allowedLineTypes) : undefined,
        minIpScore: subscription.minIpScore
      };
    } catch (error) {
      logger.error(`Failed to get user subscription info for ${userId}:`, error);
      return null;
    }
  }

  /**
   * 根据订阅信息过滤节点
   * @param nodes - 节点列表
   * @param subscription - 订阅信息
   * @returns 过滤后的节点列表
   */
  private filterNodesBySubscription(
    nodes: Node[],
    subscription: {
      allowedIpTypes?: string[];
      allowedLineTypes?: string[];
      minIpScore?: number;
    }
  ): Node[] {
    return nodes.filter(node => {
      // 检查IP类型权限
      if (subscription.allowedIpTypes && subscription.allowedIpTypes.length > 0) {
        if (!node.ipType || !subscription.allowedIpTypes.includes(node.ipType)) {
          return false;
        }
      }

      // 检查线路类型权限
      if (subscription.allowedLineTypes && subscription.allowedLineTypes.length > 0) {
        if (!node.lineType || !subscription.allowedLineTypes.includes(node.lineType)) {
          return false;
        }
      }

      // 检查IP评分要求
      if (subscription.minIpScore !== undefined && subscription.minIpScore !== null) {
        if (node.ipScore !== undefined && node.ipScore !== null && node.ipScore < subscription.minIpScore) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 增强节点信息（添加标签、颜色等）
   * @param node - 原始节点数据
   * @returns 增强后的节点
   */
  private enhanceNodeInfo(node: Node): Node {
    const enhanced = { ...node };

    // 添加服务类型标签和颜色
    enhanced.serviceType = node.serviceType || ServiceType.VPN_BASIC;

    // 添加IP类型标签
    if (node.ipType) {
      enhanced.ipTypeLabel = IpTypeMeta[node.ipType as IpType]?.label || node.ipType;
    }

    // 添加线路类型标签
    if (node.lineType) {
      enhanced.lineTypeLabel = LineTypeMeta[node.lineType as LineType]?.label || node.lineType;
    }

    return enhanced;
  }

  /**
   * 构建节点显示名称
   * 格式: "地区 [ISP] [IP类型] [线路类型]"
   * 示例: "美国加州 [AT&T] [静态住宅] [IEPL]"
   * @param node - 节点信息
   * @returns 增强的节点名称
   */
  private buildNodeDisplayName(node: Node): string {
    const parts: string[] = [node.name];

    // 添加ISP
    if (node.ispName) {
      parts.push(`[${node.ispName}]`);
    }

    // 添加IP类型
    if (node.ipType && node.ipType !== IpType.DATACENTER) {
      const ipTypeLabel = IpTypeMeta[node.ipType as IpType]?.label || node.ipType;
      parts.push(`[${ipTypeLabel}]`);
    }

    // 添加线路类型
    if (node.lineType && node.lineType !== LineType.STANDARD) {
      const lineTypeLabel = LineTypeMeta[node.lineType as LineType]?.label || node.lineType;
      parts.push(`[${lineTypeLabel}]`);
    }

    return parts.join(' ');
  }

  /**
   * 检查节点是否可达（私有方法）
   * @param node - 节点信息
   * @returns 是否可达
   */
  private async checkNodeReachability(node: Node): Promise<boolean> {
    // 简化实现：根据节点健康分数判断
    // 实际生产环境应该实现真实的网络探测
    if (node.status !== 'active') {
      return false;
    }

    if (node.healthScore !== undefined && node.healthScore < 30) {
      return false;
    }

    // 模拟网络延迟测试
    await this.simulateNetworkDelay();

    return true;
  }

  /**
   * 模拟网络延迟
   */
  private async simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 100 + 50);
    });
  }
}

// 导出单例实例
export const nodeService = new NodeService();
