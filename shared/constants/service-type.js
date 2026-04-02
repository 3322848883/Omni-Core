/**
 * 服务类型常量定义
 * 用于套餐服务类型支持功能
 */
/**
 * 服务类型枚举
 */
export var ServiceType;
(function (ServiceType) {
    ServiceType["STANDARD"] = "standard";
    ServiceType["DEDICATED_LINE"] = "dedicated_line";
    ServiceType["EXCLUSIVE"] = "exclusive";
    ServiceType["STATIC_RESIDENTIAL"] = "static_residential"; // 静态住宅IP - 固定住宅IP，高匿名性
})(ServiceType || (ServiceType = {}));
/**
 * 服务类型分组
 */
export const ServiceTypeGroups = {
    BASIC: [ServiceType.STANDARD],
    PRO: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
    ENTERPRISE: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE],
    RESIDENTIAL: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL]
};
/**
 * 服务类型元数据
 */
export const ServiceTypeMeta = {
    [ServiceType.STANDARD]: {
        label: '标准',
        description: '普通共享节点，适合日常使用',
        color: '#3B82F6', // blue-500
        bgColor: '#EFF6FF', // blue-50
        icon: 'plane',
        priority: 1
    },
    [ServiceType.DEDICATED_LINE]: {
        label: '专线',
        description: '高质量专线，低延迟高稳定',
        color: '#F59E0B', // amber-500
        bgColor: '#FFFBEB', // amber-50
        icon: 'crown',
        priority: 2
    },
    [ServiceType.EXCLUSIVE]: {
        label: '独享',
        description: '独立IP资源，单用户专用',
        color: '#EC4899', // pink-500
        bgColor: '#FDF2F8', // pink-50
        icon: 'shield',
        priority: 3
    },
    [ServiceType.STATIC_RESIDENTIAL]: {
        label: '静态住宅',
        description: '固定住宅IP，高匿名性，适合长期使用',
        color: '#10B981', // emerald-500
        bgColor: '#ECFDF5', // emerald-50
        icon: 'home',
        priority: 4
    }
};
/**
 * 套餐组配置
 */
export const PLAN_GROUPS = [
    {
        id: 'standard',
        name: '标准套餐',
        description: '普通共享节点，适合日常使用',
        serviceTypes: [ServiceType.STANDARD],
        icon: 'plane',
        color: '#3B82F6',
        recommendedFor: ['日常浏览', '轻度使用', '预算有限']
    },
    {
        id: 'dedicated_line',
        name: '专线套餐',
        description: '高质量专线，低延迟高稳定',
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
        icon: 'crown',
        color: '#F59E0B',
        recommendedFor: ['游戏加速', '视频流媒体', '高频交易']
    },
    {
        id: 'exclusive',
        name: '独享套餐',
        description: '独立IP资源，单用户专用',
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE],
        icon: 'shield',
        color: '#EC4899',
        recommendedFor: ['企业用户', 'IP敏感业务', '高安全需求']
    },
    {
        id: 'static_residential',
        name: '静态住宅套餐',
        description: '固定住宅IP，高匿名性，适合长期使用',
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL],
        icon: 'home',
        color: '#10B981',
        recommendedFor: ['跨境电商', '社交媒体运营', '长期稳定连接']
    }
];
/**
 * 预设套餐配置
 */
