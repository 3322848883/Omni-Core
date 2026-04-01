// IP Type Constants

/**
 * IP类型枚举
 */
export enum IpType {
  DATACENTER = 'datacenter',
  RESIDENTIAL_DYNAMIC = 'residential_dynamic',
  RESIDENTIAL_STATIC = 'residential_static',
  MOBILE = 'mobile',
  BUSINESS = 'business',
  EDUCATION = 'education',
  HOSTING = 'hosting'
}

/**
 * 线路类型枚举
 */
export enum LineType {
  STANDARD = 'standard',
  CN2 = 'cn2',
  IEPL = 'iepl',
  IPLC = 'iplc',
  BGP = 'bgp',
  PREMIUM = 'premium'
}

/**
 * IP类型元数据
 */
export const IpTypeMeta = {
  [IpType.DATACENTER]: {
    label: '数据中心',
    description: '标准数据中心IP',
    priceMultiplier: 1.0,
    features: ['稳定', '高速']
  },
  [IpType.RESIDENTIAL_DYNAMIC]: {
    label: '住宅动态IP',
    description: '家庭宽带动态IP',
    priceMultiplier: 1.5,
    features: ['高匿名', '动态更换']
  },
  [IpType.RESIDENTIAL_STATIC]: {
    label: '住宅静态IP',
    description: '家庭宽带静态IP',
    priceMultiplier: 2.0,
    features: ['高匿名', '固定IP']
  },
  [IpType.MOBILE]: {
    label: '移动IP',
    description: '移动网络IP',
    priceMultiplier: 1.8,
    features: ['移动网络', '高匿名']
  },
  [IpType.BUSINESS]: {
    label: '商业IP',
    description: '商业宽带IP',
    priceMultiplier: 1.3,
    features: ['商业级', '稳定']
  },
  [IpType.EDUCATION]: {
    label: '教育IP',
    description: '教育网IP',
    priceMultiplier: 1.2,
    features: ['教育网', '学术']
  },
  [IpType.HOSTING]: {
    label: '托管IP',
    description: '托管服务商IP',
    priceMultiplier: 1.1,
    features: ['托管级', '专业']
  }
} as const;

/**
 * 线路类型元数据
 */
export const LineTypeMeta = {
  [LineType.STANDARD]: {
    label: '标准线路',
    description: '标准网络线路',
    priority: 1,
    features: ['标准速度']
  },
  [LineType.CN2]: {
    label: 'CN2线路',
    description: '中国电信CN2优质线路',
    priority: 2,
    features: ['低延迟', '低丢包']
  },
  [LineType.IEPL]: {
    label: 'IEPL线路',
    description: '国际以太网专线',
    priority: 3,
    features: ['企业级', '高稳定']
  },
  [LineType.IPLC]: {
    label: 'IPLC线路',
    description: '国际私人租用线路',
    priority: 4,
    features: ['物理专线', '最高品质']
  },
  [LineType.BGP]: {
    label: 'BGP线路',
    description: 'BGP多线接入',
    priority: 3,
    features: ['多线接入', '智能路由']
  },
  [LineType.PREMIUM]: {
    label: '优质线路',
    description: '优质网络线路',
    priority: 2,
    features: ['优质带宽']
  }
} as const;

/**
 * 获取IP类型标签
 */
export function getIpTypeLabel(type: IpType): string {
  return IpTypeMeta[type]?.label || type;
}

/**
 * 获取IP类型描述
 */
export function getIpTypeDescription(type: IpType): string {
  return IpTypeMeta[type]?.description || '';
}

/**
 * 获取IP类型价格倍数
 */
export function getIpTypePriceMultiplier(type: IpType): number {
  return IpTypeMeta[type]?.priceMultiplier || 1.0;
}

/**
 * 验证IP类型是否有效
 */
export function isValidIpType(type: string): type is IpType {
  return Object.values(IpType).includes(type as IpType);
}

/**
 * 获取线路类型标签
 */
export function getLineTypeLabel(type: LineType): string {
  return LineTypeMeta[type]?.label || type;
}

/**
 * 获取线路类型描述
 */
export function getLineTypeDescription(type: LineType): string {
  return LineTypeMeta[type]?.description || '';
}

/**
 * 获取线路类型优先级
 */
export function getLineTypePriority(type: LineType): number {
  return LineTypeMeta[type]?.priority || 0;
}

/**
 * 验证线路类型是否有效
 */
export function isValidLineType(type: string): type is LineType {
  return Object.values(LineType).includes(type as LineType);
}

/**
 * 获取所有IP类型
 */
export function getAllIpTypes(): IpType[] {
  return Object.values(IpType);
}

