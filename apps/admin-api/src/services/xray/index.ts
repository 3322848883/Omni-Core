// Xray Core Service - 入口文件
export { XrayConfigGenerator, generateUUID, generatePassword, generateShortId } from './config';
export type {
  XrayConfig,
  InboundConfig,
  OutboundConfig,
  StreamSettings,
  TLSSettings,
  RealitySettings,
  WSSettings,
  GRPCSettings,
  RoutingConfig,
  RoutingRule,
  PolicyConfig,
} from './config';

export { XrayClient, getXrayClient, resetXrayClient } from './client';
export type {
  XrayStatsResponse,
  XraySysStatsResponse,
  XrayInboundConfig,
  UserConnection,
  TrafficStats,
} from './client';

export { XrayAPIClient, getXrayClient as getXrayAPIClient } from './api';

export { SubscriptionGenerator } from './subscription';
export type { NodeConfig } from './subscription';

export { TrafficCollector, getTrafficCollector } from './trafficCollector';

export { UserSyncService, getUserSyncService } from './userSync';
export type { UserSyncConfig, SyncResult } from './userSync';

// 导入依赖
import { logger } from '../../utils/logger';
import { getTrafficCollector } from './trafficCollector';
import { getUserSyncService } from './userSync';
import { getXrayClient } from './client';
import { getRedisClient } from '../cache';

// Xray 服务配置
export interface XrayServiceConfig {
  autoStartTrafficCollector: boolean;
  autoStartUserSync: boolean;
  userSyncIntervalMs: number;
  trafficCollectorIntervalMs: number;
}

// 默认配置
const defaultConfig: XrayServiceConfig = {
  // 开发环境下禁用自动启动，避免Xray未运行时阻塞
  autoStartTrafficCollector: process.env.NODE_ENV === 'production',
  autoStartUserSync: process.env.NODE_ENV === 'production',
  userSyncIntervalMs: 300000, // 5分钟
  trafficCollectorIntervalMs: 60000, // 1分钟
};

// 初始化 Xray 服务
export function initializeXrayService(config: Partial<XrayServiceConfig> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };

  logger.info('Initializing Xray service...');

  try {
    // 测试 Xray 连接
    const xrayClient = getXrayClient();
    xrayClient.testConnection().then(connected => {
      if (connected) {
        logger.info('Xray API connection established');
      } else {
        logger.warn('Xray API connection failed - service will retry on demand');
      }
    });

    // 测试 Redis 连接
    const redisClient = getRedisClient();
    if (redisClient.isReady()) {
      logger.info('Redis cache connection established');
    } else {
      logger.warn('Redis cache not available - caching disabled');
    }

    // 启动流量采集器
    if (finalConfig.autoStartTrafficCollector) {
      const collector = getTrafficCollector();
      collector.setInterval(finalConfig.trafficCollectorIntervalMs);
      collector.start();
    }

    // 启动用户同步服务
    if (finalConfig.autoStartUserSync) {
      const userSync = getUserSyncService({
        syncIntervalMs: finalConfig.userSyncIntervalMs,
      });
      userSync.start();
    }

    logger.info('Xray service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Xray service:', error);
    throw error;
  }
}

// 关闭 Xray 服务
export function shutdownXrayService(): void {
  logger.info('Shutting down Xray service...');

  try {
    // 停止流量采集器
    const collector = getTrafficCollector();
    collector.stop();

    // 停止用户同步服务
    const userSync = getUserSyncService();
    userSync.stop();

    // 关闭 Redis 连接
    const redisClient = getRedisClient();
    redisClient.close();

    logger.info('Xray service shut down successfully');
  } catch (error) {
    logger.error('Error during Xray service shutdown:', error);
  }
}

// 获取 Xray 服务状态
export async function getXrayServiceStatus(): Promise<{
  xrayConnected: boolean;
  redisConnected: boolean;
  trafficCollectorRunning: boolean;
  userSyncRunning: boolean;
}> {
  const xrayClient = getXrayClient();
  const redisClient = getRedisClient();
  const collector = getTrafficCollector();
  const userSync = getUserSyncService();

  return {
    xrayConnected: await xrayClient.testConnection(),
    redisConnected: redisClient.isReady(),
    trafficCollectorRunning: collector.getStatus().isRunning,
    userSyncRunning: userSync.getStatus().isRunning,
  };
}

// 重新加载 Xray 配置
export async function reloadXrayConfig(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const xrayClient = getXrayClient();
    const isConnected = await xrayClient.testConnection();

    if (!isConnected) {
      return {
        success: false,
        message: 'Xray API not connected',
      };
    }

    // 获取所有入站配置
    const inbounds = await xrayClient.getInbounds();

    logger.info(`Reloaded Xray config with ${inbounds.length} inbounds`);

    return {
      success: true,
      message: `Reloaded ${inbounds.length} inbounds`,
    };
  } catch (error) {
    logger.error('Failed to reload Xray config:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
