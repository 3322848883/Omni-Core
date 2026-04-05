export declare class XrayAPIClient {
    private client;
    private apiPort;
    constructor(apiPort?: number);
    getInboundStats(reset?: boolean): Promise<any>;
    getUserStats(email: string, reset?: boolean): Promise<{
        uplink: number;
        downlink: number;
    }>;
    getAllUserStats(reset?: boolean): Promise<Map<string, {
        uplink: number;
        downlink: number;
    }>>;
    addUser(inboundTag: string, user: {
        id?: string;
        password?: string;
        email: string;
        flow?: string;
        alterId?: number;
        level?: number;
    }): Promise<boolean>;
    removeUser(inboundTag: string, email: string): Promise<boolean>;
    getInbounds(): Promise<any[]>;
    addInbound(inbound: any): Promise<boolean>;
    removeInbound(tag: string): Promise<boolean>;
    getSysStats(): Promise<any>;
    testConnection(): Promise<boolean>;
}
export declare function getXrayClient(apiPort?: number): XrayAPIClient;
export default XrayAPIClient;
//# sourceMappingURL=api.d.ts.map