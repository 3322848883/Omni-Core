/**
 * 服务类型常量定义
 * 用于套餐服务类型支持功能
 */
/**
 * 服务类型枚举
 */
export declare enum ServiceType {
    STANDARD = "standard",// 标准/机场 - 普通共享节点
    DEDICATED_LINE = "dedicated_line",// 专线 - 高质量线路，低延迟高稳定
    EXCLUSIVE = "exclusive",// 独享 - 独立IP资源，单用户专用
    STATIC_RESIDENTIAL = "static_residential"
}
/**
 * 服务类型分组
 */
export declare const ServiceTypeGroups: {
    readonly BASIC: readonly [ServiceType.STANDARD];
    readonly PRO: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE];
    readonly ENTERPRISE: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE];
    readonly RESIDENTIAL: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL];
};
/**
 * 服务类型元数据
 */
export declare const ServiceTypeMeta: Record<ServiceType, {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    icon: string;
    priority: number;
}>;
/**
 * 套餐组配置类型
 */
export interface PlanGroup {
    id: string;
    name: string;
    description: string;
    serviceTypes: ServiceType[];
    icon: string;
    color: string;
    recommendedFor: string[];
}
/**
 * 套餐组配置
 */
export declare const PLAN_GROUPS: PlanGroup[];
/**
 * 预设套餐配置
 */
