/**
 * 定时任务服务
 * 管理IP声誉检测、IP池轮换、缓存清理等定时任务
 */

import cron from 'node-cron';
import { db } from '../../database';
import { logger } from '../../utils/logger';
import { getIPReputationService } from '../ip-reputation';
import { getIPPoolService } from '../ip-pool';
import { ScheduledTaskResult } from '../../shared/types/ip-assets';

/**
 * 定时任务配置
 */
interface TaskConfig {
  name: string;
  schedule: string;
  enabled: boolean;
  runOnStart?: boolean;
}

/**
 * 定时任务服务类
 */
export class ScheduledTaskService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private ipReputationService = getIPReputationService();
  private ipPoolService = getIPPoolService();

  // 默认任务配置
  private defaultConfigs: TaskConfig[] = [
    {
      name: 'ipReputationCheck',
      schedule: '0 2 * * *', // 每天凌晨2:00
      enabled: true,
      runOnStart: false
    },
    {
      name: 'ipPoolRotation',
      schedule: '*/5 * * * *', // 每5分钟
      enabled: true,
      runOnStart: false
    },
    {
      name: 'cleanExpiredCache',
      schedule: '0 3 * * *', // 每天凌晨3:00
      enabled: true,
      runOnStart: false
    },
    {
      name: 'refreshNodeIPScores',
      schedule: '0 */6 * * *', // 每6小时
      enabled: true,
      runOnStart: false
    }
  ];

  /**
   * 初始化并启动所有定时任务
   */
  initialize(): void {
    logger.info('Initializing scheduled tasks...');

    for (const config of this.defaultConfigs) {
      if (config.enabled) {
        this.registerTask(config);
      }
    }

    logger.info(`Scheduled tasks initialized: ${this.tasks.size} tasks registered`);
  }

  /**
   * 注册定时任务
   * @param config 任务配置
   */
  private registerTask(config: TaskConfig): void {
    try {
      const task = cron.schedule(
        config.schedule,
        async () => {
          await this.executeTask(config.name);
        },
        {
          scheduled: true,
          timezone: 'Asia/Shanghai'
        }
      );

      this.tasks.set(config.name, task);
      logger.info(`Task registered: ${config.name} (${config.schedule})`);

      // 如果需要启动时执行
      if (config.runOnStart) {
        this.executeTask(config.name);
      }
    } catch (error) {
      logger.error(`Failed to register task: ${config.name}`, error);
    }
  }

  /**
   * 执行指定任务
   * @param taskName 任务名称
   * @returns 执行结果
   */
  async executeTask(taskName: string): Promise<ScheduledTaskResult> {
    const startTime = Date.now();
    const result: ScheduledTaskResult = {
      taskName,
      success: false,
      executedAt: new Date(),
      duration: 0,
      itemsProcessed: 0,
      itemsFailed: 0
    };

    try {
      logger.info(`Executing scheduled task: ${taskName}`);

      switch (taskName) {
        case 'ipReputationCheck':
          await this.executeIPReputationCheck(result);
          break;

        case 'ipPoolRotation':
          await this.executeIPPoolRotation(result);
          break;

        case 'cleanExpiredCache':
          await this.executeCleanExpiredCache(result);
          break;

        case 'refreshNodeIPScores':
          await this.executeRefreshNodeIPScores(result);
          break;

        default:
          throw new Error(`Unknown task: ${taskName}`);
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      // 记录任务执行历史
      await this.recordTaskExecution(result);

      logger.info(`Task completed: ${taskName}`, {
        duration: result.duration,
        itemsProcessed: result.itemsProcessed,
        itemsFailed: result.itemsFailed
      });
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.duration = Date.now() - startTime;

      await this.recordTaskExecution(result);

      logger.error(`Task failed: ${taskName}`, error);
    }

    return result;
  }

  /**
   * 执行IP声誉检测任务
   * 每天凌晨2:00执行，检测所有住宅IP节点
   */
  private async executeIPReputationCheck(result: ScheduledTaskResult): Promise<void> {
    try {
      // 获取所有住宅IP节点
      const nodes = await db('nodes')
        .whereIn('ip_type', ['residential_dynamic', 'residential_static'])
        .where('status', '!=', 'deleted')
        .select('id', 'current_ip', 'host', 'name');

      logger.info(`IP reputation check started for ${nodes.length} residential nodes`);

      const ips: string[] = [];
      const nodeIpMap = new Map<string, { nodeId: string; name: string }>();

      for (const node of nodes) {
        const ip = node.current_ip || node.host;
        if (ip && this.isValidIP(ip)) {
          ips.push(ip);
          nodeIpMap.set(ip, { nodeId: node.id, name: node.name });
        }
      }

      // 批量检测IP
      const batchResult = await this.ipReputationService.batchCheckIPs(ips, 10, 1000);

      // 更新节点评分
      for (const [ip, reputation] of batchResult.results) {
        const nodeInfo = nodeIpMap.get(ip);
        if (nodeInfo) {
          try {
            await db('nodes')
              .where('id', nodeInfo.nodeId)
              .update({
                ip_score: reputation.score,
                updated_at: new Date()
              });

            result.itemsProcessed++;

            // 低分预警
            if (reputation.score < 40) {
              await this.createAlert('CRITICAL_LOW_IP_SCORE', {
                nodeId: nodeInfo.nodeId,
                nodeName: nodeInfo.name,
                ip,
                score: reputation.score
              });
            } else if (reputation.score < 60) {
              await this.createAlert('LOW_IP_SCORE', {
                nodeId: nodeInfo.nodeId,
                nodeName: nodeInfo.name,
                ip,
                score: reputation.score
              });
            }
          } catch (error) {
            result.itemsFailed++;
            logger.error(`Failed to update node IP score: ${nodeInfo.nodeId}`, error);
          }
        }
      }

      result.itemsFailed += batchResult.failed;

      logger.info(`IP reputation check completed: ${result.itemsProcessed} updated, ${result.itemsFailed} failed`);
    } catch (error) {
      logger.error('Failed to execute IP reputation check', error);
      throw error;
    }
  }

  /**
   * 执行IP池轮换任务
   * 每5分钟执行，检查并轮换到期的IP池
   */
  private async executeIPPoolRotation(result: ScheduledTaskResult): Promise<void> {
    try {
      const rotationResult = await this.ipPoolService.scheduledRotation();

      result.itemsProcessed = rotationResult.rotated;
      result.itemsFailed = rotationResult.failed;

      // 记录失败的轮换
      for (const item of rotationResult.results) {
        if (!item.success && item.error) {
          await this.createAlert('IP_ROTATION_FAILED', {
            poolId: item.poolId,
            error: item.error
          });
        }
      }

      if (rotationResult.rotated > 0) {
        logger.info(`IP pool rotation completed: ${rotationResult.rotated} rotated, ${rotationResult.failed} failed`);
      }
    } catch (error) {
      logger.error('Failed to execute IP pool rotation', error);
      throw error;
    }
  }

  /**
   * 执行清理过期缓存任务
   * 每天凌晨3:00执行
   */
  private async executeCleanExpiredCache(result: ScheduledTaskResult): Promise<void> {
    try {
      // 清理IP声誉缓存
      const deletedCount = await this.ipReputationService.cleanExpiredCache();
      result.itemsProcessed = deletedCount;

      // 清理Redis中过期的IP声誉缓存
      // 这里可以添加更多的缓存清理逻辑

      logger.info(`Expired cache cleaned: ${deletedCount} records deleted`);
    } catch (error) {
      logger.error('Failed to execute clean expired cache', error);
      throw error;
    }
  }

  /**
   * 执行刷新节点IP评分任务
   * 每6小时执行，刷新所有节点的IP评分
   */
  private async executeRefreshNodeIPScores(result: ScheduledTaskResult): Promise<void> {
    try {
      // 获取所有有IP的节点
      const nodes = await db('nodes')
        .where('status', 'active')
        .whereNotNull('current_ip')
        .select('id', 'current_ip', 'name');

      logger.info(`Refreshing IP scores for ${nodes.length} nodes`);

      for (const node of nodes) {
        try {
          const reputation = await this.ipReputationService.refreshNodeIPScore(
            node.id,
            node.current_ip
          );

          if (reputation) {
            result.itemsProcessed++;
          } else {
            result.itemsFailed++;
          }
        } catch (error) {
          result.itemsFailed++;
          logger.error(`Failed to refresh IP score for node: ${node.id}`, error);
        }
      }

      logger.info(`Node IP scores refresh completed: ${result.itemsProcessed} success, ${result.itemsFailed} failed`);
    } catch (error) {
      logger.error('Failed to execute refresh node IP scores', error);
      throw error;
    }
  }

  /**
   * 手动触发任务
   * @param taskName 任务名称
   * @returns 执行结果
   */
  async runTaskManually(taskName: string): Promise<ScheduledTaskResult> {
    logger.info(`Manual task execution triggered: ${taskName}`);
    return this.executeTask(taskName);
  }

  /**
   * 获取所有任务状态
   * @returns 任务状态列表
   */
  getTaskStatus(): Array<{
    name: string;
    schedule: string;
    enabled: boolean;
    running: boolean;
  }> {
    return this.defaultConfigs.map(config => ({
      name: config.name,
      schedule: config.schedule,
      enabled: config.enabled,
      running: this.tasks.has(config.name)
    }));
  }

  /**
   * 停止所有任务
   */
  stopAll(): void {
    logger.info('Stopping all scheduled tasks...');

    for (const [name, task] of this.tasks) {
      task.stop();
      logger.info(`Task stopped: ${name}`);
    }

    this.tasks.clear();
    logger.info('All scheduled tasks stopped');
  }

  /**
   * 停止指定任务
   * @param taskName 任务名称
   */
  stopTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      this.tasks.delete(taskName);
      logger.info(`Task stopped: ${taskName}`);
      return true;
    }
    return false;
  }

  /**
   * 启动指定任务
   * @param taskName 任务名称
   */
  startTask(taskName: string): boolean {
    const config = this.defaultConfigs.find(c => c.name === taskName);
    if (config && !this.tasks.has(taskName)) {
      this.registerTask(config);
      return true;
    }
    return false;
  }

  /**
   * 记录任务执行历史
   * @param result 执行结果
   */
  private async recordTaskExecution(result: ScheduledTaskResult): Promise<void> {
    try {
      await db('scheduled_task_logs').insert({
        id: this.generateId(),
        task_name: result.taskName,
        success: result.success,
        executed_at: result.executedAt,
        duration: result.duration,
        items_processed: result.itemsProcessed,
        items_failed: result.itemsFailed,
        error: result.error || null,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Failed to record task execution', error);
    }
  }

  /**
   * 创建告警
   * @param type 告警类型
   * @param data 告警数据
   */
  private async createAlert(type: string, data: Record<string, any>): Promise<void> {
    try {
      await db('system_alerts').insert({
        id: this.generateId(),
        type,
        severity: type.includes('CRITICAL') ? 'critical' : 'warning',
        title: this.getAlertTitle(type),
        message: this.getAlertMessage(type, data),
        data: JSON.stringify(data),
        status: 'open',
        created_at: new Date()
      });

      logger.warn(`Alert created: ${type}`, data);
    } catch (error) {
      logger.error('Failed to create alert', error);
    }
  }

  /**
   * 获取告警标题
   */
  private getAlertTitle(type: string): string {
    const titles: Record<string, string> = {
      'LOW_IP_SCORE': 'IP评分较低',
      'CRITICAL_LOW_IP_SCORE': 'IP评分过低',
      'IP_ROTATION_FAILED': 'IP轮换失败'
    };
    return titles[type] || '系统告警';
  }

  /**
   * 获取告警消息
   */
  private getAlertMessage(type: string, data: Record<string, any>): string {
    switch (type) {
      case 'LOW_IP_SCORE':
        return `节点 ${data.nodeName || data.nodeId} 的IP ${data.ip} 评分为 ${data.score}，低于预警阈值`;
      case 'CRITICAL_LOW_IP_SCORE':
        return `节点 ${data.nodeName || data.nodeId} 的IP ${data.ip} 评分为 ${data.score}，低于危险阈值，建议立即更换`;
      case 'IP_ROTATION_FAILED':
        return `IP池 ${data.poolId} 轮换失败: ${data.error}`;
      default:
        return JSON.stringify(data);
    }
  }

  /**
   * 验证IP格式
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取任务执行历史
   * @param taskName 任务名称（可选）
   * @param limit 限制数量
   * @returns 执行历史列表
   */
  async getTaskExecutionHistory(
    taskName?: string,
    limit = 50
  ): Promise<ScheduledTaskResult[]> {
    try {
      let query = db('scheduled_task_logs')
        .orderBy('executed_at', 'desc')
        .limit(limit);

      if (taskName) {
        query = query.where('task_name', taskName);
      }

      const records = await query;

      return records.map(record => ({
        taskName: record.task_name,
        success: record.success,
        executedAt: record.executed_at,
        duration: record.duration,
        itemsProcessed: record.items_processed,
        itemsFailed: record.items_failed,
        error: record.error
      }));
    } catch (error) {
      logger.error('Failed to get task execution history', error);
      return [];
    }
  }
}

// 导出单例实例
let scheduledTaskServiceInstance: ScheduledTaskService | null = null;

export function getScheduledTaskService(): ScheduledTaskService {
  if (!scheduledTaskServiceInstance) {
    scheduledTaskServiceInstance = new ScheduledTaskService();
  }
  return scheduledTaskServiceInstance;
}

export default ScheduledTaskService;
