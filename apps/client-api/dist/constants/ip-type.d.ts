/**
 * IP类型枚举
 */
export declare enum IpType {
    DATACENTER = "datacenter",
    RESIDENTIAL_DYNAMIC = "residential_dynamic",
    RESIDENTIAL_STATIC = "residential_static",
    MOBILE = "mobile",
    BUSINESS = "business",
    EDUCATION = "education",
    HOSTING = "hosting"
}
/**
 * 线路类型枚举
 */
export declare enum LineType {
    STANDARD = "standard",
    CN2 = "cn2",
    IEPL = "iepl",
    IPLC = "iplc",
    BGP = "bgp",
    PREMIUM = "premium"
}
/**
 * IP类型元数据
 */
export declare const IpTypeMeta: {
    readonly datacenter: {
        readonly label: "数据中心";
        readonly description: "标准数据中心IP";
        readonly priceMultiplier: 1;
        readonly features: readonly ["稳定", "高速"];
    };
    readonly residential_dynamic: {
        readonly label: "住宅动态IP";
        readonly description: "家庭宽带动态IP";
        readonly priceMultiplier: 1.5;
        readonly features: readonly ["高匿名", "动态更换"];
    };
    readonly residential_static: {
        readonly label: "住宅静态IP";
        readonly description: "家庭宽带静态IP";
        readonly priceMultiplier: 2;
        readonly features: readonly ["高匿名", "固定IP"];
    };
    readonly mobile: {
        readonly label: "移动IP";
        readonly description: "移动网络IP";
        readonly priceMultiplier: 1.8;
        readonly features: readonly ["移动网络", "高匿名"];
    };
    readonly business: {
        readonly label: "商业IP";
        readonly description: "商业宽带IP";
        readonly priceMultiplier: 1.3;
        readonly features: readonly ["商业级", "稳定"];
    };
    readonly education: {
        readonly label: "教育IP";
        readonly description: "教育网IP";
        readonly priceMultiplier: 1.2;
        readonly features: readonly ["教育网", "学术"];
    };
    readonly hosting: {
        readonly label: "托管IP";
        readonly description: "托管服务商IP";
        readonly priceMultiplier: 1.1;
        readonly features: readonly ["托管级", "专业"];
    };
};
/**
 * 线路类型元数据
 */
export declare const LineTypeMeta: {
    readonly standard: {
        readonly label: "标准线路";
        readonly description: "标准网络线路";
        readonly priority: 1;
        readonly features: readonly ["标准速度"];
    };
    readonly cn2: {
        readonly label: "CN2线路";
        readonly description: "中国电信CN2优质线路";
        readonly priority: 2;
        readonly features: readonly ["低延迟", "低丢包"];
    };
    readonly iepl: {
        readonly label: "IEPL线路";
        readonly description: "国际以太网专线";
        readonly priority: 3;
        readonly features: readonly ["企业级", "高稳定"];
    };
    readonly iplc: {
        readonly label: "IPLC线路";
        readonly description: "国际私人租用线路";
        readonly priority: 4;
        readonly features: readonly ["物理专线", "最高品质"];
    };
    readonly bgp: {
        readonly label: "BGP线路";
        readonly description: "BGP多线接入";
        readonly priority: 3;
        readonly features: readonly ["多线接入", "智能路由"];
    };
    readonly premium: {
        readonly label: "优质线路";
        readonly description: "优质网络线路";
        readonly priority: 2;
        readonly features: readonly ["优质带宽"];
    };
};
/**
 * 获取IP类型标签
 */
export declare function getIpTypeLabel(type: IpType): string;
/**
 * 获取IP类型描述
 */
export declare function getIpTypeDescription(type: IpType): string;
/**
 * 获取IP类型价格倍数
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
 * 获取所有IP类型
 */
export declare function getAllIpTypes(): IpType[];
/**
 * 获取所有线路类型
 */
export declare function getAllLineTypes(): LineType[];
export type ISPType = 'isp' | 'datacenter' | 'hosting' | 'business' | 'education' | 'mobile' | 'residential' | 'cable' | 'fiber' | 'starlink';
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
 * 根据ID获取ISP
 */
export declare function getISPById(id: string): ISP | undefined;
/**
 * 根据国家获取ISP列表
 */
export declare function getISPsByCountry(country: string): ISP[];
export declare enum RotationStrategy {
    FIXED = "fixed",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    ON_DEMAND = "on_demand",
    ROUND_ROBIN = "round_robin"
}
export declare const RotationStrategyMeta: {
    readonly fixed: {
        readonly label: "固定IP";
        readonly description: "IP地址保持不变";
        readonly requiresApproval: false;
    };
    readonly daily: {
        readonly label: "每日更换";
        readonly description: "每24小时自动更换IP";
        readonly requiresApproval: false;
    };
    readonly weekly: {
        readonly label: "每周更换";
        readonly description: "每周自动更换IP";
        readonly requiresApproval: false;
    };
    readonly monthly: {
        readonly label: "每月更换";
        readonly description: "每月自动更换IP";
        readonly requiresApproval: false;
    };
    readonly on_demand: {
        readonly label: "按需更换";
        readonly description: "用户手动触发更换";
        readonly requiresApproval: true;
    };
    readonly round_robin: {
        readonly label: "轮询";
        readonly description: "轮询分配IP";
        readonly requiresApproval: false;
    };
};
export declare function isValidRotationStrategy(strategy: string): strategy is RotationStrategy;
export declare const PLAN_GROUPS_V2: {
    id: string;
    name: string;
    description: string;
    ipTypes: IpType[];
    lineTypes: LineType[];
}[];
export declare function getPlanGroupById(id: string): {
    id: string;
    name: string;
    description: string;
    ipTypes: IpType[];
    lineTypes: LineType[];
} | undefined;
export declare function isIpTypeAllowed(ipType: IpType, planGroupId: string): boolean;
export declare function isLineTypeAllowed(lineType: LineType, planGroupId: string): boolean;
//# sourceMappingURL=ip-type.d.ts.map