import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import logger from '@/utils/logger';

const execAsync = promisify(exec);

// Xray 配置类型定义
export interface XrayInboundConfig {
  tag: string;
  port: number;
  protocol: 'vless' | 'vmess' | 'trojan' | 'shadowsocks' | 'dokodemo-door';
  settings: Record<string, any>;
  streamSettings?: Record<string, any>;
  sniffing?: {
    enabled: boolean;
    destOverride: string[];
  };
}

export interface XrayOutboundConfig {
  tag: string;
  protocol: 'freedom' | 'blackhole' | string;
  settings?: Record<string, any>;
}

export interface XrayConfig {
  log: {
    access: string;
    error: string;
    loglevel: string;
  };
  api: {
    tag: string;
    services: string[];
  };
  inbounds: XrayInboundConfig[];
  outbounds: XrayOutboundConfig[];
  routing: {
    rules: Array<{
      type: string;
      inboundTag?: string[];
      outboundTag: string;
    }>;
  };
  stats: {};
  policy: {
    levels: {
      '0': {
        statsUserUplink: boolean;
        statsUserDownlink: boolean;
      };
    };
    system: {
      statsInboundUplink: boolean;
      statsInboundDownlink: boolean;
    };
  };
}

// 节点配置类型
export interface NodeConfig {
  id: string;
  name: string;
  protocol: 'vless' | 'vmess' | 'trojan' | 'shadowsocks';
  host: string;
  port: number;
  uuid?: string;
  password?: string;
  alterId?: number;
  security?: 'none' | 'tls' | 'xtls';
  network?: 'tcp' | 'ws' | 'grpc' | 'kcp';
  path?: string;
  serviceName?: string;
  flow?: string;
  encryption?: string;
}

// 用户配置类型
export interface UserConfig {
  userId: string;
  email: string;
  uuid: string;
  trafficLimit: number;
  trafficUsed: number;
  expireDate: Date | null;
  isActive: boolean;
}

// 流量统计类型
export interface TrafficStats {
  userId: string;
  upload: number;
  download: number;
  total: number;
  timestamp: Date;
}

/**
 * Xray 服务类
 * 负责 Xray 配置的生成、管理和流量统计
 */
export class XrayService {
  private configPath: string;
  private xrayBinaryPath: string;
  private apiPort: number;
  private apiHost: string;

  constructor() {
    this.configPath = process.env.XRAY_CONFIG_PATH || '/etc/xray/config.json';
    this.xrayBinaryPath = process.env.XRAY_BINARY_PATH || '/usr/local/bin/xray';
    this.apiPort = parseInt(process.env.XRAY_API_PORT || '10085');
    this.apiHost = process.env.XRAY_API_HOST || '127.0.0.1';
  }

  /**
   * 生成 Xray 完整配置
   */
  async generateConfig(nodes: NodeConfig[], users: UserConfig[]): Promise<XrayConfig> {
    const inbounds = this.generateInbounds(nodes, users);
    const outbounds = this.generateOutbounds();

    const config: XrayConfig = {
      log: {
        access: '/var/log/xray/access.log',
        error: '/var/log/xray/error.log',
        loglevel: 'warning',
      },
      api: {
        tag: 'api',
        services: ['HandlerService', 'LoggerService', 'StatsService'],
      },
      inbounds: [
        ...inbounds,
        {
          tag: 'api',
          port: this.apiPort,
          protocol: 'dokodemo-door',
          settings: {
            address: this.apiHost,
          },
        },
      ],
      outbounds,
      routing: {
        rules: [
          {
            type: 'field',
            inboundTag: ['api'],
            outboundTag: 'api',
          },
        ],
      },
      stats: {},
      policy: {
        levels: {
          '0': {
            statsUserUplink: true,
            statsUserDownlink: true,
          },
        },
        system: {
          statsInboundUplink: true,
          statsInboundDownlink: true,
        },
      },
    };

    return config;
  }

  /**
   * 生成入站配置
   */
  private generateInbounds(nodes: NodeConfig[], users: UserConfig[]): XrayInboundConfig[] {
    return nodes.map((node) => this.generateInbound(node, users));
  }

  /**
   * 生成单个入站配置
   */
  private generateInbound(node: NodeConfig, users: UserConfig[]): XrayInboundConfig {
    const clients = users
      .filter((user) => user.isActive)
      .map((user) => this.generateClient(user, node.protocol));

    const inbound: XrayInboundConfig = {
      tag: `node_${node.id}`,
      port: node.port,
      protocol: node.protocol,
      settings: this.generateProtocolSettings(node, clients),
      streamSettings: this.generateStreamSettings(node),
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls'],
      },
    };

