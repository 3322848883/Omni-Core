/**
 * 缓存策略服务
 * 提供多级缓存策略和缓存管理功能
 */

import { getRedisClient } from './redis';
import { logger } from '../../utils/logger';

// 缓存层级
enum CacheLevel {
  MEMORY = 'memory',    // 内存缓存（最快）
  REDIS = 'redis',      // Redis缓存（分布式）
  DATABASE = 'database' // 数据库缓存（持久化）
}

// 缓存策略配置
interface CacheStrategyConfig {
  ttl: number;           // 缓存时间（秒）
  level: CacheLevel;     // 缓存层级
  staleWhileRevalidate?: number;  // 过期后仍可使用的时间（秒）
  tags?: string[];       // 缓存标签，用于批量失效
}

// 默认缓存策略
const DEFAULT_STRATEGIES: Record<string, CacheStrategyConfig> = {
  // IP声誉数据 - 24小时
  'ip:reputation': {
    ttl: 24 * 60 * 60,
    level: CacheLevel.REDIS,
    staleWhileRevalidate: 60 * 60, // 过期后1小时内仍可用
    tags: ['ip', 'reputation']
  },
  
  // IP池状态 - 5分钟
  'ip:pool:status': {
    ttl: 5 * 60,
    level: CacheLevel.REDIS,
    tags: ['ip', 'pool']
  },
  
  // 套餐列表 - 10分钟
  'plan:list': {
    ttl: 10 * 60,
    level: CacheLevel.REDIS,
    staleWhileRevalidate: 5 * 60,
    tags: ['plan', 'list']
  },
  
  // 套餐详情 - 15分钟
  'plan:detail': {
    ttl: 15 * 60,
    level: CacheLevel.REDIS,
    tags: ['plan', 'detail']
  },
  
  // 套餐统计 - 5分钟
  'plan:stats': {
    ttl: 5 * 60,
    level: CacheLevel.REDIS,
    tags: ['plan', 'stats']
  },
  
  // 节点列表 - 2分钟
  'node:list': {
    ttl: 2 * 60,
    level: CacheLevel.REDIS,
    tags: ['node', 'list']
  },
  
  // 服务类型统计 - 1分钟
  'service:stats': {
    ttl: 60,
    level: CacheLevel.REDIS,
    tags: ['service', 'stats']
  },
  
  // 用户订阅 - 5分钟
  'user:subscription': {
    ttl: 5 * 60,
    level: CacheLevel.REDIS,
    tags: ['user', 'subscription']
  },
  
  // 配置数据 - 1小时
  'config': {
    ttl: 60 * 60,
    level: CacheLevel.REDIS,
    staleWhileRevalidate: 10 * 60,
    tags: ['config']
  }
};

// 内存缓存存储
class MemoryCache {
  private cache = new Map<string, {
    value: any;
    expiresAt: number;
    tags: string[];
  }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number, tags: string[] = []): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deleteByTag(tag: string): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: number } {
    return {
      size: this.cache.size,
      keys: this.cache.size
    };
  }
}

// 缓存策略服务
export class CacheStrategyService {
  private memoryCache = new MemoryCache();
  private redisClient = getRedisClient();
  private strategies: Map<string, CacheStrategyConfig>;

  constructor(customStrategies?: Record<string, CacheStrategyConfig>) {
    this.strategies = new Map(Object.entries({
      ...DEFAULT_STRATEGIES,
      ...customStrategies
    }));
  }

  /**
   * 获取缓存
   * 按层级顺序查找：内存 -> Redis -> 数据库
   */
  async get<T>(key: string, strategyKey?: string): Promise<T | null> {
    const strategy = this.getStrategy(strategyKey || key);
    
    // 1. 尝试从内存缓存获取
    if (strategy.level === CacheLevel.MEMORY || strategy.level === CacheLevel.REDIS) {
      const memoryValue = this.memoryCache.get<T>(key);
      if (memoryValue !== null) {
        logger.debug(`Memory cache hit: ${key}`);
        return memoryValue;
      }
    }

    // 2. 尝试从Redis获取
    if (strategy.level === CacheLevel.REDIS) {
      try {
        const redisValue = await this.redisClient.getJSON<T>(key);
        if (redisValue !== null) {
          logger.debug(`Redis cache hit: ${key}`);
          // 回填内存缓存
          this.memoryCache.set(key, redisValue, strategy.ttl, strategy.tags);
          return redisValue;
        }
      } catch (error) {
        logger.error(`Redis cache get error: ${key}`, error);
      }
    }

    return null;
  }

