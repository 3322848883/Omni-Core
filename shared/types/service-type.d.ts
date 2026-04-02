/**
 * 服务类型相关类型定义
 * 用于套餐服务类型支持功能
 */
import { ServiceType } from '../constants/service-type';
import { IpType, LineType } from '../constants/ip-type';
/**
 * 节点服务类型扩展
 */
export interface NodeServiceTypeExtension {
    serviceType: ServiceType;
    serviceGroup: string;
    isPremium: boolean;
    bandwidthLimit: number;
    qosLevel: number;
    maxUsers: number;
    currentUsers: number;
}
/**
 * 套餐服务类型扩展
 */
export interface PlanServiceTypeExtension {
    groupId: string;
    serviceTypes: ServiceType[];
    primaryServiceType: ServiceType;
    priorityBoost: number;
    guaranteedBandwidth: number;
    maxConnections: number;
    sortOrder: number;
}
/**
 * 用户订阅服务类型扩展
 */
export interface UserSubscriptionExtension {
    serviceTypes: ServiceType[];
    effectiveServiceTypes: ServiceType[];
    subscriptionLevel: number;
}
/**
 * 用户服务类型扩展
 */
export interface UserServiceTypeExtension {
    effectiveServiceTypes: ServiceType[];
    serviceTypeExpires: Record<ServiceType, string>;
}
/**
 * 访问检查结果
 */
export interface AccessCheckResult {
    allowed: boolean;
    reason?: string;
    currentTypes?: ServiceType[];
    requiredType?: ServiceType;
}
/**
 * 套餐组配置
 */
export interface PlanGroupConfig {
    id: string;
    name: string;
    description: string;
    serviceTypes: ServiceType[];
    ipTypes: IpType[];
    lineTypes: LineType[];
    allowedIpTypes?: IpType[];
    allowedLineTypes?: LineType[];
    icon?: string;
    color?: string;
    recommendedFor?: string[];
}
/**
 * 套餐配置
 */
export interface PlanConfig {
    id: string;
    name: string;
    group: string;
    price: number;
    durationDays: number;
    trafficLimit: number;
    serviceTypes: ServiceType[];
    primaryType: ServiceType;
    priorityBoost: number;
    guaranteedBandwidth: number;
    maxConnections: number;
    features: string[];
    allowedIpTypes?: IpType[];
    allowedLineTypes?: LineType[];
    minIpScore?: number;
    ipRotationEnabled?: boolean;
    ipRotationInterval?: number;
}
/**
 * 流量记录（带服务类型）
 */
export interface TrafficRecord {
    userId: string;
    nodeId: string;
    serviceType: ServiceType;
    upload: number;
    download: number;
    timestamp: Date;
}
/**
 * 按服务类型的流量统计
 */
export interface TrafficByServiceType {
}
/**
 * 流量概览
 */
export interface TrafficOverview {
    totalUsed: number;
    totalLimit: number;
    byServiceType: TrafficByServiceType;
}
/**
 * 可访问节点统计
 */
export interface AccessibleNodesStats {
    total: number;
    byType: Record<ServiceType, number>;
}
/**
 * 服务类型详情
 */
export interface ServiceTypeDetail {
    type: ServiceType;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    icon: string;
    priority: number;
}
/**
 * 节点过滤选项
 */
export interface NodeFilterOptions {
    serviceType?: ServiceType;
    serviceGroup?: string;
    isPremium?: boolean;
    minQosLevel?: number;
    region?: string;
    ipType?: IpType;
    ipTypes?: IpType[];
    lineType?: LineType;
    lineTypes?: LineType[];
    ispName?: string;
    minIpScore?: number;
    supportsIPv6?: boolean;
    ipPoolId?: string;
}
/**
 * 缓存的节点配置
 */
export interface CachedNodeConfig {
    id: string;
    name: string;
    serviceType: ServiceType;
    serviceGroup: string;
    qosLevel: number;
    bandwidthLimit: number;
    maxUsers: number;
    currentUsers: number;
    host: string;
    port: number;
    protocol: string;
    network: string;
    security: string;
    ipType: IpType;
    lineType: LineType;
    ispName?: string;
    ipScore?: number;
    supportsIPv6: boolean;
    ipPoolId?: string;
    currentIp?: string;
    ipRotationEnabled: boolean;
    ipRotationInterval?: number;
    lastIpRotationAt?: Date;
}
/**
 * 缓存的用户配置
 */
export interface CachedUserConfig {
    userId: string;
    uuid: string;
    effectiveServiceTypes: ServiceType[];
    serviceTypeExpires: Record<ServiceType, string>;
    trafficLimit: number;
    trafficUsed: number;
    expireDate: Date | null;
}
export type { IPReputation, IPPoolConfig, IPPoolIP, IPRotationResult } from './ip-assets';
/**
 * 套餐权益验证结果
 */
export interface PlanValidationResult {
    allowed: boolean;
    reason?: string;
    planGroup?: string;
    allowedIpTypes?: IpType[];
    allowedLineTypes?: LineType[];
    minIpScore?: number;
}
/**
 * 节点访问权限检查参数
 */
export interface NodeAccessCheckParams {
    userId: string;
    nodeId: string;
    nodeIpType: IpType;
    nodeLineType: LineType;
    nodeServiceType: ServiceType;
    nodeIpScore?: number;
}
//# sourceMappingURL=service-type.d.ts.map