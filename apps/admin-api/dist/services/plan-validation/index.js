"use strict";
/**
 * 套餐权益验证服务
 * 实现套餐权益验证逻辑，确保每个套餐只享受自己的权益
 *
 * 重要原则：每个套餐只享受自己的权益，不是等级覆盖
 * - 机场大流量套餐只能访问机房IP+标准线路
 * - 专线套餐只能访问机房IP+CN2/IEPL专线
 * - 住宅IP套餐只能访问住宅IP+IEPL专线
 * - 独享IP套餐只能访问独享IP+IPLC专线
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanValidationService = exports.ValidationErrorCode = void 0;
exports.getPlanValidationService = getPlanValidationService;
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../cache/redis");
const ip_assets_1 = require("../../shared/constants/ip-assets");
const service_type_1 = require("../../shared/constants/service-type");
/**
 * 验证错误码
 */
var ValidationErrorCode;
(function (ValidationErrorCode) {
    ValidationErrorCode["SUBSCRIPTION_NOT_FOUND"] = "SUBSCRIPTION_NOT_FOUND";
    ValidationErrorCode["SUBSCRIPTION_EXPIRED"] = "SUBSCRIPTION_EXPIRED";
    ValidationErrorCode["SERVICE_TYPE_NOT_ALLOWED"] = "SERVICE_TYPE_NOT_ALLOWED";
    ValidationErrorCode["IP_TYPE_NOT_ALLOWED"] = "IP_TYPE_NOT_ALLOWED";
    ValidationErrorCode["LINE_TYPE_NOT_ALLOWED"] = "LINE_TYPE_NOT_ALLOWED";
    ValidationErrorCode["IP_SCORE_TOO_LOW"] = "IP_SCORE_TOO_LOW";
    ValidationErrorCode["NODE_NOT_FOUND"] = "NODE_NOT_FOUND";
    ValidationErrorCode["TRAFFIC_EXCEEDED"] = "TRAFFIC_EXCEEDED";
    ValidationErrorCode["CONNECTION_LIMIT_EXCEEDED"] = "CONNECTION_LIMIT_EXCEEDED";
})(ValidationErrorCode || (exports.ValidationErrorCode = ValidationErrorCode = {}));
/**
 * 套餐权益验证服务类
 */
