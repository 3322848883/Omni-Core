"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XrayConfigGenerator = void 0;
exports.generateX25519Keys = generateX25519Keys;
exports.generateUUID = generateUUID;
exports.generatePassword = generatePassword;
exports.generateShortId = generateShortId;
const uuid_1 = require("uuid");
// Xray 配置生成器
class XrayConfigGenerator {
    config;
    constructor() {
        this.config = this.getBaseConfig();
    }
    // 获取基础配置
    getBaseConfig() {
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
    addVLESSRealityInbound(port = 443, users = [], realitySettings = {}) {
        const defaultRealitySettings = {
            show: false,
            dest: 'www.microsoft.com:443',
            xver: 0,
            serverNames: ['www.microsoft.com', 'microsoft.com'],
            privateKey: realitySettings.privateKey || '',
            publicKey: realitySettings.publicKey || '',
            shortIds: ['', '0123456789abcdef'],
        };
        const inbound = {
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
    addVLESSWSInbound(port = 8443, users = [], path = '/vless-ws', tlsCert = '', tlsKey = '') {
        const inbound = {
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
    addVMessWSInbound(port = 8080, users = [], path = '/vmess-ws', tlsCert = '', tlsKey = '') {
        const inbound = {
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
    addTrojanInbound(port = 2083, users = [], tlsCert = '', tlsKey = '') {
        const inbound = {
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
    addShadowsocksInbound(port = 8388, users = []) {
        const inbound = {
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
    addAPIInbound(port = 10085) {
        const inbound = {
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
    addRoutingRules() {
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
    build() {
        return this.config;
    }
    // 生成 JSON 字符串
    toJSON() {
        return JSON.stringify(this.config, null, 2);
    }
}
exports.XrayConfigGenerator = XrayConfigGenerator;
// 生成 X25519 密钥对
function generateX25519Keys() {
    // 在实际环境中使用 xray x25519 命令生成
    // 这里返回示例密钥格式
    return {
        privateKey: 'uJ_gKx8vQnL3mP9sR2tW5yZ8aB1cD4eF7gH0iJ2kL4',
        publicKey: 'XyZ9AbC2DeF5GhI8JkL1MnO4PqR7StU0VwX3YzA6Bc',
    };
}
// 生成 UUID
function generateUUID() {
    return (0, uuid_1.v4)();
}
// 生成随机密码
function generatePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
// 生成短 ID
function generateShortId(length = 8) {
    const chars = '0123456789abcdef';
    let shortId = '';
    for (let i = 0; i < length; i++) {
        shortId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return shortId;
}
exports.default = XrayConfigGenerator;
//# sourceMappingURL=config.js.map