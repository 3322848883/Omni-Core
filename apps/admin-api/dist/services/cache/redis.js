"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClient = void 0;
exports.getRedisClient = getRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
// Redis 客户端类
class RedisClient {
    client = null;
    isConnected = false;
    constructor() {
        this.connect();
    }
    // 连接 Redis
    connect() {
        try {
            this.client = new ioredis_1.default({
                host: config_1.config.redis.host,
                port: config_1.config.redis.port,
                password: config_1.config.redis.password || undefined,
                db: config_1.config.redis.db,
                retryStrategy: (times) => {
                    if (times > 1) {
                        return null;
                    }
                    return Math.min(times * 100, 1000);
                },
                maxRetriesPerRequest: 3,
                connectTimeout: 5000,
                lazyConnect: true,
            });
            this.client.connect().catch((err) => {
                logger_1.logger.warn(`Redis initial connection failed: ${err.message}`);
                this.isConnected = false;
            });
            this.client.on('connect', () => {
                this.isConnected = true;
                logger_1.logger.info('Redis connected successfully');
            });
            this.client.on('error', (error) => {
                logger_1.logger.warn(`Redis error: ${error.message}`);
                this.isConnected = false;
            });
            this.client.on('close', () => {
                logger_1.logger.warn('Redis connection closed');
                this.isConnected = false;
            });
        }
        catch (error) {
            logger_1.logger.warn(`Failed to create Redis client: ${error}`);
            this.isConnected = false;
        }
    }
    // 获取连接状态
    isReady() {
        return this.isConnected && this.client !== null;
    }
    // 获取原始客户端
    getClient() {
        return this.client;
    }
    // 设置字符串值
    async set(key, value, ttlSeconds) {
        try {
            if (!this.client) {
                return false;
            }
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Redis set error for key ${key}:`, error);
            return false;
        }
    }
    // 获取字符串值
    async get(key) {
        try {
            if (!this.client) {
                return null;
            }
            return await this.client.get(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis get error for key ${key}:`, error);
            return null;
        }
    }
    // 删除键
    async del(key) {
        try {
            if (!this.client) {
                return false;
            }
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Redis del error for key ${key}:`, error);
            return false;
        }
    }
    // 批量删除键
    async delPattern(pattern) {
        try {
            if (!this.client) {
                return false;
            }
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Redis delPattern error for pattern ${pattern}:`, error);
            return false;
        }
    }
    // 设置 JSON 值
    async setJSON(key, value, ttlSeconds) {
        try {
            const jsonString = JSON.stringify(value);
            return await this.set(key, jsonString, ttlSeconds);
        }
        catch (error) {
            logger_1.logger.error(`Redis setJSON error for key ${key}:`, error);
            return false;
        }
    }
    // 获取 JSON 值
    async getJSON(key) {
        try {
            const value = await this.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error(`Redis getJSON error for key ${key}:`, error);
            return null;
        }
    }
    // 设置哈希值
    async hset(key, field, value) {
        try {
            if (!this.client) {
                return false;
            }
            await this.client.hset(key, field, value);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Redis hset error for key ${key}, field ${field}:`, error);
            return false;
        }
    }
    // 批量设置哈希值
    async hmset(key, data) {
        try {
            if (!this.client) {
                return false;
            }
            await this.client.hmset(key, data);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Redis hmset error for key ${key}:`, error);
            return false;
        }
    }
    // 获取哈希值
    async hget(key, field) {
        try {
            if (!this.client) {
                return null;
            }
            return await this.client.hget(key, field);
        }
        catch (error) {
            logger_1.logger.error(`Redis hget error for key ${key}, field ${field}:`, error);
            return null;
        }
    }
    // 获取所有哈希值
    async hgetall(key) {
        try {
            if (!this.client) {
                return null;
            }
            return await this.client.hgetall(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis hgetall error for key ${key}:`, error);
            return null;
        }
    }
    // 删除哈希字段
    async hdel(key, field) {
        try {
            if (!this.client) {
                return false;
            }
            await this.client.hdel(key, field);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Redis hdel error for key ${key}, field ${field}:`, error);
            return false;
        }
    }
    // 设置过期时间
    async expire(key, seconds) {
        try {
            if (!this.client) {
                return false;
            }
            await this.client.expire(key, seconds);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Redis expire error for key ${key}:`, error);
            return false;
        }
    }
    // 获取过期时间
    async ttl(key) {
        try {
            if (!this.client) {
                return -2;
            }
            return await this.client.ttl(key);
        }
        catch (error) {
            logger_1.logger.error(`Redis ttl error for key ${key}:`, error);
            return -2;
        }
    }
    // 检查键是否存在
    async exists(key) {
        try {
            if (!this.client) {
                return false;
            }
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Redis exists error for key ${key}:`, error);
            return false;
        }
    }
    // 获取匹配的所有键
    async keys(pattern) {
        try {
            if (!this.client) {
                return [];
            }
            return await this.client.keys(pattern);
        }
        catch (error) {
            logger_1.logger.error(`Redis keys error for pattern ${pattern}:`, error);
            return [];
        }
    }
    // 关闭连接
    async close() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
            logger_1.logger.info('Redis connection closed');
        }
    }
}
exports.RedisClient = RedisClient;
// 单例实例
let redisClientInstance = null;
function getRedisClient() {
    if (!redisClientInstance) {
        redisClientInstance = new RedisClient();
    }
    return redisClientInstance;
}
exports.default = RedisClient;
//# sourceMappingURL=redis.js.map