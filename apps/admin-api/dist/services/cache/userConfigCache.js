"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserConfigCache = void 0;
exports.getUserConfigCache = getUserConfigCache;
const redis_1 = require("./redis");
const logger_1 = require("../../utils/logger");
// 用户配置缓存服务
class UserConfigCache {
    redis;
    KEY_PREFIX = 'user:config:';
    TTL_SECONDS = 3600; // 1小时过期
    constructor(redis) {
        this.redis = redis || (0, redis_1.getRedisClient)();
    }
    // 生成缓存键
    getKey(userId) {
        return `${this.KEY_PREFIX}${userId}`;
    }
    // 缓存用户配置
    async setUserConfig(userId, config) {
        try {
            const key = this.getKey(userId);
            const data = {
                ...config,
                updatedAt: new Date().toISOString(),
            };
            return await this.redis.setJSON(key, data, this.TTL_SECONDS);
        }
        catch (error) {
            logger_1.logger.error(`Failed to cache user config for ${userId}:`, error);
            return false;
        }
    }
    // 获取用户配置
    async getUserConfig(userId) {
        try {
            const key = this.getKey(userId);
            return await this.redis.getJSON(key);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get cached user config for ${userId}:`, error);
            return null;
        }
    }
    // 删除用户配置缓存
    async deleteUserConfig(userId) {
        try {
            const key = this.getKey(userId);
            return await this.redis.del(key);
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete user config cache for ${userId}:`, error);
            return false;
        }
    }
    // 批量缓存用户配置
    async batchSetUserConfigs(configs) {
        const success = [];
        const failed = [];
        for (const { userId, config } of configs) {
            const result = await this.setUserConfig(userId, config);
            if (result) {
                success.push(userId);
            }
            else {
                failed.push(userId);
            }
        }
        return { success, failed };
    }
    // 批量删除用户配置缓存
    async batchDeleteUserConfigs(userIds) {
        const success = [];
        const failed = [];
        for (const userId of userIds) {
            const result = await this.deleteUserConfig(userId);
            if (result) {
                success.push(userId);
            }
            else {
                failed.push(userId);
            }
        }
        return { success, failed };
    }
    // 获取所有缓存的用户ID
    async getAllCachedUserIds() {
        try {
            const keys = await this.redis.keys(`${this.KEY_PREFIX}*`);
            return keys.map(key => key.replace(this.KEY_PREFIX, ''));
        }
        catch (error) {
            logger_1.logger.error('Failed to get all cached user IDs:', error);
            return [];
        }
    }
    // 清空所有用户配置缓存
    async clearAllUserConfigs() {
        try {
            return await this.redis.delPattern(`${this.KEY_PREFIX}*`);
        }
        catch (error) {
            logger_1.logger.error('Failed to clear all user config caches:', error);
            return false;
        }
    }
    // 更新用户流量使用
    async updateUserTraffic(userId, trafficUsed) {
        try {
            const config = await this.getUserConfig(userId);
            if (!config) {
                return false;
            }
            config.trafficUsed = trafficUsed;
            config.updatedAt = new Date().toISOString();
            return await this.setUserConfig(userId, config);
        }
        catch (error) {
            logger_1.logger.error(`Failed to update user traffic for ${userId}:`, error);
            return false;
        }
    }
    // 检查用户配置是否存在
    async exists(userId) {
        try {
            const key = this.getKey(userId);
            return await this.redis.exists(key);
        }
        catch (error) {
            logger_1.logger.error(`Failed to check user config existence for ${userId}:`, error);
            return false;
        }
    }
    // 获取缓存过期时间
    async getTTL(userId) {
        try {
            const key = this.getKey(userId);
            return await this.redis.ttl(key);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get TTL for user ${userId}:`, error);
            return -2;
        }
    }
    // 延长缓存过期时间
    async extendTTL(userId, seconds) {
        try {
            const key = this.getKey(userId);
            return await this.redis.expire(key, seconds);
        }
        catch (error) {
            logger_1.logger.error(`Failed to extend TTL for user ${userId}:`, error);
            return false;
        }
    }
}
exports.UserConfigCache = UserConfigCache;
// 单例实例
let userConfigCacheInstance = null;
function getUserConfigCache(redis) {
    if (!userConfigCacheInstance) {
        userConfigCacheInstance = new UserConfigCache(redis);
    }
    return userConfigCacheInstance;
}
exports.default = UserConfigCache;
//# sourceMappingURL=userConfigCache.js.map