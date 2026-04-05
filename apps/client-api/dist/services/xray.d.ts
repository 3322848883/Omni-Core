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
export interface UserConfig {
    userId: string;
    email: string;
    uuid: string;
    trafficLimit: number;
    trafficUsed: number;
    expireDate: Date | null;
    isActive: boolean;
}
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
export declare class XrayService {
    private configPath;
    private xrayBinaryPath;
    private apiPort;
    private apiHost;
    constructor();
    /**
     * 生成 Xray 完整配置
     */
    generateConfig(nodes: NodeConfig[], users: UserConfig[]): Promise<XrayConfig>;
    /**
     * 生成入站配置
     */
    private generateInbounds;
    /**
     * 生成单个入站配置
     */
    private generateInbound;
    /**
     * 生成协议特定的配置
     */
    private generateProtocolSettings;
    /**
     * 生成客户端配置
     */
    private generateClient;
    /**
     * 生成传输层配置
     */
    private generateStreamSettings;
    /**
     * 生成出站配置
     */
    private generateOutbounds;
    /**
     * 保存配置到文件
     */
    saveConfig(config: XrayConfig): Promise<void>;
    /**
     * 热重载 Xray 配置
     */
    reloadConfig(): Promise<void>;
    /**
     * 查询用户流量统计
     */
    queryUserTraffic(userEmail: string): Promise<TrafficStats | null>;
    /**
     * 查询所有用户流量
     */
    queryAllTraffic(): Promise<TrafficStats[]>;
    /**
     * 生成用户 UUID
     */
    generateUUID(): string;
    /**
     * 验证配置格式
     */
    validateConfig(config: XrayConfig): boolean;
}
export declare const xrayService: XrayService;
//# sourceMappingURL=xray.d.ts.map