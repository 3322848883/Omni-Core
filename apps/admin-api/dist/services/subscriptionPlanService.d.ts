/**
 * 套餐管理服务
 * 提供套餐的 CRUD 操作和统计功能
 */
import { SubscriptionPlan, CreatePlanData, UpdatePlanData, PlanStats, PlanListQuery, PlanListResponse, PlanGroup } from '../types/subscription-plan';
import { ServiceType } from '@shared/constants';
/**
 * 获取套餐列表
 */
export declare function getPlans(query?: PlanListQuery): Promise<PlanListResponse>;
/**
 * 根据 ID 获取套餐
 */
export declare function getPlanById(id: string): Promise<SubscriptionPlan>;
/**
 * 创建套餐
 */
export declare function createPlan(data: CreatePlanData, operator?: string): Promise<SubscriptionPlan>;
/**
 * 更新套餐
 */
export declare function updatePlan(id: string, data: UpdatePlanData, operator?: string): Promise<SubscriptionPlan>;
/**
 * 删除套餐
 */
export declare function deletePlan(id: string, operator?: string): Promise<void>;
/**
 * 获取套餐统计信息
 */
export declare function getPlanStats(id: string): Promise<PlanStats>;
/**
 * 获取所有套餐组
 */
export declare function getPlanGroups(): Promise<PlanGroup[]>;
/**
 * 激活套餐
 */
export declare function activatePlan(id: string, operator?: string): Promise<SubscriptionPlan>;
/**
 * 停用套餐
 */
export declare function deactivatePlan(id: string, operator?: string): Promise<SubscriptionPlan>;
/**
 * 批量更新套餐排序
 */
export declare function updatePlansSortOrder(sortData: {
    id: string;
    sortOrder: number;
}[], operator?: string): Promise<void>;
/**
 * 获取套餐选项（用于下拉选择）
 */
export declare function getPlanOptions(serviceType?: ServiceType): Promise<Array<{
    id: string;
    name: string;
    price: number;
}>>;
//# sourceMappingURL=subscriptionPlanService.d.ts.map