"use strict";
/**
 * 性能优化中间件
 * API响应时间优化、请求压缩、缓存控制
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimer = requestTimer;
exports.smartCompression = smartCompression;
exports.cacheControl = cacheControl;
exports.queryOptimizer = queryOptimizer;
exports.dbQueryOptimizer = dbQueryOptimizer;
exports.connectionPoolMonitor = connectionPoolMonitor;
exports.responseOptimizer = responseOptimizer;
exports.batchOptimizer = batchOptimizer;
exports.generatePerformanceReport = generatePerformanceReport;
const compression_1 = __importDefault(require("compression"));
const logger_1 = require("../utils/logger");
const defaultConfig = {
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '200'),
    enableLogging: process.env.ENABLE_PERF_LOG === 'true',
    cacheControl: {
        static: 'public, max-age=31536000, immutable', // 1年
        api: 'private, no-cache', // 不缓存
        dynamic: 'private, max-age=60' // 1分钟
    }
};
/**
 * 请求计时中间件
 * 监控API响应时间并记录慢查询
 */
function requestTimer(config = {}) {
    const perfConfig = { ...defaultConfig, ...config };
    return (req, res, next) => {
        const start = Date.now();
        const requestId = req.headers['x-request-id'] || `req_${start}_${Math.random().toString(36).substr(2, 9)}`;
        // 将请求ID附加到请求对象
        req.requestId = requestId;
        // 响应完成时计算耗时
        res.on('finish', () => {
            const duration = Date.now() - start;
            const isSlow = duration > perfConfig.slowQueryThreshold;
            // 记录性能指标
            const perfData = {
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                isSlow,
                userAgent: req.get('user-agent'),
                ip: req.ip
            };
            if (isSlow && perfConfig.enableLogging) {
                logger_1.logger.warn('Slow query detected', perfData);
            }
            else if (perfConfig.enableLogging) {
                logger_1.logger.debug('Request completed', perfData);
            }
            // 设置性能响应头
            res.setHeader('X-Response-Time', `${duration}ms`);
            res.setHeader('X-Request-ID', requestId);
        });
        next();
    };
}
/**
 * 智能压缩中间件
 * 根据内容类型和大小决定是否压缩
 */
function smartCompression() {
    return (0, compression_1.default)({
        // 只压缩大于1KB的响应
        threshold: 1024,
        // 压缩级别（1-9，9压缩率最高但最慢）
        level: 6,
        // 过滤器：决定哪些响应需要压缩
        filter: (req, res) => {
            const contentType = res.getHeader('Content-Type');
            // 不压缩已经压缩的内容
            if (contentType?.includes('gzip') || contentType?.includes('br')) {
                return false;
            }
            // 不压缩小图片
            if (contentType?.includes('image/') && !contentType?.includes('svg')) {
                return false;
            }
            // 压缩JSON、HTML、CSS、JS、SVG
            if (contentType?.includes('json') ||
                contentType?.includes('html') ||
                contentType?.includes('css') ||
                contentType?.includes('javascript') ||
                contentType?.includes('svg')) {
                return true;
            }
            // 默认不压缩
            return false;
        }
    });
}
/**
 * 缓存控制中间件
 * 为不同类型的响应设置适当的缓存头
 */
