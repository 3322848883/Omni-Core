"use strict";
/**
 * IP声誉检测服务
 * 集成IPData API进行IP纯净度检测，实现缓存机制和批量检测
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPReputationService = void 0;
exports.getIPReputationService = getIPReputationService;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../cache/redis");
// IP评分阈值
const IPScoreThresholds = {
    EXCELLENT: 90,
    GOOD: 75,
    FAIR: 60,
    POOR: 40,
    CRITICAL: 0
};
/**
 * IP声誉检测服务类
 */
class IPReputationService {
    httpClient;
    redisClient = (0, redis_1.getRedisClient)();
    serviceConfig;
    requestTimestamps = [];
    REQUEST_LOG_WINDOW = 60 * 1000; // 1分钟
    constructor(serviceConfig) {
        // 默认配置 - 运行时动态读取环境变量
        const apiKey = process.env.IPDATA_API_KEY || '';
        logger_1.logger.info(`[IPReputationService] Constructor called, API Key from env: ${apiKey ? 'configured (' + apiKey.substring(0, 10) + '...)' : 'NOT CONFIGURED'}`);
        logger_1.logger.info(`[IPReputationService] NODE_ENV: ${process.env.NODE_ENV}`);
        logger_1.logger.info(`[IPReputationService] All env keys: ${Object.keys(process.env).filter(k => k.includes('IP')).join(', ')}`);
        this.serviceConfig = {
            ipdataApiKey: apiKey,
            cacheTtlSeconds: 24 * 60 * 60, // 24小时
            rateLimit: {
                maxRequestsPerMinute: 10,
                maxRequestsPerHour: 100,
                maxRequestsPerDay: 1000
            },
            alertThreshold: IPScoreThresholds.FAIR, // 60
            criticalThreshold: IPScoreThresholds.POOR, // 40
            ...serviceConfig
        };
        // 初始化HTTP客户端
        this.httpClient = axios_1.default.create({
            baseURL: 'https://api.ipdata.co',
            timeout: 10000,
            headers: {
                'Accept': 'application/json'
            }
        });
    }
    /**
     * 获取当前配置（每次调用时重新读取环境变量）
     */
    getConfig() {
        // 运行时动态读取环境变量，确保获取最新值
        const currentApiKey = process.env.IPDATA_API_KEY || this.serviceConfig.ipdataApiKey;
        return {
            ...this.serviceConfig,
            ipdataApiKey: currentApiKey
        };
    }
    /**
     * 检测单个IP的声誉
     * @param ip IP地址
     * @param forceRefresh 强制刷新缓存
     * @returns IP声誉检测结果
     */
    async checkIP(ip, forceRefresh = false) {
        try {
            // 验证IP格式
            if (!this.isValidIP(ip)) {
                throw new Error(`Invalid IP address: ${ip}`);
            }
            // 1. 检查缓存（除非强制刷新）
            if (!forceRefresh) {
                const cached = await this.getFromCache(ip);
                if (cached && !this.isExpired(cached)) {
                    logger_1.logger.debug(`IP reputation cache hit: ${ip}`);
                    return cached;
                }
            }
            // 2. 检查数据库缓存
            if (!forceRefresh) {
                const dbCached = await this.getFromDatabase(ip);
                if (dbCached && !this.isExpired(dbCached)) {
                    logger_1.logger.debug(`IP reputation DB cache hit: ${ip}`);
                    // 同步到Redis缓存
                    await this.saveToCache(ip, dbCached);
                    return dbCached;
                }
            }
            // 限流检查
            await this.checkRateLimit();
            // 4. 调用IPData API
            const result = await this.callIPDataAPI(ip);
            // 5. 保存到缓存和数据库
            await this.saveToCache(ip, result);
            await this.saveToDatabase(ip, result);
            logger_1.logger.info(`[IPReputationService] IP reputation checked: ${ip}, score: ${result.score}, provider: ${result.provider}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Failed to check IP reputation: ${ip}`, error);
            throw error;
        }
    }
    /**
     * 批量检测IP声誉
     * @param ips IP地址列表
     * @param batchSize 每批大小
     * @param delayMs 批次间延迟（毫秒）
     * @returns 批量检测结果
     */
    async batchCheckIPs(ips, batchSize = 10, delayMs = 1000) {
        const result = {
            total: ips.length,
            success: 0,
            failed: 0,
            results: new Map(),
            errors: new Map()
        };
        // 去重
        const uniqueIps = [...new Set(ips)];
        logger_1.logger.info(`Starting batch IP check for ${uniqueIps.length} unique IPs`);
        // 分批处理
        const batches = this.chunkArray(uniqueIps, batchSize);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            logger_1.logger.debug(`Processing batch ${i + 1}/${batches.length}, size: ${batch.length}`);
            // 并行处理每批
            const batchPromises = batch.map(async (ip) => {
                try {
                    const reputation = await this.checkIP(ip);
                    result.results.set(ip, reputation);
                    result.success++;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    result.errors.set(ip, errorMessage);
                    result.failed++;
                }
            });
            await Promise.all(batchPromises);
            // 批次间延迟（除了最后一批）
            if (i < batches.length - 1 && delayMs > 0) {
                await this.sleep(delayMs);
            }
        }
        logger_1.logger.info(`Batch IP check completed: ${result.success} success, ${result.failed} failed`);
        return result;
    }
    /**
     * 刷新节点IP评分
     * @param nodeId 节点ID
     * @param currentIp 当前IP地址
     * @returns 是否成功
     */
    async refreshNodeIPScore(nodeId, currentIp) {
        try {
            if (!currentIp || !this.isValidIP(currentIp)) {
                logger_1.logger.warn(`Invalid IP for node ${nodeId}: ${currentIp}`);
                return null;
            }
            const reputation = await this.checkIP(currentIp, true);
            // 更新节点评分
            await (0, database_1.db)('nodes')
                .where('id', nodeId)
                .update({
                ip_score: reputation.score,
                updated_at: new Date()
            });
            logger_1.logger.info(`Node ${nodeId} IP score updated: ${reputation.score}`);
            // 低分预警
            const config = this.getConfig();
            if (reputation.score < config.criticalThreshold) {
                await this.sendLowScoreAlert({
                    type: 'CRITICAL_LOW_IP_SCORE',
                    nodeId,
                    ip: currentIp,
                    score: reputation.score,
                    threshold: config.criticalThreshold,
                    detectedAt: new Date()
                });
            }
            else if (reputation.score < config.alertThreshold) {
                await this.sendLowScoreAlert({
                    type: 'LOW_IP_SCORE',
                    nodeId,
                    ip: currentIp,
                    score: reputation.score,
                    threshold: config.alertThreshold,
                    detectedAt: new Date()
                });
            }
            return reputation;
        }
        catch (error) {
            logger_1.logger.error(`Failed to refresh node IP score: ${nodeId}`, error);
            return null;
        }
    }
    /**
     * 从Redis缓存获取
     */
    async getFromCache(ip) {
        try {
            const key = this.getCacheKey(ip);
            const cached = await this.redisClient.getJSON(key);
            return cached;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get IP reputation from cache: ${ip}`, error);
            return null;
        }
    }
    /**
     * 保存到Redis缓存
     */
    async saveToCache(ip, data) {
        try {
            const key = this.getCacheKey(ip);
            const config = this.getConfig();
            const ttl = config.cacheTtlSeconds;
            await this.redisClient.setJSON(key, data, ttl);
        }
        catch (error) {
            logger_1.logger.error(`Failed to save IP reputation to cache: ${ip}`, error);
        }
    }
    /**
     * 从数据库获取缓存
     */
    async getFromDatabase(ip) {
        try {
            const record = await (0, database_1.db)('ip_reputation_cache')
                .where('ip', ip)
                .first();
            if (!record)
                return null;
            return this.mapDatabaseRecordToReputation(record);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get IP reputation from database: ${ip}`, error);
            return null;
        }
    }
    /**
     * 保存到数据库
     */
    async saveToDatabase(ip, data) {
        try {
            const now = new Date();
            const record = {
                id: (0, uuid_1.v4)(),
                ip,
                provider: data.provider,
                score: data.score,
                is_residential: data.isResidential,
                abuse_records: data.abuseRecords,
                raw_data: JSON.stringify(data.rawData),
                checked_at: data.checkedAt,
                expires_at: data.expiresAt,
                created_at: now,
                updated_at: now
            };
            // 使用upsert
            await (0, database_1.db)('ip_reputation_cache')
                .insert(record)
                .onConflict('ip')
                .merge({
                provider: record.provider,
                score: record.score,
                is_residential: record.is_residential,
                abuse_records: record.abuse_records,
                raw_data: record.raw_data,
                checked_at: record.checked_at,
                expires_at: record.expires_at,
                updated_at: record.updated_at
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to save IP reputation to database: ${ip}`, error);
        }
    }
    /**
     * 调用IP检测API（支持多个免费源）
     */
    async callIPDataAPI(ip) {
        const config = this.getConfig();
        logger_1.logger.info(`[IPReputationService] callIPDataAPI called for IP: ${ip}`);
        logger_1.logger.info(`[IPReputationService] API Key from getConfig(): ${config.ipdataApiKey ? 'configured (' + config.ipdataApiKey.substring(0, 10) + '...)' : 'NOT CONFIGURED'}`);
        logger_1.logger.info(`[IPReputationService] API Key from process.env: ${process.env.IPDATA_API_KEY ? 'configured (' + process.env.IPDATA_API_KEY.substring(0, 10) + '...)' : 'NOT CONFIGURED'}`);
        // 优先使用IPData API（如果有Key）
        if (config.ipdataApiKey) {
            logger_1.logger.info(`[IPReputationService] Using IPData API with key for IP: ${ip}`);
            try {
                const result = await this.callIPDataWithKey(ip, config.ipdataApiKey);
                logger_1.logger.info(`[IPReputationService] IPData API success for ${ip}, score: ${result.score}, provider: ${result.provider}`);
                return result;
            }
            catch (error) {
                logger_1.logger.warn(`[IPReputationService] IPData API failed, falling back to free sources: ${error}`);
            }
        }
        else {
            logger_1.logger.warn(`[IPReputationService] No IPData API key configured, using free sources for IP: ${ip}`);
        }
        // 使用免费IP检测源
        try {
            logger_1.logger.info(`[IPReputationService] Using free IP API for IP: ${ip}`);
            return await this.callFreeIPAPIS(ip);
        }
        catch (error) {
            logger_1.logger.warn(`[IPReputationService] Free IP API failed, using basic detection: ${error}`);
            return this.getBasicReputation(ip);
        }
    }
    /**
     * 使用IPData API Key调用
     */
    async callIPDataWithKey(ip, apiKey) {
        const config = this.getConfig();
        const url = `/${ip}?api-key=${apiKey}`;
        logger_1.logger.info(`[IPReputationService] Calling IPData API: https://api.ipdata.co${url.substring(0, url.indexOf('?') + 10)}...`);
        const response = await this.httpClient.get(url);
        const data = response.data;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + config.cacheTtlSeconds * 1000);
        const score = this.calculateScore(data);
        let abuseRecords = 0;
        if (data.threat) {
            if (data.threat.is_tor)
                abuseRecords++;
            if (data.threat.is_proxy)
                abuseRecords++;
            if (data.threat.is_anonymous)
                abuseRecords++;
            if (data.threat.is_known_attacker)
                abuseRecords++;
            if (data.threat.is_known_abuser)
                abuseRecords++;
            if (data.threat.is_threat)
                abuseRecords++;
            if (data.threat.is_bogon)
                abuseRecords++;
        }
        return {
            ip,
            provider: 'ipdata',
            score,
            isResidential: data.asn?.type === 'isp' || false,
            isDatacenter: data.asn?.type === 'hosting' || false,
            isVpn: data.threat?.is_proxy || false,
            isProxy: data.threat?.is_proxy || false,
            isTor: data.threat?.is_tor || false,
            abuseRecords,
            country: data.country_code,
            isp: data.asn?.name || null,
            rawData: data,
            checkedAt: now,
            expiresAt
        };
    }
    /**
     * 调用免费IP检测API（无需Key）
     */
    async callFreeIPAPIS(ip) {
        const config = this.getConfig();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + config.cacheTtlSeconds * 1000);
        // 使用ipapi.co（免费，无需Key，限流）
        try {
            const response = await axios_1.default.get(`https://ipapi.co/${ip}/json/`, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OmniCore/1.0)' }
            });
            const data = response.data;
            // 基于ASN类型判断
            const asnType = data.asn?.toLowerCase() || '';
            const org = data.org?.toLowerCase() || '';
            let isDatacenter = false;
            let isResidential = false;
            let score = 85;
            // 检测数据中心特征
            const dcKeywords = ['hosting', 'datacenter', 'cloud', 'server', 'vps', 'amazon', 'google', 'microsoft', 'alibaba', 'tencent', 'digitalocean', 'linode', 'vultr'];
            for (const keyword of dcKeywords) {
                if (asnType.includes(keyword) || org.includes(keyword)) {
                    isDatacenter = true;
                    score -= 15;
                    break;
                }
            }
            // 检测住宅IP特征
            const residentialKeywords = ['isp', 'telecom', 'broadband', 'cable', 'residential'];
            for (const keyword of residentialKeywords) {
                if (asnType.includes(keyword) || org.includes(keyword)) {
                    isResidential = true;
                    score += 5;
                    break;
                }
            }
            return {
                ip,
                provider: 'ipapi.co',
                score: Math.max(0, Math.min(100, score)),
                isResidential,
                isDatacenter,
                isVpn: false,
                isProxy: false,
                isTor: false,
                abuseRecords: 0,
                country: data.country_code,
                isp: data.org || data.asn || null,
                rawData: data,
                checkedAt: now,
                expiresAt
            };
        }
        catch (error) {
            // 如果ipapi.co失败，使用基本检测
            logger_1.logger.warn(`ipapi.co failed: ${error}`);
            throw error;
        }
    }
    /**
     * 基本IP检测（无需外部API）
     */
    getBasicReputation(ip) {
        const config = this.getConfig();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + config.cacheTtlSeconds * 1000);
        // 基于IP范围进行基本判断
        let score = 75;
        let isDatacenter = false;
        // 常见数据中心IP段（简化判断）
        const dcRanges = [
            /^3\./, /^13\./, /^18\./, /^23\./, /^34\./, /^35\./, /^43\./, /^44\./,
            /^47\./, /^50\./, /^52\./, /^54\./, /^63\./, /^64\./, /^65\./, /^66\./
        ];
        for (const range of dcRanges) {
            if (range.test(ip)) {
                isDatacenter = true;
                score = 70;
                break;
            }
        }
        return {
            ip,
            provider: 'basic',
            score,
            isResidential: !isDatacenter,
            isDatacenter,
            isVpn: null,
            isProxy: null,
            isTor: null,
            abuseRecords: 0,
            country: null,
            isp: null,
            rawData: { method: 'basic_detection' },
            checkedAt: now,
            expiresAt
        };
    }
    /**
     * 计算IP评分
     */
    calculateScore(data) {
        let score = 100;
        // 威胁检测扣分
        if (data.threat) {
            if (data.threat.is_bogon)
                score -= 50;
            if (data.threat.is_tor)
                score -= 30;
            if (data.threat.is_known_attacker)
                score -= 40;
            if (data.threat.is_known_abuser)
                score -= 35;
            if (data.threat.is_threat)
                score -= 25;
            if (data.threat.is_proxy)
                score -= 20;
            if (data.threat.is_anonymous)
                score -= 15;
        }
        // ASN类型扣分
        if (data.asn) {
            const type = data.asn.type?.toLowerCase();
            if (type === 'hosting')
                score -= 10;
            if (type === 'business')
                score -= 5;
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * 检查是否过期
     */
    isExpired(data) {
        return new Date() > data.expiresAt;
    }
    /**
     * 限流检查
     */
    async checkRateLimit() {
        const config = this.getConfig();
        const now = Date.now();
        // 清理过期的请求记录
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => now - timestamp < this.REQUEST_LOG_WINDOW);
        // 检查每分钟限制
        if (this.requestTimestamps.length >= config.rateLimit.maxRequestsPerMinute) {
            throw new Error('Rate limit exceeded: too many requests per minute');
        }
        // 记录请求时间
        this.requestTimestamps.push(now);
    }
    /**
     * 发送低分预警
     */
    async sendLowScoreAlert(alert) {
        try {
            // 保存预警记录到数据库
            await (0, database_1.db)('ip_reputation_alerts').insert({
                id: (0, uuid_1.v4)(),
                type: alert.type,
                node_id: alert.nodeId,
                ip: alert.ip,
                score: alert.score,
                threshold: alert.threshold,
                detected_at: alert.detectedAt,
                created_at: new Date()
            });
            logger_1.logger.warn(`Low IP score alert: ${alert.type}`, {
                nodeId: alert.nodeId,
                ip: alert.ip,
                score: alert.score,
                threshold: alert.threshold
            });
            // TODO: 可以在这里添加更多通知方式（邮件、Webhook等）
        }
        catch (error) {
            logger_1.logger.error('Failed to send low score alert', error);
        }
    }
    /**
     * 验证IP格式
     */
    isValidIP(ip) {
        // IPv4验证
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        // IPv6验证（简化版）
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }
    /**
     * 获取缓存Key
     */
    getCacheKey(ip) {
        return `ip:reputation:${ip}`;
    }
    /**
     * 将数组分块
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    /**
     * 延迟
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 映射数据库记录到IPReputation
     */
    mapDatabaseRecordToReputation(record) {
        return {
            ip: record.ip,
            provider: record.provider,
            score: record.score,
            isResidential: record.is_residential,
            isDatacenter: null,
            isVpn: null,
            isProxy: null,
            isTor: null,
            abuseRecords: record.abuse_records,
            country: null,
            isp: null,
            rawData: record.raw_data ? JSON.parse(record.raw_data) : {},
            checkedAt: record.checked_at,
            expiresAt: record.expires_at
        };
    }
    /**
     * 清理过期缓存
     */
    async cleanExpiredCache() {
        try {
            const result = await (0, database_1.db)('ip_reputation_cache')
                .where('expires_at', '<', new Date())
                .delete();
            logger_1.logger.info(`Cleaned ${result} expired IP reputation cache records`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to clean expired cache', error);
            return 0;
        }
    }
    /**
     * 获取IP声誉统计
     */
    async getReputationStats() {
        try {
            const result = await (0, database_1.db)('ip_reputation_cache')
                .where('expires_at', '>', new Date())
                .count('id as count')
                .avg('score as avgScore')
                .first();
            const config = this.getConfig();
            const lowScoreCount = await (0, database_1.db)('ip_reputation_cache')
                .where('expires_at', '>', new Date())
                .andWhere('score', '<', config.alertThreshold)
                .count('id as count')
                .first();
            return {
                totalCached: parseInt(result?.count || '0', 10),
                avgScore: parseFloat(result?.avgScore || '0'),
                lowScoreCount: parseInt(lowScoreCount?.count || '0', 10)
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get reputation stats', error);
            return {
                totalCached: 0,
                avgScore: 0,
                lowScoreCount: 0
            };
        }
    }
}
exports.IPReputationService = IPReputationService;
// 导出单例实例
let ipReputationServiceInstance = null;
function getIPReputationService() {
    if (!ipReputationServiceInstance) {
        ipReputationServiceInstance = new IPReputationService();
    }
    return ipReputationServiceInstance;
}
exports.default = IPReputationService;
//# sourceMappingURL=index.js.map