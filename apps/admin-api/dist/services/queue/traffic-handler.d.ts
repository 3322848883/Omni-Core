export interface TrafficStatsPayload {
    type: 'user_traffic' | 'node_traffic' | 'daily_summary';
    userId?: string;
    nodeId?: string;
    date?: string;
    uploadBytes?: number;
    downloadBytes?: number;
    connectionCount?: number;
}
export declare class TrafficStatsHandler {
    handle(payload: TrafficStatsPayload): Promise<void>;
    private handleUserTraffic;
    private handleNodeTraffic;
    private handleDailySummary;
}
export declare const trafficStatsHandler: TrafficStatsHandler;
//# sourceMappingURL=traffic-handler.d.ts.map