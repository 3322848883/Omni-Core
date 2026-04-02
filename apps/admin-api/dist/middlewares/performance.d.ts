/**
 * 性能优化中间件
 * API响应时间优化、请求压缩、缓存控制
 */
import { Request, Response, NextFunction } from 'express';
interface PerformanceConfig {
    slowQueryThreshold: number;
    enableLogging: boolean;
    cacheControl: {
        static: string;
        api: string;
        dynamic: string;
    };
}
/**
 * 请求计时中间件
 * 监控API响应时间并记录慢查询
 */
export declare function requestTimer(config?: Partial<PerformanceConfig>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 智能压缩中间件
 * 根据内容类型和大小决定是否压缩
 */
export declare function smartCompression(): any;
/**
 * 缓存控制中间件
 * 为不同类型的响应设置适当的缓存头
 */
export declare function cacheControl(type?: 'static' | 'api' | 'dynamic'): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 查询优化中间件
 * 自动优化常见查询模式
 */
export declare function queryOptimizer(req: Request, res: Response, next: NextFunction): void;
/**
 * 数据库查询优化器
 * 为常见查询添加优化提示
 */
export declare function dbQueryOptimizer(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 连接池监控中间件
 * 监控数据库连接池状态
 */
export declare function connectionPoolMonitor(req: Request, res: Response, next: NextFunction): void;
/**
 * 响应优化中间件
 * 优化响应格式和大小
 */
export declare function responseOptimizer(req: Request, res: Response, next: NextFunction): void;
/**
 * 批量操作优化器
 * 优化批量插入和更新操作
 */
export declare function batchOptimizer(batchSize?: number): {
    chunk: <T>(array: T[]) => T[][];
    batchInsert: <T>(table: string, records: T[], insertFn: (chunk: T[]) => Promise<any>) => Promise<{
        success: number;
        failed: number;
    }>;
};
/**
 * 性能报告生成器
 * 生成API性能报告
 */
export declare function generatePerformanceReport(): {
    timestamp: string;
    metrics: {
        totalRequests: number;
        slowQueries: number;
        averageResponseTime: number;
        cacheHitRate: number;
    };
};
declare const _default: {
    requestTimer: typeof requestTimer;
    smartCompression: typeof smartCompression;
    cacheControl: typeof cacheControl;
    queryOptimizer: typeof queryOptimizer;
    dbQueryOptimizer: typeof dbQueryOptimizer;
    connectionPoolMonitor: typeof connectionPoolMonitor;
    responseOptimizer: typeof responseOptimizer;
    batchOptimizer: typeof batchOptimizer;
    generatePerformanceReport: typeof generatePerformanceReport;
};
export default _default;
//# sourceMappingURL=performance.d.ts.map