export declare const PRESET_PLANS: readonly [{
    readonly id: "standard-lite";
    readonly name: "标准-轻量版";
    readonly group: "standard";
    readonly price: 9.99;
    readonly durationDays: 30;
    readonly trafficLimit: 107374182400;
    readonly serviceTypes: readonly [ServiceType.STANDARD];
    readonly primaryType: ServiceType.STANDARD;
    readonly priorityBoost: 0;
    readonly guaranteedBandwidth: 20;
    readonly maxConnections: 3;
    readonly features: readonly ["标准节点访问", "20Mbps保证带宽", "3设备同时在线", "基础客服"];
}, {
    readonly id: "standard-pro";
    readonly name: "标准-专业版";
    readonly group: "standard";
    readonly price: 19.99;
    readonly durationDays: 30;
    readonly trafficLimit: 322122547200;
    readonly serviceTypes: readonly [ServiceType.STANDARD];
    readonly primaryType: ServiceType.STANDARD;
    readonly priorityBoost: 1;
    readonly guaranteedBandwidth: 50;
    readonly maxConnections: 5;
    readonly features: readonly ["标准节点访问", "50Mbps保证带宽", "5设备同时在线", "优先客服", "流量包叠加"];
}, {
    readonly id: "dedicated-entry";
    readonly name: "专线-入门版";
    readonly group: "dedicated_line";
    readonly price: 29.99;
    readonly durationDays: 30;
    readonly trafficLimit: 214748364800;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE];
    readonly primaryType: ServiceType.DEDICATED_LINE;
    readonly priorityBoost: 1;
    readonly guaranteedBandwidth: 50;
    readonly maxConnections: 3;
    readonly features: readonly ["标准+专线节点访问", "50Mbps保证带宽", "3设备同时在线", "低延迟线路"];
}, {
    readonly id: "dedicated-standard";
    readonly name: "专线-标准版";
    readonly group: "dedicated_line";
    readonly price: 49.99;
    readonly durationDays: 30;
    readonly trafficLimit: 536870912000;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE];
    readonly primaryType: ServiceType.DEDICATED_LINE;
    readonly priorityBoost: 2;
    readonly guaranteedBandwidth: 100;
    readonly maxConnections: 5;
    readonly features: readonly ["标准+专线节点访问", "100Mbps保证带宽", "5设备同时在线", "优先客服", "游戏加速"];
}, {
    readonly id: "dedicated-premium";
    readonly name: "专线-高级版";
    readonly group: "dedicated_line";
    readonly price: 79.99;
    readonly durationDays: 30;
    readonly trafficLimit: 1099511627776;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE];
    readonly primaryType: ServiceType.DEDICATED_LINE;
    readonly priorityBoost: 3;
    readonly guaranteedBandwidth: 200;
    readonly maxConnections: 8;
    readonly features: readonly ["标准+专线节点访问", "200Mbps保证带宽", "8设备同时在线", "专属客服", "流量包叠加", "API接口"];
}, {
    readonly id: "dedicated-flagship";
    readonly name: "专线-旗舰版";
    readonly group: "dedicated_line";
    readonly price: 129.99;
    readonly durationDays: 30;
    readonly trafficLimit: 2199023255552;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE];
    readonly primaryType: ServiceType.DEDICATED_LINE;
    readonly priorityBoost: 4;
    readonly guaranteedBandwidth: 500;
    readonly maxConnections: 15;
    readonly features: readonly ["标准+专线节点访问", "500Mbps保证带宽", "15设备同时在线", "专属客服", "不限流量包", "API接口", "定制配置"];
}, {
    readonly id: "exclusive-basic";
    readonly name: "独享-基础版";
    readonly group: "exclusive";
    readonly price: 99.99;
    readonly durationDays: 30;
    readonly trafficLimit: 536870912000;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE];
    readonly primaryType: ServiceType.EXCLUSIVE;
    readonly priorityBoost: 3;
    readonly guaranteedBandwidth: 100;
    readonly maxConnections: 3;
    readonly features: readonly ["全节点访问（含独享IP）", "100Mbps独享带宽", "3设备同时在线", "独立IP", "IP更换服务"];
}, {
    readonly id: "exclusive-business";
    readonly name: "独享-商务版";
    readonly group: "exclusive";
    readonly price: 199.99;
    readonly durationDays: 30;
    readonly trafficLimit: 1099511627776;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE];
    readonly primaryType: ServiceType.EXCLUSIVE;
    readonly priorityBoost: 4;
    readonly guaranteedBandwidth: 300;
    readonly maxConnections: 8;
    readonly features: readonly ["全节点访问（含独享IP）", "300Mbps独享带宽", "8设备同时在线", "独立IP", "IP更换服务", "专属客服"];
}, {
    readonly id: "exclusive-enterprise";
    readonly name: "独享-企业版";
    readonly group: "exclusive";
    readonly price: 499.99;
    readonly durationDays: 30;
    readonly trafficLimit: 5497558138880;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE];
    readonly primaryType: ServiceType.EXCLUSIVE;
    readonly priorityBoost: 5;
    readonly guaranteedBandwidth: 1000;
    readonly maxConnections: 20;
    readonly features: readonly ["全节点访问（含独享IP）", "1Gbps独享带宽", "20设备同时在线", "独立IP", "IP更换服务", "专属客服", "API接口", "定制配置", "SLA保障"];
}, {
    readonly id: "residential-basic";
    readonly name: "静态住宅-基础版";
    readonly group: "static_residential";
    readonly price: 149.99;
    readonly durationDays: 30;
    readonly trafficLimit: 536870912000;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL];
    readonly primaryType: ServiceType.STATIC_RESIDENTIAL;
    readonly priorityBoost: 4;
    readonly guaranteedBandwidth: 100;
    readonly maxConnections: 3;
    readonly features: readonly ["全节点访问（含静态住宅IP）", "100Mbps保证带宽", "3设备同时在线", "固定住宅IP", "高匿名性", "适合跨境电商"];
}, {
    readonly id: "residential-pro";
    readonly name: "静态住宅-专业版";
    readonly group: "static_residential";
    readonly price: 299.99;
    readonly durationDays: 30;
    readonly trafficLimit: 1099511627776;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL];
    readonly primaryType: ServiceType.STATIC_RESIDENTIAL;
    readonly priorityBoost: 5;
    readonly guaranteedBandwidth: 300;
    readonly maxConnections: 8;
    readonly features: readonly ["全节点访问（含静态住宅IP）", "300Mbps保证带宽", "8设备同时在线", "固定住宅IP", "高匿名性", "优先客服", "IP保留服务"];
}, {
    readonly id: "residential-enterprise";
    readonly name: "静态住宅-企业版";
    readonly group: "static_residential";
    readonly price: 699.99;
    readonly durationDays: 30;
    readonly trafficLimit: 5497558138880;
    readonly serviceTypes: readonly [ServiceType.STANDARD, ServiceType.DEDICATED_LINE, ServiceType.EXCLUSIVE, ServiceType.STATIC_RESIDENTIAL];
    readonly primaryType: ServiceType.STATIC_RESIDENTIAL;
    readonly priorityBoost: 6;
    readonly guaranteedBandwidth: 1000;
    readonly maxConnections: 20;
    readonly features: readonly ["全节点访问（含静态住宅IP）", "1Gbps保证带宽", "20设备同时在线", "固定住宅IP", "高匿名性", "专属客服", "API接口", "定制配置", "SLA保障", "IP保留服务"];
}];
/**
 * 获取服务类型标签
 */
export declare function getServiceTypeLabel(type: ServiceType): string;
/**
 * 获取服务类型描述
 */
export declare function getServiceTypeDescription(type: ServiceType): string;
/**
 * 获取服务类型颜色
 */
export declare function getServiceTypeColor(type: ServiceType): string;
/**
 * 获取服务类型背景色
 */
export declare function getServiceTypeBgColor(type: ServiceType): string;
/**
 * 获取服务类型图标
 */
export declare function getServiceTypeIcon(type: ServiceType): string;
/**
 * 获取服务类型优先级
 */
export declare function getServiceTypePriority(type: ServiceType): number;
/**
 * 判断是否为高级服务类型
 */
export declare function isPremiumServiceType(type: ServiceType): boolean;
/**
 * 根据服务类型获取套餐组
 */
export declare function getPlanGroupByServiceType(type: ServiceType): PlanGroup | undefined;
/**
 * 获取所有服务类型列表
 */
export declare function getAllServiceTypes(): ServiceType[];
/**
 * 验证服务类型是否有效
 */
export declare function isValidServiceType(type: string): type is ServiceType;
//# sourceMappingURL=service-type.d.ts.map