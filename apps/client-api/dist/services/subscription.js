"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.SubscriptionService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const logger_1 = __importDefault(require("@/utils/logger"));
const service_type_1 = require("@/constants/service-type");
const nodeFilterService_1 = require("./nodeFilterService");
const database_1 = __importDefault(require("@/config/database"));
/**
 * 订阅服务类
 * 负责生成各种格式的订阅链接和二维码
 */
class SubscriptionService {
    /**
     * 生成订阅配置
     * @param userId - 用户ID
     * @returns 订阅配置
     */
    async generateSubscriptionConfig(userId) {
        try {
            // 获取用户信息
            const userInfo = await (0, database_1.default)('users').where({ user_id: userId }).first();
            if (!userInfo) {
                logger_1.default.error(`User not found: ${userId}`);
                return null;
            }
            // 获取用户有效的服务类型
            const userServiceTypes = await nodeFilterService_1.nodeFilterService.getUserEffectiveServiceTypes(userId);
            // 获取所有可用节点
            const allNodes = await (0, database_1.default)('nodes')
                .where({ status: 'online', is_active: true })
                .select('*');
            // 根据用户服务类型过滤节点
            const accessibleNodes = nodeFilterService_1.nodeFilterService.filterNodesByUserServiceTypes(allNodes.map((node) => ({
                id: node.id,
                name: node.name,
                protocol: node.protocol,
                host: node.host,
                port: node.port,
                security: node.security,
                network: node.network,
                path: node.path,
                serviceName: node.service_name,
                flow: node.flow,
                encryption: node.encryption,
                serviceType: node.service_type,
            })), userServiceTypes);
            // 如果没有可访问的节点，返回 null
            if (accessibleNodes.length === 0) {
                logger_1.default.warn(`No accessible nodes for user: ${userId}`);
                return null;
            }
            return {
                userId: userInfo.user_id,
                email: userInfo.email,
                uuid: userInfo.vpn_uuid,
                nodes: accessibleNodes,
                expireDate: userInfo.expire_date,
                trafficLimit: userInfo.traffic_limit,
                trafficUsed: userInfo.traffic_used,
                serviceTypes: userServiceTypes,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to generate subscription config for ${userId}:`, error);
            return null;
        }
    }
    /**
     * 生成 VLESS 分享链接
     */
    generateVlessLink(node, uuid, email) {
        const params = new URLSearchParams();
        if (node.security && node.security !== 'none') {
            params.set('security', node.security);
        }
        if (node.network && node.network !== 'tcp') {
            params.set('type', node.network);
        }
        if (node.flow) {
            params.set('flow', node.flow);
        }
        if (node.path) {
            params.set('path', node.path);
        }
        if (node.host) {
            params.set('host', node.host);
        }
        const queryString = params.toString();
        const query = queryString ? `?${queryString}` : '';
        return `vless://${uuid}@${node.host}:${node.port}${query}#${encodeURIComponent(node.name)}`;
    }
    /**
     * 生成 VMess 分享链接
     */
    generateVmessLink(node, uuid, email) {
        const config = {
            v: '2',
            ps: node.name,
            add: node.host,
            port: node.port.toString(),
            id: uuid,
            aid: (node.alterId || 0).toString(),
            scy: 'auto',
            net: node.network || 'tcp',
            type: 'none',
            host: node.host,
            path: node.path || '/',
            tls: node.security === 'tls' || node.security === 'xtls' ? 'tls' : '',
        };
        const base64Config = Buffer.from(JSON.stringify(config)).toString('base64');
        return `vmess://${base64Config}`;
    }
    /**
     * 生成 Trojan 分享链接
     */
    generateTrojanLink(node, password, email) {
        const params = new URLSearchParams();
        if (node.security && node.security !== 'none') {
            params.set('security', node.security);
        }
        if (node.network && node.network !== 'tcp') {
            params.set('type', node.network);
        }
        if (node.path) {
            params.set('path', node.path);
        }
        const queryString = params.toString();
        const query = queryString ? `?${queryString}` : '';
        return `trojan://${password}@${node.host}:${node.port}${query}#${encodeURIComponent(node.name)}`;
    }
    /**
     * 生成 Shadowsocks 分享链接
     */
    generateShadowsocksLink(node, password, email) {
        const method = node.encryption || 'aes-256-gcm';
        const userInfo = Buffer.from(`${method}:${password}`).toString('base64');
        return `ss://${userInfo}@${node.host}:${node.port}#${encodeURIComponent(node.name)}`;
    }
    /**
     * 生成节点分享链接
     */
    generateNodeLink(node, uuid, email) {
        switch (node.protocol) {
            case 'vless':
                return this.generateVlessLink(node, uuid, email);
            case 'vmess':
                return this.generateVmessLink(node, uuid, email);
            case 'trojan':
                return this.generateTrojanLink(node, uuid, email);
            case 'shadowsocks':
                return this.generateShadowsocksLink(node, uuid, email);
            default:
                throw new Error(`Unsupported protocol: ${node.protocol}`);
        }
    }
    /**
     * 生成 Base64 订阅内容
     */
    generateBase64Subscription(config) {
        const links = config.nodes.map((node) => this.generateNodeLink(node, config.uuid, config.email));
        const content = links.join('\n');
        return Buffer.from(content).toString('base64');
    }
    /**
     * 生成 Clash 配置
     */
    generateClashConfig(config) {
        // 按服务类型分组节点
        const nodesByType = {
            [service_type_1.ServiceType.STANDARD]: [],
            [service_type_1.ServiceType.DEDICATED_LINE]: [],
            [service_type_1.ServiceType.EXCLUSIVE]: [],
            [service_type_1.ServiceType.STATIC_RESIDENTIAL]: [],
        };
        config.nodes.forEach((node) => {
            const serviceType = node.serviceType || service_type_1.ServiceType.STANDARD;
            if (nodesByType[serviceType]) {
                nodesByType[serviceType].push(node);
            }
            else {
                nodesByType[service_type_1.ServiceType.STANDARD].push(node);
            }
        });
        // 生成代理配置
        const proxies = [];
        const proxyGroups = [];
        const allProxyNames = [];
        // 为每个服务类型创建代理组和节点
        Object.entries(nodesByType).forEach(([serviceType, nodes]) => {
            if (nodes.length === 0)
                return;
            const type = serviceType;
            const typeLabel = service_type_1.ServiceTypeMeta[type]?.label || type;
            const proxyNames = [];
            nodes.forEach((node, index) => {
                const proxyName = `${typeLabel}-${index + 1}`;
                proxyNames.push(proxyName);
                allProxyNames.push(proxyName);
                proxies.push(this.nodeToClashProxy(node, config.uuid, proxyName));
            });
            // 为该服务类型创建选择组
            proxyGroups.push({
                name: `${typeLabel}节点`,
                type: 'select',
                proxies: proxyNames,
            });
        });
        // 添加自动选择组
        proxyGroups.unshift({
            name: '自动选择',
            type: 'url-test',
            proxies: allProxyNames,
            url: 'http://www.gstatic.com/generate_204',
            interval: 300,
        });
        // 添加总节点选择组
        proxyGroups.unshift({
            name: '节点选择',
            type: 'select',
            proxies: ['自动选择', ...proxyGroups.map((g) => g.name).filter((name) => name !== '节点选择')],
        });
        // 添加全球直连组
        proxyGroups.push({
            name: '全球直连',
            type: 'select',
            proxies: ['DIRECT'],
        });
        const clashConfig = {
            'mixed-port': 7890,
            'allow-lan': true,
            mode: 'rule',
            'log-level': 'info',
            externalController: '127.0.0.1:9090',
            proxies,
            'proxy-groups': proxyGroups,
            rules: [
                'DOMAIN-SUFFIX,local,DIRECT',
                'IP-CIDR,127.0.0.0/8,DIRECT',
                'IP-CIDR,172.16.0.0/12,DIRECT',
                'IP-CIDR,192.168.0.0/16,DIRECT',
                'IP-CIDR,10.0.0.0/8,DIRECT',
                'GEOIP,CN,DIRECT',
                'MATCH,节点选择',
            ],
        };
        return Buffer.from(JSON.stringify(clashConfig, null, 2)).toString('base64');
    }
    /**
     * 转换节点为 Clash 代理配置
     */
    nodeToClashProxy(node, uuid, customName) {
        const base = {
            name: customName || node.name,
            server: node.host,
            port: node.port,
        };
        switch (node.protocol) {
            case 'vless':
                return {
                    ...base,
                    type: 'vless',
                    uuid,
                    flow: node.flow || 'xtls-rprx-vision',
                    'client-fingerprint': 'chrome',
                    tls: node.security === 'tls' || node.security === 'xtls',
                    'skip-cert-verify': false,
                    servername: node.host,
                    network: node.network || 'tcp',
                    'ws-opts': node.network === 'ws'
                        ? {
                            path: node.path || '/',
                            headers: { Host: node.host },
                        }
                        : undefined,
                    'grpc-opts': node.network === 'grpc'
                        ? {
                            'grpc-service-name': node.serviceName || 'xray',
                        }
                        : undefined,
                };
            case 'vmess':
                return {
                    ...base,
                    type: 'vmess',
                    uuid,
                    alterId: node.alterId || 0,
                    cipher: 'auto',
                    tls: node.security === 'tls',
                    'skip-cert-verify': false,
                    servername: node.host,
                    network: node.network || 'tcp',
                    'ws-opts': node.network === 'ws'
                        ? {
                            path: node.path || '/',
                            headers: { Host: node.host },
                        }
                        : undefined,
                };
            case 'trojan':
                return {
                    ...base,
                    type: 'trojan',
                    password: uuid,
                    tls: true,
                    'skip-cert-verify': false,
                    sni: node.host,
                    network: node.network || 'tcp',
                };
            case 'shadowsocks':
                return {
                    ...base,
                    type: 'ss',
                    cipher: node.encryption || 'aes-256-gcm',
                    password: uuid,
                };
            default:
                throw new Error(`Unsupported protocol: ${node.protocol}`);
        }
    }
    /**
     * 生成 Surge 配置
     */
    generateSurgeConfig(config) {
        const lines = ['[Proxy]'];
        config.nodes.forEach((node, index) => {
            const proxyLine = this.nodeToSurgeProxy(node, config.uuid, index);
            lines.push(proxyLine);
        });
        lines.push('');
        lines.push('[Proxy Group]');
        lines.push(`Proxy = select, ${config.nodes.map((_, i) => `Node${i + 1}`).join(', ')}`);
        lines.push('Auto = url-test, ' +
            config.nodes.map((_, i) => `Node${i + 1}`).join(', ') +
            ', url=http://www.gstatic.com/generate_204, interval=300');
        lines.push('');
        lines.push('[Rule]');
        lines.push('DOMAIN-SUFFIX,local,DIRECT');
        lines.push('IP-CIDR,127.0.0.0/8,DIRECT');
        lines.push('GEOIP,CN,DIRECT');
        lines.push('FINAL,Proxy');
        return Buffer.from(lines.join('\n')).toString('base64');
    }
    /**
     * 转换节点为 Surge 代理配置
     */
    nodeToSurgeProxy(node, uuid, index) {
        const name = `Node${index + 1}`;
        switch (node.protocol) {
            case 'vless':
                return `${name} = vless, ${node.host}, ${node.port}, uuid=${uuid}, flow=${node.flow || 'xtls-rprx-vision'}, tls=${node.security === 'tls'}, sni=${node.host}`;
            case 'vmess':
                return `${name} = vmess, ${node.host}, ${node.port}, username=${uuid}, tls=${node.security === 'tls'}, sni=${node.host}`;
            case 'trojan':
                return `${name} = trojan, ${node.host}, ${node.port}, password=${uuid}, tls=true, sni=${node.host}`;
            case 'shadowsocks':
                return `${name} = ss, ${node.host}, ${node.port}, encrypt-method=${node.encryption || 'aes-256-gcm'}, password=${uuid}`;
            default:
                throw new Error(`Unsupported protocol: ${node.protocol}`);
        }
    }
    /**
     * 生成二维码
     */
    async generateQRCode(data) {
        try {
            return await qrcode_1.default.toDataURL(data, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to generate QR code:', error);
            throw error;
        }
    }
    /**
     * 生成订阅二维码
     */
    async generateSubscriptionQR(config) {
        const subscriptionUrl = `https://api.fgvpn.com/subscription/${config.userId}`;
        return this.generateQRCode(subscriptionUrl);
    }
    /**
     * 生成节点二维码
     */
    async generateNodeQR(node, uuid, email) {
        const link = this.generateNodeLink(node, uuid, email);
        return this.generateQRCode(link);
    }
    /**
     * 生成订阅信息头
     */
    generateSubscriptionHeader(config) {
        return {
            'subscription-userinfo': `upload=${config.trafficUsed}; download=${config.trafficUsed}; total=${config.trafficLimit}; expire=${config.expireDate ? Math.floor(config.expireDate.getTime() / 1000) : 0}`,
            'profile-update-interval': '1',
            'content-disposition': `attachment; filename*=utf-8''${encodeURIComponent('FGVPN')}`,
        };
    }
}
exports.SubscriptionService = SubscriptionService;
// 导出单例
exports.subscriptionService = new SubscriptionService();
//# sourceMappingURL=subscription.js.map