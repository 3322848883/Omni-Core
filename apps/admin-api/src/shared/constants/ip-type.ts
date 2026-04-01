/**
 * IP类型和线路类型常量定义
 * 用于套餐服务体系升级
 */

// Rotation Strategy Enum
export enum RotationStrategy {
  FIXED = 'fixed',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ON_DEMAND = 'on_demand',
  ROUND_ROBIN = 'round_robin',
  RANDOM = 'random',
  LEAST_USED = 'least_used',
  QUALITY_FIRST = 'quality_first'
}

/**
 * IP类型枚举
 */
export enum IpType {
  DATACENTER = 'datacenter',                    // 机房IP - 大流量场景
  RESIDENTIAL_DYNAMIC = 'residential_dynamic',  // 动态住宅IP - 流媒体解锁
  RESIDENTIAL_STATIC = 'residential_static',    // 静态住宅IP - 账号注册
  MOBILE = 'mobile'                             // 移动IP - 移动端业务
}

/**
 * IP类型元数据
 */
export const IpTypeMeta = {
  [IpType.DATACENTER]: {
    label: '机房',
    description: '数据中心IP，适合大流量下载',
    costLevel: 'low',
    priceMultiplier: 1.0,
    typicalBandwidth: '1000Mbps',
    typicalTraffic: '1000GB+',
    useCases: ['大流量下载', '视频观看', '日常代理']
  },
  [IpType.RESIDENTIAL_DYNAMIC]: {
    label: '动态住宅',
    description: '真实家庭宽带IP，24h自动更换',
    costLevel: 'high',
    priceMultiplier: 3.0,
    typicalBandwidth: '100Mbps',
    typicalTraffic: '200GB',
    useCases: ['流媒体解锁', '防追踪', '隐私保护']
  },
  [IpType.RESIDENTIAL_STATIC]: {
    label: '静态住宅',
    description: '真实家庭宽带IP，固定不变',
    costLevel: 'very_high',
    priceMultiplier: 5.0,
    typicalBandwidth: '100Mbps',
    typicalTraffic: '100GB',
    useCases: ['账号注册', '长期业务', 'IP敏感操作']
  },
  [IpType.MOBILE]: {
    label: '移动',
    description: '移动网络IP',
    costLevel: 'high',
    priceMultiplier: 3.5,
    typicalBandwidth: '50Mbps',
    typicalTraffic: '100GB',
    useCases: ['移动端业务', '验证码接收', 'APP测试']
  }
} as const;

/**
 * 线路类型枚举
 */
export enum LineType {
  STANDARD = 'standard',  // 普通国际线路
  CN2 = 'cn2',           // CN2线路
  IEPL = 'iepl',         // IEPL专线
  IPLC = 'iplc'          // IPLC专线
}

/**
 * 线路类型元数据
 */
export const LineTypeMeta = {
  [LineType.STANDARD]: {
    label: '标准线路',
    description: '普通国际线路',
    priority: 1,
    costMultiplier: 1.0,
    sla: '99%',
    typicalLatency: '150-300ms'
  },
  [LineType.CN2]: {
    label: 'CN2',
    description: '中国电信下一代承载网',
    priority: 2,
    costMultiplier: 1.5,
    sla: '99.5%',
    typicalLatency: '80-150ms'
  },
  [LineType.IEPL]: {
    label: 'IEPL',
    description: '国际以太网专线',
    priority: 3,
    costMultiplier: 2.0,
    sla: '99.9%',
    typicalLatency: '50-100ms'
  },
  [LineType.IPLC]: {
    label: 'IPLC',
    description: '国际私有租用电路',
    priority: 4,
    costMultiplier: 3.0,
    sla: '99.99%',
    typicalLatency: '30-80ms'
  }
} as const;

/**
 * ISP类型
 */
export type ISPType = 'starlink' | 'cable' | 'fiber' | 'mobile';

/**
 * ISP接口定义
 */
export interface ISP {
  id: string;
  name: string;           // 显示名称
  displayName: string;    // 显示名称（别名）
  country: string;        // 国家
  type: ISPType;          // ISP类型
  reputation: number;     // 0-100
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
 * 获取IP类型价格系数
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
 * 获取所有IP类型列表
 */
export function getAllIpTypes(): IpType[] {
  return Object.values(IpType);
}

/**
 * 获取所有线路类型列表
 */
export function getAllLineTypes(): LineType[] {
  return Object.values(LineType);
}

/**
 * 根据ID获取ISP信息
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
