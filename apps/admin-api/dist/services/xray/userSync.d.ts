export interface UserSyncConfig {
    enabled: boolean;
    syncIntervalMs: number;
    batchSize: number;
    retryAttempts: number;
    retryDelayMs: number;
}
export interface SyncResult {
    success: boolean;
    syncedCount: number;
    failedCount: number;
    failedUsers: Array<{
        userId: string;
        email: string;
        error: string;
    }>;
    duration: number;
}
export declare class UserSyncService {
    private xrayClient;
    private userCache;
    private config;
    private isRunning;
    private syncIntervalId;
    constructor(config?: Partial<UserSyncConfig>);
    updateConfig(config: Partial<UserSyncConfig>): void;
    start(): void;
    stop(): void;
    getStatus(): {
        isRunning: boolean;
        config: UserSyncConfig;
    };
    syncAllUsers(): Promise<SyncResult>;
    syncUser(userId: string, userData?: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    private syncUserToXray;
    private prepareUserConfigForInbound;
    private getUserNodes;
    removeUserFromXray(userId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    batchSyncUsers(userIds: string[]): Promise<{
        success: string[];
        failed: Array<{
            userId: string;
            error: string;
        }>;
    }>;
    validateUserCache(userId: string): Promise<{
        valid: boolean;
        cached: boolean;
        error?: string;
    }>;
    private delay;
}
export declare function getUserSyncService(config?: Partial<UserSyncConfig>): UserSyncService;
export default UserSyncService;
//# sourceMappingURL=userSync.d.ts.map