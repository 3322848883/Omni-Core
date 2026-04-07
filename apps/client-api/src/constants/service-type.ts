// Service Type Constants

/**
 * 服务类型枚举
 * 定义系统支持的所有服务类型
 */
export enum ServiceType {
  // 标准VPN服务
  VPN_BASIC = 'vpn_basic',
  VPN_PREMIUM = 'vpn_premium',
  VPN_ENTERPRISE = 'vpn_enterprise',

  // 专线服务
  DEDICATED_LINE = 'dedicated_line',
  CN2_LINE = 'cn2_line',
  IEPL_LINE = 'iepl_line',
  IPLC_LINE = 'iplc_line',

  // 静态IP服务
  STATIC_IP = 'static_ip',
  RESIDENTIAL_STATIC = 'residential_static',

  // 动态IP服务
  DYNAMIC_IP = 'dynamic_ip',
  RESIDENTIAL_DYNAMIC = 'residential_dynamic',

  // 特殊服务
  CUSTOM = 'custom',
  TRIAL = 'trial'
}

/**
 * 服务类型元数据
 */
export const ServiceTypeMeta = {
  [ServiceType.VPN_BASIC]: {
    label: '基础VPN',
    description: '标准VPN服务，适合日常使用',
    features: ['多节点', '标准速度', '基础支持'],
    category: 'vpn',
    color: '#666666',
    icon: 'circle'
  },
  [ServiceType.VPN_PREMIUM]: {
    label: '高级VPN',
    description: '高级VPN服务，优先线路',
    features: ['多节点', '优先线路', '高速通道', '优先支持'],
    category: 'vpn',
    color: '#4CAF50',
    icon: 'star'
  },
  [ServiceType.VPN_ENTERPRISE]: {
    label: '企业VPN',
    description: '企业级VPN服务，专线品质',
    features: ['专属节点', '专线品质', '最高速度', '24/7支持'],
    category: 'vpn',
    color: '#2196F3',
    icon: 'building'
  },
  [ServiceType.DEDICATED_LINE]: {
    label: '专线服务',
    description: '独享专线，稳定低延迟',
    features: ['独享带宽', '低延迟', '高稳定性'],
    category: 'dedicated',
    color: '#FF9800',
    icon: 'cable'
  },
  [ServiceType.CN2_LINE]: {
    label: 'CN2专线',
    description: '中国电信CN2专线',
    features: ['CN2 GIA', '优质路由', '低丢包'],
    category: 'dedicated',
    color: '#F44336',
    icon: 'signal'
  },
  [ServiceType.IEPL_LINE]: {
    label: 'IEPL专线',
    description: '国际以太网专线',
    features: ['IEPL专线', '企业级品质', '全球覆盖'],
    category: 'dedicated',
    color: '#9C27B0',
    icon: 'globe'
  },
  [ServiceType.IPLC_LINE]: {
    label: 'IPLC专线',
    description: '国际私人租用线路',
    features: ['IPLC专线', '物理隔离', '最高安全'],
    category: 'dedicated',
    color: '#607D8B',
    icon: 'lock'
  },
  [ServiceType.STATIC_IP]: {
    label: '静态IP',
    description: '固定IP地址服务',
    features: ['固定IP', '长期稳定', '适合业务'],
    category: 'ip',
    color: '#795548',
    icon: 'map-marker'
  },
  [ServiceType.RESIDENTIAL_STATIC]: {
    label: '住宅静态IP',
    description: '住宅网络静态IP',
    features: ['住宅IP', '静态地址', '高匿名性'],
    category: 'ip',
    color: '#4CAF50',
    icon: 'home'
  },
  [ServiceType.DYNAMIC_IP]: {
    label: '动态IP',
    description: '动态IP地址服务',
    features: ['动态IP', '自动更换', '性价比高'],
    category: 'ip',
    color: '#FFC107',
    icon: 'refresh'
  },
  [ServiceType.RESIDENTIAL_DYNAMIC]: {
    label: '住宅动态IP',
    description: '住宅网络动态IP',
    features: ['住宅IP', '动态更换', '高匿名性'],
    category: 'ip',
    color: '#00BCD4',
    icon: 'random'
  },
  [ServiceType.CUSTOM]: {
    label: '定制服务',
    description: '根据需求定制',
    features: ['灵活配置', '专属方案', '一对一服务'],
    category: 'custom',
    color: '#E91E63',
    icon: 'sliders'
  },
  [ServiceType.TRIAL]: {
    label: '试用服务',
    description: '限时试用体验',
    features: ['限时体验', '功能完整', '免费试用'],
    category: 'trial',
    color: '#9E9E9E',
    icon: 'clock'
  }
} as const;

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
 * 获取服务类型特性列表
 */
export function getServiceTypeFeatures(type: ServiceType): readonly string[] {
  return ServiceTypeMeta[type]?.features || [];
}

/**
 * 获取服务类型分类
 */
export function getServiceTypeCategory(type: ServiceType): string {
  return ServiceTypeMeta[type]?.category || 'other';
}

/**
 * 验证是否为有效的服务类型
 */
export function isValidServiceType(type: string): type is ServiceType {
  return Object.values(ServiceType).includes(type as ServiceType);
}

/**
 * 获取所有服务类型
 */
export function getAllServiceTypes(): ServiceType[] {
  return Object.values(ServiceType);
}

/**
 * 按分类获取服务类型
 */
export function getServiceTypesByCategory(category: string): ServiceType[] {
  return Object.values(ServiceType).filter(
    type => ServiceTypeMeta[type]?.category === category
  );
}

/**
 * 套餐组定义
 */
export const PLAN_GROUPS = [
  {
    id: 'standard',
    name: '标准套餐',
    serviceTypes: [ServiceType.VPN_BASIC]
  },
  {
    id: 'premium',
    name: '高级套餐',
    serviceTypes: [ServiceType.VPN_PREMIUM]
  },
  {
    id: 'enterprise',
    name: '企业套餐',
    serviceTypes: [ServiceType.VPN_ENTERPRISE]
  },
  {
    id: 'dedicated',
    name: '专线套餐',
    serviceTypes: [ServiceType.DEDICATED_LINE, ServiceType.CN2_LINE, ServiceType.IEPL_LINE, ServiceType.IPLC_LINE]
  },
  {
    id: 'ip',
    name: 'IP服务',
    serviceTypes: [ServiceType.STATIC_IP, ServiceType.RESIDENTIAL_STATIC, ServiceType.DYNAMIC_IP, ServiceType.RESIDENTIAL_DYNAMIC]
  }
] as const;

// 默认导出
export default ServiceType;
