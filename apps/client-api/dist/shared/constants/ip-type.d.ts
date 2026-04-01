/**
 * IP类型和线路类型常量定义
 * 用于套餐服务体系升级
 */
export declare enum RotationStrategy {
    FIXED = "fixed",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    ON_DEMAND = "on_demand",
    ROUND_ROBIN = "round_robin",
    RANDOM = "random",
    LEAST_USED = "least_used",
    QUALITY_FIRST = "quality_first"
}
/**
 * IP类型枚举
 */
export declare enum IpType {
    DATACENTER = "datacenter",// 机房IP - 大流量场景
    RESIDENTIAL_DYNAMIC = "residential_dynamic",// 动态住宅IP - 流媒体解锁
    RESIDENTIAL_STATIC = "residential_static",// 静态住宅IP - 账号注册
    MOBILE = "mobile"
}
/**
 * IP类型元数据
 */
export declare const IpTypeMeta: {
    readonly datacenter: {
        readonly label: "机房";
        readonly description: "数据中心IP，适合大流量下载";
        readonly costLevel: "low";
        readonly priceMultiplier: 1;
        readonly typicalBandwidth: "1000Mbps";
        readonly typicalTraffic: "1000GB+";
        readonly useCases: readonly ["大流量下载", "视频观看", "日常代理"];
    };
    readonly residential_dynamic: {
        readonly label: "动态住宅";
        readonly description: "真实家庭宽带IP，24h自动更换";
        readonly costLevel: "high";
        readonly priceMultiplier: 3;
        readonly typicalBandwidth: "100Mbps";
        readonly typicalTraffic: "200GB";
        readonly useCases: readonly ["流媒体解锁", "防追踪", "隐私保护"];
    };
    readonly residential_static: {
        readonly label: "静态住宅";
        readonly description: "真实家庭宽带IP，固定不变";
        readonly costLevel: "very_high";
        readonly priceMultiplier: 5;
        readonly typicalBandwidth: "100Mbps";
        readonly typicalTraffic: "100GB";
        readonly useCases: readonly ["账号注册", "长期业务", "IP敏感操作"];
    };
    readonly mobile: {
        readonly label: "移动";
        readonly description: "移动网络IP";
        readonly costLevel: "high";
        readonly priceMultiplier: 3.5;
        readonly typicalBandwidth: "50Mbps";
        readonly typicalTraffic: "100GB";
        readonly useCases: readonly ["移动端业务", "验证码接收", "APP测试"];
    };
};
/**
 * 线路类型枚举
 */
export declare enum LineType {
    STANDARD = "standard",// 普通国际线路
    CN2 = "cn2",// CN2线路
    IEPL = "iepl",// IEPL专线
    IPLC = "iplc"
}
/**
 * 线路类型元数据
 */
export declare const LineTypeMeta: {
    readonly standard: {
        readonly label: "标准线路";
        readonly description: "普通国际线路";
        readonly priority: 1;
        readonly costMultiplier: 1;
        readonly sla: "99%";
        readonly typicalLatency: "150-300ms";
    };
    readonly cn2: {
        readonly label: "CN2";
        readonly description: "中国电信下一代承载网";
        readonly priority: 2;
        readonly costMultiplier: 1.5;
        readonly sla: "99.5%";
        readonly typicalLatency: "80-150ms";
    };
    readonly iepl: {
        readonly label: "IEPL";
        readonly description: "国际以太网专线";
        readonly priority: 3;
        readonly costMultiplier: 2;
        readonly sla: "99.9%";
        readonly typicalLatency: "50-100ms";
    };
    readonly iplc: {
        readonly label: "IPLC";
        readonly description: "国际私有租用电路";
        readonly priority: 4;
        readonly costMultiplier: 3;
        readonly sla: "99.99%";
        readonly typicalLatency: "30-80ms";
    };
};
/**
 * ISP类型
 */
export type ISPType = 'starlink' | 'cable' | 'fiber' | 'mobile';
/**
 * ISP接口定义
 */
export interface ISP {
    id: string;
    name: string;
    displayName: string;
    country: string;
    type: ISPType;
    reputation: number;
    features: string[];
}
/**
 * 预设ISP列表
 */
export declare const PRESET_ISPS: ISP[];
/**
 * 获取IP类型标签
 */
export declare function getIpTypeLabel(type: IpType): string;
/**
 * 获取IP类型描述
 */
export declare function getIpTypeDescription(type: IpType): string;
/**
 * 获取IP类型价格系数
 */
export declare function getIpTypePriceMultiplier(type: IpType): number;
/**
 * 验证IP类型是否有效
 */
export declare function isValidIpType(type: string): type is IpType;
/**
 * 获取线路类型标签
 */
export declare function getLineTypeLabel(type: LineType): string;
/**
 * 获取线路类型描述
 */
export declare function getLineTypeDescription(type: LineType): string;
/**
 * 获取线路类型优先级
 */
export declare function getLineTypePriority(type: LineType): number;
/**
 * 验证线路类型是否有效
 */
export declare function isValidLineType(type: string): type is LineType;
/**
 * 获取所有IP类型列表
 */
export declare function getAllIpTypes(): IpType[];
/**
 * 获取所有线路类型列表
 */
export declare function getAllLineTypes(): LineType[];
/**
 * 根据ID获取ISP信息
 */
export declare function getISPById(id: string): ISP | undefined;
/**
 * 根据国家获取ISP列表
 */
export declare function getISPsByCountry(country: string): ISP[];
//# sourceMappingURL=ip-type.d.ts.map