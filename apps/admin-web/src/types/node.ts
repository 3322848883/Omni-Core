import { ServiceType } from '@shared/constants/service-type.mjs';

// IP 类型
export enum IpType {
  DATACENTER = 'datacenter',
  DYNAMIC_RESIDENTIAL = 'dynamic_residential',
  STATIC_RESIDENTIAL = 'static_residential',
  MOBILE = 'mobile',
}

// 线路类型
export enum LineType {
  STANDARD = 'standard',
  CN2 = 'cn2',
  IEPL = 'iepl',
  IPLC = 'iplc',
}

// IP 声誉状态
export enum IpReputationStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  BLACKLISTED = 'blacklisted',
}

// IP 池配置
export interface IpPoolConfig {
  poolId?: string;
  poolName?: string;
  rotationEnabled: boolean;
  rotationInterval?: number; // 分钟
  minHealthyIps?: number;
  maxIps?: number;
}

// IP 声誉历史记录
export interface IpReputationHistory {
  timestamp: string;
  score: number;
  status: IpReputationStatus;
  source: string;
  details?: string;
}

// IP 资产信息
export interface IpAsset {
  id: string;
  ipAddress: string;
  ipType: IpType;
  lineType: LineType;
  isp: string;
  ispCode: string;
  country: string;
  region: string;
  city: string;
  supportsIpv6: boolean;
  ipv6Address?: string;
  score: number;
  reputationStatus: IpReputationStatus;
  lastCheckedAt: string;
  blacklistCount: number;
  history: IpReputationHistory[];
}

export interface Node {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: string; // vmess, vless, trojan, shadowsocks
  network: string; // tcp, ws, grpc
  security: string; // tls, none
  country: string;
  region: string;
  status: number; // 1-active, 2-inactive, 3-maintenance
  isEnabled: boolean;
  trafficLimit: number;
  trafficUsed: number;
  maxUsers: number;
  currentUsers: number;
  sortOrder: number;
  tags: string[];
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Service type support
  serviceType: ServiceType;
  serviceGroup: string;
  isPremium: boolean;
  qosLevel: number;
  bandwidthLimit: number;
  // IP Asset support
  ipType?: IpType;
  lineType?: LineType;
  isp?: string;
  ispCode?: string;
  supportsIpv6?: boolean;
  ipv6Address?: string;
  ipScore?: number;
  ipReputationStatus?: IpReputationStatus;
  ipPoolConfig?: IpPoolConfig;
  ipAssets?: IpAsset[];
}

export interface NodeQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
  country?: string;
  protocol?: string;
  serviceTypes?: ServiceType[];
  qosLevel?: number;
  loadStatus?: string;
  // New filters for IP asset
  ipType?: IpType;
  lineType?: LineType;
  isp?: string;
  minIpScore?: number;
}

export interface NodeListResponse {
  list: Node[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NodeStats {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  totalConnections: number;
  protocolDistribution: Record<string, number>;
  regionDistribution: Record<string, number>;
  serviceTypeDistribution: Record<string, number>;
  premiumStats: {
    premium: number;
    standard: number;
  };
  ipTypeDistribution: Record<string, number>;
  lineTypeDistribution: Record<string, number>;
  ipScoreDistribution: Record<string, number>;
}

export interface NodeFormData {
  name: string;
  host: string;
  port: number;
  protocol: string;
  network: string;
  security: string;
  country: string;
  region: string;
  maxUsers: number;
  trafficLimit: number;
  tags: string[];
  config: Record<string, unknown>;
  // Service type support
  serviceType?: ServiceType;
  serviceGroup?: string;
  isPremium?: boolean;
  qosLevel?: number;
  bandwidthLimit?: number;
  // IP Asset support
  ipType?: IpType;
  lineType?: LineType;
  isp?: string;
  ispCode?: string;
  supportsIpv6?: boolean;
  ipv6Address?: string;
  ipPoolConfig?: IpPoolConfig;
}

// ISP 选项
export interface IspOption {
  code: string;
  name: string;
  country: string;
  type: 'isp' | 'datacenter' | 'mobile';
}

// 元数据响应
export interface IpMetadata {
  ipTypes: Array<{
    value: IpType;
    label: string;
    description: string;
    icon?: string;
  }>;
  lineTypes: Array<{
    value: LineType;
    label: string;
    description: string;
    priority: number;
  }>;
  isps: IspOption[];
}

// IP 检测结果
export interface IpCheckResult {
  success: boolean;
  ipAddress: string;
  ipType: IpType;
  isp: string;
  country: string;
  region: string;
  city: string;
  score: number;
  reputationStatus: IpReputationStatus;
  blacklistCount: number;
  latency: number;
  message?: string;
}

// IP 评分刷新结果
export interface IpScoreRefreshResult {
  success: boolean;
  oldScore: number;
  newScore: number;
  status: IpReputationStatus;
  checkedAt: string;
  message?: string;
}
