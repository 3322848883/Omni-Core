import { RedisClient } from './redis';
export interface CachedNodeConfig {
    id: string;
    code: string;
    name: string;
    address: string;
    port: number;
    protocol: string;
    config: any;
    status: string;
    trafficLimit: number;
    trafficUsed: number;
    updatedAt: string;
}
export declare class NodeConfigCache {
    private redis;
    private readonly KEY_PREFIX;
    private readonly TTL_SECONDS;
    constructor(redis?: RedisClient);
    private getKey;
    setNodeConfig(nodeId: string, config: CachedNodeConfig): Promise<boolean>;
    getNodeConfig(nodeId: string): Promise<CachedNodeConfig | null>;
    deleteNodeConfig(nodeId: string): Promise<boolean>;
    batchSetNodeConfigs(configs: Array<{
        nodeId: string;
        config: CachedNodeConfig;
    }>): Promise<{
        success: string[];
        failed: string[];
    }>;
    batchDeleteNodeConfigs(nodeIds: string[]): Promise<{
        success: string[];
        failed: string[];
    }>;
    getAllCachedNodeIds(): Promise<string[]>;
    getAllNodeConfigs(): Promise<CachedNodeConfig[]>;
    clearAllNodeConfigs(): Promise<boolean>;
    updateNodeStatus(nodeId: string, status: string): Promise<boolean>;
    updateNodeTraffic(nodeId: string, trafficUsed: number): Promise<boolean>;
    exists(nodeId: string): Promise<boolean>;
    getTTL(nodeId: string): Promise<number>;
    extendTTL(nodeId: string, seconds: number): Promise<boolean>;
    getNodesByProtocol(protocol: string): Promise<CachedNodeConfig[]>;
    getNodesByStatus(status: string): Promise<CachedNodeConfig[]>;
}
export declare function getNodeConfigCache(redis?: RedisClient): NodeConfigCache;
export default NodeConfigCache;
//# sourceMappingURL=nodeConfigCache.d.ts.map