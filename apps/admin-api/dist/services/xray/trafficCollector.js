"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficCollector = void 0;
exports.getTrafficCollector = getTrafficCollector;
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
const api_1 = require("./api");
// 流量统计采集器
class TrafficCollector {
    xrayClient;
    isRunning = false;
    intervalId = null;
    collectionInterval = 60000; // 默认60秒
    constructor(apiPort) {
        this.xrayClient = (0, api_1.getXrayClient)(apiPort);
    }
    // 设置采集间隔
    setInterval(intervalMs) {
        this.collectionInterval = intervalMs;
    }
    // 启动采集
    start() {
        if (this.isRunning) {
            logger_1.logger.warn('Traffic collector is already running');
            return;
        }
        this.isRunning = true;
        logger_1.logger.info(`Traffic collector started with interval ${this.collectionInterval}ms`);
        // 立即执行一次
        this.collect();
        // 定时执行
        this.intervalId = setInterval(() => {
            this.collect();
        }, this.collectionInterval);
    }
    // 停止采集
    stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger_1.logger.info('Traffic collector stopped');
    }
    // 采集流量数据
    async collect() {
        try {
            // 获取所有用户流量统计
            const userStats = await this.xrayClient.getAllUserStats(true); // true = 重置统计
            if (userStats.size === 0) {
                return;
            }
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            // 批量插入数据库
            for (const [email, stats] of userStats.entries()) {
                await this.saveUserTraffic(email, stats, dateStr);
            }
            logger_1.logger.info(`Collected traffic for ${userStats.size} users`);
        }
        catch (error) {
            logger_1.logger.error('Failed to collect traffic:', error);
        }
    }
    // 保存用户流量到数据库
    async saveUserTraffic(email, stats, dateStr) {
        const now = new Date();
        try {
            // 从邮箱获取用户ID
            const user = await (0, database_1.db)('users').where('email', email).first();
            if (!user) {
                logger_1.logger.warn(`User not found for email: ${email}`);
                return;
            }
            const userId = user.user_id;
            const totalBytes = stats.uplink + stats.downlink;
            // 更新每日统计
            const existingStat = await (0, database_1.db)('traffic_stats_daily')
                .where({ user_id: userId, stat_date: dateStr })
                .first();
            if (existingStat) {
                await (0, database_1.db)('traffic_stats_daily')
                    .where({ user_id: userId, stat_date: dateStr })
                    .update({
                    upload_bytes: existingStat.upload_bytes + stats.uplink,
                    download_bytes: existingStat.download_bytes + stats.downlink,
                    total_bytes: existingStat.total_bytes + totalBytes,
                    updated_at: now,
                });
            }
            else {
                await (0, database_1.db)('traffic_stats_daily').insert({
                    user_id: userId,
                    stat_date: dateStr,
                    upload_bytes: stats.uplink,
                    download_bytes: stats.downlink,
                    total_bytes: totalBytes,
                });
            }
            // 更新用户总流量使用
            await (0, database_1.db)('users')
                .where('user_id', userId)
                .update({
                traffic_used: database_1.db.raw('traffic_used + ?', [totalBytes]),
                updated_at: now,
            });
            // 检查是否超出流量限制
            await this.checkTrafficLimit(userId);
        }
        catch (error) {
            logger_1.logger.error(`Failed to save traffic for ${email}:`, error);
        }
    }
    // 检查用户是否超出流量限制
    async checkTrafficLimit(userId) {
        try {
            const user = await (0, database_1.db)('users').where('user_id', userId).first();
            if (!user) {
                return;
            }
            const usagePercent = (user.traffic_used / user.traffic_limit) * 100;
            // 如果超出100%，禁用用户
            if (usagePercent >= 100) {
                await (0, database_1.db)('users').where('user_id', userId).update({
                    status: 2, // 禁用状态
                    updated_at: new Date(),
                });
                logger_1.logger.warn(`User ${userId} has exceeded traffic limit and been disabled`);
            }
            // 如果超过80%，记录警告
            else if (usagePercent >= 80) {
                logger_1.logger.info(`User ${userId} has used ${usagePercent.toFixed(1)}% of traffic limit`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to check traffic limit for ${userId}:`, error);
        }
    }
    // 获取用户实时流量
    async getRealtimeTraffic(userId) {
        try {
            const user = await (0, database_1.db)('users').where('user_id', userId).first();
            if (!user) {
                return null;
            }
            const stats = await this.xrayClient.getUserStats(user.email, false);
            return {
                upload: stats.uplink,
                download: stats.downlink,
                total: stats.uplink + stats.downlink,
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get realtime traffic for ${userId}:`, error);
            return null;
        }
    }
    // 获取所有在线用户流量
    async getAllOnlineTraffic() {
        try {
            return await this.xrayClient.getAllUserStats(false);
        }
        catch (error) {
            logger_1.logger.error('Failed to get all online traffic:', error);
            return new Map();
        }
    }
    // 手动触发采集
    async manualCollect() {
        try {
            const userStats = await this.xrayClient.getAllUserStats(true);
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            for (const [email, stats] of userStats.entries()) {
                await this.saveUserTraffic(email, stats, dateStr);
            }
            return {
                success: true,
                message: 'Traffic collection completed',
                collectedCount: userStats.size,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to collect traffic: ${error}`,
                collectedCount: 0,
            };
        }
    }
    // 获取采集器状态
    getStatus() {
        return {
            isRunning: this.isRunning,
            interval: this.collectionInterval,
        };
    }
}
exports.TrafficCollector = TrafficCollector;
// 单例实例
let trafficCollector = null;
function getTrafficCollector(apiPort) {
    if (!trafficCollector) {
        trafficCollector = new TrafficCollector(apiPort);
    }
    return trafficCollector;
}
exports.default = TrafficCollector;
//# sourceMappingURL=trafficCollector.js.map