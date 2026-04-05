// Subscription Types
import { ServiceType } from '@/constants/service-type';

// IP类型枚举
export enum IpType {
  DATACENTER = 'datacenter',
  RESIDENTIAL_DYNAMIC = 'residential_dynamic',
  RESIDENTIAL_STATIC = 'residential_static',
  MOBILE = 'mobile'
}

// 线路类型枚举
export enum LineType {
  STANDARD = 'standard',
  CN2 = 'cn2',
  IEPL = 'iepl',
  IPLC = 'iplc'
}

// 服务类型详情
export interface ServiceTypeDetail {
  type: ServiceType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  priority: number;
}

// 套餐组
export interface PlanGroup {
  id: string;
  name: string;
  shortDesc: string;
  description: string;
  color: string;
  gradient?: string;
  icon: string;
  features: string[];
  scenarios: string[];
  plans?: Plan[];
}

// IP类型信息
export interface IpTypeInfo {
  type: IpType;
  label: string;
  description: string;
  color: string;
}

// 线路类型信息
export interface LineTypeInfo {
  type: LineType;
  label: string;
  description: string;
  color: string;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled';
  trafficLimit: number;
  trafficUsed: number;
  trafficRemaining: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  features: string[];
  // 服务类型相关字段
  service_types: ServiceType[];
  effective_service_types: ServiceType[];
  accessible_nodes: number;
  // IP类型和线路类型
  ip_types: IpType[];
  line_types: LineType[];
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  period: 'month' | 'quarter' | 'year';
  trafficLimit: number;
  traffic_limit: number;
  deviceLimit: number;
  device_limit: number;
  speedLimit?: number;
  bandwidth: number;
  features: string[];
  recommended?: boolean;
  is_recommended?: boolean;
  // 套餐组
  group_id: string;
  group_name?: string;
  // 服务类型相关字段
  service_types: ServiceType[];
  service_type_details: ServiceTypeDetail[];
  primary_service_type: ServiceType;
  guaranteed_bandwidth: number;
  max_connections: number;
  // IP类型和线路类型
  ip_types: IpType[];
  line_types: LineType[];
  // 适用场景
  scenarios: string[];
  // 节点统计
  nodeStats?: {
    total: number;
    byRegion: Record<string, number>;
  };
}

// 可访问节点统计
export interface AccessibleNodesStats {
  total: number;
  byType: Record<ServiceType, number>;
  byIpType: Record<IpType, number>;
  byLineType: Record<LineType, number>;
}

// 订阅信息扩展
export interface SubscriptionInfo {
  planName: string;
  expireDate: string;
  trafficLimit: number;
  trafficUsed: number;
  trafficRemaining: number;
  usagePercent: number;
  daysRemaining: number;
  // 服务类型相关字段
  serviceTypes: ServiceType[];
  effectiveServiceTypes: ServiceType[];
  accessibleNodes: AccessibleNodesStats;
  guaranteedBandwidth: number;
  priorityLevel: number;
  // IP类型和线路类型
  ipTypes: IpType[];
  lineTypes: LineType[];
  // 套餐组
  planGroup?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  // 设备限制
  deviceLimit?: number;
  // 套餐权益
  features: string[];
}

// 套餐列表参数
export interface PlanListParams {
  serviceType?: ServiceType;
  groupId?: string;
  minPrice?: number;
  maxPrice?: number;
}

// 套餐详情
export interface PlanDetail extends Plan {
  // 完整描述
  fullDescription: string;
  // 详细特性
  detailedFeatures: {
    title: string;
    description: string;
    icon: string;
  }[];
  // IP类型详情
  ipTypeDetails: IpTypeInfo[];
  // 线路类型详情
  lineTypeDetails: LineTypeInfo[];
  // 节点统计
  nodeStats: {
    total: number;
    byRegion: Record<string, number>;
  };
}