export const PRESET_PLANS = [
    // ========== 标准套餐组 ==========
    {
        id: 'standard-lite',
        name: '标准-轻量版',
        group: 'standard',
        price: 9.99,
        durationDays: 30,
        trafficLimit: 107374182400, // 100GB
        serviceTypes: [ServiceType.STANDARD],
        primaryType: ServiceType.STANDARD,
        priorityBoost: 0,
        guaranteedBandwidth: 20,
        maxConnections: 3,
        features: ['标准节点访问', '20Mbps保证带宽', '3设备同时在线', '基础客服']
    },
    {
        id: 'standard-pro',
        name: '标准-专业版',
        group: 'standard',
        price: 19.99,
        durationDays: 30,
        trafficLimit: 322122547200, // 300GB
        serviceTypes: [ServiceType.STANDARD],
        primaryType: ServiceType.STANDARD,
        priorityBoost: 1,
        guaranteedBandwidth: 50,
        maxConnections: 5,
        features: ['标准节点访问', '50Mbps保证带宽', '5设备同时在线', '优先客服', '流量包叠加']
    },
    // ========== 专线套餐组 ==========
    {
        id: 'dedicated-entry',
        name: '专线-入门版',
        group: 'dedicated_line',
        price: 29.99,
        durationDays: 30,
        trafficLimit: 214748364800, // 200GB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
        primaryType: ServiceType.DEDICATED_LINE,
        priorityBoost: 1,
        guaranteedBandwidth: 50,
        maxConnections: 3,
        features: ['标准+专线节点访问', '50Mbps保证带宽', '3设备同时在线', '低延迟线路']
    },
    {
        id: 'dedicated-standard',
        name: '专线-标准版',
        group: 'dedicated_line',
        price: 49.99,
        durationDays: 30,
        trafficLimit: 536870912000, // 500GB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
        primaryType: ServiceType.DEDICATED_LINE,
        priorityBoost: 2,
        guaranteedBandwidth: 100,
        maxConnections: 5,
        features: ['标准+专线节点访问', '100Mbps保证带宽', '5设备同时在线', '优先客服', '游戏加速']
    },
    {
        id: 'dedicated-premium',
        name: '专线-高级版',
        group: 'dedicated_line',
        price: 79.99,
        durationDays: 30,
        trafficLimit: 1099511627776, // 1TB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
        primaryType: ServiceType.DEDICATED_LINE,
        priorityBoost: 3,
        guaranteedBandwidth: 200,
        maxConnections: 8,
        features: ['标准+专线节点访问', '200Mbps保证带宽', '8设备同时在线', '专属客服', '流量包叠加', 'API接口']
    },
    {
        id: 'dedicated-flagship',
        name: '专线-旗舰版',
        group: 'dedicated_line',
        price: 129.99,
        durationDays: 30,
        trafficLimit: 2199023255552, // 2TB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
        primaryType: ServiceType.DEDICATED_LINE,
        priorityBoost: 4,
        guaranteedBandwidth: 500,
        maxConnections: 15,
        features: ['标准+专线节点访问', '500Mbps保证带宽', '15设备同时在线', '专属客服', '不限流量包', 'API接口', '定制配置']
    },
    // ========== 独享套餐组 ==========
    {
        id: 'exclusive-basic',
        name: '独享-基础版',
        group: 'exclusive',
        price: 99.99,
        durationDays: 30,
        trafficLimit: 536870912000, // 500GB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE],
        primaryType: ServiceType.EXCLUSIVE,
        priorityBoost: 3,
        guaranteedBandwidth: 100,
        maxConnections: 3,
        features: ['全节点访问（含独享IP）', '100Mbps独享带宽', '3设备同时在线', '独立IP', 'IP更换服务']
    },
    {
        id: 'exclusive-business',
        name: '独享-商务版',
        group: 'exclusive',
        price: 199.99,
        durationDays: 30,
        trafficLimit: 1099511627776, // 1TB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE],
        primaryType: ServiceType.EXCLUSIVE,
        priorityBoost: 4,
        guaranteedBandwidth: 300,
        maxConnections: 8,
        features: ['全节点访问（含独享IP）', '300Mbps独享带宽', '8设备同时在线', '独立IP', 'IP更换服务', '专属客服']
    },
    {
        id: 'exclusive-enterprise',
        name: '独享-企业版',
        group: 'exclusive',
        price: 499.99,
        durationDays: 30,
        trafficLimit: 5497558138880, // 5TB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE],
        primaryType: ServiceType.EXCLUSIVE,
        priorityBoost: 5,
        guaranteedBandwidth: 1000,
        maxConnections: 20,
        features: ['全节点访问（含独享IP）', '1Gbps独享带宽', '20设备同时在线', '独立IP', 'IP更换服务', '专属客服', 'API接口', '定制配置', 'SLA保障']
    },
    // ========== 静态住宅IP套餐组 ==========
    {
        id: 'residential-basic',
        name: '静态住宅-基础版',
        group: 'static_residential',
        price: 149.99,
        durationDays: 30,
        trafficLimit: 536870912000, // 500GB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL],
        primaryType: ServiceType.STATIC_RESIDENTIAL,
        priorityBoost: 4,
        guaranteedBandwidth: 100,
        maxConnections: 3,
        features: ['全节点访问（含静态住宅IP）', '100Mbps保证带宽', '3设备同时在线', '固定住宅IP', '高匿名性', '适合跨境电商']
    },
    {
        id: 'residential-pro',
        name: '静态住宅-专业版',
        group: 'static_residential',
        price: 299.99,
        durationDays: 30,
        trafficLimit: 1099511627776, // 1TB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL],
        primaryType: ServiceType.STATIC_RESIDENTIAL,
        priorityBoost: 5,
        guaranteedBandwidth: 300,
        maxConnections: 8,
        features: ['全节点访问（含静态住宅IP）', '300Mbps保证带宽', '8设备同时在线', '固定住宅IP', '高匿名性', '优先客服', 'IP保留服务']
    },
    {
        id: 'residential-enterprise',
        name: '静态住宅-企业版',
        group: 'static_residential',
        price: 699.99,
        durationDays: 30,
        trafficLimit: 5497558138880, // 5TB
        serviceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL],
        primaryType: ServiceType.STATIC_RESIDENTIAL,
        priorityBoost: 6,
        guaranteedBandwidth: 1000,
        maxConnections: 20,
        features: ['全节点访问（含静态住宅IP）', '1Gbps保证带宽', '20设备同时在线', '固定住宅IP', '高匿名性', '专属客服', 'API接口', '定制配置', 'SLA保障', 'IP保留服务']
    }
];
/**
 * 获取服务类型标签
 */