    return inbound;
  }

  /**
   * 生成协议特定的配置
   */
  private generateProtocolSettings(
    node: NodeConfig,
    clients: Array<Record<string, any>>
  ): Record<string, any> {
    switch (node.protocol) {
      case 'vless':
        return {
          clients,
          decryption: 'none',
          fallbacks: [],
        };
      case 'vmess':
        return {
          clients: clients.map((c) => ({
            id: c.id,
            alterId: node.alterId || 0,
            email: c.email,
          })),
        };
      case 'trojan':
        return {
          clients: clients.map((c) => ({
            password: c.id,
            email: c.email,
          })),
        };
      case 'shadowsocks':
        return {
          clients: clients.map((c) => ({
            method: node.encryption || 'aes-256-gcm',
            password: c.id,
            email: c.email,
          })),
        };
      default:
        throw new Error(`Unsupported protocol: ${node.protocol}`);
    }
  }

  /**
   * 生成客户端配置
   */
  private generateClient(user: UserConfig, protocol: string): Record<string, any> {
    const base = {
      id: user.uuid,
      email: user.email,
      flow: protocol === 'vless' ? 'xtls-rprx-vision' : undefined,
    };

    // 移除 undefined 值
    return Object.fromEntries(Object.entries(base).filter(([_, v]) => v !== undefined));
  }

  /**
   * 生成传输层配置
   */
  private generateStreamSettings(node: NodeConfig): Record<string, any> | undefined {
    const network = node.network || 'tcp';
    const security = node.security || 'none';

    const settings: Record<string, any> = {
      network,
      security,
    };

    // TLS/XTLS 配置
    if (security === 'tls' || security === 'xtls') {
      settings.tlsSettings = {
        certificates: [
          {
            certificateFile: `/etc/xray/certs/${node.host}.crt`,
            keyFile: `/etc/xray/certs/${node.host}.key`,
          },
        ],
      };
    }

    // WebSocket 配置
    if (network === 'ws') {
      settings.wsSettings = {
        path: node.path || '/',
        headers: {
          Host: node.host,
        },
      };
    }

    // gRPC 配置
    if (network === 'grpc') {
      settings.grpcSettings = {
        serviceName: node.serviceName || 'xray',
      };
    }

    return settings;
  }

  /**
   * 生成出站配置
   */
  private generateOutbounds(): XrayOutboundConfig[] {
    return [
      {
        tag: 'direct',
        protocol: 'freedom',
      },
      {
        tag: 'blocked',
        protocol: 'blackhole',
        settings: {
          response: {
            type: 'http',
          },
        },
      },
      {
        tag: 'api',
        protocol: 'freedom',
      },
    ];
  }

  /**
   * 保存配置到文件
   */
  async saveConfig(config: XrayConfig): Promise<void> {
    try {
      // 确保目录存在
      const dir = path.dirname(this.configPath);
      await fs.mkdir(dir, { recursive: true });

      // 写入配置
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      logger.info(`Xray config saved to ${this.configPath}`);
    } catch (error) {
      logger.error('Failed to save Xray config:', error);
      throw error;
    }
  }

  /**
   * 热重载 Xray 配置
   */
  async reloadConfig(): Promise<void> {
    try {
      // 使用 xray api 命令重载配置
      const command = `${this.xrayBinaryPath} api reload --server=${this.apiHost}:${this.apiPort}`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        logger.warn('Xray reload stderr:', stderr);
      }

      logger.info('Xray config reloaded successfully:', stdout);
    } catch (error) {
      logger.error('Failed to reload Xray config:', error);
      throw error;
    }
  }

  /**
   * 查询用户流量统计
   */
  async queryUserTraffic(userEmail: string): Promise<TrafficStats | null> {
    try {
      const command = `${this.xrayBinaryPath} api statsquery --server=${this.apiHost}:${this.apiPort} --pattern="user>>>${userEmail}>>>`;
      const { stdout } = await execAsync(command);

      const stats = JSON.parse(stdout);
      if (!stats || !stats.stat) {
        return null;
      }

      let upload = 0;
      let download = 0;

      for (const stat of stats.stat) {
        if (stat.name.includes('uplink')) {
          upload = parseInt(stat.value);
        } else if (stat.name.includes('downlink')) {
          download = parseInt(stat.value);
        }
      }

      return {
        userId: userEmail,
        upload,
        download,
        total: upload + download,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to query traffic for ${userEmail}:`, error);
      return null;
    }
  }

  /**
   * 查询所有用户流量
   */
  async queryAllTraffic(): Promise<TrafficStats[]> {
    try {
      const command = `${this.xrayBinaryPath} api statsquery --server=${this.apiHost}:${this.apiPort}`;
      const { stdout } = await execAsync(command);

      const stats = JSON.parse(stdout);
      if (!stats || !stats.stat) {
        return [];
      }

      // 按用户分组统计
      const userStats: Record<string, { upload: number; download: number }> = {};

      for (const stat of stats.stat) {
        const match = stat.name.match(/user>>>(.+?)>>>(uplink|downlink)/);
        if (match) {
          const email = match[1];
          const type = match[2];
          const value = parseInt(stat.value);

          if (!userStats[email]) {
            userStats[email] = { upload: 0, download: 0 };
          }

          if (type === 'uplink') {
            userStats[email].upload = value;
          } else {
            userStats[email].download = value;
          }
        }
      }

      return Object.entries(userStats).map(([email, stats]) => ({
        userId: email,
        upload: stats.upload,
        download: stats.download,
        total: stats.upload + stats.download,
        timestamp: new Date(),
      }));
    } catch (error) {
      logger.error('Failed to query all traffic:', error);
      return [];
    }
  }

  /**
   * 生成用户 UUID
   */
  generateUUID(): string {
    return uuidv4();
  }

  /**
   * 验证配置格式
   */
  validateConfig(config: XrayConfig): boolean {
    // 基本验证
    if (!config.inbounds || config.inbounds.length === 0) {
      throw new Error('At least one inbound is required');
    }

    if (!config.outbounds || config.outbounds.length === 0) {
      throw new Error('At least one outbound is required');
    }

    // 验证端口冲突
    const ports = config.inbounds.map((i) => i.port);
    const uniquePorts = new Set(ports);
    if (ports.length !== uniquePorts.size) {
      throw new Error('Port conflict detected');
    }

    return true;
  }
}

// 导出单例
export const xrayService = new XrayService();
