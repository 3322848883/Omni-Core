"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XrayClient = void 0;
exports.getXrayClient = getXrayClient;
exports.resetXrayClient = resetXrayClient;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
const config_1 = require("../../config");
// Xray HTTP 客户端
class XrayClient {
    client;
    apiHost;
    apiPort;
    isConnected = false;
    constructor(apiHost, apiPort) {
        this.apiHost = apiHost || config_1.config.xray.host || 'localhost';
        this.apiPort = apiPort || config_1.config.xray.port || 10085;
        this.client = axios_1.default.create({
            baseURL: `http://${this.apiHost}:${this.apiPort}`,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // 请求拦截器 - 添加日志
        this.client.interceptors.request.use((config) => {
            logger_1.logger.debug(`Xray API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => Promise.reject(error));
        // 响应拦截器 - 处理错误
        this.client.interceptors.response.use((response) => response, (error) => {
            this.handleError(error);
            return Promise.reject(error);
        });
    }
    // 错误处理
    handleError(error) {
        if (error.code === 'ECONNREFUSED') {
            logger_1.logger.debug(`Xray API connection refused at ${this.apiHost}:${this.apiPort}`);
            this.isConnected = false;
        }
        else if (error.code === 'ETIMEDOUT') {
            logger_1.logger.debug('Xray API request timeout');
        }
        else if (error.response) {
            logger_1.logger.debug(`Xray API error: ${error.response.status}`);
        }
        else {
            logger_1.logger.debug('Xray API error:', error.message);
        }
    }
    // 测试连接
    async testConnection() {
        try {
            // Use queryStats to test connection since Xray API returns HTTP/0.9 for root path
            const response = await this.queryStats('inbound>>>', false);
            this.isConnected = response.stat !== undefined;
            return this.isConnected;
        }
        catch (error) {
            this.isConnected = false;
            return false;
        }
    }
    // 获取连接状态
    getConnectionStatus() {
        return this.isConnected;
    }
    // ==================== StatsService API ====================
    // 查询统计信息
    async queryStats(pattern, reset = false) {
        try {
            const response = await this.client.post('/stats/query', {
                pattern,
                reset,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.debug(`Failed to query stats with pattern ${pattern}`);
            return { stat: [] };
        }
    }
    // 获取系统统计
    async getSysStats() {
        try {
            const response = await this.client.post('/stats/sys');
            return response.data;
        }
        catch (error) {
            logger_1.logger.debug('Failed to get system stats');
            return {};
        }
    }
    // 获取所有入站统计
    async getAllInboundStats(reset = false) {
        try {
            const response = await this.queryStats('inbound>>>', reset);
            const stats = new Map();
            const data = response.stat || [];
            for (const stat of data) {
                const match = stat.name.match(/inbound>>>(.+?)>>>traffic>>>(uplink|downlink)/);
                if (match) {
                    const tag = match[1];
                    const type = match[2];
                    const value = parseInt(stat.value) || 0;
                    if (!stats.has(tag)) {
                        stats.set(tag, { uplink: 0, downlink: 0, total: 0 });
                    }
                    const inboundStats = stats.get(tag);
                    if (type === 'uplink') {
                        inboundStats.uplink = value;
                    }
                    else {
                        inboundStats.downlink = value;
                    }
                    inboundStats.total = inboundStats.uplink + inboundStats.downlink;
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.debug('Failed to get all inbound stats');
            return new Map();
        }
    }
    // 获取用户统计
    async getUserStats(email, reset = false) {
        try {
            const [uplinkRes, downlinkRes] = await Promise.all([
                this.queryStats(`user>>>${email}>>>traffic>>>uplink`, reset),
                this.queryStats(`user>>>${email}>>>traffic>>>downlink`, reset),
            ]);
            const uplink = parseInt(uplinkRes.stat?.[0]?.value || '0');
            const downlink = parseInt(downlinkRes.stat?.[0]?.value || '0');
            return {
                uplink,
                downlink,
                total: uplink + downlink,
            };
        }
        catch (error) {
            logger_1.logger.debug(`Failed to get user stats for ${email}`);
            return { uplink: 0, downlink: 0, total: 0 };
        }
    }
    // 获取所有用户统计
    async getAllUserStats(reset = false) {
        try {
            const response = await this.queryStats('user>>>', reset);
            const stats = new Map();
            const data = response.stat || [];
            for (const stat of data) {
                const match = stat.name.match(/user>>>(.+?)>>>traffic>>>(uplink|downlink)/);
                if (match) {
                    const email = match[1];
                    const type = match[2];
                    const value = parseInt(stat.value) || 0;
                    if (!stats.has(email)) {
                        stats.set(email, { uplink: 0, downlink: 0, total: 0 });
                    }
                    const userStats = stats.get(email);
                    if (type === 'uplink') {
                        userStats.uplink = value;
                    }
                    else {
                        userStats.downlink = value;
                    }
                    userStats.total = userStats.uplink + userStats.downlink;
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.debug('Failed to get all user stats');
            return new Map();
        }
    }
    // ==================== HandlerService API ====================
    // 添加入站
    async addInbound(inboundConfig) {
        try {
            await this.client.post('/handler/addInbound', inboundConfig);
            return true;
        }
        catch (error) {
            logger_1.logger.debug('Failed to add inbound');
            return false;
        }
    }
    // 删除入站
    async removeInbound(tag) {
        try {
            await this.client.post('/handler/removeInbound', { tag });
            return true;
        }
        catch (error) {
            logger_1.logger.debug(`Failed to remove inbound ${tag}`);
            return false;
        }
    }
    // 添加用户
    async addUser(inboundTag, user) {
        try {
            await this.client.post('/handler/addUser', {
                inboundTag,
                user,
            });
            return true;
        }
        catch (error) {
            logger_1.logger.debug(`Failed to add user to inbound ${inboundTag}`);
            return false;
        }
    }
    // 删除用户
    async removeUser(inboundTag, email) {
        try {
            await this.client.post('/handler/removeUser', {
                inboundTag,
                email,
            });
            return true;
        }
        catch (error) {
            logger_1.logger.debug(`Failed to remove user ${email} from inbound ${inboundTag}`);
            return false;
        }
    }
    // ==================== LoggerService API ====================
    // 重启日志
    async restartLogger() {
        try {
            await this.client.post('/logger/restart');
            return true;
        }
        catch (error) {
            logger_1.logger.debug('Failed to restart logger');
            return false;
        }
    }
    // ==================== 便捷方法 ====================
    // 获取节点状态
    async getNodeStatus() {
        try {
            const [sysStats, inboundStats] = await Promise.all([
                this.getSysStats(),
                this.getAllInboundStats(),
            ]);
            return {
                connected: true,
                sysStats,
                inboundStats: Object.fromEntries(inboundStats),
            };
        }
        catch (error) {
            logger_1.logger.debug('Failed to get node status');
            return {
                connected: false,
                sysStats: null,
                inboundStats: {},
            };
        }
    }
    // 获取入站列表
    async getInbounds() {
        // 由于 Xray API 没有直接获取入站列表的方法，
        // 这里返回空数组，实际数据应该从数据库获取
        return [];
    }
    // 热重载配置
    async hotReloadConfig(config) {
        // 热重载配置需要通过其他方式实现
        // 这里返回 false，表示需要重启 Xray 服务
        logger_1.logger.debug('Hot reload not supported');
        return false;
    }
}
exports.XrayClient = XrayClient;
// 全局 Xray 客户端实例
let xrayClientInstance = null;
function getXrayClient(apiHost, apiPort) {
    if (!xrayClientInstance) {
        xrayClientInstance = new XrayClient(apiHost, apiPort);
    }
    return xrayClientInstance;
}
function resetXrayClient() {
    xrayClientInstance = null;
}
exports.default = XrayClient;
//# sourceMappingURL=client.js.map