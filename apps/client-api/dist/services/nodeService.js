"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeService = exports.NodeService = void 0;
const database_1 = __importDefault(require("@/config/database"));
const user_1 = require("@/types/user");
const AppError_1 = require("@/errors/AppError");
const logger_1 = __importDefault(require("@/utils/logger"));
const service_type_1 = require("@/constants/service-type");
const nodeFilterService_1 = require("./nodeFilterService");
const ip_type_1 = require("@/constants/ip-type");
/**
 * Node Service - 处理节点相关的业务逻辑
 */
class NodeService {
    /**
     * 获取节点列表
     * @param region - 可选的区域筛选
     * @param userId - 可选的用户ID，用于过滤用户有权限访问的节点
     * @returns 节点列表
     */
    async getNodes(region, userId) {
        try {
            let query = (0, database_1.default)('nodes')
                .where('status', 'online')
                .orderBy('priority', 'desc')
                .orderBy('health_score', 'desc');
            if (region) {
                query = query.where({ region });
            }
            const nodes = await query.select('id', 'code', 'name', 'region', 'country', 'city', 'latitude', 'longitude', 'host', 'port', 'protocol', 'status', 'health_score as healthScore', 'load_percent as loadPercent', 'active_connections as activeConnections', 'max_connections as maxConnections', 'priority', 'is_backup as isBackup', 'service_type as serviceType', 
            // IP资产管理新字段
            'ip_type as ipType', 'line_type as lineType', 'isp_name as ispName', 'ip_score as ipScore', 'supports_ipv6 as supportsIPv6');
            // 如果提供了用户ID，根据用户服务类型过滤节点
            if (userId) {
                const userServiceTypes = await nodeFilterService_1.nodeFilterService.getUserEffectiveServiceTypes(userId);
                let filteredNodes = nodeFilterService_1.nodeFilterService.filterNodesByUserServiceTypes(nodes, userServiceTypes);
                // 获取用户订阅信息以进行IP类型和线路类型过滤
                const userSubscription = await this.getUserSubscriptionInfo(userId);
                if (userSubscription) {
                    filteredNodes = this.filterNodesBySubscription(filteredNodes, userSubscription);
                }
                return filteredNodes.map(node => this.enhanceNodeInfo(node));
            }
            return nodes.map(node => this.enhanceNodeInfo(node));
        }
        catch (error) {
            logger_1.default.error('Failed to get nodes:', error);
            throw error;
        }
    }
    /**
     * 根据ID获取节点详情
     * @param nodeId - 节点ID
     * @param userId - 可选的用户ID，用于权限检查
     * @returns 节点详情
     */
    async getNodeById(nodeId, userId) {
        try {
            const node = await (0, database_1.default)('nodes')
                .where({ id: nodeId })
                .first('id', 'code', 'name', 'region', 'country', 'city', 'latitude', 'longitude', 'host', 'port', 'protocol', 'status', 'health_score as healthScore', 'load_percent as loadPercent', 'active_connections as activeConnections', 'max_connections as maxConnections', 'priority', 'is_backup as isBackup', 'service_type as serviceType', 
            // IP资产管理新字段
            'ip_type as ipType', 'line_type as lineType', 'isp_name as ispName', 'ip_score as ipScore', 'supports_ipv6 as supportsIPv6');
            if (!node) {
                throw new AppError_1.NotFoundError('Node', nodeId);
            }
            // 如果提供了用户ID，检查访问权限
            if (userId) {
                const accessCheck = await this.checkNodeAccess(nodeId, userId);
                if (!accessCheck.allowed) {
                    throw new AppError_1.ForbiddenError(accessCheck.reason || '无权访问该节点');
                }
            }
            return this.enhanceNodeInfo(node);
        }
        catch (error) {
            logger_1.default.error(`Failed to get node ${nodeId}:`, error);
            throw error;
        }
    }
    /**
     * 生成节点配置
     * @param nodeId - 节点ID
     * @param userId - 用户ID
     * @returns 节点连接配置
     */
    async generateNodeConfig(nodeId, userId) {
        try {
            // 检查用户是否有权限访问该节点
            const accessCheck = await this.checkNodeAccess(nodeId, userId);
            if (!accessCheck.allowed) {
                throw new AppError_1.ForbiddenError(accessCheck.reason || '无权访问该节点');
            }
            // 获取节点信息
            const node = await this.getNodeById(nodeId);
            // 获取用户信息
            const user = await (0, database_1.default)('users')
                .where({ user_id: userId })
                .first('vpn_uuid as vpnUuid');
            if (!user) {
                throw new AppError_1.NotFoundError('User', userId);
            }
            // 构建增强的节点名称
            const enhancedName = this.buildNodeDisplayName(node);
            // 构建配置
            const config = {
                v: '2',
                ps: enhancedName,
                add: node.host,
                port: node.port.toString(),
                id: user.vpnUuid,
                aid: '0',
                scy: 'auto',
                net: 'tcp',
                type: 'none',
                host: '',
                path: '',
                tls: 'none',
                sni: '',
            };
            // 根据协议类型调整配置
            if (node.protocol === 'vmess') {
                config.net = 'ws';
                config.path = '/ws';
            }
            else if (node.protocol === 'vless') {
                config.flow = 'xtls-rprx-vision';
                config.tls = 'tls';
            }
            // 生成配置URL
            const configString = Buffer.from(JSON.stringify(config)).toString('base64');
            const url = `${node.protocol}://${configString}`;
            return {
                id: node.id,
                name: enhancedName,
                protocol: node.protocol,
                host: node.host,
                port: node.port,
                config,
                url,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to generate config for node ${nodeId}:`, error);
            throw error;
        }
    }
    /**
     * 测试节点连接
     * @param nodeId - 节点ID
     * @returns 连接测试结果
     */
    async testNodeConnection(nodeId) {
        try {
            const node = await this.getNodeById(nodeId);
            // 模拟连接测试（实际实现中应该使用真实的网络测试）
            const startTime = Date.now();
            // 这里可以实现真实的连接测试逻辑
            // 例如：尝试建立 TCP 连接或发送探测请求
            const isReachable = await this.checkNodeReachability(node);
            const latency = Date.now() - startTime;
            return {
                nodeId: node.id,
                success: isReachable,
                latency: isReachable ? latency : -1,
                message: isReachable
                    ? `Connection successful, latency: ${latency}ms`
                    : 'Connection failed',
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to test connection for node ${nodeId}:`, error);
            return {
                nodeId,
                success: false,
                latency: -1,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * 检查节点访问权限（私有方法）
     * @param nodeId - 节点ID
     * @param userId - 用户ID
     * @returns 访问检查结果
     */
    async checkNodeAccess(nodeId, userId) {
        return await nodeFilterService_1.nodeFilterService.checkUserNodeAccess(nodeId, userId);
    }
    /**
     * 获取用户可访问的节点数量统计
     * @param userId - 用户ID
     * @returns 可访问节点统计
     */
    async getAccessibleNodeCount(userId) {
        return await nodeFilterService_1.nodeFilterService.getAccessibleNodeCount(userId);
    }
    /**
     * 获取节点的服务类型标签
     * @param serviceType - 服务类型
     * @returns 服务类型标签
     */
    getServiceTypeLabel(serviceType) {
        const type = serviceType || service_type_1.ServiceType.STANDARD;
        return service_type_1.ServiceTypeMeta[type]?.label || type;
    }
    /**
     * 获取节点的服务类型颜色
     * @param serviceType - 服务类型
     * @returns 服务类型颜色
     */
    getServiceTypeColor(serviceType) {
        const type = serviceType || service_type_1.ServiceType.STANDARD;
        return service_type_1.ServiceTypeMeta[type]?.color || '#666666';
    }
    /**
     * 获取用户订阅信息
     * @param userId - 用户ID
     * @returns 订阅信息
     */
    async getUserSubscriptionInfo(userId) {
        try {
            const subscription = await (0, database_1.default)('user_subscriptions')
                .join('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.id')
                .where('user_subscriptions.user_id', userId)
                .where('user_subscriptions.status', 'active')
                .where('user_subscriptions.end_date', '>', database_1.default.fn.now())
                .first('subscription_plans.allowed_ip_types as allowedIpTypes', 'subscription_plans.allowed_line_types as allowedLineTypes', 'subscription_plans.min_ip_score as minIpScore');
            if (!subscription) {
                return null;
            }
            return {
                allowedIpTypes: subscription.allowedIpTypes ? JSON.parse(subscription.allowedIpTypes) : undefined,
                allowedLineTypes: subscription.allowedLineTypes ? JSON.parse(subscription.allowedLineTypes) : undefined,
                minIpScore: subscription.minIpScore
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to get user subscription info for ${userId}:`, error);
            return null;
        }
    }
    /**
     * 根据订阅信息过滤节点
     * @param nodes - 节点列表
     * @param subscription - 订阅信息
     * @returns 过滤后的节点列表
     */
    filterNodesBySubscription(nodes, subscription) {
        return nodes.filter(node => {
            // 检查IP类型权限
            if (subscription.allowedIpTypes && subscription.allowedIpTypes.length > 0) {
                if (!node.ipType || !subscription.allowedIpTypes.includes(node.ipType)) {
                    return false;
                }
            }
            // 检查线路类型权限
            if (subscription.allowedLineTypes && subscription.allowedLineTypes.length > 0) {
                if (!node.lineType || !subscription.allowedLineTypes.includes(node.lineType)) {
                    return false;
                }
            }
            // 检查IP评分要求
            if (subscription.minIpScore !== undefined && subscription.minIpScore !== null) {
                if (node.ipScore !== undefined && node.ipScore !== null && node.ipScore < subscription.minIpScore) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * 增强节点信息（添加标签、颜色等）
     * @param node - 原始节点数据
     * @returns 增强后的节点
     */
    enhanceNodeInfo(node) {
        const enhanced = { ...node };
        // 添加服务类型标签和颜色
        enhanced.serviceType = node.serviceType || service_type_1.ServiceType.STANDARD;
        // 添加IP类型标签
        if (node.ipType) {
            enhanced.ipTypeLabel = ip_type_1.IpTypeMeta[node.ipType]?.label || node.ipType;
        }
        // 添加线路类型标签
        if (node.lineType) {
            enhanced.lineTypeLabel = ip_type_1.LineTypeMeta[node.lineType]?.label || node.lineType;
        }
        return enhanced;
    }
    /**
     * 构建节点显示名称
     * 格式: "地区 [ISP] [IP类型] [线路类型]"
     * 示例: "美国加州 [AT&T] [静态住宅] [IEPL]"
     * @param node - 节点信息
     * @returns 增强的节点名称
     */
    buildNodeDisplayName(node) {
        const parts = [node.name];
        // 添加ISP
        if (node.ispName) {
            parts.push(`[${node.ispName}]`);
        }
        // 添加IP类型
        if (node.ipType && node.ipType !== user_1.IpType.DATACENTER) {
            const ipTypeLabel = ip_type_1.IpTypeMeta[node.ipType]?.label || node.ipType;
            parts.push(`[${ipTypeLabel}]`);
        }
        // 添加线路类型
        if (node.lineType && node.lineType !== user_1.LineType.STANDARD) {
            const lineTypeLabel = ip_type_1.LineTypeMeta[node.lineType]?.label || node.lineType;
            parts.push(`[${lineTypeLabel}]`);
        }
        return parts.join(' ');
    }
    /**
     * 检查节点是否可达（私有方法）
     * @param node - 节点信息
     * @returns 是否可达
     */
    async checkNodeReachability(node) {
        // 简化实现：根据节点健康分数判断
        // 实际生产环境应该实现真实的网络探测
        if (node.status !== 'active') {
            return false;
        }
        if (node.healthScore < 30) {
            return false;
        }
        // 模拟网络延迟测试
        await this.simulateNetworkDelay();
        return true;
    }
    /**
     * 模拟网络延迟
     */
    async simulateNetworkDelay() {
        return new Promise((resolve) => {
            setTimeout(resolve, Math.random() * 100 + 50);
        });
    }
}
exports.NodeService = NodeService;
// 导出单例实例
exports.nodeService = new NodeService();
//# sourceMappingURL=nodeService.js.map