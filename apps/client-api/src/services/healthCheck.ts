import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '@/utils/logger';
import db from '@/config/database';

const execAsync = promisify(exec);

// 健康检查结果类型
export interface HealthCheckResult {
  nodeId: string;
  status: 'online' | 'offline' | 'degraded';
  latency: number; // ms
  bandwidth: number; // Mbps
  connections: number;
  lastChecked: Date;
  error?: string;
}

// 延迟测试结果
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
export class HealthCheckService {
  private checkInterval: number;
  private latencyTestInterval: number;
  private bandwidthTestInterval: number;

  constructor() {
    this.checkInterval = 30000; // 30 秒
    this.latencyTestInterval = 300000; // 5 分钟
    this.bandwidthTestInterval = 1800000; // 30 分钟
  }

  /**
   * 检查节点在线状态
   */
  async checkNodeStatus(nodeId: string, host: string, port: number): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 使用 TCP 连接测试
      const isOnline = await this.tcpConnectTest(host, port);
      const latency = Date.now() - startTime;

      const result: HealthCheckResult = {
        nodeId,
        status: isOnline ? 'online' : 'offline',
        latency: isOnline ? latency : -1,
        bandwidth: 0,
        connections: 0,
        lastChecked: new Date(),
      };

      // 更新数据库
      await this.updateNodeStatus(nodeId, result);

      return result;
    } catch (error) {
      logger.error(`Health check failed for node ${nodeId}:`, error);
      
      const result: HealthCheckResult = {
        nodeId,
        status: 'offline',
        latency: -1,
        bandwidth: 0,
        connections: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.updateNodeStatus(nodeId, result);
      return result;
    }
  }

  /**
   * TCP 连接测试
   */
  private async tcpConnectTest(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }

  /**
   * 测试节点延迟
   */
  async testLatency(nodeId: string, host: string, port: number): Promise<LatencyTestResult> {
    const results: number[] = [];
    const packetCount = 5;
    let packetLoss = 0;

    for (let i = 0; i < packetCount; i++) {
      try {
        const startTime = Date.now();
        const success = await this.tcpConnectTest(host, port);
        
        if (success) {
          results.push(Date.now() - startTime);
        } else {
          packetLoss++;
        }
        
        // 等待 100ms 再发送下一个包
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        packetLoss++;
      }
    }

    const latency = results.length > 0 
      ? Math.round(results.reduce((a, b) => a + b, 0) / results.length)
      : -1;

    const result: LatencyTestResult = {
      nodeId,
      host,
      port,
      latency,
      packetLoss: (packetLoss / packetCount) * 100,
      timestamp: new Date(),
    };

    // 保存延迟测试结果
    await this.saveLatencyResult(result);

    return result;
  }

  /**
   * 测试节点带宽
   */
  async testBandwidth(nodeId: string, host: string): Promise<number> {
    try {
      // 使用 speedtest-cli 或类似工具
      // 这里使用简化的方法：下载一个小文件测试
      const testUrl = `http://${host}/speedtest`;
      const startTime = Date.now();
      
      // 使用 curl 测试下载速度
      const { stdout } = await execAsync(
        `curl -o /dev/null -s -w "%{speed_download}" --max-time 10 ${testUrl}`
      );
      
      const speedBps = parseFloat(stdout);
      const speedMbps = (speedBps * 8) / 1000000;

      // 保存带宽测试结果
      await db('node_bandwidth_tests').insert({
        node_id: nodeId,
        bandwidth: speedMbps,
        tested_at: new Date(),
      });

      return speedMbps;
    } catch (error) {
      logger.error(`Bandwidth test failed for node ${nodeId}:`, error);
      return 0;
    }
  }

  /**
   * 获取节点连接数
   */
  async getNodeConnections(nodeId: string): Promise<number> {
    try {
      // 从数据库查询活跃连接数
      const result = await db('user_connections')
        .where({ node_id: nodeId, is_active: true })
        .count('id as count')
        .first();

      return parseInt(result?.count as string, 10) || 0;
    } catch (error) {
      logger.error(`Failed to get connections for node ${nodeId}:`, error);
      return 0;
    }
  }

  /**
   * 更新节点状态
   */
  private async updateNodeStatus(nodeId: string, result: HealthCheckResult): Promise<void> {
    try {
      await db('nodes')
        .where({ id: nodeId })
        .update({
          status: result.status,
          latency: result.latency,
          last_checked_at: result.lastChecked,
          updated_at: new Date(),
        });

      // 插入健康检查历史
      await db('node_health_checks').insert({
        node_id: nodeId,
        status: result.status,
        latency: result.latency,
        error: result.error,
        checked_at: result.lastChecked,
      });
    } catch (error) {
      logger.error(`Failed to update node status for ${nodeId}:`, error);
    }
  }

  /**
   * 保存延迟测试结果
   */
  private async saveLatencyResult(result: LatencyTestResult): Promise<void> {
    try {
      await db('node_latency_tests').insert({
        node_id: result.nodeId,
        host: result.host,
        port: result.port,
        latency: result.latency,
        packet_loss: result.packetLoss,
        tested_at: result.timestamp,
      });
    } catch (error) {
      logger.error(`Failed to save latency result for ${result.nodeId}:`, error);
    }
  }

  /**
   * 获取节点健康历史
   */
  async getHealthHistory(nodeId: string, limit: number = 100): Promise<HealthCheckResult[]> {
    try {
      const rows = await db('node_health_checks')
        .where({ node_id: nodeId })
        .orderBy('checked_at', 'desc')
        .limit(limit)
        .select('*');

      return rows.map((row) => ({
        nodeId: row.node_id,
        status: row.status,
        latency: row.latency,
        bandwidth: 0,
        connections: 0,
        lastChecked: row.checked_at,
        error: row.error,
      }));
    } catch (error) {
      logger.error(`Failed to get health history for ${nodeId}:`, error);
      return [];
    }
  }

  /**
   * 获取延迟历史
   */
  async getLatencyHistory(nodeId: string, hours: number = 24): Promise<LatencyTestResult[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const rows = await db('node_latency_tests')
        .where({ node_id: nodeId })
        .where('tested_at', '>=', since)
        .orderBy('tested_at', 'desc')
        .select('*');

      return rows.map((row) => ({
        nodeId: row.node_id,
        host: row.host,
        port: row.port,
        latency: row.latency,
        packetLoss: row.packet_loss,
        timestamp: row.tested_at,
      }));
    } catch (error) {
      logger.error(`Failed to get latency history for ${nodeId}:`, error);
      return [];
    }
  }

  /**
   * 批量检查所有节点
   */
  async checkAllNodes(): Promise<HealthCheckResult[]> {
    try {
      const nodes = await db('nodes').where({ is_active: true }).select('*');
      
      const results: HealthCheckResult[] = [];
      
      for (const node of nodes) {
        const result = await this.checkNodeStatus(node.id, node.host, node.port);
        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Failed to check all nodes:', error);
      return [];
    }
  }

  /**
   * 获取最佳节点
   */
  async getBestNode(protocol?: string): Promise<string | null> {
    try {
      let query = db('nodes')
        .where({ status: 'online', is_active: true })
        .orderBy('latency', 'asc')
        .first();

      if (protocol) {
        query = query.where({ protocol });
      }

      const node = await query;
      return node ? node.id : null;
    } catch (error) {
      logger.error('Failed to get best node:', error);
      return null;
    }
  }
}

// 导出单例
export const healthCheckService = new HealthCheckService();
