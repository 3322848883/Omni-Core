import { getRedisClient, RedisClient } from './redis';
import { logger } from '../../utils/logger';

// 用户配置缓存类型
export interface CachedUserConfig {
  userId: string;
  email: string;
  uuid: string;
  subscriptionPlan: string;
  trafficLimit: number;
  trafficUsed: number;
  expiresAt: string;
  status: number;
  nodes: Array<{
    nodeId: string;
    code: string;
    protocol: string;
    config: any;
  }>;
  updatedAt: string;
}

// 用户配置缓存服务
export class UserConfigCache {
  private redis: RedisClient;
  private readonly KEY_PREFIX = 'user:config:';
  private readonly TTL_SECONDS = 3600; // 1小时过期

  constructor(redis?: RedisClient) {
    this.redis = redis || getRedisClient();
  }

  // 生成缓存键
  private getKey(userId: string): string {
    return `${this.KEY_PREFIX}${userId}`;
  }

  // 缓存用户配置
  async setUserConfig(userId: string, config: CachedUserConfig): Promise<boolean> {
    try {
      const key = this.getKey(userId);
      const data = {
        ...config,
        updatedAt: new Date().toISOString(),
      };
      return await this.redis.setJSON(key, data, this.TTL_SECONDS);
    } catch (error) {
      logger.error(`Failed to cache user config for ${userId}:`, error);
      return false;
    }
  }

  // 获取用户配置
  async getUserConfig(userId: string): Promise<CachedUserConfig | null> {
    try {
      const key = this.getKey(userId);
      return await this.redis.getJSON<CachedUserConfig>(key);
    } catch (error) {
      logger.error(`Failed to get cached user config for ${userId}:`, error);
      return null;
    }
  }

  // 删除用户配置缓存
  async deleteUserConfig(userId: string): Promise<boolean> {
    try {
      const key = this.getKey(userId);
      return await this.redis.del(key);
    } catch (error) {
      logger.error(`Failed to delete user config cache for ${userId}:`, error);
      return false;
    }
  }

  // 批量缓存用户配置
  async batchSetUserConfigs(configs: Array<{ userId: string; config: CachedUserConfig }>): Promise<{
    success: string[];
    failed: string[];
  }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const { userId, config } of configs) {
      const result = await this.setUserConfig(userId, config);
      if (result) {
        success.push(userId);
      } else {
        failed.push(userId);
      }
    }

    return { success, failed };
  }

  // 批量删除用户配置缓存
  async batchDeleteUserConfigs(userIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const userId of userIds) {
      const result = await this.deleteUserConfig(userId);
      if (result) {
        success.push(userId);
      } else {
        failed.push(userId);
      }
    }

    return { success, failed };
  }

  // 获取所有缓存的用户ID
  async getAllCachedUserIds(): Promise<string[]> {
    try {
      const keys = await this.redis.keys(`${this.KEY_PREFIX}*`);
      return keys.map(key => key.replace(this.KEY_PREFIX, ''));
    } catch (error) {
      logger.error('Failed to get all cached user IDs:', error);
      return [];
    }
  }

  // 清空所有用户配置缓存
  async clearAllUserConfigs(): Promise<boolean> {
    try {
      return await this.redis.delPattern(`${this.KEY_PREFIX}*`);
    } catch (error) {
      logger.error('Failed to clear all user config caches:', error);
      return false;
    }
  }

  // 更新用户流量使用
  async updateUserTraffic(userId: string, trafficUsed: number): Promise<boolean> {
    try {
      const config = await this.getUserConfig(userId);
      if (!config) {
        return false;
      }

      config.trafficUsed = trafficUsed;
      config.updatedAt = new Date().toISOString();
      return await this.setUserConfig(userId, config);
    } catch (error) {
      logger.error(`Failed to update user traffic for ${userId}:`, error);
      return false;
    }
  }

  // 检查用户配置是否存在
  async exists(userId: string): Promise<boolean> {
    try {
      const key = this.getKey(userId);
      return await this.redis.exists(key);
    } catch (error) {
      logger.error(`Failed to check user config existence for ${userId}:`, error);
      return false;
    }
  }

  // 获取缓存过期时间
  async getTTL(userId: string): Promise<number> {
    try {
      const key = this.getKey(userId);
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error(`Failed to get TTL for user ${userId}:`, error);
      return -2;
    }
  }

  // 延长缓存过期时间
  async extendTTL(userId: string, seconds: number): Promise<boolean> {
    try {
      const key = this.getKey(userId);
      return await this.redis.expire(key, seconds);
    } catch (error) {
      logger.error(`Failed to extend TTL for user ${userId}:`, error);
      return false;
    }
  }
}

// 单例实例
let userConfigCacheInstance: UserConfigCache | null = null;

export function getUserConfigCache(redis?: RedisClient): UserConfigCache {
  if (!userConfigCacheInstance) {
    userConfigCacheInstance = new UserConfigCache(redis);
  }
  return userConfigCacheInstance;
}

export default UserConfigCache;
