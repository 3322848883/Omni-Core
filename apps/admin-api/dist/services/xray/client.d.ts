export interface XrayStatsResponse {
    stat?: Array<{
        name: string;
        value: string;
    }>;
}
export interface XraySysStatsResponse {
    SysStats?: {
        NumGoroutine: number;
        NumGC: number;
        Alloc: number;
        TotalAlloc: number;
        Sys: number;
        Mallocs: number;
        Frees: number;
        LiveObjects: number;
        PauseTotalNs: number;
        Uptime: number;
    };
}
export interface XrayInboundConfig {
    tag: string;
    protocol: string;
    port?: number;
    settings?: any;
    streamSettings?: any;
    sniffing?: any;
}
export interface UserConnection {
    email: string;
    upload: number;
    download: number;
    ipCount: number;
    connections: Array<{
        id: string;
        remoteAddr: string;
        localAddr: string;
    }>;
}
export interface TrafficStats {
    uplink: number;
    downlink: number;
    total: number;
}
export declare class XrayClient {
    private client;
    private apiHost;
    private apiPort;
    private isConnected;
    constructor(apiHost?: string, apiPort?: number);
    private handleError;
    testConnection(): Promise<boolean>;
    getConnectionStatus(): boolean;
    queryStats(pattern: string, reset?: boolean): Promise<XrayStatsResponse>;
    getSysStats(): Promise<XraySysStatsResponse>;
    getAllInboundStats(reset?: boolean): Promise<Map<string, TrafficStats>>;
    getUserStats(email: string, reset?: boolean): Promise<TrafficStats>;
    getAllUserStats(reset?: boolean): Promise<Map<string, TrafficStats>>;
    addInbound(inboundConfig: XrayInboundConfig): Promise<boolean>;
    removeInbound(tag: string): Promise<boolean>;
    addUser(inboundTag: string, user: any): Promise<boolean>;
    removeUser(inboundTag: string, email: string): Promise<boolean>;
    restartLogger(): Promise<boolean>;
    getNodeStatus(): Promise<any>;
    getInbounds(): Promise<XrayInboundConfig[]>;
    hotReloadConfig(config: {
        inbounds: XrayInboundConfig[];
    }): Promise<boolean>;
}
export declare function getXrayClient(apiHost?: string, apiPort?: number): XrayClient;
export declare function resetXrayClient(): void;
export default XrayClient;
//# sourceMappingURL=client.d.ts.map