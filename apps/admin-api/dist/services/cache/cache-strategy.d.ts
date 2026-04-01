/**
 * 缓存策略服务
 * 提供多级缓存策略和缓存管理功能
 */
declare enum CacheLevel {
    MEMORY = "memory",// 内存缓存（最快）
    REDIS = "redis",// Redis缓存（分布式）
    DATABASE = "database"
}
interface CacheStrategyConfig {
    ttl: number;
    level: CacheLevel;
    staleWhileRevalidate?: number;
    tags?: string[];
}
export declare class CacheStrategyService {
    private memoryCache;
    private redisClient;
    private strategies;
    constructor(customStrategies?: Record<string, CacheStrategyConfig>);
    /**
     * 获取缓存
     * 按层级顺序查找：内存 -> Redis -> 数据库
     */
    get<T>(key: string, strategyKey?: string): Promise<T | null>;
    /**
     * 设置缓存
     * 根据策略设置到相应的缓存层级
     */
    set<T>(key: string, value: T, strategyKey?: string, customTtl?: number): Promise<void>;
    /**
     * 删除缓存
     */
    delete(key: string): Promise<void>;
    /**
     * 按标签删除缓存
     */
    deleteByTag(tag: string): Promise<void>;
    /**
     * 获取或设置缓存
     * 如果缓存不存在，执行获取函数并缓存结果
     */
    getOrSet<T>(key: string, getter: () => Promise<T>, strategyKey?: string): Promise<T>;
    /**
     * 获取或设置缓存（带过期回源）
     * 即使缓存过期，也返回旧值并异步更新
     */
    getOrSetStale<T>(key: string, getter: () => Promise<T>, strategyKey?: string): Promise<T>;
    /**
     * 预热缓存
     * 批量加载数据到缓存
     */
    warmup<T>(keys: string[], getter: (key: string) => Promise<T>, strategyKey?: string): Promise<void>;
    /**
     * 获取缓存统计
     */
    getStats(): {
        memory: {
            size: number;
            keys: number;
        };
        strategies: number;
    };
    /**
     * 清空所有缓存
     */
    clear(): Promise<void>;
    /**
     * 获取策略配置
     */
    private getStrategy;
    /**
     * 模式匹配
     */
    private matchPattern;
    /**
     * 添加自定义策略
     */
    addStrategy(key: string, config: CacheStrategyConfig): void;
    /**
     * 移除策略
     */
    removeStrategy(key: string): void;
}
export declare function getCacheStrategyService(): CacheStrategyService;
export declare function Cacheable(strategyKey: string, ttl?: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function CacheEvict(strategyKey: string, allEntries?: boolean): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export default CacheStrategyService;
//# sourceMappingURL=cache-strategy.d.ts.map