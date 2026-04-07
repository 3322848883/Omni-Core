import db from '@/config/database';
import { ServiceType, ServiceTypeMeta } from '@/constants/service-type';
import { AccessCheckResult } from '@/types/service-type';
import logger from '@/utils/logger';

/**
 * 节点过滤服务
 * 负责根据用户服务类型过滤节点和检查访问权限
 */
export class NodeFilterService {
  /**
   * 根据用户服务类型过滤节点
   * @param nodes - 节点列表
   * @param userServiceTypes - 用户有效的服务类型列表
   * @returns 过滤后的节点列表
   */
  filterNodesByUserServiceTypes<T extends { serviceType?: string }>(
    nodes: T[],
    userServiceTypes: ServiceType[]
  ): T[] {
    if (!userServiceTypes || userServiceTypes.length === 0) {
      return [];
    }

    return nodes.filter((node) => {
      // 如果节点没有服务类型，默认为标准类型
      const nodeServiceType = (node.serviceType as ServiceType) || ServiceType.VPN_BASIC;
      return userServiceTypes.includes(nodeServiceType);
    });
  }

  /**
   * 检查用户是否有权限访问节点
   * @param nodeServiceType - 节点服务类型
   * @param userServiceTypes - 用户有效的服务类型列表
   * @returns 访问检查结果
   */
  checkNodeAccess(
    nodeServiceType: ServiceType | string | undefined,
    userServiceTypes: ServiceType[]
  ): AccessCheckResult {
    if (!userServiceTypes || userServiceTypes.length === 0) {
      return {
        allowed: false,
        reason: '用户没有有效的服务类型订阅',
        currentTypes: [],
        requiredType: (nodeServiceType as ServiceType) || ServiceType.VPN_BASIC,
      };
    }

    // 如果节点没有服务类型，默认为标准类型
    const requiredType = (nodeServiceType as ServiceType) || ServiceType.VPN_BASIC;

    if (!userServiceTypes.includes(requiredType)) {
      return {
        allowed: false,
        reason: `需要 ${ServiceTypeMeta[requiredType]?.label || requiredType} 服务类型权限`,
        currentTypes: userServiceTypes,
        requiredType,
      };
    }

    return {
      allowed: true,
      currentTypes: userServiceTypes,
      requiredType,
    };
  }

  /**
   * 获取用户有效的服务类型列表
   * @param userId - 用户ID
   * @returns 用户有效的服务类型列表
   */
  async getUserEffectiveServiceTypes(userId: string): Promise<ServiceType[]> {
    try {
      // 从用户表中获取 effective_service_types
      const user = await db('users')
        .where({ user_id: userId })
        .first('effective_service_types');

      if (!user || !user.effective_service_types) {
        // 如果没有设置，返回默认的标准类型
        return [ServiceType.VPN_BASIC];
      }

      // 解析服务类型（可能是 JSON 字符串或数组）
      let serviceTypes: ServiceType[];
      if (typeof user.effective_service_types === 'string') {
        try {
          serviceTypes = JSON.parse(user.effective_service_types);
        } catch {
          serviceTypes = [user.effective_service_types as ServiceType];
        }
      } else if (Array.isArray(user.effective_service_types)) {
        serviceTypes = user.effective_service_types;
      } else {
        serviceTypes = [ServiceType.VPN_BASIC];
      }

      // 验证服务类型是否有效
      const validTypes = Object.values(ServiceType);
      return serviceTypes.filter((type) => validTypes.includes(type));
    } catch (error) {
      logger.error(`Failed to get user effective service types for ${userId}:`, error);
      return [ServiceType.VPN_BASIC];
    }
  }

  /**
   * 获取用户可访问的节点数量统计
   * @param userId - 用户ID
   * @returns 各服务类型的可访问节点数量
   */
  async getAccessibleNodeCount(userId: string): Promise<{
    total: number;
    byType: Record<ServiceType, number>;
  }> {
    try {
      const userServiceTypes = await this.getUserEffectiveServiceTypes(userId);

      // 获取所有活跃节点
      const nodes = await db('nodes')
        .where('status', 'online')
        .select('service_type');

      // 统计各服务类型的节点数量
      const byType: Record<ServiceType, number> = {
        [ServiceType.VPN_BASIC]: 0,
        [ServiceType.VPN_PREMIUM]: 0,
        [ServiceType.VPN_ENTERPRISE]: 0,
        [ServiceType.DEDICATED_LINE]: 0,
        [ServiceType.CN2_LINE]: 0,
        [ServiceType.IEPL_LINE]: 0,
        [ServiceType.IPLC_LINE]: 0,
        [ServiceType.STATIC_IP]: 0,
        [ServiceType.RESIDENTIAL_STATIC]: 0,
        [ServiceType.DYNAMIC_IP]: 0,
        [ServiceType.RESIDENTIAL_DYNAMIC]: 0,
        [ServiceType.CUSTOM]: 0,
        [ServiceType.TRIAL]: 0,
      };

      let total = 0;

      for (const node of nodes) {
        const nodeServiceType = (node.service_type as ServiceType) || ServiceType.VPN_BASIC;

        // 只统计用户有权限访问的节点
        if (userServiceTypes.includes(nodeServiceType)) {
          byType[nodeServiceType] = (byType[nodeServiceType] || 0) + 1;
          total++;
        }
      }

      return { total, byType };
    } catch (error) {
      logger.error(`Failed to get accessible node count for ${userId}:`, error);
      return {
        total: 0,
        byType: {
          [ServiceType.VPN_BASIC]: 0,
          [ServiceType.VPN_PREMIUM]: 0,
          [ServiceType.VPN_ENTERPRISE]: 0,
          [ServiceType.DEDICATED_LINE]: 0,
          [ServiceType.CN2_LINE]: 0,
          [ServiceType.IEPL_LINE]: 0,
          [ServiceType.IPLC_LINE]: 0,
          [ServiceType.STATIC_IP]: 0,
          [ServiceType.RESIDENTIAL_STATIC]: 0,
          [ServiceType.DYNAMIC_IP]: 0,
          [ServiceType.RESIDENTIAL_DYNAMIC]: 0,
          [ServiceType.CUSTOM]: 0,
          [ServiceType.TRIAL]: 0,
        },
      };
    }
  }

  /**
   * 检查用户是否有权限访问指定节点
   * @param nodeId - 节点ID
   * @param userId - 用户ID
   * @returns 是否有权限访问
   */
  async checkUserNodeAccess(nodeId: string, userId: string): Promise<AccessCheckResult> {
    try {
      // 获取节点服务类型
      const node = await db('nodes')
        .where({ id: nodeId })
        .first('service_type');

      if (!node) {
        return {
          allowed: false,
          reason: '节点不存在',
        };
      }

      // 获取用户服务类型
      const userServiceTypes = await this.getUserEffectiveServiceTypes(userId);

      return this.checkNodeAccess(node.service_type, userServiceTypes);
    } catch (error) {
      logger.error(`Failed to check node access for ${nodeId}, user ${userId}:`, error);
      return {
        allowed: false,
        reason: '权限检查失败',
      };
    }
  }
}

// 导出单例实例
export const nodeFilterService = new NodeFilterService();
