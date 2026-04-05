"use strict";
// IP Type Constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_GROUPS_V2 = exports.RotationStrategyMeta = exports.RotationStrategy = exports.PRESET_ISPS = exports.LineTypeMeta = exports.IpTypeMeta = exports.LineType = exports.IpType = void 0;
exports.getIpTypeLabel = getIpTypeLabel;
exports.getIpTypeDescription = getIpTypeDescription;
exports.getIpTypePriceMultiplier = getIpTypePriceMultiplier;
exports.isValidIpType = isValidIpType;
exports.getLineTypeLabel = getLineTypeLabel;
exports.getLineTypeDescription = getLineTypeDescription;
exports.getLineTypePriority = getLineTypePriority;
exports.isValidLineType = isValidLineType;
exports.getAllIpTypes = getAllIpTypes;
exports.getAllLineTypes = getAllLineTypes;
exports.getISPById = getISPById;
exports.getISPsByCountry = getISPsByCountry;
exports.isValidRotationStrategy = isValidRotationStrategy;
exports.getPlanGroupById = getPlanGroupById;
exports.isIpTypeAllowed = isIpTypeAllowed;
exports.isLineTypeAllowed = isLineTypeAllowed;
/**
 * IP类型枚举
 */
var IpType;
(function (IpType) {
    IpType["DATACENTER"] = "datacenter";
    IpType["RESIDENTIAL_DYNAMIC"] = "residential_dynamic";
    IpType["RESIDENTIAL_STATIC"] = "residential_static";
    IpType["MOBILE"] = "mobile";
    IpType["BUSINESS"] = "business";
    IpType["EDUCATION"] = "education";
    IpType["HOSTING"] = "hosting";
})(IpType || (exports.IpType = IpType = {}));
/**
 * 线路类型枚举
 */
var LineType;
(function (LineType) {
    LineType["STANDARD"] = "standard";
    LineType["CN2"] = "cn2";
    LineType["IEPL"] = "iepl";
    LineType["IPLC"] = "iplc";
    LineType["BGP"] = "bgp";
    LineType["PREMIUM"] = "premium";
})(LineType || (exports.LineType = LineType = {}));
/**
 * IP类型元数据
 */
exports.IpTypeMeta = {
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
};
/**
 * 线路类型元数据
 */
exports.LineTypeMeta = {
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
};
/**
 * 获取IP类型标签
 */
function getIpTypeLabel(type) {
    return exports.IpTypeMeta[type]?.label || type;
}
/**
 * 获取IP类型描述
 */
function getIpTypeDescription(type) {
    return exports.IpTypeMeta[type]?.description || '';
}
/**
 * 获取IP类型价格倍数
 */
function getIpTypePriceMultiplier(type) {
    return exports.IpTypeMeta[type]?.priceMultiplier || 1.0;
}
/**
 * 验证IP类型是否有效
 */
function isValidIpType(type) {
    return Object.values(IpType).includes(type);
}
/**
 * 获取线路类型标签
 */
function getLineTypeLabel(type) {
    return exports.LineTypeMeta[type]?.label || type;
}
/**
 * 获取线路类型描述
 */
function getLineTypeDescription(type) {
    return exports.LineTypeMeta[type]?.description || '';
}
/**
 * 获取线路类型优先级
 */
function getLineTypePriority(type) {
    return exports.LineTypeMeta[type]?.priority || 0;
}
/**
 * 验证线路类型是否有效
 */
function isValidLineType(type) {
    return Object.values(LineType).includes(type);
}
/**
 * 获取所有IP类型
 */
function getAllIpTypes() {
    return Object.values(IpType);
}
/**
 * 获取所有线路类型
 */
function getAllLineTypes() {
    return Object.values(LineType);
}
/**
 * 预设ISP列表
 */
exports.PRESET_ISPS = [
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
function getISPById(id) {
    return exports.PRESET_ISPS.find(isp => isp.id === id);
}
/**
 * 根据国家获取ISP列表
 */
function getISPsByCountry(country) {
    return exports.PRESET_ISPS.filter(isp => isp.country === country);
}
// Rotation Strategy Enum
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
// Plan Groups
exports.PLAN_GROUPS_V2 = [
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
//# sourceMappingURL=ip-type.js.map