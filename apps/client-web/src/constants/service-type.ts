/**
 * 服务类型常量定义
 * 用于套餐服务类型支持功能
 */

/**
 * 服务类型枚举
 */
export enum ServiceType {
  STANDARD = 'standard',
  DEDICATED_LINE = 'dedicated_line',
  EXCLUSIVE = 'exclusive',
  STATIC_RESIDENTIAL = 'static_residential'
}

/**
 * 服务类型元数据
 */
export const ServiceTypeMeta: Record<ServiceType, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  priority: number;
}> = {
  [ServiceType.STANDARD]: {
    label: '标准',
    description: '普通共享节点，适合日常使用',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: 'plane',
    priority: 1
  },
  [ServiceType.DEDICATED_LINE]: {
    label: '专线',
    description: '高质量专线，低延迟高稳定',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: 'crown',
    priority: 2
  },
  [ServiceType.EXCLUSIVE]: {
    label: '独享',
    description: '独立IP资源，单用户专用',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    icon: 'shield',
    priority: 3
  },
  [ServiceType.STATIC_RESIDENTIAL]: {
    label: '静态住宅',
    description: '固定住宅IP，高匿名性，适合长期使用',
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: 'home',
    priority: 4
  }
};

/**
 * 套餐组配置
 */
export const PLAN_GROUPS = [
  {
    id: 'standard',
    name: '标准套餐',
    description: '普通共享节点，适合日常使用',
    serviceTypes: [ServiceType.STANDARD],
    icon: 'plane',
    color: '#3B82F6',
    recommendedFor: ['日常浏览', '轻度使用', '预算有限']
  },
  {
    id: 'dedicated_line',
    name: '专线套餐',
    description: '高质量专线，低延迟高稳定',
    serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
    icon: 'crown',
    color: '#F59E0B',
    recommendedFor: ['游戏加速', '视频流媒体', '高频交易']
  },
  {
    id: 'exclusive',
    name: '独享套餐',
    description: '独立IP资源，单用户专用',
    serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE],
    icon: 'shield',
    color: '#EC4899',
    recommendedFor: ['企业用户', 'IP敏感业务', '高安全需求']
  },
  {
    id: 'static_residential',
    name: '静态住宅套餐',
    description: '固定住宅IP，高匿名性，适合长期使用',
    serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL],
    icon: 'home',
    color: '#10B981',
    recommendedFor: ['跨境电商', '社交媒体运营', '长期稳定连接']
  }
] as const;

/**
 * 获取服务类型标签
 */
export function getServiceTypeLabel(type: ServiceType): string {
  return ServiceTypeMeta[type]?.label || type;
}

/**
 * 获取服务类型描述
 */
export function getServiceTypeDescription(type: ServiceType): string {
  return ServiceTypeMeta[type]?.description || '';
}

/**
 * 获取服务类型颜色
 */
export function getServiceTypeColor(type: ServiceType): string {
  return ServiceTypeMeta[type]?.color || '#666666';
}

/**
 * 获取服务类型背景色
 */
export function getServiceTypeBgColor(type: ServiceType): string {
  return ServiceTypeMeta[type]?.bgColor || '#F3F4F6';
}

/**
 * 获取服务类型图标
 */
export function getServiceTypeIcon(type: ServiceType): string {
  return ServiceTypeMeta[type]?.icon || 'circle';
}

/**
 * 获取服务类型优先级
 */
export function getServiceTypePriority(type: ServiceType): number {
  return ServiceTypeMeta[type]?.priority || 0;
}

/**
 * 判断是否为高级服务类型
 */
export function isPremiumServiceType(type: ServiceType): boolean {
  return type === ServiceType.DEDICATED_LINE || type === ServiceType.EXCLUSIVE || type === ServiceType.STATIC_RESIDENTIAL;
}

/**
 * 根据服务类型获取套餐组
 */
export function getPlanGroupByServiceType(type: ServiceType): typeof PLAN_GROUPS[number] | undefined {
  return PLAN_GROUPS.find(group => (group.serviceTypes as readonly ServiceType[]).includes(type));
}

/**
 * 获取所有服务类型列表
 */
export function getAllServiceTypes(): ServiceType[] {
  return Object.values(ServiceType);
}

/**
 * 验证服务类型是否有效
 */
export function isValidServiceType(type: string): type is ServiceType {
  return Object.values(ServiceType).includes(type as ServiceType);
}
