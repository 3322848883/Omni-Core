// IP Assets Types

import { IpType, LineType, RotationStrategy } from '../constants/ip-type';

export interface IPPool {
  id: string;
  name: string;
  ipType: IpType;
  lineType?: LineType;
  nodeId?: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  totalIPs: number;
  availableIPs: number;
  rotationStrategy?: RotationStrategy;
  rotationInterval?: number;
  currentIndex?: number;
  lastRotationAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPAddress {
  id: string;
  poolId: string;
  ip: string;
  status: 'available' | 'assigned' | 'reserved' | 'blocked';
  assignedTo?: string;
  assignedAt?: Date;
  expiresAt?: Date;
  reputation: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledTaskResult {
  taskName: string;
  success: boolean;
  executedAt: Date;
  duration: number;
  itemsProcessed: number;
  itemsFailed: number;
  error?: string;
}

export interface IPReputationData {
  ip: string;
  score: number;
  checks: {
    blacklist: boolean;
    spam: boolean;
    abuse: boolean;
  };
  lastChecked: Date;
}

export interface IPReputation {
  ip: string;
  provider: string;
  score: number;
  isResidential: boolean | null;
  isDatacenter: boolean | null;
  isVpn: boolean | null;
  isProxy: boolean | null;
  isTor: boolean | null;
  abuseRecords: number;
  country: string | null;
  isp: string | null;
  rawData: Record<string, any>;
  checkedAt: Date;
  expiresAt: Date;
}

export interface IPReputationCacheRecord {
  id: string;
  ip: string;
  provider: string;
  score: number;
  is_residential: boolean | null;
  abuse_records: number;
  raw_data: string;
  checked_at: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IPDataApiResponse {
  ip: string;
  country_code: string;
  country_name: string;
  region: string;
  city: string;
  asn: {
    name: string;
    type: string;
  } | null;
  threat: {
    is_tor: boolean;
    is_proxy: boolean;
    is_anonymous: boolean;
    is_known_attacker: boolean;
    is_known_abuser: boolean;
    is_threat: boolean;
    is_bogon: boolean;
  } | null;
}

export interface BatchIPCheckResult {
  total: number;
  success: number;
  failed: number;
  results: Map<string, IPReputation>;
  errors: Map<string, string>;
}

export interface LowIPScoreAlert {
  type: 'LOW_IP_SCORE' | 'CRITICAL_LOW_IP_SCORE';
  nodeId: string;
  ip: string;
  score: number;
  threshold: number;
  detectedAt: Date;
}

export interface IPCheckRateLimit {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
}

export interface IPPoolIP {
  id: string;
  poolId: string;
  ip: string;
  status: 'available' | 'assigned' | 'reserved' | 'blocked';
  assignedTo?: string;
  assignedAt?: Date;
  expiresAt?: Date;
  reputation: number;
  score?: number;
  usageCount?: number;
  releasedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPPoolConfig {
  enabled: boolean;
  name: string;
  nodeId: string;
  ipType: IpType;
  ips: string[];
  rotationStrategy: RotationStrategy;
  rotationInterval: number;
}

export interface IPPoolStatus {
  pool: IPPool;
  ips: IPPoolIP[];
  activeIpCount: number;
  blockedIpCount: number;
  currentIp: string | null;
  nextRotationAt: Date | null;
}

export interface IPRotationResult {
  success: boolean;
  poolId?: string;
  previousIp: string | null;
  newIp: string | null;
  rotatedAt: Date;
  error?: string;
}

export interface NodeIPAssetExtension {
  ipType: IpType;
  lineType: LineType;
  ispName: string | null;
  ipScore: number | null;
  supportsIPv6: boolean;
  ipPoolId: string | null;
  currentIp: string | null;
  ipRotationEnabled: boolean;
  ipRotationInterval: number | null;
  lastIpRotationAt: Date | null;
}

// Plan Validation Types
export interface PlanValidationResult {
  allowed: boolean;
  code?: string;
  reason?: string;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

export interface NodeAccessCheckParams {
  userId: string;
  nodeId: string;
  nodeIpType?: IpType;
  nodeLineType?: LineType;
  nodeServiceType?: string;
  nodeIpScore?: number;
}

export interface UserSubscriptionEntitlement {
  userId: string;
  subscriptionId: string;
  planId: string;
  planGroupId: string;
  serviceTypes: string[];
  ipTypes: IpType[];
  lineTypes: LineType[];
  trafficLimit: number;
  trafficUsed: number;
  expireDate: Date | null;
  maxConnections: number;
  currentConnections: number;
  ipRotationEnabled?: boolean;
  ipRotationInterval?: number | null;
  minIpScore?: number | null;
}
