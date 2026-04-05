"use strict";
/**
 * 缓存策略服务
 * 提供多级缓存策略和缓存管理功能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheStrategyService = void 0;
exports.getCacheStrategyService = getCacheStrategyService;
exports.Cacheable = Cacheable;
exports.CacheEvict = CacheEvict;
const redis_1 = require("./redis");
const logger_1 = require("../../utils/logger");
// 缓存层级
var CacheLevel;
(function (CacheLevel) {
    CacheLevel["MEMORY"] = "memory";
    CacheLevel["REDIS"] = "redis";
    CacheLevel["DATABASE"] = "database"; // 数据库缓存（持久化）
})(CacheLevel || (CacheLevel = {}));
// 默认缓存策略
const DEFAULT_STRATEGIES = {
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
    cache = new Map();
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    set(key, value, ttlSeconds, tags = []) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
            tags
        });
    }
    delete(key) {
        this.cache.delete(key);
    }
    deleteByTag(tag) {
        for (const [key, item] of this.cache.entries()) {
            if (item.tags.includes(tag)) {
                this.cache.delete(key);
            }
        }
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        return {
            size: this.cache.size,
            keys: this.cache.size
        };
    }
}
// 缓存策略服务
class CacheStrategyService {
    memoryCache = new MemoryCache();
    redisClient = (0, redis_1.getRedisClient)();
    strategies;
    constructor(customStrategies) {
        this.strategies = new Map(Object.entries({
            ...DEFAULT_STRATEGIES,
            ...customStrategies
        }));
    }
    /**
     * 获取缓存
     * 按层级顺序查找：内存 -> Redis -> 数据库
     */
    async get(key, strategyKey) {
        const strategy = this.getStrategy(strategyKey || key);
        // 1. 尝试从内存缓存获取
        if (strategy.level === CacheLevel.MEMORY || strategy.level === CacheLevel.REDIS) {
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue !== null) {
                logger_1.logger.debug(`Memory cache hit: ${key}`);
                return memoryValue;
            }
        }
        // 2. 尝试从Redis获取
        if (strategy.level === CacheLevel.REDIS) {
            try {
                const redisValue = await this.redisClient.getJSON(key);
                if (redisValue !== null) {
                    logger_1.logger.debug(`Redis cache hit: ${key}`);
                    // 回填内存缓存
                    this.memoryCache.set(key, redisValue, strategy.ttl, strategy.tags);
                    return redisValue;
                }
            }
            catch (error) {
                logger_1.logger.error(`Redis cache get error: ${key}`, error);
            }
        }
        return null;
    }
    /**
     * 设置缓存
     * 根据策略设置到相应的缓存层级
     */
    async set(key, value, strategyKey, customTtl) {
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
                logger_1.logger.debug(`Redis cache set: ${key}, TTL: ${ttl}s`);
            }
            catch (error) {
                logger_1.logger.error(`Redis cache set error: ${key}`, error);
            }
        }
    }
    /**
     * 删除缓存
     */
    async delete(key) {
        // 删除内存缓存
        this.memoryCache.delete(key);
        // 删除Redis缓存
        try {
            await this.redisClient.del(key);
            logger_1.logger.debug(`Cache deleted: ${key}`);
        }
        catch (error) {
            logger_1.logger.error(`Cache delete error: ${key}`, error);
        }
    }
    /**
     * 按标签删除缓存
     */
    async deleteByTag(tag) {
        // 删除内存缓存
        this.memoryCache.deleteByTag(tag);
        // 删除Redis缓存（使用标签扫描）
        try {
            const pattern = `*:${tag}:*`;
            await this.redisClient.delPattern(pattern);
            logger_1.logger.debug(`Cache deleted by tag: ${tag}`);
        }
        catch (error) {
            logger_1.logger.error(`Cache delete by tag error: ${tag}`, error);
        }
    }
    /**
     * 获取或设置缓存
     * 如果缓存不存在，执行获取函数并缓存结果
     */
    async getOrSet(key, getter, strategyKey) {
        // 尝试获取缓存
        const cached = await this.get(key, strategyKey);
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
    async getOrSetStale(key, getter, strategyKey) {
        const strategy = this.getStrategy(strategyKey || key);
        // 尝试获取缓存
        const cached = await this.get(key, strategyKey);
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
    async warmup(keys, getter, strategyKey) {
        const batchSize = 10;
        for (let i = 0; i < keys.length; i += batchSize) {
            const batch = keys.slice(i, i + batchSize);
            await Promise.all(batch.map(async (key) => {
                try {
                    const value = await getter(key);
                    await this.set(key, value, strategyKey);
                }
                catch (error) {
                    logger_1.logger.error(`Cache warmup error for key: ${key}`, error);
                }
            }));
        }
        logger_1.logger.info(`Cache warmup completed: ${keys.length} keys`);
    }
    /**
     * 获取缓存统计
     */
    getStats() {
        return {
            memory: this.memoryCache.getStats(),
            strategies: this.strategies.size
        };
    }
    /**
     * 清空所有缓存
     */
    async clear() {
        this.memoryCache.clear();
        try {
            // 使用delPattern清除所有缓存
            await this.redisClient.delPattern('*');
            logger_1.logger.info('All caches cleared');
        }
        catch (error) {
            logger_1.logger.error('Cache clear error', error);
        }
    }
    /**
     * 获取策略配置
     */
    getStrategy(key) {
        // 尝试精确匹配
        if (this.strategies.has(key)) {
            return this.strategies.get(key);
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
    matchPattern(key, pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(key);
    }
    /**
     * 添加自定义策略
     */
    addStrategy(key, config) {
        this.strategies.set(key, config);
    }
    /**
     * 移除策略
     */
    removeStrategy(key) {
        this.strategies.delete(key);
    }
}
exports.CacheStrategyService = CacheStrategyService;
// 单例实例
let cacheStrategyServiceInstance = null;
function getCacheStrategyService() {
    if (!cacheStrategyServiceInstance) {
        cacheStrategyServiceInstance = new CacheStrategyService();
    }
    return cacheStrategyServiceInstance;
}
// 缓存装饰器
function Cacheable(strategyKey, ttl) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const service = getCacheStrategyService();
        descriptor.value = async function (...args) {
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
function CacheEvict(strategyKey, allEntries = false) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const service = getCacheStrategyService();
        descriptor.value = async function (...args) {
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
            }
            else {
                const cacheKey = `${strategyKey}:${JSON.stringify(args)}`;
                await service.delete(cacheKey);
            }
            return result;
        };
        return descriptor;
    };
}
exports.default = CacheStrategyService;
//# sourceMappingURL=cache-strategy.js.map