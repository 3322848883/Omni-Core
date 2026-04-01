import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

// Xray 配置类型定义
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
  dns: {
    servers: string[];
  };
  stats: {};
  inbounds: InboundConfig[];
  outbounds: OutboundConfig[];
  routing: RoutingConfig;
  policy: PolicyConfig;
}

export interface InboundConfig {
  tag: string;
  port: number;
  protocol: string;
  settings: any;
  streamSettings?: StreamSettings;
  sniffing?: SniffingConfig;
}

export interface OutboundConfig {
  tag: string;
  protocol: string;
  settings?: any;
}

export interface StreamSettings {
  network?: string;
  security?: string;
  tlsSettings?: TLSSettings;
  realitySettings?: RealitySettings;
  wsSettings?: WSSettings;
  grpcSettings?: GRPCSettings;
}

export interface TLSSettings {
  certFile: string;
  keyFile: string;
}

export interface RealitySettings {
  show: boolean;
  dest: string;
  xver: number;
  serverNames: string[];
  privateKey: string;
  publicKey: string;
  shortIds: string[];
}

export interface WSSettings {
  path: string;
  headers?: {
    Host: string;
  };
}

export interface GRPCSettings {
  serviceName: string;
  multiMode: boolean;
}

export interface SniffingConfig {
  enabled: boolean;
  destOverride: string[];
}

export interface RoutingConfig {
  domainStrategy: string;
  rules: RoutingRule[];
}

export interface RoutingRule {
  type: string;
  ip?: string[];
  domain?: string[];
  protocol?: string[];
  inboundTag?: string[];
  port?: string;
  outboundTag: string;
}

export interface PolicyConfig {
  levels: {
    [key: string]: {
      statsUserUplink: boolean;
      statsUserDownlink: boolean;
    };
  };
  system: {
    statsInboundUplink: boolean;
    statsInboundDownlink: boolean;
  };
}

// Xray 配置生成器
export class XrayConfigGenerator {
  private config: XrayConfig;

  constructor() {
    this.config = this.getBaseConfig();
  }

  // 获取基础配置
  private getBaseConfig(): XrayConfig {
    return {
      log: {
        access: '/var/log/xray/access.log',
        error: '/var/log/xray/error.log',
        loglevel: 'warning',
      },
      api: {
        tag: 'api',
        services: ['HandlerService', 'LoggerService', 'StatsService'],
      },
      dns: {
        servers: ['1.1.1.1', '8.8.8.8', 'localhost'],
      },
      stats: {},
      inbounds: [],
      outbounds: [
        {
          tag: 'direct',
          protocol: 'freedom',
        },
        {
          tag: 'block',
          protocol: 'blackhole',
        },
      ],
      routing: {
        domainStrategy: 'IPIfNonMatch',
        rules: [],
      },
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
  }

  // 添加 VLESS + REALITY 入站
  addVLESSRealityInbound(
    port: number = 443,
    users: Array<{ id: string; email: string }> = [],
    realitySettings: Partial<RealitySettings> = {}
  ): this {
    const defaultRealitySettings: RealitySettings = {
      show: false,
      dest: 'www.microsoft.com:443',
      xver: 0,
      serverNames: ['www.microsoft.com', 'microsoft.com'],
      privateKey: realitySettings.privateKey || '',
      publicKey: realitySettings.publicKey || '',
      shortIds: ['', '0123456789abcdef'],
    };

    const inbound: InboundConfig = {
      tag: 'vless-reality',
      port,
      protocol: 'vless',
      settings: {
        clients: users.map(user => ({
          id: user.id,
          email: user.email,
          flow: 'xtls-rprx-vision',
        })),
        decryption: 'none',
      },
      streamSettings: {
        network: 'tcp',
        security: 'reality',
        realitySettings: { ...defaultRealitySettings, ...realitySettings },
      },
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls'],
      },
    };

    this.config.inbounds.push(inbound);
    return this;
  }

  // 添加 VLESS + WebSocket + TLS 入站
  addVLESSWSInbound(
    port: number = 8443,
    users: Array<{ id: string; email: string }> = [],
    path: string = '/vless-ws',
    tlsCert: string = '',
    tlsKey: string = ''
  ): this {
    const inbound: InboundConfig = {
      tag: 'vless-ws',
      port,
      protocol: 'vless',
      settings: {
        clients: users.map(user => ({
          id: user.id,
          email: user.email,
        })),
        decryption: 'none',
      },
      streamSettings: {
        network: 'ws',
        security: 'tls',
        tlsSettings: {
          certFile: tlsCert,
          keyFile: tlsKey,
        },
        wsSettings: {
          path,
        },
      },
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls'],
      },
    };

