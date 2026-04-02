"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_GROUPS_V2 = exports.RotationStrategyMeta = exports.RotationStrategy = exports.IPScoreThresholds = exports.getISPsByCountry = exports.getISPById = exports.getAllLineTypes = exports.getAllIpTypes = exports.getLineTypePriority = exports.getLineTypeDescription = exports.getLineTypeLabel = exports.isValidLineType = exports.isValidIpType = exports.getIpTypePriceMultiplier = exports.getIpTypeDescription = exports.getIpTypeLabel = exports.PRESET_ISPS = exports.LineTypeMeta = exports.IpTypeMeta = exports.LineType = exports.IpType = void 0;
exports.getIPScoreLabel = getIPScoreLabel;
exports.isValidRotationStrategy = isValidRotationStrategy;
exports.getPlanGroupById = getPlanGroupById;
exports.isIpTypeAllowed = isIpTypeAllowed;
exports.isLineTypeAllowed = isLineTypeAllowed;
var ip_type_1 = require("./ip-type");
Object.defineProperty(exports, "IpType", { enumerable: true, get: function () { return ip_type_1.IpType; } });
Object.defineProperty(exports, "LineType", { enumerable: true, get: function () { return ip_type_1.LineType; } });
Object.defineProperty(exports, "IpTypeMeta", { enumerable: true, get: function () { return ip_type_1.IpTypeMeta; } });
Object.defineProperty(exports, "LineTypeMeta", { enumerable: true, get: function () { return ip_type_1.LineTypeMeta; } });
Object.defineProperty(exports, "PRESET_ISPS", { enumerable: true, get: function () { return ip_type_1.PRESET_ISPS; } });
Object.defineProperty(exports, "getIpTypeLabel", { enumerable: true, get: function () { return ip_type_1.getIpTypeLabel; } });
Object.defineProperty(exports, "getIpTypeDescription", { enumerable: true, get: function () { return ip_type_1.getIpTypeDescription; } });
Object.defineProperty(exports, "getIpTypePriceMultiplier", { enumerable: true, get: function () { return ip_type_1.getIpTypePriceMultiplier; } });
Object.defineProperty(exports, "isValidIpType", { enumerable: true, get: function () { return ip_type_1.isValidIpType; } });
Object.defineProperty(exports, "isValidLineType", { enumerable: true, get: function () { return ip_type_1.isValidLineType; } });
Object.defineProperty(exports, "getLineTypeLabel", { enumerable: true, get: function () { return ip_type_1.getLineTypeLabel; } });
Object.defineProperty(exports, "getLineTypeDescription", { enumerable: true, get: function () { return ip_type_1.getLineTypeDescription; } });
Object.defineProperty(exports, "getLineTypePriority", { enumerable: true, get: function () { return ip_type_1.getLineTypePriority; } });
Object.defineProperty(exports, "getAllIpTypes", { enumerable: true, get: function () { return ip_type_1.getAllIpTypes; } });
Object.defineProperty(exports, "getAllLineTypes", { enumerable: true, get: function () { return ip_type_1.getAllLineTypes; } });
Object.defineProperty(exports, "getISPById", { enumerable: true, get: function () { return ip_type_1.getISPById; } });
Object.defineProperty(exports, "getISPsByCountry", { enumerable: true, get: function () { return ip_type_1.getISPsByCountry; } });
// Re-export from ip-type for backward compatibility
__exportStar(require("./ip-type"), exports);
exports.IPScoreThresholds = {
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
function getIPScoreLabel(score) {
    if (score >= exports.IPScoreThresholds.EXCELLENT) {
        return { label: '优秀', color: '#52c41a' };
    }
    else if (score >= exports.IPScoreThresholds.GOOD) {
        return { label: '良好', color: '#73d13d' };
    }
    else if (score >= exports.IPScoreThresholds.FAIR) {
        return { label: '一般', color: '#faad14' };
    }
    else if (score >= exports.IPScoreThresholds.POOR) {
        return { label: '较差', color: '#fa8c16' };
    }
    else {
        return { label: '很差', color: '#f5222d' };
    }
}
// Rotation Strategy (for backward compatibility)
var RotationStrategy;
(function (RotationStrategy) {
    RotationStrategy["FIXED"] = "fixed";
    RotationStrategy["DAILY"] = "daily";
    RotationStrategy["WEEKLY"] = "weekly";
    RotationStrategy["MONTHLY"] = "monthly";
    RotationStrategy["ON_DEMAND"] = "on_demand";
    RotationStrategy["ROUND_ROBIN"] = "round_robin";
})(RotationStrategy || (exports.RotationStrategy = RotationStrategy = {}));
exports.RotationStrategyMeta = {
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
function isValidRotationStrategy(strategy) {
    return Object.values(RotationStrategy).includes(strategy);
}
// Import types for use in PLAN_GROUPS_V2
const ip_type_2 = require("./ip-type");
// Plan Groups (for backward compatibility)
exports.PLAN_GROUPS_V2 = [
    {
        id: 'basic',
        name: '基础套餐',
        description: '适合个人用户',
        ipTypes: [ip_type_2.IpType.DATACENTER],
        lineTypes: [ip_type_2.LineType.STANDARD]
    },
    {
        id: 'premium',
        name: '高级套餐',
        description: '适合高级用户',
        ipTypes: [ip_type_2.IpType.DATACENTER, ip_type_2.IpType.RESIDENTIAL_DYNAMIC],
        lineTypes: [ip_type_2.LineType.STANDARD, ip_type_2.LineType.CN2]
    },
    {
        id: 'enterprise',
        name: '企业套餐',
        description: '适合企业用户',
        ipTypes: [ip_type_2.IpType.DATACENTER, ip_type_2.IpType.RESIDENTIAL_DYNAMIC, ip_type_2.IpType.RESIDENTIAL_STATIC],
        lineTypes: [ip_type_2.LineType.STANDARD, ip_type_2.LineType.CN2, ip_type_2.LineType.IEPL, ip_type_2.LineType.IPLC]
    }
];
function getPlanGroupById(id) {
    return exports.PLAN_GROUPS_V2.find(g => g.id === id);
}
function isIpTypeAllowed(ipType, planGroupId) {
    const group = getPlanGroupById(planGroupId);
    if (!group)
        return false;
    return group.ipTypes.includes(ipType);
}
function isLineTypeAllowed(lineType, planGroupId) {
    const group = getPlanGroupById(planGroupId);
    if (!group)
        return false;
    return group.lineTypes.includes(lineType);
}
//# sourceMappingURL=ip-assets.js.map