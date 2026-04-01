import { logger } from '../../utils/logger';

// 节点配置类型
export interface NodeConfig {
  id: string;
  code: string;
  name: string;
  protocol: 'vless' | 'vmess' | 'trojan' | 'shadowsocks';
  host: string;
  port: number;
  uuid?: string;
  password?: string;
  email: string;
  // VLESS/VMess 特定
  alterId?: number;
  flow?: string;
  encryption?: string;
  // 传输层设置
  network?: 'tcp' | 'ws' | 'grpc' | 'kcp' | 'quic';
  security?: 'none' | 'tls' | 'reality';
  path?: string;
  host_header?: string;
  // TLS 设置
  sni?: string;
  allowInsecure?: boolean;
  // REALITY 设置
  realityPublicKey?: string;
  realityShortId?: string;
  realitySpiderX?: string;
  // Shadowsocks 设置
  method?: string;
}

// 订阅链接生成器
export class SubscriptionGenerator {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // 生成 VLESS 链接
  generateVLESSLink(config: NodeConfig): string {
    const {
      uuid,
      host,
      port,
      email,
      flow,
      encryption = 'none',
      network = 'tcp',
      security = 'none',
      sni,
      path,
      realityPublicKey,
      realityShortId,
    } = config;

    if (!uuid) {
      throw new Error('UUID is required for VLESS');
    }

    // 构建基础链接
    let link = `vless://${uuid}@${host}:${port}?`;

    // 查询参数
    const params = new URLSearchParams();
    params.set('type', network);
    params.set('security', security);
    params.set('encryption', encryption);
    params.set('flow', flow || '');

    if (sni) {
      params.set('sni', sni);
    }

    if (path) {
      params.set('path', encodeURIComponent(path));
    }

    // REALITY 设置
    if (security === 'reality' && realityPublicKey) {
      params.set('pbk', realityPublicKey);
      if (realityShortId) {
        params.set('sid', realityShortId);
      }
    }

    // WebSocket 设置
    if (network === 'ws') {
      params.set('host', config.host_header || host);
    }

    link += params.toString();
    link += `#${encodeURIComponent(config.name)}`;

    return link;
  }

  // 生成 VMess 链接
  generateVMessLink(config: NodeConfig): string {
    const {
      uuid,
      host,
      port,
      alterId = 0,
      network = 'tcp',
      security = 'none',
      path,
      sni,
    } = config;

    if (!uuid) {
      throw new Error('UUID is required for VMess');
    }

    const vmessConfig = {
      v: '2',
      ps: config.name,
      add: host,
      port: port.toString(),
      id: uuid,
      aid: alterId.toString(),
      scy: 'auto',
      net: network,
      type: 'none',
      host: config.host_header || '',
      path: path || '',
      tls: security === 'tls' ? 'tls' : '',
      sni: sni || '',
    };

    const jsonStr = JSON.stringify(vmessConfig);
    const base64Str = Buffer.from(jsonStr).toString('base64');

    return `vmess://${base64Str}`;
  }

  // 生成 Trojan 链接
  generateTrojanLink(config: NodeConfig): string {
    const { password, host, port, sni, network = 'tcp', path } = config;

    if (!password) {
      throw new Error('Password is required for Trojan');
    }

    let link = `trojan://${password}@${host}:${port}?`;

    const params = new URLSearchParams();
    params.set('type', network);

    if (sni) {
      params.set('sni', sni);
      params.set('security', 'tls');
    }

    if (path && network === 'ws') {
      params.set('path', encodeURIComponent(path));
    }

    link += params.toString();
    link += `#${encodeURIComponent(config.name)}`;

    return link;
  }

  // 生成 Shadowsocks 链接
  generateShadowsocksLink(config: NodeConfig): string {
    const { method, password, host, port } = config;

    if (!method || !password) {
      throw new Error('Method and password are required for Shadowsocks');
    }

    const userInfo = Buffer.from(`${method}:${password}`).toString('base64');
    return `ss://${userInfo}@${host}:${port}#${encodeURIComponent(config.name)}`;
  }

  // 根据协议生成对应的链接
  generateLink(config: NodeConfig): string {
    switch (config.protocol) {
      case 'vless':
        return this.generateVLESSLink(config);
      case 'vmess':
        return this.generateVMessLink(config);
      case 'trojan':
        return this.generateTrojanLink(config);
      case 'shadowsocks':
        return this.generateShadowsocksLink(config);
      default:
        throw new Error(`Unsupported protocol: ${config.protocol}`);
    }
  }

  // 生成订阅内容 (base64)
  generateSubscription(nodes: NodeConfig[]): string {
    const links = nodes.map(node => {
      try {
        return this.generateLink(node);
      } catch (error) {
        logger.error(`Failed to generate link for node ${node.name}:`, error);
        return '';
      }
    }).filter(link => link !== '');

    const content = links.join('\n');
    return Buffer.from(content).toString('base64');
  }