export function getServiceTypeLabel(type) {
    return ServiceTypeMeta[type]?.label || type;
}
/**
 * 获取服务类型描述
 */
export function getServiceTypeDescription(type) {
    return ServiceTypeMeta[type]?.description || '';
}
/**
 * 获取服务类型颜色
 */
export function getServiceTypeColor(type) {
    return ServiceTypeMeta[type]?.color || '#666666';
}
/**
 * 获取服务类型背景色
 */
export function getServiceTypeBgColor(type) {
    return ServiceTypeMeta[type]?.bgColor || '#F3F4F6';
}
/**
 * 获取服务类型图标
 */
export function getServiceTypeIcon(type) {
    return ServiceTypeMeta[type]?.icon || 'circle';
}
/**
 * 获取服务类型优先级
 */
export function getServiceTypePriority(type) {
    return ServiceTypeMeta[type]?.priority || 0;
}
/**
 * 判断是否为高级服务类型
 */
export function isPremiumServiceType(type) {
    return type === ServiceType.DEDICATED_LINE || type === ServiceType.EXCLUSIVE || type === ServiceType.STATIC_RESIDENTIAL;
}
/**
 * 根据服务类型获取套餐组
 */
export function getPlanGroupByServiceType(type) {
    return PLAN_GROUPS.find(group => group.serviceTypes.includes(type));
}
/**
 * 获取所有服务类型列表
 */
export function getAllServiceTypes() {
    return Object.values(ServiceType);
}
/**
 * 验证服务类型是否有效
 */
export function isValidServiceType(type) {
    return Object.values(ServiceType).includes(type);
}
//# sourceMappingURL=service-type.js.map