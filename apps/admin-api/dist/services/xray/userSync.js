"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSyncService = void 0;
exports.getUserSyncService = getUserSyncService;
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
const client_1 = require("./client");
const cache_1 = require("../cache");
// 用户同步服务
class UserSyncService {
    xrayClient;
    userCache;
    config;
    isRunning = false;
    syncIntervalId = null;
    constructor(config) {
        this.xrayClient = (0, client_1.getXrayClient)();
        this.userCache = (0, cache_1.getUserConfigCache)();
        this.config = {
            enabled: true,
            syncIntervalMs: 300000, // 5分钟
            batchSize: 100,
            retryAttempts: 3,
            retryDelayMs: 1000,
            ...config,
        };
    }
    // 更新配置
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        logger_1.logger.info('User sync config updated:', this.config);
        // 如果正在运行且间隔改变，重启定时器
        if (this.isRunning && this.syncIntervalId) {
            this.stop();
            this.start();
        }
    }
    // 启动自动同步
    start() {
        if (!this.config.enabled) {
            logger_1.logger.warn('User sync service is disabled');
            return;
        }
        if (this.isRunning) {
            logger_1.logger.warn('User sync service is already running');
            return;
        }
        this.isRunning = true;
        logger_1.logger.info(`User sync service started with interval ${this.config.syncIntervalMs}ms`);
        // 立即执行一次同步
        this.syncAllUsers();
        // 设置定时同步
        this.syncIntervalId = setInterval(() => {
            this.syncAllUsers();
        }, this.config.syncIntervalMs);
    }
    // 停止自动同步
    stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }
        logger_1.logger.info('User sync service stopped');
    }
    // 获取运行状态
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config,
        };
    }
    // 同步所有用户
    async syncAllUsers() {
        const startTime = Date.now();
        const result = {
            success: true,
            syncedCount: 0,
            failedCount: 0,
            failedUsers: [],
            duration: 0,
        };
        try {
            logger_1.logger.info('Starting user sync...');
            // 获取所有活跃用户
            const users = await (0, database_1.db)('users')
                .where('status', 1) // 只同步正常状态的用户
                .where('expire_date', '>', new Date()) // 未过期
                .select('user_id', 'email', 'vpn_uuid', 'traffic_limit', 'traffic_used', 'expire_date');
            logger_1.logger.info(`Found ${users.length} active users to sync`);
            // 批量处理
            for (let i = 0; i < users.length; i += this.config.batchSize) {
                const batch = users.slice(i, i + this.config.batchSize);
                const batchResults = await Promise.all(batch.map(user => this.syncUser(user.user_id, user)));
                for (let j = 0; j < batch.length; j++) {
                    const user = batch[j];
                    const syncResult = batchResults[j];
                    if (syncResult.success) {
                        result.syncedCount++;
                    }
                    else {
                        result.failedCount++;
                        result.failedUsers.push({
                            userId: user.user_id,
                            email: user.email,
                            error: syncResult.error || 'Unknown error',
                        });
                    }
                }
            }
            result.duration = Date.now() - startTime;
            result.success = result.failedCount === 0;
            logger_1.logger.info(`User sync completed: ${result.syncedCount} synced, ${result.failedCount} failed, duration: ${result.duration}ms`);
        }
        catch (error) {
            result.success = false;
            result.duration = Date.now() - startTime;
            logger_1.logger.error('User sync failed:', error);
        }
        return result;
    }
    // 同步单个用户
    async syncUser(userId, userData) {
        try {
            // 如果没有提供用户数据，从数据库获取
            let user = userData;
            if (!user) {
                user = await (0, database_1.db)('users').where('user_id', userId).first();
                if (!user) {
                    return { success: false, error: 'User not found' };
                }
            }
            // 检查用户状态
            if (user.status !== 1) {
                return { success: false, error: 'User is not active' };
            }
            // 检查用户是否过期
            if (new Date(user.expire_date) <= new Date()) {
                return { success: false, error: 'User subscription expired' };
            }
            // 检查流量限制
            if (user.traffic_used >= user.traffic_limit) {
                return { success: false, error: 'Traffic limit exceeded' };
            }
            // 获取用户的节点配置
            const nodes = await this.getUserNodes(user.user_id);
            // 构建缓存配置
            const cachedConfig = {
                userId: user.user_id,
                email: user.email,
                uuid: user.vpn_uuid,
                subscriptionPlan: 'basic',
                trafficLimit: user.traffic_limit,
                trafficUsed: user.traffic_used,
                expiresAt: user.expire_date,
                status: user.status,
                nodes,
                updatedAt: new Date().toISOString(),
            };
            // 缓存用户配置
            await this.userCache.setUserConfig(userId, cachedConfig);
            // 同步到 Xray
            await this.syncUserToXray(user, nodes);
            logger_1.logger.debug(`User ${user.email} synced successfully`);
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error(`Failed to sync user ${userId}:`, error);
            return { success: false, error: errorMessage };
        }
    }
    // 同步用户到 Xray
    async syncUserToXray(user, nodes) {
        // 获取所有入站配置
        const inbounds = await this.xrayClient.getInbounds();
        // 为每个入站添加用户
        for (const inbound of inbounds) {
            // 根据入站协议准备用户配置
            const userConfig = this.prepareUserConfigForInbound(user, inbound);
            if (userConfig) {
                // 重试机制
                let attempts = 0;
                let success = false;
                while (attempts < this.config.retryAttempts && !success) {
                    success = await this.xrayClient.addUser(inbound.tag, userConfig);
                    if (!success) {
                        attempts++;
                        if (attempts < this.config.retryAttempts) {
                            await this.delay(this.config.retryDelayMs);
                        }
                    }
                }
                if (!success) {
                    throw new Error(`Failed to add user ${user.email} to inbound ${inbound.tag} after ${attempts} attempts`);
                }
            }
        }
    }
    // 为用户准备入站配置
    prepareUserConfigForInbound(user, inbound) {
        const protocol = inbound.protocol?.toLowerCase();
        switch (protocol) {
            case 'vless':
                return {
                    email: user.email,
                    id: user.vpn_uuid,
                    flow: 'xtls-rprx-vision',
                    level: 0,
                };
            case 'vmess':
                return {
                    email: user.email,
                    id: user.vpn_uuid,
                    alterId: 0,
                    level: 0,
                };
            case 'trojan':
                // Trojan 使用 UUID 作为密码
                return {
                    email: user.email,
                    password: user.vpn_uuid,
                    level: 0,
                };
            case 'shadowsocks':
                // Shadowsocks 使用 UUID 作为密码
                return {
                    email: user.email,
                    password: user.vpn_uuid,
                    level: 0,
                };
            default:
                logger_1.logger.warn(`Unsupported protocol: ${protocol}`);
                return null;
        }
    }
    // 获取用户节点配置
    async getUserNodes(userId) {
        try {
            // 获取所有在线节点
            const nodes = await (0, database_1.db)('nodes')
                .where('status', 'online')
                .select('id', 'code', 'name', 'host', 'port', 'protocol', 'config');
            return nodes.map(node => ({
                nodeId: node.id,
                code: node.code,
                protocol: node.protocol,
                config: {
                    host: node.host,
                    port: node.port,
                    ...node.config,
                },
            }));
        }
        catch (error) {
            logger_1.logger.error(`Failed to get nodes for user ${userId}:`, error);
            return [];
        }
    }
    // 从 Xray 移除用户
    async removeUserFromXray(userId) {
        try {
            const user = await (0, database_1.db)('users').where('user_id', userId).first();
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            // 从所有入站移除用户
            const inbounds = await this.xrayClient.getInbounds();
            for (const inbound of inbounds) {
                await this.xrayClient.removeUser(inbound.tag, user.email);
            }
            // 删除缓存
            await this.userCache.deleteUserConfig(userId);
            logger_1.logger.info(`User ${user.email} removed from Xray`);
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error(`Failed to remove user ${userId} from Xray:`, error);
            return { success: false, error: errorMessage };
        }
    }
    // 批量同步用户
    async batchSyncUsers(userIds) {
        const success = [];
        const failed = [];
        for (const userId of userIds) {
            const result = await this.syncUser(userId);
            if (result.success) {
                success.push(userId);
            }
            else {
                failed.push({ userId, error: result.error || 'Unknown error' });
            }
        }
        return { success, failed };
    }
    // 验证用户缓存
    async validateUserCache(userId) {
        try {
            const cached = await this.userCache.getUserConfig(userId);
            if (!cached) {
                return { valid: false, cached: false, error: 'User config not cached' };
            }
            // 验证缓存数据完整性
            if (!cached.uuid || !cached.email) {
                return { valid: false, cached: true, error: 'Invalid cached config' };
            }
            // 验证是否过期
            if (new Date(cached.expiresAt) <= new Date()) {
                return { valid: false, cached: true, error: 'User subscription expired' };
            }
            // 验证流量限制
            if (cached.trafficUsed >= cached.trafficLimit) {
                return { valid: false, cached: true, error: 'Traffic limit exceeded' };
            }
            return { valid: true, cached: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { valid: false, cached: false, error: errorMessage };
        }
    }
    // 延迟辅助函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.UserSyncService = UserSyncService;
// 单例实例
let userSyncServiceInstance = null;
function getUserSyncService(config) {
    if (!userSyncServiceInstance) {
        userSyncServiceInstance = new UserSyncService(config);
    }
    return userSyncServiceInstance;
}
exports.default = UserSyncService;
//# sourceMappingURL=userSync.js.map