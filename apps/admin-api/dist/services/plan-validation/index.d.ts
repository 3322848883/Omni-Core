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
import { PlanValidationResult, UserSubscriptionEntitlement } from '../../shared/types/ip-assets';
import { IpType, LineType } from '../../shared/constants/ip-assets';
/**
 * 验证错误码
 */
export declare enum ValidationErrorCode {
    SUBSCRIPTION_NOT_FOUND = "SUBSCRIPTION_NOT_FOUND",
    SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
    SERVICE_TYPE_NOT_ALLOWED = "SERVICE_TYPE_NOT_ALLOWED",
    IP_TYPE_NOT_ALLOWED = "IP_TYPE_NOT_ALLOWED",
    LINE_TYPE_NOT_ALLOWED = "LINE_TYPE_NOT_ALLOWED",
    IP_SCORE_TOO_LOW = "IP_SCORE_TOO_LOW",
    NODE_NOT_FOUND = "NODE_NOT_FOUND",
    TRAFFIC_EXCEEDED = "TRAFFIC_EXCEEDED",
    CONNECTION_LIMIT_EXCEEDED = "CONNECTION_LIMIT_EXCEEDED"
}
/**
 * 套餐权益验证服务类
 */
export declare class PlanValidationService {
    private redisClient;
    private readonly CACHE_TTL;
    /**
     * 验证节点访问权限
     * @param userId 用户ID
     * @param nodeId 节点ID
     * @returns 验证结果
     */
    validateNodeAccess(userId: string, nodeId: string): Promise<PlanValidationResult>;
    /**
     * 验证套餐权益
     * @param subscription 用户订阅
     * @param node 节点信息
     * @returns 验证结果
     */
    private validateEntitlement;
    /**
     * 获取用户可访问的节点列表
     * @param userId 用户ID
     * @returns 可访问的节点ID列表
     */
    getAccessibleNodes(userId: string): Promise<string[]>;
    /**
     * 批量验证节点访问权限
     * @param userId 用户ID
     * @param nodeIds 节点ID列表
     * @returns 验证结果映射
     */
    batchValidateNodeAccess(userId: string, nodeIds: string[]): Promise<Map<string, PlanValidationResult>>;
    /**
     * 获取用户订阅信息
     * @param userId 用户ID
     * @returns 订阅权益配置
     */
    getUserSubscription(userId: string): Promise<UserSubscriptionEntitlement | null>;
    /**
     * 清除用户订阅缓存
     * @param userId 用户ID
     */
    clearUserSubscriptionCache(userId: string): Promise<void>;
    /**
     * 获取节点信息
     * @param nodeId 节点ID
     * @returns 节点信息
     */
    private getNodeInfo;
    /**
     * 获取套餐组可访问的IP类型
     * @param groupId 套餐组ID
     * @returns IP类型列表
     */
    getAllowedIpTypesForGroup(groupId: string): IpType[];
    /**
     * 获取套餐组可访问的线路类型
     * @param groupId 套餐组ID
     * @returns 线路类型列表
     */
    getAllowedLineTypesForGroup(groupId: string): LineType[];
    /**
     * 获取IP类型限制提示消息
     */
    private getIpTypeRestrictionMessage;
    /**
     * 获取服务类型标签
     */
    private getServiceTypeLabel;
    /**
     * 获取线路类型标签
     */
    private getLineTypeLabel;
    /**
     * 解析JSON字符串
     */
    private parseJSON;
    /**
     * 获取套餐组列表
     */
    getPlanGroups(): {
        id: string;
        name: string;
        description: string;
        allowedIpTypes: any;
        allowedLineTypes: any;
        icon: any;
        color: any;
        recommendedFor: any;
    }[];
    /**
     * 验证套餐配置是否合法
     * @param config 套餐配置
     * @returns 验证结果
     */
    validatePlanConfig(config: {
        groupId: string;
        allowedIpTypes?: IpType[];
        allowedLineTypes?: LineType[];
    }): PlanValidationResult;
}
export declare function getPlanValidationService(): PlanValidationService;
export default PlanValidationService;
//# sourceMappingURL=index.d.ts.map