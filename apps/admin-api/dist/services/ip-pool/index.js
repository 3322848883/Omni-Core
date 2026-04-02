"use strict";
/**
 * IP池管理服务
 * 管理IP池的创建、轮换策略、与Xray配置同步
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPPoolService = void 0;
exports.getIPPoolService = getIPPoolService;
const uuid_1 = require("uuid");
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../cache/redis");
const ip_assets_1 = require("../../shared/constants/ip-assets");
const ip_reputation_1 = require("../ip-reputation");
/**
 * IP池管理服务类
 */
class IPPoolService {
    redisClient = (0, redis_1.getRedisClient)();
    ipReputationService = (0, ip_reputation_1.getIPReputationService)();
    /**
     * 创建IP池
     * @param config IP池配置
     * @returns 创建的IP池
     */
    async createIPPool(config) {
        try {
            const now = new Date();
            const poolId = (0, uuid_1.v4)();
            // 1. 创建IP池记录
            const pool = {
                id: poolId,
                name: config.name,
                nodeId: config.nodeId,
                ipType: config.ipType,
                rotationStrategy: config.rotationStrategy,
                rotationInterval: config.rotationInterval,
                currentIndex: 0,
                lastRotationAt: null,
                isActive: true,
                createdAt: now,
                updatedAt: now
            };
            await (0, database_1.db)('ip_pools').insert({
                id: pool.id,
                name: pool.name,
                node_id: pool.nodeId,
                ip_type: pool.ipType,
                rotation_strategy: pool.rotationStrategy,
                rotation_interval: pool.rotationInterval,
                current_index: pool.currentIndex,
                last_rotation_at: pool.lastRotationAt,
                is_active: pool.isActive,
                created_at: pool.createdAt,
                updated_at: pool.updatedAt
            });
            // 2. 添加IP到池
            for (const ip of config.ips) {
                await this.addIPToPool(poolId, ip);
            }
            // 3. 更新节点的IP池关联
            await (0, database_1.db)('nodes')
                .where('id', config.nodeId)
                .update({
                ip_pool_id: poolId,
                ip_rotation_enabled: true,
                ip_rotation_interval: config.rotationInterval,
                updated_at: new Date()
            });
            logger_1.logger.info(`IP pool created: ${poolId}, node: ${config.nodeId}, IPs: ${config.ips.length}`);
            return pool;
        }
        catch (error) {
            logger_1.logger.error('Failed to create IP pool', error);
            throw error;
        }
    }
    /**
     * 添加IP到池
     * @param poolId IP池ID
     * @param ip IP地址
     * @returns IP记录
     */
    async addIPToPool(poolId, ip) {
        try {
            // 验证IP池存在
            const pool = await this.getIPPool(poolId);
            if (!pool) {
                throw new Error(`IP pool not found: ${poolId}`);
            }
            // 检查IP是否已存在
            const existing = await (0, database_1.db)('ip_pool_ips')
                .where({ pool_id: poolId, ip })
                .first();
            if (existing) {
                throw new Error(`IP ${ip} already exists in pool ${poolId}`);
            }
            // 检测IP评分
            let score = null;
            try {
                const reputation = await this.ipReputationService.checkIP(ip);
                score = reputation.score;
            }
            catch (error) {
                logger_1.logger.warn(`Failed to check IP reputation for ${ip}, using null score`);
            }
            const now = new Date();
            const ipRecord = {
                id: (0, uuid_1.v4)(),
                poolId,
                ip,
                status: score && score < ip_assets_1.IPScoreThresholds.POOR ? 'blocked' : 'active',
                score,
                usageCount: 0,
                assignedAt: null,
                releasedAt: null,
                createdAt: now,
                updatedAt: now
            };
            await (0, database_1.db)('ip_pool_ips').insert({
                id: ipRecord.id,
                pool_id: ipRecord.poolId,
                ip: ipRecord.ip,
                status: ipRecord.status,
                score: ipRecord.score,
                usage_count: ipRecord.usageCount,
                assigned_at: ipRecord.assignedAt,
                released_at: ipRecord.releasedAt,
                created_at: ipRecord.createdAt,
                updated_at: ipRecord.updatedAt
            });
            logger_1.logger.debug(`IP added to pool: ${ip} -> ${poolId}`);
            return ipRecord;
        }
        catch (error) {
            logger_1.logger.error(`Failed to add IP to pool: ${ip} -> ${poolId}`, error);
            throw error;
        }
    }
    /**
     * 从池中移除IP
     * @param poolId IP池ID
     * @param ip IP地址
     */
    async removeIPFromPool(poolId, ip) {
        try {
            const result = await (0, database_1.db)('ip_pool_ips')
                .where({ pool_id: poolId, ip })
                .delete();
            if (result === 0) {
                throw new Error(`IP ${ip} not found in pool ${poolId}`);
            }
            logger_1.logger.info(`IP removed from pool: ${ip} from ${poolId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to remove IP from pool: ${ip} from ${poolId}`, error);
            throw error;
        }
    }
    /**
     * 获取IP池
     * @param poolId IP池ID
     * @returns IP池
     */
    async getIPPool(poolId) {
        try {
            const record = await (0, database_1.db)('ip_pools')
                .where('id', poolId)
                .first();
            if (!record)
                return null;
            return this.mapDatabaseRecordToPool(record);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get IP pool: ${poolId}`, error);
            return null;
        }
    }
    /**
     * 获取节点的IP池
     * @param nodeId 节点ID
     * @returns IP池
     */
    async getPoolByNodeId(nodeId) {
        try {
            const record = await (0, database_1.db)('ip_pools')
                .where('node_id', nodeId)
                .first();
            if (!record)
                return null;
            return this.mapDatabaseRecordToPool(record);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get IP pool by node: ${nodeId}`, error);
            return null;
        }
    }
    /**
     * 获取IP池状态
     * @param poolId IP池ID
     * @returns IP池状态
     */
    async getIPPoolStatus(poolId) {
        try {
            const pool = await this.getIPPool(poolId);
            if (!pool)
                return null;
            const ips = await (0, database_1.db)('ip_pool_ips')
                .where('pool_id', poolId)
                .orderBy('created_at', 'asc');
            const ipRecords = ips.map(ip => this.mapDatabaseRecordToPoolIP(ip));
            const activeIpCount = ipRecords.filter(ip => ip.status === 'active').length;
            const blockedIpCount = ipRecords.filter(ip => ip.status === 'blocked').length;
            // 获取当前使用的IP
            const node = await (0, database_1.db)('nodes')
                .where('id', pool.nodeId)
                .select('current_ip')
                .first();
            const currentIp = node?.current_ip || null;
            // 计算下次轮换时间
            let nextRotationAt = null;
            if (pool.lastRotationAt) {
                nextRotationAt = new Date(pool.lastRotationAt.getTime() + pool.rotationInterval * 1000);
            }
            return {
                pool,
                ips: ipRecords,
                activeIpCount,
                blockedIpCount,
                currentIp,
                nextRotationAt
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get IP pool status: ${poolId}`, error);
            return null;
        }
    }
    /**
     * 获取所有活跃的IP池
     * @returns IP池列表
     */
    async getActivePools() {
        try {
            const records = await (0, database_1.db)('ip_pools')
                .where('is_active', true);
            return records.map(record => this.mapDatabaseRecordToPool(record));
        }
        catch (error) {
            logger_1.logger.error('Failed to get active IP pools', error);
            return [];
        }
    }
    /**
     * 轮换IP
     * @param poolId IP池ID
     * @returns 轮换结果
     */
    async rotateIP(poolId) {
        const result = {
            success: false,
            poolId,
            previousIp: null,
            newIp: null,
            rotatedAt: new Date()
        };
        try {
            const pool = await this.getIPPool(poolId);
            if (!pool) {
                throw new Error(`IP pool not found: ${poolId}`);
            }
            // 获取当前IP
            const node = await (0, database_1.db)('nodes')
                .where('id', pool.nodeId)
                .select('current_ip', 'host')
                .first();
            result.previousIp = node?.current_ip || node?.host || null;
            // 获取下一个可用IP
            const nextIP = await this.getNextAvailableIP(pool);
            if (!nextIP) {
                throw new Error(`No available IP in pool: ${poolId}`);
            }
            // 更新IP使用记录
            await this.updateIPUsage(poolId, nextIP);
            // 更新节点配置
            await (0, database_1.db)('nodes')
                .where('id', pool.nodeId)
                .update({
                current_ip: nextIP,
                host: nextIP,
                last_ip_rotation_at: new Date(),
                updated_at: new Date()
            });
            // 同步到Xray（如果配置了Xray服务）
            await this.syncToXray(pool.nodeId, nextIP);
            // 更新池状态
            const newIndex = await this.calculateNextIndex(pool);
            await (0, database_1.db)('ip_pools')
                .where('id', poolId)
                .update({
                current_index: newIndex,
                last_rotation_at: new Date(),
                updated_at: new Date()
            });
            result.success = true;
            result.newIp = nextIP;
            logger_1.logger.info(`IP rotated: ${result.previousIp} -> ${nextIP} (pool: ${poolId})`);
            return result;
        }
        catch (error) {
            result.success = false;
            result.error = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error(`Failed to rotate IP for pool: ${poolId}`, error);
            return result;
        }
    }
    /**
     * 检查是否应该轮换
     * @param pool IP池
     * @returns 是否应该轮换
     */
    shouldRotate(pool) {
        if (!pool.lastRotationAt) {
            return true;
        }
        const nextRotationTime = new Date(pool.lastRotationAt.getTime() + pool.rotationInterval * 1000);
        return new Date() >= nextRotationTime;
    }
    /**
     * 执行定时轮换任务
     * @returns 轮换结果统计
     */
    async scheduledRotation() {
        const stats = {
            total: 0,
            rotated: 0,
            failed: 0,
            results: []
        };
        try {
            const pools = await this.getActivePools();
            stats.total = pools.length;
            logger_1.logger.info(`Starting scheduled IP rotation for ${pools.length} pools`);
            for (const pool of pools) {
                if (this.shouldRotate(pool)) {
                    const result = await this.rotateIP(pool.id);
                    stats.results.push(result);
                    if (result.success) {
                        stats.rotated++;
                    }
                    else {
                        stats.failed++;
                    }
                }
            }
            logger_1.logger.info(`Scheduled IP rotation completed: ${stats.rotated} rotated, ${stats.failed} failed`);
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Failed to execute scheduled rotation', error);
            return stats;
        }
    }
    /**
     * 更新IP池配置
     * @param poolId IP池ID
     * @param updates 更新内容
     */
    async updateIPPool(poolId, updates) {
        try {
            const updateData = {
                updated_at: new Date()
            };
            if (updates.name)
                updateData.name = updates.name;
            if (updates.rotationStrategy)
                updateData.rotation_strategy = updates.rotationStrategy;
            if (updates.rotationInterval)
                updateData.rotation_interval = updates.rotationInterval;
            await (0, database_1.db)('ip_pools')
                .where('id', poolId)
                .update(updateData);
            // 如果更新了轮换间隔，同步更新节点配置
            if (updates.rotationInterval) {
                const pool = await this.getIPPool(poolId);
                if (pool) {
                    await (0, database_1.db)('nodes')
                        .where('id', pool.nodeId)
                        .update({
                        ip_rotation_interval: updates.rotationInterval,
                        updated_at: new Date()
                    });
                }
            }
            logger_1.logger.info(`IP pool updated: ${poolId}`);
            return this.getIPPool(poolId);
        }
        catch (error) {
            logger_1.logger.error(`Failed to update IP pool: ${poolId}`, error);
            return null;
        }
    }
    /**
     * 删除IP池
     * @param poolId IP池ID
     */
    async deleteIPPool(poolId) {
        try {
            const pool = await this.getIPPool(poolId);
            if (!pool) {
                throw new Error(`IP pool not found: ${poolId}`);
            }
            // 清除节点的IP池关联
            await (0, database_1.db)('nodes')
                .where('id', pool.nodeId)
                .update({
                ip_pool_id: null,
                ip_rotation_enabled: false,
                ip_rotation_interval: null,
                updated_at: new Date()
            });
            // 删除IP池（级联删除IP记录）
            await (0, database_1.db)('ip_pools')
                .where('id', poolId)
                .delete();
            logger_1.logger.info(`IP pool deleted: ${poolId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete IP pool: ${poolId}`, error);
            throw error;
        }
    }
    /**
     * 手动触发IP轮换
     * @param poolId IP池ID
     * @returns 轮换结果
     */
    async manualRotate(poolId) {
        logger_1.logger.info(`Manual IP rotation triggered for pool: ${poolId}`);
        return this.rotateIP(poolId);
    }
    /**
     * 获取下一个可用IP
     * @param pool IP池
     * @returns IP地址
     */
    async getNextAvailableIP(pool) {
        try {
            const ips = await (0, database_1.db)('ip_pool_ips')
                .where({
                pool_id: pool.id,
                status: 'active'
            })
                .orderBy('created_at', 'asc');
            if (ips.length === 0) {
                return null;
            }
            switch (pool.rotationStrategy) {
                case ip_assets_1.RotationStrategy.ROUND_ROBIN:
                    return this.getRoundRobinIP(pool, ips);
                case ip_assets_1.RotationStrategy.RANDOM:
                    return this.getRandomIP(ips);
                case ip_assets_1.RotationStrategy.LEAST_USED:
                    return this.getLeastUsedIP(ips);
                case ip_assets_1.RotationStrategy.QUALITY_FIRST:
                    return this.getQualityFirstIP(ips);
                default:
                    return this.getRoundRobinIP(pool, ips);
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to get next available IP for pool: ${pool.id}`, error);
            return null;
        }
    }
    /**
     * 轮询策略获取IP
     */
    getRoundRobinIP(pool, ips) {
        const index = pool.currentIndex % ips.length;
        return ips[index].ip;
    }
    /**
     * 随机策略获取IP
     */
    getRandomIP(ips) {
        const index = Math.floor(Math.random() * ips.length);
        return ips[index].ip;
    }
    /**
     * 最少使用策略获取IP
     */
    getLeastUsedIP(ips) {
        const sorted = [...ips].sort((a, b) => a.usage_count - b.usage_count);
        return sorted[0].ip;
    }
    /**
     * 质量优先策略获取IP
     */
    getQualityFirstIP(ips) {
        // 过滤有评分的IP
        const scored = ips.filter(ip => ip.score !== null);
        if (scored.length === 0) {
            // 如果没有评分的IP，使用随机策略
            return this.getRandomIP(ips);
        }
        // 按评分降序排序
        const sorted = scored.sort((a, b) => b.score - a.score);
        return sorted[0].ip;
    }
    /**
     * 计算下一个索引
     */
    async calculateNextIndex(pool) {
        const count = await (0, database_1.db)('ip_pool_ips')
            .where('pool_id', pool.id)
            .count('id as count')
            .first();
        const total = parseInt(count?.count || '0', 10);
        return total > 0 ? (pool.currentIndex + 1) % total : 0;
    }
    /**
     * 更新IP使用记录
     */
    async updateIPUsage(poolId, ip) {
        try {
            await (0, database_1.db)('ip_pool_ips')
                .where({ pool_id: poolId, ip })
                .update({
                usage_count: database_1.db.raw('usage_count + 1'),
                assigned_at: new Date(),
                updated_at: new Date()
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to update IP usage: ${ip}`, error);
        }
    }
    /**
     * 同步到Xray
     */
    async syncToXray(nodeId, newIp) {
        try {
            // TODO: 实现与Xray API的同步
            // 这里需要调用Xray服务更新入站配置
            logger_1.logger.info(`Syncing IP change to Xray: node=${nodeId}, newIP=${newIp}`);
            // 示例：更新Xray入站配置
            // await xrayService.updateInbound(nodeId, { address: newIp });
        }
        catch (error) {
            logger_1.logger.error(`Failed to sync to Xray: ${nodeId}`, error);
            // 不抛出错误，避免影响IP轮换流程
        }
    }
    /**
     * 刷新IP评分
     * @param poolId IP池ID
     */
    async refreshIPScores(poolId) {
        try {
            const ips = await (0, database_1.db)('ip_pool_ips')
                .where('pool_id', poolId)
                .select('id', 'ip');
            for (const ipRecord of ips) {
                try {
                    const reputation = await this.ipReputationService.checkIP(ipRecord.ip, true);
                    // 更新IP状态
                    const newStatus = reputation.score < ip_assets_1.IPScoreThresholds.POOR ? 'blocked' : 'active';
                    await (0, database_1.db)('ip_pool_ips')
                        .where('id', ipRecord.id)
                        .update({
                        score: reputation.score,
                        status: newStatus,
                        updated_at: new Date()
                    });
                }
                catch (error) {
                    logger_1.logger.error(`Failed to refresh IP score: ${ipRecord.ip}`, error);
                }
            }
            logger_1.logger.info(`IP scores refreshed for pool: ${poolId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to refresh IP scores for pool: ${poolId}`, error);
            throw error;
        }
    }
    /**
     * 获取IP池列表（带分页）
     */
    async listIPPools(options = {}) {
        const { page = 1, limit = 20, nodeId, ipType, isActive } = options;
        try {
            let query = (0, database_1.db)('ip_pools');
            if (nodeId) {
                query = query.where('node_id', nodeId);
            }
            if (ipType) {
                query = query.where('ip_type', ipType);
            }
            if (isActive !== undefined) {
                query = query.where('is_active', isActive);
            }
            const totalResult = await query.clone().count('id as count').first();
            const total = parseInt(totalResult?.count || '0', 10);
            const records = await query
                .orderBy('created_at', 'desc')
                .offset((page - 1) * limit)
                .limit(limit);
            return {
                items: records.map(record => this.mapDatabaseRecordToPool(record)),
                total,
                page,
                limit
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to list IP pools', error);
            return {
                items: [],
                total: 0,
                page,
                limit
            };
        }
    }
    /**
     * 激活/停用IP池
     */
    async setPoolActive(poolId, isActive) {
        try {
            await (0, database_1.db)('ip_pools')
                .where('id', poolId)
                .update({
                is_active: isActive,
                updated_at: new Date()
            });
            const pool = await this.getIPPool(poolId);
            if (pool) {
                // 同步更新节点配置
                await (0, database_1.db)('nodes')
                    .where('id', pool.nodeId)
                    .update({
                    ip_rotation_enabled: isActive,
                    updated_at: new Date()
                });
            }
            logger_1.logger.info(`IP pool ${isActive ? 'activated' : 'deactivated'}: ${poolId}`);
            return pool;
        }
        catch (error) {
            logger_1.logger.error(`Failed to set pool active state: ${poolId}`, error);
            return null;
        }
    }
    /**
     * 映射数据库记录到IPPool
     */
    mapDatabaseRecordToPool(record) {
        return {
            id: record.id,
            name: record.name,
            nodeId: record.node_id,
            ipType: record.ip_type,
            rotationStrategy: record.rotation_strategy,
            rotationInterval: record.rotation_interval,
            currentIndex: record.current_index,
            lastRotationAt: record.last_rotation_at,
            isActive: record.is_active,
            createdAt: record.created_at,
            updatedAt: record.updated_at
        };
    }
    /**
     * 映射数据库记录到IPPoolIP
     */
    mapDatabaseRecordToPoolIP(record) {
        return {
            id: record.id,
            poolId: record.pool_id,
            ip: record.ip,
            status: record.status,
            score: record.score,
            usageCount: record.usage_count,
            assignedAt: record.assigned_at,
            releasedAt: record.released_at,
            createdAt: record.created_at,
            updatedAt: record.updated_at
        };
    }
}
exports.IPPoolService = IPPoolService;
// 导出单例实例
let ipPoolServiceInstance = null;
function getIPPoolService() {
    if (!ipPoolServiceInstance) {
        ipPoolServiceInstance = new IPPoolService();
    }
    return ipPoolServiceInstance;
}
exports.default = IPPoolService;
//# sourceMappingURL=index.js.map