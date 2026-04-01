export {
  IpType,
  LineType,
  IpTypeMeta,
  LineTypeMeta,
  ISP,
  ISPType,
  PRESET_ISPS,
  getIpTypeLabel,
  getIpTypeDescription,
  getIpTypePriceMultiplier,
  isValidIpType,
  isValidLineType,
  getLineTypeLabel,
  getLineTypeDescription,
  getLineTypePriority,
  getAllIpTypes,
  getAllLineTypes,
  getISPById,
  getISPsByCountry
} from './ip-type';

// Re-export from ip-type for backward compatibility
export * from './ip-type';

export const IPScoreThresholds = {
  EXCELLENT: 80,
  GOOD: 70,
  FAIR: 60,
  POOR: 40,
  BAD: 20
} as const;

/**
 * 获取IP评分标签
 * 简化版本 - 只返回评分等级
 */
export function getIPScoreLabel(score: number): { label: string; color: string } {
  if (score >= IPScoreThresholds.EXCELLENT) {
    return { label: '优秀', color: '#52c41a' };
  } else if (score >= IPScoreThresholds.GOOD) {
    return { label: '良好', color: '#73d13d' };
  } else if (score >= IPScoreThresholds.FAIR) {
    return { label: '一般', color: '#faad14' };
  } else if (score >= IPScoreThresholds.POOR) {
    return { label: '较差', color: '#fa8c16' };
  } else {
    return { label: '很差', color: '#f5222d' };
  }
}

// Rotation Strategy (for backward compatibility)
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
  },
  [RotationStrategy.RANDOM]: {
    label: '随机',
    description: '随机选择IP',
    requiresApproval: false
  },
  [RotationStrategy.LEAST_USED]: {
    label: '最少使用',
    description: '选择使用次数最少的IP',
    requiresApproval: false
  },
  [RotationStrategy.QUALITY_FIRST]: {
    label: '质量优先',
    description: '选择质量最高的IP',
    requiresApproval: false
  }
} as const;

export function isValidRotationStrategy(strategy: string): strategy is RotationStrategy {
  return Object.values(RotationStrategy).includes(strategy as RotationStrategy);
}

// Import types for use in PLAN_GROUPS_V2
import { IpType, LineType } from './ip-type';

// Plan Groups (for backward compatibility)
export const PLAN_GROUPS_V2 = [
  {
    id: 'basic',
    name: '基础套餐',
    description: '适合个人用户',
    ipTypes: [IpType.DATACENTER],
    lineTypes: [LineType.STANDARD],
    allowedIpTypes: [IpType.DATACENTER],
    allowedLineTypes: [LineType.STANDARD],
    icon: 'plane',
    color: '#3B82F6',
    recommendedFor: ['日常浏览', '轻度使用']
  },
  {
    id: 'premium',
    name: '高级套餐',
    description: '适合高级用户',
    ipTypes: [IpType.DATACENTER, IpType.RESIDENTIAL_DYNAMIC],
    lineTypes: [LineType.STANDARD, LineType.CN2],
    allowedIpTypes: [IpType.DATACENTER, IpType.RESIDENTIAL_DYNAMIC],
    allowedLineTypes: [LineType.STANDARD, LineType.CN2],
    icon: 'crown',
    color: '#F59E0B',
    recommendedFor: ['游戏加速', '视频流媒体']
  },
  {
    id: 'enterprise',
    name: '企业套餐',
    description: '适合企业用户',
    ipTypes: [IpType.DATACENTER, IpType.RESIDENTIAL_DYNAMIC, IpType.RESIDENTIAL_STATIC],
    lineTypes: [LineType.STANDARD, LineType.CN2, LineType.IEPL, LineType.IPLC],
    allowedIpTypes: [IpType.DATACENTER, IpType.RESIDENTIAL_DYNAMIC, IpType.RESIDENTIAL_STATIC],
    allowedLineTypes: [LineType.STANDARD, LineType.CN2, LineType.IEPL, LineType.IPLC],
    icon: 'shield',
    color: '#EC4899',
    recommendedFor: ['企业用户', 'IP敏感业务']
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
