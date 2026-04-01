/**
 * IP池管理服务
 * 管理IP池的创建、轮换策略、与Xray配置同步
 */
import { IPPool, IPPoolIP, IPPoolConfig, IPPoolStatus, IPRotationResult } from '../../shared/types/ip-assets';
import { IpType } from '../../shared/constants/ip-assets';
/**
 * IP池管理服务类
 */
export declare class IPPoolService {
    private redisClient;
    private ipReputationService;
    /**
     * 创建IP池
     * @param config IP池配置
     * @returns 创建的IP池
     */
    createIPPool(config: IPPoolConfig): Promise<IPPool>;
    /**
     * 添加IP到池
     * @param poolId IP池ID
     * @param ip IP地址
     * @returns IP记录
     */
    addIPToPool(poolId: string, ip: string): Promise<IPPoolIP>;
    /**
     * 从池中移除IP
     * @param poolId IP池ID
     * @param ip IP地址
     */
    removeIPFromPool(poolId: string, ip: string): Promise<void>;
    /**
     * 获取IP池
     * @param poolId IP池ID
     * @returns IP池
     */
    getIPPool(poolId: string): Promise<IPPool | null>;
    /**
     * 获取节点的IP池
     * @param nodeId 节点ID
     * @returns IP池
     */
    getPoolByNodeId(nodeId: string): Promise<IPPool | null>;
    /**
     * 获取IP池状态
     * @param poolId IP池ID
     * @returns IP池状态
     */
    getIPPoolStatus(poolId: string): Promise<IPPoolStatus | null>;
    /**
     * 获取所有活跃的IP池
     * @returns IP池列表
     */
    getActivePools(): Promise<IPPool[]>;
    /**
     * 轮换IP
     * @param poolId IP池ID
     * @returns 轮换结果
     */
    rotateIP(poolId: string): Promise<IPRotationResult>;
    /**
     * 检查是否应该轮换
     * @param pool IP池
     * @returns 是否应该轮换
     */
    shouldRotate(pool: IPPool): boolean;
    /**
     * 执行定时轮换任务
     * @returns 轮换结果统计
     */
    scheduledRotation(): Promise<{
        total: number;
        rotated: number;
        failed: number;
        results: IPRotationResult[];
    }>;
    /**
     * 更新IP池配置
     * @param poolId IP池ID
     * @param updates 更新内容
     */
    updateIPPool(poolId: string, updates: Partial<Pick<IPPoolConfig, 'name' | 'rotationStrategy' | 'rotationInterval'>>): Promise<IPPool | null>;
    /**
     * 删除IP池
     * @param poolId IP池ID
     */
    deleteIPPool(poolId: string): Promise<void>;
    /**
     * 手动触发IP轮换
     * @param poolId IP池ID
     * @returns 轮换结果
     */
    manualRotate(poolId: string): Promise<IPRotationResult>;
    /**
     * 获取下一个可用IP
     * @param pool IP池
     * @returns IP地址
     */
    private getNextAvailableIP;
    /**
     * 轮询策略获取IP
     */
    private getRoundRobinIP;
    /**
     * 随机策略获取IP
     */
    private getRandomIP;
    /**
     * 最少使用策略获取IP
     */
    private getLeastUsedIP;
    /**
     * 质量优先策略获取IP
     */
    private getQualityFirstIP;
    /**
     * 计算下一个索引
     */
    private calculateNextIndex;
    /**
     * 更新IP使用记录
     */
    private updateIPUsage;
    /**
     * 同步到Xray
     */
    private syncToXray;
    /**
     * 刷新IP评分
     * @param poolId IP池ID
     */
    refreshIPScores(poolId: string): Promise<void>;
    /**
     * 获取IP池列表（带分页）
     */
    listIPPools(options?: {
        page?: number;
        limit?: number;
        nodeId?: string;
        ipType?: IpType;
        isActive?: boolean;
    }): Promise<{
        items: IPPool[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * 激活/停用IP池
     */
    setPoolActive(poolId: string, isActive: boolean): Promise<IPPool | null>;
    /**
     * 映射数据库记录到IPPool
     */
    private mapDatabaseRecordToPool;
    /**
     * 映射数据库记录到IPPoolIP
     */
    private mapDatabaseRecordToPoolIP;
}
export declare function getIPPoolService(): IPPoolService;
export default IPPoolService;
//# sourceMappingURL=index.d.ts.map