/**
 * 服务类型枚举
 * 定义系统支持的所有服务类型
 */
export declare enum ServiceType {
    VPN_BASIC = "vpn_basic",
    VPN_PREMIUM = "vpn_premium",
    VPN_ENTERPRISE = "vpn_enterprise",
    DEDICATED_LINE = "dedicated_line",
    CN2_LINE = "cn2_line",
    IEPL_LINE = "iepl_line",
    IPLC_LINE = "iplc_line",
    STATIC_IP = "static_ip",
    RESIDENTIAL_STATIC = "residential_static",
    DYNAMIC_IP = "dynamic_ip",
    RESIDENTIAL_DYNAMIC = "residential_dynamic",
    CUSTOM = "custom",
    TRIAL = "trial"
}
/**
 * 服务类型元数据
 */
export declare const ServiceTypeMeta: {
    readonly vpn_basic: {
        readonly label: "基础VPN";
        readonly description: "标准VPN服务，适合日常使用";
        readonly features: readonly ["多节点", "标准速度", "基础支持"];
        readonly category: "vpn";
    };
    readonly vpn_premium: {
        readonly label: "高级VPN";
        readonly description: "高级VPN服务，优先线路";
        readonly features: readonly ["多节点", "优先线路", "高速通道", "优先支持"];
        readonly category: "vpn";
    };
    readonly vpn_enterprise: {
        readonly label: "企业VPN";
        readonly description: "企业级VPN服务，专线品质";
        readonly features: readonly ["专属节点", "专线品质", "最高速度", "24/7支持"];
        readonly category: "vpn";
    };
    readonly dedicated_line: {
        readonly label: "专线服务";
        readonly description: "独享专线，稳定低延迟";
        readonly features: readonly ["独享带宽", "低延迟", "高稳定性"];
        readonly category: "dedicated";
    };
    readonly cn2_line: {
        readonly label: "CN2专线";
        readonly description: "中国电信CN2专线";
        readonly features: readonly ["CN2 GIA", "优质路由", "低丢包"];
        readonly category: "dedicated";
    };
    readonly iepl_line: {
        readonly label: "IEPL专线";
        readonly description: "国际以太网专线";
        readonly features: readonly ["IEPL专线", "企业级品质", "全球覆盖"];
        readonly category: "dedicated";
    };
    readonly iplc_line: {
        readonly label: "IPLC专线";
        readonly description: "国际私人租用线路";
        readonly features: readonly ["IPLC专线", "物理隔离", "最高安全"];
        readonly category: "dedicated";
    };
    readonly static_ip: {
        readonly label: "静态IP";
        readonly description: "固定IP地址服务";
        readonly features: readonly ["固定IP", "长期稳定", "适合业务"];
        readonly category: "ip";
    };
    readonly residential_static: {
        readonly label: "住宅静态IP";
        readonly description: "住宅网络静态IP";
        readonly features: readonly ["住宅IP", "静态地址", "高匿名性"];
        readonly category: "ip";
    };
    readonly dynamic_ip: {
        readonly label: "动态IP";
        readonly description: "动态IP地址服务";
        readonly features: readonly ["动态IP", "自动更换", "性价比高"];
        readonly category: "ip";
    };
    readonly residential_dynamic: {
        readonly label: "住宅动态IP";
        readonly description: "住宅网络动态IP";
        readonly features: readonly ["住宅IP", "动态更换", "高匿名性"];
        readonly category: "ip";
    };
    readonly custom: {
        readonly label: "定制服务";
        readonly description: "根据需求定制";
        readonly features: readonly ["灵活配置", "专属方案", "一对一服务"];
        readonly category: "custom";
    };
    readonly trial: {
        readonly label: "试用服务";
        readonly description: "限时试用体验";
        readonly features: readonly ["限时体验", "功能完整", "免费试用"];
        readonly category: "trial";
    };
};
/**
 * 获取服务类型标签
 */
export declare function getServiceTypeLabel(type: ServiceType): string;
/**
 * 获取服务类型描述
 */
export declare function getServiceTypeDescription(type: ServiceType): string;
/**
 * 获取服务类型特性列表
 */
export declare function getServiceTypeFeatures(type: ServiceType): string[];
/**
 * 获取服务类型分类
 */
export declare function getServiceTypeCategory(type: ServiceType): string;
/**
 * 验证是否为有效的服务类型
 */
export declare function isValidServiceType(type: string): type is ServiceType;
/**
 * 获取所有服务类型
 */
export declare function getAllServiceTypes(): ServiceType[];
/**
 * 按分类获取服务类型
 */
export declare function getServiceTypesByCategory(category: string): ServiceType[];
export default ServiceType;
//# sourceMappingURL=service-type.d.ts.map