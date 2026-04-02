export { IpType, LineType, IpTypeMeta, LineTypeMeta, ISP, ISPType, PRESET_ISPS, getIpTypeLabel, getIpTypeDescription, getIpTypePriceMultiplier, isValidIpType, isValidLineType, getLineTypeLabel, getLineTypeDescription, getLineTypePriority, getAllIpTypes, getAllLineTypes, getISPById, getISPsByCountry } from './ip-type';
export * from './ip-type';
export declare const IPScoreThresholds: {
    readonly EXCELLENT: 80;
    readonly GOOD: 70;
    readonly FAIR: 60;
    readonly POOR: 40;
    readonly BAD: 20;
};
/**
 * 获取IP评分标签
 * 简化版本 - 只返回评分等级
 */
export declare function getIPScoreLabel(score: number): {
    label: string;
    color: string;
};
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
import { IpType, LineType } from './ip-type';
export declare const PLAN_GROUPS_V2: {
    id: string;
    name: string;
    description: string;
    ipTypes: any[];
    lineTypes: any[];
}[];
export declare function getPlanGroupById(id: string): {
    id: string;
    name: string;
    description: string;
    ipTypes: any[];
    lineTypes: any[];
} | undefined;
export declare function isIpTypeAllowed(ipType: IpType, planGroupId: string): boolean;
export declare function isLineTypeAllowed(lineType: LineType, planGroupId: string): boolean;
//# sourceMappingURL=ip-assets.d.ts.map