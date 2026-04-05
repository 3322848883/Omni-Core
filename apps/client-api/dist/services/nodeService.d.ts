import { Node, NodeConnectionConfig, ConnectionTestResult } from '@/types/user';
import { ServiceType } from '@/constants/service-type';
/**
 * Node Service - 处理节点相关的业务逻辑
 */
export declare class NodeService {
    /**
     * 获取节点列表
     * @param region - 可选的区域筛选
     * @param userId - 可选的用户ID，用于过滤用户有权限访问的节点
     * @returns 节点列表
     */
    getNodes(region?: string, userId?: string): Promise<Node[]>;
    /**
     * 根据ID获取节点详情
     * @param nodeId - 节点ID
     * @param userId - 可选的用户ID，用于权限检查
     * @returns 节点详情
     */
    getNodeById(nodeId: string, userId?: string): Promise<Node>;
    /**
     * 生成节点配置
     * @param nodeId - 节点ID
     * @param userId - 用户ID
     * @returns 节点连接配置
     */
    generateNodeConfig(nodeId: string, userId: string): Promise<NodeConnectionConfig>;
    /**
     * 测试节点连接
     * @param nodeId - 节点ID
     * @returns 连接测试结果
     */
    testNodeConnection(nodeId: string): Promise<ConnectionTestResult>;
    /**
     * 检查节点访问权限（私有方法）
     * @param nodeId - 节点ID
     * @param userId - 用户ID
     * @returns 访问检查结果
     */
    private checkNodeAccess;
    /**
     * 获取用户可访问的节点数量统计
     * @param userId - 用户ID
     * @returns 可访问节点统计
     */
    getAccessibleNodeCount(userId: string): Promise<{
        total: number;
        byType: Record<ServiceType, number>;
    }>;
    /**
     * 获取节点的服务类型标签
     * @param serviceType - 服务类型
     * @returns 服务类型标签
     */
    getServiceTypeLabel(serviceType?: string): string;
    /**
     * 获取节点的服务类型颜色
     * @param serviceType - 服务类型
     * @returns 服务类型颜色
     */
    getServiceTypeColor(serviceType?: string): string;
    /**
     * 获取用户订阅信息
     * @param userId - 用户ID
     * @returns 订阅信息
     */
    private getUserSubscriptionInfo;
    /**
     * 根据订阅信息过滤节点
     * @param nodes - 节点列表
     * @param subscription - 订阅信息
     * @returns 过滤后的节点列表
     */
    private filterNodesBySubscription;
    /**
     * 增强节点信息（添加标签、颜色等）
     * @param node - 原始节点数据
     * @returns 增强后的节点
     */
    private enhanceNodeInfo;
    /**
     * 构建节点显示名称
     * 格式: "地区 [ISP] [IP类型] [线路类型]"
     * 示例: "美国加州 [AT&T] [静态住宅] [IEPL]"
     * @param node - 节点信息
     * @returns 增强的节点名称
     */
    private buildNodeDisplayName;
    /**
     * 检查节点是否可达（私有方法）
     * @param node - 节点信息
     * @returns 是否可达
     */
    private checkNodeReachability;
    /**
     * 模拟网络延迟
     */
    private simulateNetworkDelay;
}
export declare const nodeService: NodeService;
//# sourceMappingURL=nodeService.d.ts.map