/**
 * 获取所有线路类型
 */
export function getAllLineTypes(): LineType[] {
  return Object.values(LineType);
}

// ISP类型
export type ISPType = 'isp' | 'datacenter' | 'hosting' | 'business' | 'education' | 'mobile' | 'residential' | 'cable' | 'fiber' | 'starlink';

/**
 * ISP接口定义
 */
export interface ISP {
  id: string;
  name: string;
  displayName: string;
  country: string;
  type: ISPType;
  reputation: number;
  features: string[];
}

/**
 * 预设ISP列表
 */
export const PRESET_ISPS: ISP[] = [
  { id: 'starlink', name: 'Starlink', displayName: 'Starlink', country: 'US', type: 'starlink', reputation: 95, features: ['卫星网络', '全球覆盖'] },
  { id: 'comcast', name: 'Comcast', displayName: 'Comcast', country: 'US', type: 'cable', reputation: 90, features: ['美国最大有线运营商'] },
  { id: 'att', name: 'AT&T', displayName: 'AT&T', country: 'US', type: 'fiber', reputation: 92, features: ['光纤网络'] },
  { id: 'verizon', name: 'Verizon', displayName: 'Verizon', country: 'US', type: 'fiber', reputation: 93, features: ['企业级服务'] },
  { id: 'ucom', name: 'Ucom', displayName: 'Ucom', country: 'JP', type: 'fiber', reputation: 88, features: ['日本本土运营商'] },
  { id: 'ntt', name: 'NTT', displayName: 'NTT', country: 'JP', type: 'fiber', reputation: 94, features: ['日本最大运营商'] }
];

/**
 * 根据ID获取ISP
 */
export function getISPById(id: string): ISP | undefined {
  return PRESET_ISPS.find(isp => isp.id === id);
}

/**
 * 根据国家获取ISP列表
 */
export function getISPsByCountry(country: string): ISP[] {
  return PRESET_ISPS.filter(isp => isp.country === country);
}

// Rotation Strategy Enum
export enum RotationStrategy {
  FIXED = 'fixed',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ON_DEMAND = 'on_demand',
  ROUND_ROBIN = 'round_robin'
}

export const RotationStrategyMeta = {
  [RotationStrategy.FIXED]: {
    label: '固定IP',
    description: 'IP地址保持不变',
    requiresApproval: false
  },
  [RotationStrategy.DAILY]: {
    label: '每日更换',
    description: '每24小时自动更换IP',
    requiresApproval: false
  },
  [RotationStrategy.WEEKLY]: {
    label: '每周更换',
    description: '每周自动更换IP',
    requiresApproval: false
  },
  [RotationStrategy.MONTHLY]: {
    label: '每月更换',
    description: '每月自动更换IP',
    requiresApproval: false
  },
  [RotationStrategy.ON_DEMAND]: {
    label: '按需更换',
    description: '用户手动触发更换',
    requiresApproval: true
  },
  [RotationStrategy.ROUND_ROBIN]: {
    label: '轮询',
    description: '轮询分配IP',
    requiresApproval: false
  }
} as const;

export function isValidRotationStrategy(strategy: string): strategy is RotationStrategy {
  return Object.values(RotationStrategy).includes(strategy as RotationStrategy);
}

// Plan Groups
export const PLAN_GROUPS_V2 = [
  {
    id: 'basic',
    name: '基础套餐',
    description: '适合个人用户',
    ipTypes: [IpType.DATACENTER],
    lineTypes: [LineType.STANDARD]
  },
  {
    id: 'premium',
    name: '高级套餐',
    description: '适合高级用户',
    ipTypes: [IpType.DATACENTER, IpType.RESIDENTIAL_DYNAMIC],
    lineTypes: [LineType.STANDARD, LineType.CN2]
  },
  {
    id: 'enterprise',
    name: '企业套餐',
    description: '适合企业用户',
    ipTypes: [IpType.DATACENTER, IpType.RESIDENTIAL_DYNAMIC, IpType.RESIDENTIAL_STATIC],
    lineTypes: [LineType.STANDARD, LineType.CN2, LineType.IEPL, LineType.IPLC]
  }
];

export function getPlanGroupById(id: string) {
  return PLAN_GROUPS_V2.find(g => g.id === id);
}

export function isIpTypeAllowed(ipType: IpType, planGroupId: string): boolean {
  const group = getPlanGroupById(planGroupId);
  if (!group) return false;
  return group.ipTypes.includes(ipType);
}

export function isLineTypeAllowed(lineType: LineType, planGroupId: string): boolean {
  const group = getPlanGroupById(planGroupId);
  if (!group) return false;
  return group.lineTypes.includes(lineType);
}
