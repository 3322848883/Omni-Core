"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xrayService = exports.XrayService = void 0;
const uuid_1 = require("uuid");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = __importDefault(require("@/utils/logger"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Xray 服务类
 * 负责 Xray 配置的生成、管理和流量统计
 */
class XrayService {
    configPath;
    xrayBinaryPath;
    apiPort;
    apiHost;
    constructor() {
        this.configPath = process.env.XRAY_CONFIG_PATH || '/etc/xray/config.json';
        this.xrayBinaryPath = process.env.XRAY_BINARY_PATH || '/usr/local/bin/xray';
        this.apiPort = parseInt(process.env.XRAY_API_PORT || '10085');
        this.apiHost = process.env.XRAY_API_HOST || '127.0.0.1';
    }
    /**
     * 生成 Xray 完整配置
     */
    async generateConfig(nodes, users) {
        const inbounds = this.generateInbounds(nodes, users);
        const outbounds = this.generateOutbounds();
        const config = {
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
    generateInbounds(nodes, users) {
        return nodes.map((node) => this.generateInbound(node, users));
    }
    /**
     * 生成单个入站配置
     */
    generateInbound(node, users) {
        const clients = users
            .filter((user) => user.isActive)
            .map((user) => this.generateClient(user, node.protocol));
        const inbound = {
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
    generateProtocolSettings(node, clients) {
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
    generateClient(user, protocol) {
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
    generateStreamSettings(node) {
        const network = node.network || 'tcp';
        const security = node.security || 'none';
        const settings = {
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
    generateOutbounds() {
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
    async saveConfig(config) {
        try {
            // 确保目录存在
            const dir = path_1.default.dirname(this.configPath);
            await promises_1.default.mkdir(dir, { recursive: true });
            // 写入配置
            await promises_1.default.writeFile(this.configPath, JSON.stringify(config, null, 2));
            logger_1.default.info(`Xray config saved to ${this.configPath}`);
        }
        catch (error) {
            logger_1.default.error('Failed to save Xray config:', error);
            throw error;
        }
    }
    /**
     * 热重载 Xray 配置
     */
    async reloadConfig() {
        try {
            // 使用 xray api 命令重载配置
            const command = `${this.xrayBinaryPath} api reload --server=${this.apiHost}:${this.apiPort}`;
            const { stdout, stderr } = await execAsync(command);
            if (stderr) {
                logger_1.default.warn('Xray reload stderr:', stderr);
            }
            logger_1.default.info('Xray config reloaded successfully:', stdout);
        }
        catch (error) {
            logger_1.default.error('Failed to reload Xray config:', error);
            throw error;
        }
    }
    /**
     * 查询用户流量统计
     */
    async queryUserTraffic(userEmail) {
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
                }
                else if (stat.name.includes('downlink')) {
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
        }
        catch (error) {
            logger_1.default.error(`Failed to query traffic for ${userEmail}:`, error);
            return null;
        }
    }
    /**
     * 查询所有用户流量
     */
    async queryAllTraffic() {
        try {
            const command = `${this.xrayBinaryPath} api statsquery --server=${this.apiHost}:${this.apiPort}`;
            const { stdout } = await execAsync(command);
            const stats = JSON.parse(stdout);
            if (!stats || !stats.stat) {
                return [];
            }
            // 按用户分组统计
            const userStats = {};
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
                    }
                    else {
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
        }
        catch (error) {
            logger_1.default.error('Failed to query all traffic:', error);
            return [];
        }
    }
    /**
     * 生成用户 UUID
     */
    generateUUID() {
        return (0, uuid_1.v4)();
    }
    /**
     * 验证配置格式
     */
    validateConfig(config) {
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
exports.XrayService = XrayService;
// 导出单例
exports.xrayService = new XrayService();
//# sourceMappingURL=xray.js.map