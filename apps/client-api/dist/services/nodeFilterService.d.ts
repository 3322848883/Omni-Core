import { ServiceType } from '@/constants/service-type';
import { AccessCheckResult } from '@/types/service-type';
/**
 * 节点过滤服务
 * 负责根据用户服务类型过滤节点和检查访问权限
 */
export declare class NodeFilterService {
    /**
     * 根据用户服务类型过滤节点
     * @param nodes - 节点列表
     * @param userServiceTypes - 用户有效的服务类型列表
     * @returns 过滤后的节点列表
     */
    filterNodesByUserServiceTypes<T extends {
        serviceType?: string;
    }>(nodes: T[], userServiceTypes: ServiceType[]): T[];
    /**
     * 检查用户是否有权限访问节点
     * @param nodeServiceType - 节点服务类型
     * @param userServiceTypes - 用户有效的服务类型列表
     * @returns 访问检查结果
     */
    checkNodeAccess(nodeServiceType: ServiceType | string | undefined, userServiceTypes: ServiceType[]): AccessCheckResult;
    /**
     * 获取用户有效的服务类型列表
     * @param userId - 用户ID
     * @returns 用户有效的服务类型列表
     */
    getUserEffectiveServiceTypes(userId: string): Promise<ServiceType[]>;
    /**
     * 获取用户可访问的节点数量统计
     * @param userId - 用户ID
     * @returns 各服务类型的可访问节点数量
     */
    getAccessibleNodeCount(userId: string): Promise<{
        total: number;
        byType: Record<ServiceType, number>;
    }>;
    /**
     * 检查用户是否有权限访问指定节点
     * @param nodeId - 节点ID
     * @param userId - 用户ID
     * @returns 是否有权限访问
     */
    checkUserNodeAccess(nodeId: string, userId: string): Promise<AccessCheckResult>;
}
export declare const nodeFilterService: NodeFilterService;
//# sourceMappingURL=nodeFilterService.d.ts.map