function cacheControl(type = 'api') {
    return (req, res, next) => {
        const cacheValue = defaultConfig.cacheControl[type];
        res.setHeader('Cache-Control', cacheValue);
        // API响应添加额外的缓存控制头
        if (type === 'api') {
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        next();
    };
}
/**
 * 查询优化中间件
 * 自动优化常见查询模式
 */
function queryOptimizer(req, res, next) {
    // 限制最大返回记录数
    const maxLimit = 100;
    if (req.query.limit) {
        const limit = parseInt(req.query.limit);
        if (limit > maxLimit) {
            req.query.limit = maxLimit.toString();
        }
    }
    // 默认分页
    if (!req.query.page) {
        req.query.page = '1';
    }
    if (!req.query.limit) {
        req.query.limit = '20';
    }
    // 验证分页参数
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    if (isNaN(page) || page < 1) {
        req.query.page = '1';
    }
    if (isNaN(limit) || limit < 1) {
        req.query.limit = '20';
    }
    next();
}
/**
 * 数据库查询优化器
 * 为常见查询添加优化提示
 */
function dbQueryOptimizer() {
    return (req, res, next) => {
        // 将优化器附加到请求对象
        req.dbOptimizer = {
            // 建议使用的索引
            suggestedIndexes: [],
            // 查询提示
            queryHints: {
                useIndex: true,
                avoidFullScan: true,
                preferCoveringIndex: true
            },
            // 添加索引建议
            suggestIndex: (table, columns) => {
                req.dbOptimizer.suggestedIndexes.push({
                    table,
                    columns,
                    timestamp: new Date()
                });
            },
            // 记录查询计划
            logQueryPlan: (table, plan) => {
                if (defaultConfig.enableLogging) {
                    logger_1.logger.debug('Query plan', { table, plan, requestId: req.requestId });
                }
            }
        };
        next();
    };
}
/**
 * 连接池监控中间件
 * 监控数据库连接池状态
 */
function connectionPoolMonitor(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        // 如果响应时间异常长，可能是连接池问题
        if (duration > defaultConfig.slowQueryThreshold * 2) {
            logger_1.logger.warn('Potential connection pool issue', {
                requestId: req.requestId,
                duration,
                path: req.path,
                method: req.method
            });
        }
    });
    next();
}
/**
 * 响应优化中间件
 * 优化响应格式和大小
 */
function responseOptimizer(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
        // 优化响应数据
        const optimizedData = optimizeResponseData(data);
        // 添加响应元数据
        if (typeof optimizedData === 'object' && optimizedData !== null) {
            optimizedData._meta = {
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            };
        }
        return originalJson(optimizedData);
    };
    next();
}
/**
 * 优化响应数据
 * 移除不必要的字段，压缩数据
 */
function optimizeResponseData(data) {
    if (Array.isArray(data)) {
        return data.map(item => optimizeResponseData(item));
    }
    if (typeof data === 'object' && data !== null) {
        const optimized = {};
        for (const [key, value] of Object.entries(data)) {
            // 跳过内部字段
            if (key.startsWith('_'))
                continue;
            // 跳过null值
            if (value === null)
                continue;
            // 优化日期格式
            if (value instanceof Date) {
                optimized[key] = value.toISOString();
            }
            else if (typeof value === 'object') {
                optimized[key] = optimizeResponseData(value);
            }
            else {
                optimized[key] = value;
            }
        }
        return optimized;
    }
    return data;
}
/**
 * 批量操作优化器
 * 优化批量插入和更新操作
 */
function batchOptimizer(batchSize = 1000) {
    return {
        // 分批处理数组
        chunk: (array) => {
            const chunks = [];
            for (let i = 0; i < array.length; i += batchSize) {
                chunks.push(array.slice(i, i + batchSize));
            }
            return chunks;
        },
        // 执行批量插入
        batchInsert: async (table, records, insertFn) => {
            const chunks = batchOptimizer(batchSize).chunk(records);
            let success = 0;
            let failed = 0;
            for (const chunk of chunks) {
                try {
                    await insertFn(chunk);
                    success += chunk.length;
                }
                catch (error) {
                    logger_1.logger.error(`Batch insert failed for ${table}`, error);
                    failed += chunk.length;
                }
            }
            return { success, failed };
        }
    };
}
/**
 * 性能报告生成器
 * 生成API性能报告
 */
function generatePerformanceReport() {
    // 这里应该从实际的监控数据中获取
    // 简化示例
    return {
        timestamp: new Date().toISOString(),
        metrics: {
            totalRequests: 0,
            slowQueries: 0,
            averageResponseTime: 0,
            cacheHitRate: 0
        }
    };
}
exports.default = {
    requestTimer,
    smartCompression,
    cacheControl,
    queryOptimizer,
    dbQueryOptimizer,
    connectionPoolMonitor,
    responseOptimizer,
    batchOptimizer,
    generatePerformanceReport
};
//# sourceMappingURL=performance.js.map