  /**
   * 设置缓存
   * 根据策略设置到相应的缓存层级
   */
  async set<T>(
    key: string,
    value: T,
    strategyKey?: string,
    customTtl?: number
  ): Promise<void> {
    const strategy = this.getStrategy(strategyKey || key);
    const ttl = customTtl || strategy.ttl;

    // 1. 设置内存缓存
    if (strategy.level === CacheLevel.MEMORY || strategy.level === CacheLevel.REDIS) {
      this.memoryCache.set(key, value, ttl, strategy.tags);
    }

    // 2. 设置Redis缓存
    if (strategy.level === CacheLevel.REDIS) {
      try {
        await this.redisClient.setJSON(key, value, ttl);
        logger.debug(`Redis cache set: ${key}, TTL: ${ttl}s`);
      } catch (error) {
        logger.error(`Redis cache set error: ${key}`, error);
      }
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    // 删除内存缓存
    this.memoryCache.delete(key);

    // 删除Redis缓存
    try {
      await this.redisClient.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error: ${key}`, error);
    }
  }

  /**
   * 按标签删除缓存
   */
  async deleteByTag(tag: string): Promise<void> {
    // 删除内存缓存
    this.memoryCache.deleteByTag(tag);

    // 删除Redis缓存（使用标签扫描）
    try {
      const pattern = `*:${tag}:*`;
      await this.redisClient.delPattern(pattern);
      logger.debug(`Cache deleted by tag: ${tag}`);
    } catch (error) {
      logger.error(`Cache delete by tag error: ${tag}`, error);
    }
  }

  /**
   * 获取或设置缓存
   * 如果缓存不存在，执行获取函数并缓存结果
   */
  async getOrSet<T>(
    key: string,
    getter: () => Promise<T>,
    strategyKey?: string
  ): Promise<T> {
    // 尝试获取缓存
    const cached = await this.get<T>(key, strategyKey);
    if (cached !== null) {
      return cached;
    }

    // 执行获取函数
    const value = await getter();
    
    // 设置缓存
    await this.set(key, value, strategyKey);
    
    return value;
  }

  /**
   * 获取或设置缓存（带过期回源）
   * 即使缓存过期，也返回旧值并异步更新
   */
  async getOrSetStale<T>(
    key: string,
    getter: () => Promise<T>,
    strategyKey?: string
  ): Promise<T> {
    const strategy = this.getStrategy(strategyKey || key);
    
    // 尝试获取缓存
    const cached = await this.get<T>(key, strategyKey);
    
    if (cached !== null) {
      return cached;
    }

    // 如果没有缓存，必须等待获取
    const value = await getter();
    await this.set(key, value, strategyKey);
    return value;
  }

  /**
   * 预热缓存
   * 批量加载数据到缓存
   */
  async warmup<T>(
    keys: string[],
    getter: (key: string) => Promise<T>,
    strategyKey?: string
  ): Promise<void> {
    const batchSize = 10;
    
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (key) => {
          try {
            const value = await getter(key);
            await this.set(key, value, strategyKey);
          } catch (error) {
            logger.error(`Cache warmup error for key: ${key}`, error);
          }
        })
      );
    }

    logger.info(`Cache warmup completed: ${keys.length} keys`);
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    memory: { size: number; keys: number };
    strategies: number;
  } {
    return {
      memory: this.memoryCache.getStats(),
      strategies: this.strategies.size
    };
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      // 使用delPattern清除所有缓存
      await this.redisClient.delPattern('*');
      logger.info('All caches cleared');
    } catch (error) {
      logger.error('Cache clear error', error);
    }
  }

  /**
   * 获取策略配置
   */
  private getStrategy(key: string): CacheStrategyConfig {
    // 尝试精确匹配
    if (this.strategies.has(key)) {
      return this.strategies.get(key)!;
    }

    // 尝试前缀匹配
    for (const [pattern, strategy] of this.strategies.entries()) {
      if (key.startsWith(pattern) || pattern.includes('*') && this.matchPattern(key, pattern)) {
        return strategy;
      }
    }

    // 返回默认策略
    return {
      ttl: 5 * 60,
      level: CacheLevel.REDIS,
      tags: ['default']
    };
  }

  /**
   * 模式匹配
   */
  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  /**
   * 添加自定义策略
   */
  addStrategy(key: string, config: CacheStrategyConfig): void {
    this.strategies.set(key, config);
  }

  /**
   * 移除策略
   */
  removeStrategy(key: string): void {
    this.strategies.delete(key);
  }
}

// 单例实例
let cacheStrategyServiceInstance: CacheStrategyService | null = null;

export function getCacheStrategyService(): CacheStrategyService {
  if (!cacheStrategyServiceInstance) {
    cacheStrategyServiceInstance = new CacheStrategyService();
  }
  return cacheStrategyServiceInstance;
}

// 缓存装饰器
export function Cacheable(strategyKey: string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const service = getCacheStrategyService();

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      const cacheKey = `${strategyKey}:${JSON.stringify(args)}`;
      
      // 尝试获取缓存
      const cached = await service.get(cacheKey, strategyKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 设置缓存
      await service.set(cacheKey, result, strategyKey, ttl);
      
      return result;
    };

    return descriptor;
  };
}

// 缓存清除装饰器
export function CacheEvict(strategyKey: string, allEntries: boolean = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const service = getCacheStrategyService();

    descriptor.value = async function (...args: any[]) {
      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 清除缓存
      if (allEntries) {
        const strategy = service['getStrategy'](strategyKey);
        if (strategy.tags) {
          for (const tag of strategy.tags) {
            await service.deleteByTag(tag);
          }
        }
      } else {
        const cacheKey = `${strategyKey}:${JSON.stringify(args)}`;
        await service.delete(cacheKey);
      }
      
      return result;
    };

    return descriptor;
  };
}

export default CacheStrategyService;
