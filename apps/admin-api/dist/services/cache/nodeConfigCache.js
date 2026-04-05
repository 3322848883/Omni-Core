"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeConfigCache = void 0;
exports.getNodeConfigCache = getNodeConfigCache;
const redis_1 = require("./redis");
const logger_1 = require("../../utils/logger");
// 节点配置缓存服务
class NodeConfigCache {
    redis;
    KEY_PREFIX = 'node:config:';
    TTL_SECONDS = 1800; // 30分钟过期
    constructor(redis) {
        this.redis = redis || (0, redis_1.getRedisClient)();
    }
    // 生成缓存键
    getKey(nodeId) {
        return `${this.KEY_PREFIX}${nodeId}`;
    }
    // 缓存节点配置
    async setNodeConfig(nodeId, config) {
        try {
            const key = this.getKey(nodeId);
            const data = {
                ...config,
                updatedAt: new Date().toISOString(),
            };
            return await this.redis.setJSON(key, data, this.TTL_SECONDS);
        }
        catch (error) {
            logger_1.logger.error(`Failed to cache node config for ${nodeId}:`, error);
            return false;
        }
    }
    // 获取节点配置
    async getNodeConfig(nodeId) {
        try {
            const key = this.getKey(nodeId);
            return await this.redis.getJSON(key);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get cached node config for ${nodeId}:`, error);
            return null;
        }
    }
    // 删除节点配置缓存
    async deleteNodeConfig(nodeId) {
        try {
            const key = this.getKey(nodeId);
            return await this.redis.del(key);
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete node config cache for ${nodeId}:`, error);
            return false;
        }
    }
    // 批量缓存节点配置
    async batchSetNodeConfigs(configs) {
        const success = [];
        const failed = [];
        for (const { nodeId, config } of configs) {
            const result = await this.setNodeConfig(nodeId, config);
            if (result) {
                success.push(nodeId);
            }
            else {
                failed.push(nodeId);
            }
        }
        return { success, failed };
    }
    // 批量删除节点配置缓存
    async batchDeleteNodeConfigs(nodeIds) {
        const success = [];
        const failed = [];
        for (const nodeId of nodeIds) {
            const result = await this.deleteNodeConfig(nodeId);
            if (result) {
                success.push(nodeId);
            }
            else {
                failed.push(nodeId);
            }
        }
        return { success, failed };
    }
    // 获取所有缓存的节点ID
    async getAllCachedNodeIds() {
        try {
            const keys = await this.redis.keys(`${this.KEY_PREFIX}*`);
            return keys.map(key => key.replace(this.KEY_PREFIX, ''));
        }
        catch (error) {
            logger_1.logger.error('Failed to get all cached node IDs:', error);
            return [];
        }
    }
    // 获取所有缓存的节点配置
    async getAllNodeConfigs() {
        try {
            const nodeIds = await this.getAllCachedNodeIds();
            const configs = [];
            for (const nodeId of nodeIds) {
                const config = await this.getNodeConfig(nodeId);
                if (config) {
                    configs.push(config);
                }
            }
            return configs;
        }
        catch (error) {
            logger_1.logger.error('Failed to get all cached node configs:', error);
            return [];
        }
    }
    // 清空所有节点配置缓存
    async clearAllNodeConfigs() {
        try {
            return await this.redis.delPattern(`${this.KEY_PREFIX}*`);
        }
        catch (error) {
            logger_1.logger.error('Failed to clear all node config caches:', error);
            return false;
        }
    }
    // 更新节点状态
    async updateNodeStatus(nodeId, status) {
        try {
            const config = await this.getNodeConfig(nodeId);
            if (!config) {
                return false;
            }
            config.status = status;
            config.updatedAt = new Date().toISOString();
            return await this.setNodeConfig(nodeId, config);
        }
        catch (error) {
            logger_1.logger.error(`Failed to update node status for ${nodeId}:`, error);
            return false;
        }
    }
    // 更新节点流量使用
    async updateNodeTraffic(nodeId, trafficUsed) {
        try {
            const config = await this.getNodeConfig(nodeId);
            if (!config) {
                return false;
            }
            config.trafficUsed = trafficUsed;
            config.updatedAt = new Date().toISOString();
            return await this.setNodeConfig(nodeId, config);
        }
        catch (error) {
            logger_1.logger.error(`Failed to update node traffic for ${nodeId}:`, error);
            return false;
        }
    }
    // 检查节点配置是否存在
    async exists(nodeId) {
        try {
            const key = this.getKey(nodeId);
            return await this.redis.exists(key);
        }
        catch (error) {
            logger_1.logger.error(`Failed to check node config existence for ${nodeId}:`, error);
            return false;
        }
    }
    // 获取缓存过期时间
    async getTTL(nodeId) {
        try {
            const key = this.getKey(nodeId);
            return await this.redis.ttl(key);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get TTL for node ${nodeId}:`, error);
            return -2;
        }
    }
    // 延长缓存过期时间
    async extendTTL(nodeId, seconds) {
        try {
            const key = this.getKey(nodeId);
            return await this.redis.expire(key, seconds);
        }
        catch (error) {
            logger_1.logger.error(`Failed to extend TTL for node ${nodeId}:`, error);
            return false;
        }
    }
    // 根据协议获取节点
    async getNodesByProtocol(protocol) {
        try {
            const allConfigs = await this.getAllNodeConfigs();
            return allConfigs.filter(config => config.protocol === protocol);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get nodes by protocol ${protocol}:`, error);
            return [];
        }
    }
    // 根据状态获取节点
    async getNodesByStatus(status) {
        try {
            const allConfigs = await this.getAllNodeConfigs();
            return allConfigs.filter(config => config.status === status);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get nodes by status ${status}:`, error);
            return [];
        }
    }
}
exports.NodeConfigCache = NodeConfigCache;
// 单例实例
let nodeConfigCacheInstance = null;
function getNodeConfigCache(redis) {
    if (!nodeConfigCacheInstance) {
        nodeConfigCacheInstance = new NodeConfigCache(redis);
    }
    return nodeConfigCacheInstance;
}
exports.default = NodeConfigCache;
//# sourceMappingURL=nodeConfigCache.js.map