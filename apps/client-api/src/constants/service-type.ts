// Service Type Constants

export enum ServiceType {
  STANDARD = 'standard',
  DEDICATED_LINE = 'dedicated_line',
  EXCLUSIVE = 'exclusive',
  STATIC_RESIDENTIAL = 'static_residential',
}

export interface ServiceTypeMeta {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  priority: number;
}

export const ServiceTypeMeta: Record<ServiceType, ServiceTypeMeta> = {
  [ServiceType.STANDARD]: {
    label: '标准服务',
    description: '标准节点服务，适合日常使用',
    color: '#1890ff',
    bgColor: '#e6f7ff',
    icon: 'global',
    priority: 1,
  },
  [ServiceType.DEDICATED_LINE]: {
    label: '专线服务',
    description: '专线节点服务，低延迟高稳定',
    color: '#52c41a',
    bgColor: '#f6ffed',
    icon: 'thunderbolt',
    priority: 2,
  },
  [ServiceType.EXCLUSIVE]: {
    label: '专属服务',
    description: '专属节点服务，独享带宽',
    color: '#722ed1',
    bgColor: '#f9f0ff',
    icon: 'crown',
    priority: 3,
  },
  [ServiceType.STATIC_RESIDENTIAL]: {
    label: '静态住宅',
    description: '静态住宅IP，高匿名性',
    color: '#fa8c16',
    bgColor: '#fff7e6',
    icon: 'home',
    priority: 4,
  },
};

export interface PlanGroup {
  id: string;
  name: string;
  description: string;
  serviceTypes: ServiceType[];
  ipTypes: string[];
  lineTypes: string[];
  allowedIpTypes?: string[];
  allowedLineTypes?: string[];
  icon?: string;
  color?: string;
  recommendedFor?: string[];
}

export const PLAN_GROUPS: PlanGroup[] = [
  {
    id: 'standard',
    name: '标准套餐',
    description: '适合日常使用的标准服务',
    serviceTypes: [ServiceType.STANDARD],
    ipTypes: ['ipv4'],
    lineTypes: ['standard'],
  },
  {
    id: 'dedicated',
    name: '专线套餐',
    description: '低延迟高稳定的专线服务',
    serviceTypes: [ServiceType.DEDICATED_LINE],
    ipTypes: ['ipv4', 'ipv6'],
    lineTypes: ['dedicated'],
  },
  {
    id: 'exclusive',
    name: '专属套餐',
    description: '独享带宽的专属服务',
    serviceTypes: [ServiceType.EXCLUSIVE],
    ipTypes: ['ipv4', 'ipv6'],
    lineTypes: ['dedicated', 'exclusive'],
  },
  {
    id: 'static',
    name: '静态住宅套餐',
    description: '高匿名性的静态住宅IP',
    serviceTypes: [ServiceType.STATIC_RESIDENTIAL],
    ipTypes: ['ipv4'],
    lineTypes: ['residential'],
  },
];

// Re-export from shared
export * from '@shared/constants/service-type';