  // 生成 Clash 配置
  generateClashConfig(nodes: NodeConfig[], userInfo: {
    upload: number;
    download: number;
    total: number;
    expire: number;
  }): string {
    const proxies = nodes.map(node => this.convertToClashProxy(node));
    const proxyNames = proxies.map(p => p.name);

    const config = {
      'mixed-port': 7890,
      'allow-lan': true,
      'bind-address': '*',
      mode: 'rule',
      'log-level': 'info',
      'external-controller': '127.0.0.1:9090',
      'secret': '',
      'profile': {
        'store-selected': true,
        'store-fake-ip': true,
      },
      'proxy-providers': {},
      proxies,
      'proxy-groups': [
        {
          name: '🚀 节点选择',
          type: 'select',
          proxies: ['♻️ 自动选择', ' DIRECT', ...proxyNames],
        },
        {
          name: '♻️ 自动选择',
          type: 'url-test',
          proxies: proxyNames,
          url: 'http://www.gstatic.com/generate_204',
          interval: 300,
        },
        {
          name: '🌍 国外媒体',
          type: 'select',
          proxies: ['🚀 节点选择', '♻️ 自动选择', ...proxyNames],
        },
        {
          name: '📲 电报消息',
          type: 'select',
          proxies: ['🚀 节点选择', ...proxyNames],
        },
        {
          name: '📢 谷歌FCM',
          type: 'select',
          proxies: ['🚀 节点选择', '♻️ 自动选择', ...proxyNames],
        },
        {
          name: 'Ⓜ️ 微软服务',
          type: 'select',
          proxies: ['🎯 全球直连', '🚀 节点选择', ...proxyNames],
        },
        {
          name: '🍎 苹果服务',
          type: 'select',
          proxies: ['🚀 节点选择', '🎯 全球直连', ...proxyNames],
        },
        {
          name: '🎯 全球直连',
          type: 'select',
          proxies: ['DIRECT', '🚀 节点选择', '♻️ 自动选择'],
        },
        {
          name: '🛑 全球拦截',
          type: 'select',
          proxies: ['REJECT', 'DIRECT'],
        },
        {
          name: '🍃 应用净化',
          type: 'select',
          proxies: ['REJECT', 'DIRECT'],
        },
        {
          name: '🐟 漏网之鱼',
          type: 'select',
          proxies: ['🚀 节点选择', '♻️ 自动选择', ...proxyNames],
        },
      ],
      rules: [
        'DOMAIN-SUFFIX,local,DIRECT',
        'IP-CIDR,127.0.0.0/8,DIRECT',
        'IP-CIDR,172.16.0.0/12,DIRECT',
        'IP-CIDR,192.168.0.0/16,DIRECT',
        'IP-CIDR,10.0.0.0/8,DIRECT',
        'IP-CIDR,17.0.0.0/8,DIRECT',
        'IP-CIDR,100.64.0.0/10,DIRECT',
        'IP-CIDR,224.0.0.0/4,DIRECT',
        'IP-CIDR6,fe80::/10,DIRECT',
        'DOMAIN-SUFFIX,cn,DIRECT',
        'DOMAIN-KEYWORD,-cn,DIRECT',
        'GEOIP,CN,DIRECT',
        'MATCH,🐟 漏网之鱼',
      ],
    };

    return `# Clash Config
# Upload: ${this.formatBytes(userInfo.upload)}
# Download: ${this.formatBytes(userInfo.download)}
# Total: ${this.formatBytes(userInfo.total)}
# Expire: ${new Date(userInfo.expire * 1000).toISOString()}

${this.objectToYaml(config)}
`;
  }

  // 转换为 Clash 代理配置
  private convertToClashProxy(config: NodeConfig): any {
    const base = {
      name: config.name,
      server: config.host,
      port: config.port,
    };

    switch (config.protocol) {
      case 'vless':
        return {
          ...base,
          type: 'vless',
          uuid: config.uuid,
          flow: config.flow || 'xtls-rprx-vision',
          'client-fingerprint': 'chrome',
          tls: config.security === 'tls' || config.security === 'reality',
          'skip-cert-verify': config.allowInsecure || false,
          servername: config.sni || config.host,
          network: config.network || 'tcp',
          ...(config.network === 'ws' && {
            'ws-opts': {
              path: config.path || '/',
              headers: {
                Host: config.host_header || config.host,
              },
            },
          }),
          ...(config.security === 'reality' && {
            reality_opts: {
              'public-key': config.realityPublicKey,
              'short-id': config.realityShortId,
            },
          }),
        };

      case 'vmess':
        return {
          ...base,
          type: 'vmess',
          uuid: config.uuid,
          alterId: config.alterId || 0,
          cipher: 'auto',
          tls: config.security === 'tls',
          'skip-cert-verify': config.allowInsecure || false,
          servername: config.sni || config.host,
          network: config.network || 'tcp',
          ...(config.network === 'ws' && {
            'ws-opts': {
              path: config.path || '/',
              headers: {
                Host: config.host_header || config.host,
              },
            },
          }),
        };

      case 'trojan':
        return {
          ...base,
          type: 'trojan',
          password: config.password,
          tls: true,
          'skip-cert-verify': config.allowInsecure || false,
          sni: config.sni || config.host,
          network: config.network || 'tcp',
          ...(config.network === 'ws' && {
            'ws-opts': {
              path: config.path || '/',
              headers: {
                Host: config.host_header || config.host,
              },
            },
          }),
        };

      case 'shadowsocks':
        return {
          ...base,
          type: 'ss',
          cipher: config.method || 'aes-256-gcm',
          password: config.password,
        };

      default:
        throw new Error(`Unsupported protocol for Clash: ${config.protocol}`);
    }
  }

  // 对象转 YAML
  private objectToYaml(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            yaml += `${spaces}- `;
            const itemYaml = this.objectToYaml(item, 0);
            yaml += itemYaml.replace(/\n/g, `\n${spaces}  `).trim() + '\n';
          } else {
            yaml += `${spaces}- ${item}\n`;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  // 格式化字节
  private formatBytes(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default SubscriptionGenerator;
