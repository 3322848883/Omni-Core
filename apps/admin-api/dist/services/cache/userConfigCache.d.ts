import { RedisClient } from './redis';
export interface CachedUserConfig {
    userId: string;
    email: string;
    uuid: string;
    subscriptionPlan: string;
    trafficLimit: number;
    trafficUsed: number;
    expiresAt: string;
    status: number;
    nodes: Array<{
        nodeId: string;
        code: string;
        protocol: string;
        config: any;
    }>;
    updatedAt: string;
}
export declare class UserConfigCache {
    private redis;
    private readonly KEY_PREFIX;
    private readonly TTL_SECONDS;
    constructor(redis?: RedisClient);
    private getKey;
    setUserConfig(userId: string, config: CachedUserConfig): Promise<boolean>;
    getUserConfig(userId: string): Promise<CachedUserConfig | null>;
    deleteUserConfig(userId: string): Promise<boolean>;
    batchSetUserConfigs(configs: Array<{
        userId: string;
        config: CachedUserConfig;
    }>): Promise<{
        success: string[];
        failed: string[];
    }>;
    batchDeleteUserConfigs(userIds: string[]): Promise<{
        success: string[];
        failed: string[];
    }>;
    getAllCachedUserIds(): Promise<string[]>;
    clearAllUserConfigs(): Promise<boolean>;
    updateUserTraffic(userId: string, trafficUsed: number): Promise<boolean>;
    exists(userId: string): Promise<boolean>;
    getTTL(userId: string): Promise<number>;
    extendTTL(userId: string, seconds: number): Promise<boolean>;
}
export declare function getUserConfigCache(redis?: RedisClient): UserConfigCache;
export default UserConfigCache;
//# sourceMappingURL=userConfigCache.d.ts.map