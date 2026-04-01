import { getRedisClient, RedisClient } from './redis';
import { logger } from '../../utils/logger';

// 节点配置缓存类型
export interface CachedNodeConfig {
  id: string;
  code: string;
  name: string;
  address: string;
  port: number;
  protocol: string;
  config: any;
  status: string;
  trafficLimit: number;
  trafficUsed: number;
  updatedAt: string;
}

// 节点配置缓存服务
export class NodeConfigCache {
  private redis: RedisClient;
  private readonly KEY_PREFIX = 'node:config:';
  private readonly TTL_SECONDS = 1800; // 30分钟过期

  constructor(redis?: RedisClient) {
    this.redis = redis || getRedisClient();
  }

  // 生成缓存键
  private getKey(nodeId: string): string {
    return `${this.KEY_PREFIX}${nodeId}`;
  }

  // 缓存节点配置
  async setNodeConfig(nodeId: string, config: CachedNodeConfig): Promise<boolean> {
    try {
      const key = this.getKey(nodeId);
      const data = {
        ...config,
        updatedAt: new Date().toISOString(),
      };
      return await this.redis.setJSON(key, data, this.TTL_SECONDS);
    } catch (error) {
      logger.error(`Failed to cache node config for ${nodeId}:`, error);
      return false;
    }
  }

  // 获取节点配置
  async getNodeConfig(nodeId: string): Promise<CachedNodeConfig | null> {
    try {
      const key = this.getKey(nodeId);
      return await this.redis.getJSON<CachedNodeConfig>(key);
    } catch (error) {
      logger.error(`Failed to get cached node config for ${nodeId}:`, error);
      return null;
    }
  }

  // 删除节点配置缓存
  async deleteNodeConfig(nodeId: string): Promise<boolean> {
    try {
      const key = this.getKey(nodeId);
      return await this.redis.del(key);
    } catch (error) {
      logger.error(`Failed to delete node config cache for ${nodeId}:`, error);
      return false;
    }
  }

  // 批量缓存节点配置
  async batchSetNodeConfigs(configs: Array<{ nodeId: string; config: CachedNodeConfig }>): Promise<{
    success: string[];
    failed: string[];
  }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const { nodeId, config } of configs) {
      const result = await this.setNodeConfig(nodeId, config);
      if (result) {
        success.push(nodeId);
      } else {
        failed.push(nodeId);
      }
    }

    return { success, failed };
  }

  // 批量删除节点配置缓存
  async batchDeleteNodeConfigs(nodeIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const nodeId of nodeIds) {
      const result = await this.deleteNodeConfig(nodeId);
      if (result) {
        success.push(nodeId);
      } else {
        failed.push(nodeId);
      }
    }

    return { success, failed };
  }

  // 获取所有缓存的节点ID
  async getAllCachedNodeIds(): Promise<string[]> {
    try {
      const keys = await this.redis.keys(`${this.KEY_PREFIX}*`);
      return keys.map(key => key.replace(this.KEY_PREFIX, ''));
    } catch (error) {
      logger.error('Failed to get all cached node IDs:', error);
      return [];
    }
  }

  // 获取所有缓存的节点配置
  async getAllNodeConfigs(): Promise<CachedNodeConfig[]> {
    try {
      const nodeIds = await this.getAllCachedNodeIds();
      const configs: CachedNodeConfig[] = [];

      for (const nodeId of nodeIds) {
        const config = await this.getNodeConfig(nodeId);
        if (config) {
          configs.push(config);
        }
      }

      return configs;
    } catch (error) {
      logger.error('Failed to get all cached node configs:', error);
      return [];
    }
  }

  // 清空所有节点配置缓存
  async clearAllNodeConfigs(): Promise<boolean> {
    try {
      return await this.redis.delPattern(`${this.KEY_PREFIX}*`);
    } catch (error) {
      logger.error('Failed to clear all node config caches:', error);
      return false;
    }
  }

  // 更新节点状态
  async updateNodeStatus(nodeId: string, status: string): Promise<boolean> {
    try {
      const config = await this.getNodeConfig(nodeId);
      if (!config) {
        return false;
      }

      config.status = status;
      config.updatedAt = new Date().toISOString();
      return await this.setNodeConfig(nodeId, config);
    } catch (error) {
      logger.error(`Failed to update node status for ${nodeId}:`, error);
      return false;
    }
  }

  // 更新节点流量使用
  async updateNodeTraffic(nodeId: string, trafficUsed: number): Promise<boolean> {
    try {
      const config = await this.getNodeConfig(nodeId);
      if (!config) {
        return false;
      }

      config.trafficUsed = trafficUsed;
      config.updatedAt = new Date().toISOString();
      return await this.setNodeConfig(nodeId, config);
    } catch (error) {
      logger.error(`Failed to update node traffic for ${nodeId}:`, error);
      return false;
    }
  }

  // 检查节点配置是否存在
  async exists(nodeId: string): Promise<boolean> {
    try {
      const key = this.getKey(nodeId);
      return await this.redis.exists(key);
    } catch (error) {
      logger.error(`Failed to check node config existence for ${nodeId}:`, error);
      return false;
    }
  }

  // 获取缓存过期时间
  async getTTL(nodeId: string): Promise<number> {
    try {
      const key = this.getKey(nodeId);
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error(`Failed to get TTL for node ${nodeId}:`, error);
      return -2;
    }
  }

  // 延长缓存过期时间
  async extendTTL(nodeId: string, seconds: number): Promise<boolean> {
    try {
      const key = this.getKey(nodeId);
      return await this.redis.expire(key, seconds);
    } catch (error) {
      logger.error(`Failed to extend TTL for node ${nodeId}:`, error);
      return false;
    }
  }

  // 根据协议获取节点
  async getNodesByProtocol(protocol: string): Promise<CachedNodeConfig[]> {
    try {
      const allConfigs = await this.getAllNodeConfigs();
      return allConfigs.filter(config => config.protocol === protocol);
    } catch (error) {
      logger.error(`Failed to get nodes by protocol ${protocol}:`, error);
      return [];
    }
  }

  // 根据状态获取节点
  async getNodesByStatus(status: string): Promise<CachedNodeConfig[]> {
    try {
      const allConfigs = await this.getAllNodeConfigs();
      return allConfigs.filter(config => config.status === status);
    } catch (error) {
      logger.error(`Failed to get nodes by status ${status}:`, error);
      return [];
    }
  }
}

// 单例实例
let nodeConfigCacheInstance: NodeConfigCache | null = null;

export function getNodeConfigCache(redis?: RedisClient): NodeConfigCache {
  if (!nodeConfigCacheInstance) {
    nodeConfigCacheInstance = new NodeConfigCache(redis);
  }
  return nodeConfigCacheInstance;
}

export default NodeConfigCache;
