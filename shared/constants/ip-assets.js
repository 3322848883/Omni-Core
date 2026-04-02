export { IpType, LineType, IpTypeMeta, LineTypeMeta, ISP, ISPType, PRESET_ISPS, getIpTypeLabel, getIpTypeDescription, getIpTypePriceMultiplier, isValidIpType, isValidLineType, getLineTypeLabel, getLineTypeDescription, getLineTypePriority, getAllIpTypes, getAllLineTypes, getISPById, getISPsByCountry } from './ip-type';
// Re-export from ip-type for backward compatibility
export * from './ip-type';
export const IPScoreThresholds = {
    EXCELLENT: 80,
    GOOD: 70,
    FAIR: 60,
    POOR: 40,
    BAD: 20
};
/**
 * 获取IP评分标签
 * 简化版本 - 只返回评分等级
 */
export function getIPScoreLabel(score) {
    if (score >= IPScoreThresholds.EXCELLENT) {
        return { label: '优秀', color: '#52c41a' };
    }
    else if (score >= IPScoreThresholds.GOOD) {
        return { label: '良好', color: '#73d13d' };
    }
    else if (score >= IPScoreThresholds.FAIR) {
        return { label: '一般', color: '#faad14' };
    }
    else if (score >= IPScoreThresholds.POOR) {
        return { label: '较差', color: '#fa8c16' };
    }
    else {
        return { label: '很差', color: '#f5222d' };
    }
}
// Rotation Strategy (for backward compatibility)
export var RotationStrategy;
(function (RotationStrategy) {
    RotationStrategy["FIXED"] = "fixed";
    RotationStrategy["DAILY"] = "daily";
    RotationStrategy["WEEKLY"] = "weekly";
    RotationStrategy["MONTHLY"] = "monthly";
    RotationStrategy["ON_DEMAND"] = "on_demand";
    RotationStrategy["ROUND_ROBIN"] = "round_robin";
})(RotationStrategy || (RotationStrategy = {}));
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
};
export function isValidRotationStrategy(strategy) {
    return Object.values(RotationStrategy).includes(strategy);
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
export function getPlanGroupById(id) {
    return PLAN_GROUPS_V2.find(g => g.id === id);
}
export function isIpTypeAllowed(ipType, planGroupId) {
    const group = getPlanGroupById(planGroupId);
    if (!group)
        return false;
    return group.ipTypes.includes(ipType);
}
export function isLineTypeAllowed(lineType, planGroupId) {
    const group = getPlanGroupById(planGroupId);
    if (!group)
        return false;
    return group.lineTypes.includes(lineType);
}
//# sourceMappingURL=ip-assets.js.map