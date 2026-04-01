export declare class TrafficCollector {
    private xrayClient;
    private isRunning;
    private intervalId;
    private collectionInterval;
    constructor(apiPort?: number);
    setInterval(intervalMs: number): void;
    start(): void;
    stop(): void;
    collect(): Promise<void>;
    private saveUserTraffic;
    private checkTrafficLimit;
    getRealtimeTraffic(userId: string): Promise<{
        upload: number;
        download: number;
        total: number;
    } | null>;
    getAllOnlineTraffic(): Promise<Map<string, {
        uplink: number;
        downlink: number;
    }>>;
    manualCollect(): Promise<{
        success: boolean;
        message: string;
        collectedCount: number;
    }>;
    getStatus(): {
        isRunning: boolean;
        interval: number;
    };
}
export declare function getTrafficCollector(apiPort?: number): TrafficCollector;
export default TrafficCollector;
//# sourceMappingURL=trafficCollector.d.ts.map