    this.config.inbounds.push(inbound);
    return this;
  }

  // 添加 VMess + WebSocket + TLS 入站
  addVMessWSInbound(
    port: number = 8080,
    users: Array<{ id: string; email: string }> = [],
    path: string = '/vmess-ws',
    tlsCert: string = '',
    tlsKey: string = ''
  ): this {
    const inbound: InboundConfig = {
      tag: 'vmess-ws',
      port,
      protocol: 'vmess',
      settings: {
        clients: users.map(user => ({
          id: user.id,
          email: user.email,
          alterId: 0,
        })),
      },
      streamSettings: {
        network: 'ws',
        security: 'tls',
        tlsSettings: {
          certFile: tlsCert,
          keyFile: tlsKey,
        },
        wsSettings: {
          path,
        },
      },
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls'],
      },
    };

    this.config.inbounds.push(inbound);
    return this;
  }

  // 添加 Trojan + TLS 入站
  addTrojanInbound(
    port: number = 2083,
    users: Array<{ password: string; email: string }> = [],
    tlsCert: string = '',
    tlsKey: string = ''
  ): this {
    const inbound: InboundConfig = {
      tag: 'trojan',
      port,
      protocol: 'trojan',
      settings: {
        clients: users.map(user => ({
          password: user.password,
          email: user.email,
        })),
      },
      streamSettings: {
        network: 'tcp',
        security: 'tls',
        tlsSettings: {
          certFile: tlsCert,
          keyFile: tlsKey,
        },
      },
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls'],
      },
    };

    this.config.inbounds.push(inbound);
    return this;
  }

  // 添加 Shadowsocks 入站
  addShadowsocksInbound(
    port: number = 8388,
    users: Array<{ password: string; email: string; method?: string }> = []
  ): this {
    const inbound: InboundConfig = {
      tag: 'shadowsocks',
      port,
      protocol: 'shadowsocks',
      settings: {
        clients: users.map(user => ({
          password: user.password,
          email: user.email,
          method: user.method || 'aes-256-gcm',
        })),
      },
      sniffing: {
        enabled: true,
        destOverride: ['http', 'tls'],
      },
    };

    this.config.inbounds.push(inbound);
    return this;
  }

  // 添加 API 入站
  addAPIInbound(port: number = 10085): this {
    const inbound: InboundConfig = {
      tag: 'api',
      port,
      protocol: 'dokodemo-door',
      settings: {
        address: '127.0.0.1',
      },
    };

    this.config.inbounds.push(inbound);
    return this;
  }

  // 添加路由规则
  addRoutingRules(): this {
    this.config.routing.rules = [
      // API 路由
      {
        type: 'field',
        inboundTag: ['api'],
        outboundTag: 'api',
      },
      // 广告拦截
      {
        type: 'field',
        domain: ['geosite:category-ads'],
        outboundTag: 'block',
      },
      // 国内域名直连
      {
        type: 'field',
        domain: ['geosite:cn', 'geosite:private'],
        outboundTag: 'direct',
      },
      // 国内IP直连
      {
        type: 'field',
        ip: ['geoip:private', 'geoip:cn'],
        outboundTag: 'direct',
      },
      // P2P 阻断
      {
        type: 'field',
        protocol: ['bittorrent'],
        outboundTag: 'block',
      },
      // 默认代理
      {
        type: 'field',
        port: '0-65535',
        outboundTag: 'direct',
      },
    ];

    return this;
  }

  // 生成配置
  build(): XrayConfig {
    return this.config;
  }

  // 生成 JSON 字符串
  toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }
}

// 生成 X25519 密钥对
export function generateX25519Keys(): { privateKey: string; publicKey: string } {
  // 在实际环境中使用 xray x25519 命令生成
  // 这里返回示例密钥格式
  return {
    privateKey: 'uJ_gKx8vQnL3mP9sR2tW5yZ8aB1cD4eF7gH0iJ2kL4',
    publicKey: 'XyZ9AbC2DeF5GhI8JkL1MnO4PqR7StU0VwX3YzA6Bc',
  };
}

// 生成 UUID
export function generateUUID(): string {
  return uuidv4();
}

// 生成随机密码
export function generatePassword(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 生成短 ID
export function generateShortId(length: number = 8): string {
  const chars = '0123456789abcdef';
  let shortId = '';
  for (let i = 0; i < length; i++) {
    shortId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shortId;
}

export default XrayConfigGenerator;
