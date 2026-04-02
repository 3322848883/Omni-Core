export { XrayConfigGenerator, generateUUID, generatePassword, generateShortId } from './config';
export type { XrayConfig, InboundConfig, OutboundConfig, StreamSettings, TLSSettings, RealitySettings, WSSettings, GRPCSettings, RoutingConfig, RoutingRule, PolicyConfig, } from './config';
export { XrayClient, getXrayClient, resetXrayClient } from './client';
export type { XrayStatsResponse, XraySysStatsResponse, XrayInboundConfig, UserConnection, TrafficStats, } from './client';
export { XrayAPIClient, getXrayClient as getXrayAPIClient } from './api';
export { SubscriptionGenerator } from './subscription';
export type { NodeConfig } from './subscription';
export { TrafficCollector, getTrafficCollector } from './trafficCollector';
export { UserSyncService, getUserSyncService } from './userSync';
export type { UserSyncConfig, SyncResult } from './userSync';
export interface XrayServiceConfig {
    autoStartTrafficCollector: boolean;
    autoStartUserSync: boolean;
    userSyncIntervalMs: number;
    trafficCollectorIntervalMs: number;
}
export declare function initializeXrayService(config?: Partial<XrayServiceConfig>): void;
export declare function shutdownXrayService(): void;
export declare function getXrayServiceStatus(): Promise<{
    xrayConnected: boolean;
    redisConnected: boolean;
    trafficCollectorRunning: boolean;
    userSyncRunning: boolean;
}>;
export declare function reloadXrayConfig(): Promise<{
    success: boolean;
    message: string;
}>;
//# sourceMappingURL=index.d.ts.map