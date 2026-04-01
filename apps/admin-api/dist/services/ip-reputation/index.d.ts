/**
 * IP声誉检测服务
 * 集成IPData API进行IP纯净度检测，实现缓存机制和批量检测
 */
interface IPReputation {
    ip: string;
    provider: string;
    score: number;
    isResidential: boolean | null;
    isDatacenter: boolean | null;
    isVpn: boolean | null;
    isProxy: boolean | null;
    isTor: boolean | null;
    abuseRecords: number;
    country: string | null;
    isp: string | null;
    rawData: Record<string, any>;
    checkedAt: Date;
    expiresAt: Date;
}
interface BatchIPCheckResult {
    total: number;
    success: number;
    failed: number;
    results: Map<string, IPReputation>;
    errors: Map<string, string>;
}
interface IPCheckRateLimit {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
}
/**
 * IP声誉服务配置
 */
interface IPReputationServiceConfig {
    ipdataApiKey: string;
    cacheTtlSeconds: number;
    rateLimit: IPCheckRateLimit;
    alertThreshold: number;
    criticalThreshold: number;
}
/**
 * IP声誉检测服务类
 */
export declare class IPReputationService {
    private httpClient;
    private redisClient;
    private serviceConfig;
    private requestTimestamps;
    private readonly REQUEST_LOG_WINDOW;
    constructor(serviceConfig?: Partial<IPReputationServiceConfig>);
    /**
     * 获取当前配置（每次调用时重新读取环境变量）
     */
    private getConfig;
    /**
     * 检测单个IP的声誉
     * @param ip IP地址
     * @param forceRefresh 强制刷新缓存
     * @returns IP声誉检测结果
     */
    checkIP(ip: string, forceRefresh?: boolean): Promise<IPReputation>;
    /**
     * 批量检测IP声誉
     * @param ips IP地址列表
     * @param batchSize 每批大小
     * @param delayMs 批次间延迟（毫秒）
     * @returns 批量检测结果
     */
    batchCheckIPs(ips: string[], batchSize?: number, delayMs?: number): Promise<BatchIPCheckResult>;
    /**
     * 刷新节点IP评分
     * @param nodeId 节点ID
     * @param currentIp 当前IP地址
     * @returns 是否成功
     */
    refreshNodeIPScore(nodeId: string, currentIp: string): Promise<IPReputation | null>;
    /**
     * 从Redis缓存获取
     */
    private getFromCache;
    /**
     * 保存到Redis缓存
     */
    private saveToCache;
    /**
     * 从数据库获取缓存
     */
    private getFromDatabase;
    /**
     * 保存到数据库
     */
    private saveToDatabase;
    /**
     * 调用IP检测API（支持多个免费源）
     */
    private callIPDataAPI;
    /**
     * 使用IPData API Key调用
     */
    private callIPDataWithKey;
    /**
     * 调用免费IP检测API（无需Key）
     */
    private callFreeIPAPIS;
    /**
     * 基本IP检测（无需外部API）
     */
    private getBasicReputation;
    /**
     * 计算IP评分
     */
    private calculateScore;
    /**
     * 检查是否过期
     */
    private isExpired;
    /**
     * 限流检查
     */
    private checkRateLimit;
    /**
     * 发送低分预警
     */
    private sendLowScoreAlert;
    /**
     * 验证IP格式
     */
    private isValidIP;
    /**
     * 获取缓存Key
     */
    private getCacheKey;
    /**
     * 将数组分块
     */
    private chunkArray;
    /**
     * 延迟
     */
    private sleep;
    /**
     * 映射数据库记录到IPReputation
     */
    private mapDatabaseRecordToReputation;
    /**
     * 清理过期缓存
     */
    cleanExpiredCache(): Promise<number>;
    /**
     * 获取IP声誉统计
     */
    getReputationStats(): Promise<{
        totalCached: number;
        avgScore: number;
        lowScoreCount: number;
    }>;
}
export declare function getIPReputationService(): IPReputationService;
export default IPReputationService;
//# sourceMappingURL=index.d.ts.map