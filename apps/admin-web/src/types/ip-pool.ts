export interface IpPool {
  id: string;
  name: string;
  nodeId: string;
  nodeName: string;
  ipType: IpType;
  rotationStrategy: RotationStrategy;
  rotationInterval: number;
  status: IpPoolStatus;
  ipCount: number;
  activeIpCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IpPoolDetail extends IpPool {
  ips: IpAddress[];
  description?: string;
}

export interface IpAddress {
  id: string;
  ip: string;
  status: IpStatus;
  score: number;
  useCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

export enum IpType {
  IPV4 = 'ipv4',
  IPV6 = 'ipv6',
  MIXED = 'mixed',
}

export enum RotationStrategy {
  ROUND_ROBIN = 'round_robin',
  RANDOM = 'random',
  LEAST_USED = 'least_used',
  QUALITY_FIRST = 'quality_first',
}

export enum IpPoolStatus {
  ENABLED = 1,
  DISABLED = 2,
}

export enum IpStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  BLOCKED = 3,
}

export interface IpPoolQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  nodeId?: string;
  ipType?: IpType;
  rotationStrategy?: RotationStrategy;
  status?: IpPoolStatus;
}

export interface IpPoolListResponse {
  list: IpPool[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IpPoolFormData {
  name: string;
  nodeId: string;
  ipType: IpType;
  rotationStrategy: RotationStrategy;
  rotationInterval: number;
  description?: string;
  ips: string[];
}

export interface RotationStrategyOption {
  value: RotationStrategy;
  label: string;
  description: string;
}

export interface IpPoolStats {
  totalPools: number;
  enabledPools: number;
  disabledPools: number;
  totalIps: number;
  activeIps: number;
}

// Helper functions
export const getIpTypeLabel = (type: IpType): string => {
  const map: Record<IpType, string> = {
    [IpType.IPV4]: 'IPv4',
    [IpType.IPV6]: 'IPv6',
    [IpType.MIXED]: '混合',
  };
  return map[type] || type;
};

export const getRotationStrategyLabel = (strategy: RotationStrategy): string => {
  const map: Record<RotationStrategy, string> = {
    [RotationStrategy.ROUND_ROBIN]: '轮询',
    [RotationStrategy.RANDOM]: '随机',
    [RotationStrategy.LEAST_USED]: '最少使用',
    [RotationStrategy.QUALITY_FIRST]: '质量优先',
  };
  return map[strategy] || strategy;
};

export const getIpPoolStatusType = (status: IpPoolStatus): string => {
  const map: Record<IpPoolStatus, string> = {
    [IpPoolStatus.ENABLED]: 'success',
    [IpPoolStatus.DISABLED]: 'info',
  };
  return map[status] || 'info';
};

export const getIpPoolStatusText = (status: IpPoolStatus): string => {
  const map: Record<IpPoolStatus, string> = {
    [IpPoolStatus.ENABLED]: '已启用',
    [IpPoolStatus.DISABLED]: '已禁用',
  };
  return map[status] || '未知';
};

export const getIpStatusType = (status: IpStatus): string => {
  const map: Record<IpStatus, string> = {
    [IpStatus.ACTIVE]: 'success',
    [IpStatus.INACTIVE]: 'info',
    [IpStatus.BLOCKED]: 'danger',
  };
  return map[status] || 'info';
};

export const getIpStatusText = (status: IpStatus): string => {
  const map: Record<IpStatus, string> = {
    [IpStatus.ACTIVE]: '活跃',
    [IpStatus.INACTIVE]: '空闲',
    [IpStatus.BLOCKED]: '已封锁',
  };
  return map[status] || '未知';
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#67c23a';
  if (score >= 60) return '#e6a23c';
  if (score >= 40) return '#f56c6c';
  return '#ff0000';
};

export const getIpTypeTagType = (type: IpType): string => {
  const map: Record<IpType, string> = {
    [IpType.IPV4]: 'primary',
    [IpType.IPV6]: 'success',
    [IpType.MIXED]: 'warning',
  };
  return map[type] || 'info';
};
