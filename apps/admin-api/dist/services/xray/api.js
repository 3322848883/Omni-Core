"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XrayAPIClient = void 0;
exports.getXrayClient = getXrayClient;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
// Xray API 客户端
class XrayAPIClient {
    client;
    apiPort;
    constructor(apiPort = 10085) {
        this.apiPort = apiPort;
        this.client = axios_1.default.create({
            baseURL: `http://127.0.0.1:${apiPort}`,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    // 获取所有入站连接统计
    async getInboundStats(reset = false) {
        try {
            const response = await this.client.post('/stats/query', {
                pattern: 'inbound>>>',
                reset,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.debug('Failed to get inbound stats');
            return { stat: [] };
        }
    }
    // 获取用户统计 (按邮箱)
    async getUserStats(email, reset = false) {
        try {
            const [uplinkRes, downlinkRes] = await Promise.all([
                this.client.post('/stats/query', {
                    pattern: `user>>>${email}>>>traffic>>>uplink`,
                    reset,
                }),
                this.client.post('/stats/query', {
                    pattern: `user>>>${email}>>>traffic>>>downlink`,
                    reset,
                }),
            ]);
            return {
                uplink: uplinkRes.data?.stat?.[0]?.value || 0,
                downlink: downlinkRes.data?.stat?.[0]?.value || 0,
            };
        }
        catch (error) {
            logger_1.logger.debug(`Failed to get user stats for ${email}`);
            return { uplink: 0, downlink: 0 };
        }
    }
    // 获取所有用户统计
    async getAllUserStats(reset = false) {
        try {
            const response = await this.client.post('/stats/query', {
                pattern: 'user>>>',
                reset,
            });
            const stats = new Map();
            const data = response.data?.stat || [];
            // 解析统计数据
            for (const stat of data) {
                const match = stat.name.match(/user>>>(.+?)>>>traffic>>>(uplink|downlink)/);
                if (match) {
                    const email = match[1];
                    const type = match[2];
                    const value = parseInt(stat.value) || 0;
                    if (!stats.has(email)) {
                        stats.set(email, { uplink: 0, downlink: 0 });
                    }
                    const userStats = stats.get(email);
                    if (type === 'uplink') {
                        userStats.uplink = value;
                    }
                    else {
                        userStats.downlink = value;
                    }
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.debug('Failed to get all user stats');
            return new Map();
        }
    }
    // 添加用户到入站
    async addUser(inboundTag, user) {
        try {
            await this.client.post('/handler/AddUser', {
                tag: inboundTag,
                user,
            });
            logger_1.logger.info(`User ${user.email} added to inbound ${inboundTag}`);
            return true;
        }
        catch (error) {
            logger_1.logger.debug(`Failed to add user ${user.email}`);
            return false;
        }
    }
    // 从入站移除用户
    async removeUser(inboundTag, email) {
        try {
            await this.client.post('/handler/RemoveUser', {
                tag: inboundTag,
                email,
            });
            logger_1.logger.info(`User ${email} removed from inbound ${inboundTag}`);
            return true;
        }
        catch (error) {
            logger_1.logger.debug(`Failed to remove user ${email}`);
            return false;
        }
    }
    // 获取所有入站配置
    async getInbounds() {
        try {
            const response = await this.client.post('/handler/GetInbounds');
            return response.data?.inbounds || [];
        }
        catch (error) {
            logger_1.logger.debug('Failed to get inbounds');
            return [];
        }
    }
    // 添加入站
    async addInbound(inbound) {
        try {
            await this.client.post('/handler/AddInbound', {
                inbound,
            });
            logger_1.logger.info(`Inbound ${inbound.tag} added`);
            return true;
        }
        catch (error) {
            logger_1.logger.debug(`Failed to add inbound ${inbound.tag}`);
            return false;
        }
    }
    // 移除入站
    async removeInbound(tag) {
        try {
            await this.client.post('/handler/RemoveInbound', {
                tag,
            });
            logger_1.logger.info(`Inbound ${tag} removed`);
            return true;
        }
        catch (error) {
            logger_1.logger.debug(`Failed to remove inbound ${tag}`);
            return false;
        }
    }
    // 获取系统状态
    async getSysStats() {
        try {
            const response = await this.client.post('/stats/sys');
            return response.data;
        }
        catch (error) {
            logger_1.logger.debug('Failed to get system stats');
            return null;
        }
    }
    // 测试连接
    async testConnection() {
        try {
            await this.client.get('/');
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.XrayAPIClient = XrayAPIClient;
// 单例实例
let xrayClient = null;
function getXrayClient(apiPort) {
    if (!xrayClient || apiPort) {
        xrayClient = new XrayAPIClient(apiPort);
    }
    return xrayClient;
}
exports.default = XrayAPIClient;
//# sourceMappingURL=api.js.map