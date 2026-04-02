/**
 * 定时任务服务
 * 管理IP声誉检测、IP池轮换、缓存清理等定时任务
 */
import { ScheduledTaskResult } from '../../shared/types/ip-assets';
/**
 * 定时任务服务类
 */
export declare class ScheduledTaskService {
    private tasks;
    private ipReputationService;
    private ipPoolService;
    private defaultConfigs;
    /**
     * 初始化并启动所有定时任务
     */
    initialize(): void;
    /**
     * 注册定时任务
     * @param config 任务配置
     */
    private registerTask;
    /**
     * 执行指定任务
     * @param taskName 任务名称
     * @returns 执行结果
     */
    executeTask(taskName: string): Promise<ScheduledTaskResult>;
    /**
     * 执行IP声誉检测任务
     * 每天凌晨2:00执行，检测所有住宅IP节点
     */
    private executeIPReputationCheck;
    /**
     * 执行IP池轮换任务
     * 每5分钟执行，检查并轮换到期的IP池
     */
    private executeIPPoolRotation;
    /**
     * 执行清理过期缓存任务
     * 每天凌晨3:00执行
     */
    private executeCleanExpiredCache;
    /**
     * 执行刷新节点IP评分任务
     * 每6小时执行，刷新所有节点的IP评分
     */
    private executeRefreshNodeIPScores;
    /**
     * 手动触发任务
     * @param taskName 任务名称
     * @returns 执行结果
     */
    runTaskManually(taskName: string): Promise<ScheduledTaskResult>;
    /**
     * 获取所有任务状态
     * @returns 任务状态列表
     */
    getTaskStatus(): Array<{
        name: string;
        schedule: string;
        enabled: boolean;
        running: boolean;
    }>;
    /**
     * 停止所有任务
     */
    stopAll(): void;
    /**
     * 停止指定任务
     * @param taskName 任务名称
     */
    stopTask(taskName: string): boolean;
    /**
     * 启动指定任务
     * @param taskName 任务名称
     */
    startTask(taskName: string): boolean;
    /**
     * 记录任务执行历史
     * @param result 执行结果
     */
    private recordTaskExecution;
    /**
     * 创建告警
     * @param type 告警类型
     * @param data 告警数据
     */
    private createAlert;
    /**
     * 获取告警标题
     */
    private getAlertTitle;
    /**
     * 获取告警消息
     */
    private getAlertMessage;
    /**
     * 验证IP格式
     */
    private isValidIP;
    /**
     * 生成唯一ID
     */
    private generateId;
    /**
     * 获取任务执行历史
     * @param taskName 任务名称（可选）
     * @param limit 限制数量
     * @returns 执行历史列表
     */
    getTaskExecutionHistory(taskName?: string, limit?: number): Promise<ScheduledTaskResult[]>;
}
export declare function getScheduledTaskService(): ScheduledTaskService;
export default ScheduledTaskService;
//# sourceMappingURL=index.d.ts.map