"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSyncService = exports.UserSyncService = exports.getTrafficCollector = exports.TrafficCollector = exports.SubscriptionGenerator = exports.getXrayAPIClient = exports.XrayAPIClient = exports.resetXrayClient = exports.getXrayClient = exports.XrayClient = exports.generateShortId = exports.generatePassword = exports.generateUUID = exports.XrayConfigGenerator = void 0;
exports.initializeXrayService = initializeXrayService;
exports.shutdownXrayService = shutdownXrayService;
exports.getXrayServiceStatus = getXrayServiceStatus;
exports.reloadXrayConfig = reloadXrayConfig;
// Xray Core Service - 入口文件
var config_1 = require("./config");
Object.defineProperty(exports, "XrayConfigGenerator", { enumerable: true, get: function () { return config_1.XrayConfigGenerator; } });
Object.defineProperty(exports, "generateUUID", { enumerable: true, get: function () { return config_1.generateUUID; } });
Object.defineProperty(exports, "generatePassword", { enumerable: true, get: function () { return config_1.generatePassword; } });
Object.defineProperty(exports, "generateShortId", { enumerable: true, get: function () { return config_1.generateShortId; } });
var client_1 = require("./client");
Object.defineProperty(exports, "XrayClient", { enumerable: true, get: function () { return client_1.XrayClient; } });
Object.defineProperty(exports, "getXrayClient", { enumerable: true, get: function () { return client_1.getXrayClient; } });
Object.defineProperty(exports, "resetXrayClient", { enumerable: true, get: function () { return client_1.resetXrayClient; } });
var api_1 = require("./api");
Object.defineProperty(exports, "XrayAPIClient", { enumerable: true, get: function () { return api_1.XrayAPIClient; } });
Object.defineProperty(exports, "getXrayAPIClient", { enumerable: true, get: function () { return api_1.getXrayClient; } });
var subscription_1 = require("./subscription");
Object.defineProperty(exports, "SubscriptionGenerator", { enumerable: true, get: function () { return subscription_1.SubscriptionGenerator; } });
var trafficCollector_1 = require("./trafficCollector");
Object.defineProperty(exports, "TrafficCollector", { enumerable: true, get: function () { return trafficCollector_1.TrafficCollector; } });
Object.defineProperty(exports, "getTrafficCollector", { enumerable: true, get: function () { return trafficCollector_1.getTrafficCollector; } });
var userSync_1 = require("./userSync");
Object.defineProperty(exports, "UserSyncService", { enumerable: true, get: function () { return userSync_1.UserSyncService; } });
Object.defineProperty(exports, "getUserSyncService", { enumerable: true, get: function () { return userSync_1.getUserSyncService; } });
// 导入依赖
const logger_1 = require("../../utils/logger");
const trafficCollector_2 = require("./trafficCollector");
const userSync_2 = require("./userSync");
const client_2 = require("./client");
const cache_1 = require("../cache");
// 默认配置
const defaultConfig = {
    // 开发环境下禁用自动启动，避免Xray未运行时阻塞
    autoStartTrafficCollector: process.env.NODE_ENV === 'production',
    autoStartUserSync: process.env.NODE_ENV === 'production',
    userSyncIntervalMs: 300000, // 5分钟
    trafficCollectorIntervalMs: 60000, // 1分钟
};
// 初始化 Xray 服务
function initializeXrayService(config = {}) {
    const finalConfig = { ...defaultConfig, ...config };
    logger_1.logger.info('Initializing Xray service...');
    try {
        // 测试 Xray 连接
        const xrayClient = (0, client_2.getXrayClient)();
        xrayClient.testConnection().then(connected => {
            if (connected) {
                logger_1.logger.info('Xray API connection established');
            }
            else {
                logger_1.logger.warn('Xray API connection failed - service will retry on demand');
            }
        });
        // 测试 Redis 连接
        const redisClient = (0, cache_1.getRedisClient)();
        if (redisClient.isReady()) {
            logger_1.logger.info('Redis cache connection established');
        }
        else {
            logger_1.logger.warn('Redis cache not available - caching disabled');
        }
        // 启动流量采集器
        if (finalConfig.autoStartTrafficCollector) {
            const collector = (0, trafficCollector_2.getTrafficCollector)();
            collector.setInterval(finalConfig.trafficCollectorIntervalMs);
            collector.start();
        }
        // 启动用户同步服务
        if (finalConfig.autoStartUserSync) {
            const userSync = (0, userSync_2.getUserSyncService)({
                syncIntervalMs: finalConfig.userSyncIntervalMs,
            });
            userSync.start();
        }
        logger_1.logger.info('Xray service initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Xray service:', error);
        throw error;
    }
}
// 关闭 Xray 服务
function shutdownXrayService() {
    logger_1.logger.info('Shutting down Xray service...');
    try {
        // 停止流量采集器
        const collector = (0, trafficCollector_2.getTrafficCollector)();
        collector.stop();
        // 停止用户同步服务
        const userSync = (0, userSync_2.getUserSyncService)();
        userSync.stop();
        // 关闭 Redis 连接
        const redisClient = (0, cache_1.getRedisClient)();
        redisClient.close();
        logger_1.logger.info('Xray service shut down successfully');
    }
    catch (error) {
        logger_1.logger.error('Error during Xray service shutdown:', error);
    }
}
// 获取 Xray 服务状态
async function getXrayServiceStatus() {
    const xrayClient = (0, client_2.getXrayClient)();
    const redisClient = (0, cache_1.getRedisClient)();
    const collector = (0, trafficCollector_2.getTrafficCollector)();
    const userSync = (0, userSync_2.getUserSyncService)();
    return {
        xrayConnected: await xrayClient.testConnection(),
        redisConnected: redisClient.isReady(),
        trafficCollectorRunning: collector.getStatus().isRunning,
        userSyncRunning: userSync.getStatus().isRunning,
    };
}
// 重新加载 Xray 配置
async function reloadXrayConfig() {
    try {
        const xrayClient = (0, client_2.getXrayClient)();
        const isConnected = await xrayClient.testConnection();
        if (!isConnected) {
            return {
                success: false,
                message: 'Xray API not connected',
            };
        }
        // 获取所有入站配置
        const inbounds = await xrayClient.getInbounds();
        logger_1.logger.info(`Reloaded Xray config with ${inbounds.length} inbounds`);
        return {
            success: true,
            message: `Reloaded ${inbounds.length} inbounds`,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to reload Xray config:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
//# sourceMappingURL=index.js.map