class PlanValidationService {
    redisClient = (0, redis_1.getRedisClient)();
    CACHE_TTL = 300; // 5分钟缓存
    /**
     * 验证节点访问权限
     * @param userId 用户ID
     * @param nodeId 节点ID
     * @returns 验证结果
     */
    async validateNodeAccess(userId, nodeId) {
        try {
            // 1. 获取用户订阅信息
            const subscription = await this.getUserSubscription(userId);
            if (!subscription) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.SUBSCRIPTION_NOT_FOUND,
                    reason: '您没有有效的订阅套餐'
                };
            }
            // 2. 检查订阅是否过期
            if (subscription.expireDate && new Date() > subscription.expireDate) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.SUBSCRIPTION_EXPIRED,
                    reason: '您的订阅套餐已过期'
                };
            }
            // 3. 检查流量是否超限
            if (subscription.trafficLimit > 0 && subscription.trafficUsed >= subscription.trafficLimit) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.TRAFFIC_EXCEEDED,
                    reason: '您的套餐流量已用完'
                };
            }
            // 4. 获取节点信息
            const node = await this.getNodeInfo(nodeId);
            if (!node) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.NODE_NOT_FOUND,
                    reason: '节点不存在或已下线'
                };
            }
            // 5. 执行权益验证
            return this.validateEntitlement(subscription, node);
        }
        catch (error) {
            logger_1.logger.error(`Failed to validate node access: user=${userId}, node=${nodeId}`, error);
            return {
                allowed: false,
                reason: '验证过程发生错误，请稍后重试'
            };
        }
    }
    /**
     * 验证套餐权益
     * @param subscription 用户订阅
     * @param node 节点信息
     * @returns 验证结果
     */
    validateEntitlement(subscription, node) {
        const planGroup = subscription.planGroup;
        // 规则R1: 机场大流量套餐只能访问机房IP
        if (planGroup === 'airport') {
            if (node.ipType !== ip_assets_1.IpType.DATACENTER) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.IP_TYPE_NOT_ALLOWED,
                    reason: '机场大流量套餐仅支持机房IP节点，如需住宅IP请购买住宅IP套餐'
                };
            }
            // 机场套餐只能使用标准线路
            if (node.lineType !== ip_assets_1.LineType.STANDARD) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.LINE_TYPE_NOT_ALLOWED,
                    reason: '机场大流量套餐仅支持标准线路节点'
                };
            }
        }
        // 规则R2: 住宅IP套餐只能访问住宅IP
        if (planGroup === 'residential') {
            if (![ip_assets_1.IpType.RESIDENTIAL_DYNAMIC, ip_assets_1.IpType.RESIDENTIAL_STATIC].includes(node.ipType)) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.IP_TYPE_NOT_ALLOWED,
                    reason: '住宅IP套餐仅支持住宅IP节点，如需大流量请购买机场套餐'
                };
            }
            // 住宅套餐只能使用IEPL线路
            if (node.lineType !== ip_assets_1.LineType.IEPL) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.LINE_TYPE_NOT_ALLOWED,
                    reason: '住宅IP套餐仅支持IEPL专线节点'
                };
            }
        }
        // 规则R3: 专线套餐只能访问专线线路（不能访问标准线路）
        if (planGroup === 'dedicated') {
            if (node.ipType !== ip_assets_1.IpType.DATACENTER) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.IP_TYPE_NOT_ALLOWED,
                    reason: '专线套餐仅支持机房IP节点'
                };
            }
            // 专线套餐只能使用CN2或IEPL线路
            if (node.lineType !== ip_assets_1.LineType.CN2 && node.lineType !== ip_assets_1.LineType.IEPL) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.LINE_TYPE_NOT_ALLOWED,
                    reason: '专线套餐仅支持CN2/IEPL专线节点，不支持标准线路'
                };
            }
        }
        // 规则R4: 独享套餐只能访问独享IP（不能访问其他类型）
        if (planGroup === 'exclusive') {
            if (node.serviceType !== service_type_1.ServiceType.EXCLUSIVE) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.SERVICE_TYPE_NOT_ALLOWED,
                    reason: '独享套餐仅支持独享IP节点'
                };
            }
            // 独享套餐只能使用IPLC线路
            if (node.lineType !== ip_assets_1.LineType.IPLC) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.LINE_TYPE_NOT_ALLOWED,
                    reason: '独享套餐仅支持IPLC专线节点'
                };
            }
        }
        // 规则R5: 验证服务类型权限
        if (!subscription.serviceTypes.includes(node.serviceType)) {
            return {
                allowed: false,
                code: ValidationErrorCode.SERVICE_TYPE_NOT_ALLOWED,
                reason: `您的套餐不支持${this.getServiceTypeLabel(node.serviceType)}类型节点`
            };
        }
        // 规则R6: 验证IP类型权限
        if (subscription.allowedIpTypes && subscription.allowedIpTypes.length > 0) {
            if (!subscription.allowedIpTypes.includes(node.ipType)) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.IP_TYPE_NOT_ALLOWED,
                    reason: this.getIpTypeRestrictionMessage(planGroup, node.ipType)
                };
            }
        }
        // 规则R7: 验证线路类型权限
        if (subscription.allowedLineTypes && subscription.allowedLineTypes.length > 0) {
            if (!subscription.allowedLineTypes.includes(node.lineType)) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.LINE_TYPE_NOT_ALLOWED,
                    reason: `您的套餐不支持${this.getLineTypeLabel(node.lineType)}线路`
                };
            }
        }
        // 规则R8: IP纯净度检查
        if (subscription.minIpScore !== null && subscription.minIpScore !== undefined) {
            if (node.ipScore !== null && node.ipScore < subscription.minIpScore) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.IP_SCORE_TOO_LOW,
                    reason: '该节点IP纯净度不符合套餐要求'
                };
            }
        }
        // 规则R9: 默认IP纯净度检查（住宅IP要求>=60）
        if (node.ipType === ip_assets_1.IpType.RESIDENTIAL_DYNAMIC || node.ipType === ip_assets_1.IpType.RESIDENTIAL_STATIC) {
            if (node.ipScore !== null && node.ipScore < ip_assets_1.IPScoreThresholds.FAIR) {
                return {
                    allowed: false,
                    code: ValidationErrorCode.IP_SCORE_TOO_LOW,
                    reason: '该住宅IP节点纯净度较低，暂时不可用'
                };
            }
        }
        // 所有验证通过
        return { allowed: true };
    }
    /**
     * 获取用户可访问的节点列表
     * @param userId 用户ID
     * @returns 可访问的节点ID列表
     */
    async getAccessibleNodes(userId) {
        try {
            // 获取用户订阅
            const subscription = await this.getUserSubscription(userId);
            if (!subscription) {
                return [];
            }
            // 检查订阅是否过期
            if (subscription.expireDate && new Date() > subscription.expireDate) {
                return [];
            }
            // 构建查询条件
            const query = (0, database_1.db)('nodes')
                .where('status', 'active');
            // 根据套餐组过滤
            switch (subscription.planGroup) {
                case 'airport':
                    // 机场套餐：只能访问机房IP + 标准线路
                    query.where('ip_type', ip_assets_1.IpType.DATACENTER)
                        .andWhere('line_type', ip_assets_1.LineType.STANDARD);
                    break;
                case 'dedicated':
                    // 专线套餐：只能访问机房IP + CN2/IEPL线路
                    query.where('ip_type', ip_assets_1.IpType.DATACENTER)
                        .andWhere(function () {
                        this.where('line_type', ip_assets_1.LineType.CN2)
                            .orWhere('line_type', ip_assets_1.LineType.IEPL);
                    });
                    break;
                case 'residential':
                    // 住宅套餐：只能访问住宅IP + IEPL线路
                    query.whereIn('ip_type', [ip_assets_1.IpType.RESIDENTIAL_DYNAMIC, ip_assets_1.IpType.RESIDENTIAL_STATIC])
                        .andWhere('line_type', ip_assets_1.LineType.IEPL);
                    break;
                case 'exclusive':
                    // 独享套餐：只能访问独享服务类型 + IPLC线路
                    query.where('service_type', service_type_1.ServiceType.EXCLUSIVE)
                        .andWhere('line_type', ip_assets_1.LineType.IPLC);
                    break;
            }
            // IP纯净度过滤
            query.andWhere(function () {
                this.whereNull('ip_score')
                    .orWhere('ip_score', '>=', ip_assets_1.IPScoreThresholds.FAIR);
            });
            const nodes = await query.select('id');
            return nodes.map(n => n.id);
        }
        catch (error) {
            logger_1.logger.error(`Failed to get accessible nodes for user: ${userId}`, error);
            return [];
        }
    }
    /**
     * 批量验证节点访问权限
     * @param userId 用户ID
     * @param nodeIds 节点ID列表
     * @returns 验证结果映射
     */
    async batchValidateNodeAccess(userId, nodeIds) {
        const results = new Map();
        // 获取用户订阅（只查询一次）
        const subscription = await this.getUserSubscription(userId);
        if (!subscription) {
            for (const nodeId of nodeIds) {
                results.set(nodeId, {
                    allowed: false,
                    code: ValidationErrorCode.SUBSCRIPTION_NOT_FOUND,
                    reason: '您没有有效的订阅套餐'
                });
            }
            return results;
        }
        // 检查订阅是否过期
        if (subscription.expireDate && new Date() > subscription.expireDate) {
            for (const nodeId of nodeIds) {
                results.set(nodeId, {
                    allowed: false,
                    code: ValidationErrorCode.SUBSCRIPTION_EXPIRED,
                    reason: '您的订阅套餐已过期'
                });
            }
            return results;
        }
        // 获取所有节点信息
        const nodes = await (0, database_1.db)('nodes')
            .whereIn('id', nodeIds)
            .select('id', 'ip_type', 'line_type', 'service_type', 'ip_score');
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        // 批量验证
        for (const nodeId of nodeIds) {
            const node = nodeMap.get(nodeId);
            if (!node) {
                results.set(nodeId, {
                    allowed: false,
                    code: ValidationErrorCode.NODE_NOT_FOUND,
                    reason: '节点不存在或已下线'
                });
                continue;
            }
            const result = this.validateEntitlement(subscription, {
                id: node.id,
                ipType: node.ip_type,
                lineType: node.line_type,
                serviceType: node.service_type,
                ipScore: node.ip_score
            });
            results.set(nodeId, result);
        }
        return results;
    }
    /**
     * 获取用户订阅信息
     * @param userId 用户ID
     * @returns 订阅权益配置
     */
    async getUserSubscription(userId) {
        try {
            // 尝试从缓存获取
            const cacheKey = `user:subscription:${userId}`;
            const cached = await this.redisClient.getJSON(cacheKey);
            if (cached) {
                return cached;
            }
            // 从数据库查询
            const subscription = await (0, database_1.db)('user_subscriptions')
                .where({
                user_id: userId,
                status: 'active'
            })
                .where('end_date', '>', new Date())
                .first();
            if (!subscription) {
                return null;
            }
            // 获取套餐配置
            const plan = await (0, database_1.db)('subscription_plans')
                .where('id', subscription.plan_id)
                .first();
            if (!plan) {
                return null;
            }
            // 构建权益配置
            const entitlement = {
                userId,
                planGroup: plan.group_id || plan.group,
                serviceTypes: this.parseJSON(plan.service_types) || [plan.service_type],
                allowedIpTypes: this.parseJSON(plan.allowed_ip_types) || [],
                allowedLineTypes: this.parseJSON(plan.allowed_line_types) || [],
                minIpScore: plan.min_ip_score || null,
                ipRotationEnabled: plan.ip_rotation_enabled || false,
                ipRotationInterval: plan.ip_rotation_interval || null,
                trafficLimit: subscription.traffic_limit || plan.traffic_limit || 0,
                trafficUsed: subscription.traffic_used || 0,
                expireDate: subscription.end_date
            };
            // 缓存结果
            await this.redisClient.setJSON(cacheKey, entitlement, this.CACHE_TTL);
            return entitlement;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get user subscription: ${userId}`, error);
            return null;
        }
    }
    /**
     * 清除用户订阅缓存
     * @param userId 用户ID
     */
    async clearUserSubscriptionCache(userId) {
        const cacheKey = `user:subscription:${userId}`;
        await this.redisClient.del(cacheKey);
    }
    /**
     * 获取节点信息
     * @param nodeId 节点ID
     * @returns 节点信息
     */
    async getNodeInfo(nodeId) {
        try {
            const node = await (0, database_1.db)('nodes')
                .where('id', nodeId)
                .select('id', 'ip_type', 'line_type', 'service_type', 'ip_score')
                .first();
            if (!node)
                return null;
            return {
                id: node.id,
                ipType: node.ip_type || ip_assets_1.IpType.DATACENTER,
                lineType: node.line_type || ip_assets_1.LineType.STANDARD,
                serviceType: node.service_type || service_type_1.ServiceType.STANDARD,
                ipScore: node.ip_score
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get node info: ${nodeId}`, error);
            return null;
        }
    }
    /**
     * 获取套餐组可访问的IP类型
     * @param groupId 套餐组ID
     * @returns IP类型列表
     */
    getAllowedIpTypesForGroup(groupId) {
        const group = (0, ip_assets_1.getPlanGroupById)(groupId);
        return group?.allowedIpTypes || [];
    }
    /**
     * 获取套餐组可访问的线路类型
     * @param groupId 套餐组ID
     * @returns 线路类型列表
     */
    getAllowedLineTypesForGroup(groupId) {
        const group = (0, ip_assets_1.getPlanGroupById)(groupId);
        return group?.allowedLineTypes || [];
    }
    /**
     * 获取IP类型限制提示消息
     */
    getIpTypeRestrictionMessage(planGroup, nodeIpType) {
        const messages = {
            'airport': '机场大流量套餐仅支持机房IP节点，如需住宅IP请购买住宅IP套餐',
            'dedicated': '专线套餐仅支持机房IP节点',
            'residential': '住宅IP套餐仅支持住宅IP节点，如需大流量请购买机场套餐',
            'exclusive': '独享套餐仅支持独享IP节点'
        };
        return messages[planGroup] || '您的套餐不支持该IP类型';
    }
    /**
     * 获取服务类型标签
     */
    getServiceTypeLabel(type) {
        const labels = {
            [service_type_1.ServiceType.STANDARD]: '标准',
            [service_type_1.ServiceType.DEDICATED_LINE]: '专线',
            [service_type_1.ServiceType.EXCLUSIVE]: '独享'
        };
        return labels[type] || type;
    }
    /**
     * 获取线路类型标签
     */
    getLineTypeLabel(type) {
        const labels = {
            [ip_assets_1.LineType.STANDARD]: '标准线路',
            [ip_assets_1.LineType.CN2]: 'CN2',
            [ip_assets_1.LineType.IEPL]: 'IEPL',
            [ip_assets_1.LineType.IPLC]: 'IPLC'
        };
        return labels[type] || type;
    }
    /**
     * 解析JSON字符串
     */
    parseJSON(value) {
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    /**
     * 获取套餐组列表
     */
    getPlanGroups() {
        return ip_assets_1.PLAN_GROUPS_V2.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            allowedIpTypes: group.allowedIpTypes,
            allowedLineTypes: group.allowedLineTypes,
            icon: group.icon,
            color: group.color,
            recommendedFor: group.recommendedFor
        }));
    }
    /**
     * 验证套餐配置是否合法
     * @param config 套餐配置
     * @returns 验证结果
     */
    validatePlanConfig(config) {
        const group = (0, ip_assets_1.getPlanGroupById)(config.groupId);
        if (!group) {
            return {
                allowed: false,
                reason: `无效的套餐组: ${config.groupId}`
            };
        }
        // 验证IP类型配置
        if (config.allowedIpTypes) {
            for (const ipType of config.allowedIpTypes) {
                if (!group.allowedIpTypes.includes(ipType)) {
                    return {
                        allowed: false,
                        reason: `套餐组 ${group.name} 不支持IP类型: ${ipType}`
                    };
                }
            }
        }
        // 验证线路类型配置
        if (config.allowedLineTypes) {
            for (const lineType of config.allowedLineTypes) {
                if (!group.allowedLineTypes.includes(lineType)) {
                    return {
                        allowed: false,
                        reason: `套餐组 ${group.name} 不支持线路类型: ${lineType}`
                    };
                }
            }
        }
        return { allowed: true };
    }
}
exports.PlanValidationService = PlanValidationService;
// 导出单例实例
let planValidationServiceInstance = null;
function getPlanValidationService() {
    if (!planValidationServiceInstance) {
        planValidationServiceInstance = new PlanValidationService();
    }
    return planValidationServiceInstance;
}
exports.default = PlanValidationService;
//# sourceMappingURL=index.js.map