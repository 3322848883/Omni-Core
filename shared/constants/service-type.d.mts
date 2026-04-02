/**
 * 获取服务类型标签
 */
export function getServiceTypeLabel(type: any): any;
/**
 * 获取服务类型描述
 */
export function getServiceTypeDescription(type: any): string;
/**
 * 获取服务类型颜色
 */
export function getServiceTypeColor(type: any): string;
/**
 * 获取服务类型背景色
 */
export function getServiceTypeBgColor(type: any): string;
/**
 * 获取服务类型图标
 */
export function getServiceTypeIcon(type: any): string;
/**
 * 获取服务类型优先级
 */
export function getServiceTypePriority(type: any): number;
/**
 * 判断是否为高级服务类型
 */
export function isPremiumServiceType(type: any): boolean;
/**
 * 根据服务类型获取套餐组
 */
export function getPlanGroupByServiceType(type: any): {
    id: string;
    name: string;
    description: string;
    serviceTypes: string[];
    icon: string;
    color: string;
    recommendedFor: string[];
} | undefined;
/**
 * 获取所有服务类型列表
 */
export function getAllServiceTypes(): string[];
/**
 * 验证服务类型是否有效
 */
export function isValidServiceType(type: any): boolean;
export namespace ServiceType {
    let STANDARD: string;
    let DEDICATED_LINE: string;
    let EXCLUSIVE: string;
    let STATIC_RESIDENTIAL: string;
}
export namespace ServiceTypeGroups {
    let BASIC: string[];
    let PRO: string[];
    let ENTERPRISE: string[];
    let RESIDENTIAL: string[];
}
/**
 * 服务类型元数据
 */
export const ServiceTypeMeta: {
    [ServiceType.STANDARD]: {
        label: string;
        description: string;
        color: string;
        bgColor: string;
        icon: string;
        priority: number;
    };
    [ServiceType.DEDICATED_LINE]: {
        label: string;
        description: string;
        color: string;
        bgColor: string;
        icon: string;
        priority: number;
    };
    [ServiceType.EXCLUSIVE]: {
        label: string;
        description: string;
        color: string;
        bgColor: string;
        icon: string;
        priority: number;
    };
    [ServiceType.STATIC_RESIDENTIAL]: {
        label: string;
        description: string;
        color: string;
        bgColor: string;
        icon: string;
        priority: number;
    };
};
/**
 * 套餐组配置
 */
export const PLAN_GROUPS: {
    id: string;
    name: string;
    description: string;
    serviceTypes: string[];
    icon: string;
    color: string;
    recommendedFor: string[];
}[];
/**
 * 预设套餐配置
 */
export const PRESET_PLANS: {
    id: string;
    name: string;
    group: string;
    price: number;
    durationDays: number;
    trafficLimit: number;
    serviceTypes: string[];
    primaryType: string;
    priorityBoost: number;
    guaranteedBandwidth: number;
    maxConnections: number;
    features: string[];
}[];
//# sourceMappingURL=service-type.d.mts.map