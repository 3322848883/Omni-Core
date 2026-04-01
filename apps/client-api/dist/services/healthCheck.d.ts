export interface HealthCheckResult {
    nodeId: string;
    status: 'online' | 'offline' | 'degraded';
    latency: number;
    bandwidth: number;
    connections: number;
    lastChecked: Date;
    error?: string;
}
export interface LatencyTestResult {
    nodeId: string;
    host: string;
    port: number;
    latency: number;
    packetLoss: number;
    timestamp: Date;
}
/**
 * 节点健康检查服务
 */
export declare class HealthCheckService {
    private checkInterval;
    private latencyTestInterval;
    private bandwidthTestInterval;
    constructor();
    /**
     * 检查节点在线状态
     */
    checkNodeStatus(nodeId: string, host: string, port: number): Promise<HealthCheckResult>;
    /**
     * TCP 连接测试
     */
    private tcpConnectTest;
    /**
     * 测试节点延迟
     */
    testLatency(nodeId: string, host: string, port: number): Promise<LatencyTestResult>;
    /**
     * 测试节点带宽
     */
    testBandwidth(nodeId: string, host: string): Promise<number>;
    /**
     * 获取节点连接数
     */
    getNodeConnections(nodeId: string): Promise<number>;
    /**
     * 更新节点状态
     */
    private updateNodeStatus;
    /**
     * 保存延迟测试结果
     */
    private saveLatencyResult;
    /**
     * 获取节点健康历史
     */
    getHealthHistory(nodeId: string, limit?: number): Promise<HealthCheckResult[]>;
    /**
     * 获取延迟历史
     */
    getLatencyHistory(nodeId: string, hours?: number): Promise<LatencyTestResult[]>;
    /**
     * 批量检查所有节点
     */
    checkAllNodes(): Promise<HealthCheckResult[]>;
    /**
     * 获取最佳节点
     */
    getBestNode(protocol?: string): Promise<string | null>;
}
export declare const healthCheckService: HealthCheckService;
//# sourceMappingURL=healthCheck.d.ts.map