import { NodeConfig } from './xray';
import { ServiceType } from '@/constants/service-type';
export interface SubscriptionConfig {
    userId: string;
    email: string;
    uuid: string;
    nodes: NodeConfig[];
    expireDate: Date | null;
    trafficLimit: number;
    trafficUsed: number;
    serviceTypes: ServiceType[];
}
export type ShareLinkType = 'vless' | 'vmess' | 'trojan' | 'shadowsocks';
/**
 * 订阅服务类
 * 负责生成各种格式的订阅链接和二维码
 */
export declare class SubscriptionService {
    /**
     * 生成订阅配置
     * @param userId - 用户ID
     * @returns 订阅配置
     */
    generateSubscriptionConfig(userId: string): Promise<SubscriptionConfig | null>;
    /**
     * 生成 VLESS 分享链接
     */
    generateVlessLink(node: NodeConfig, uuid: string, email: string): string;
    /**
     * 生成 VMess 分享链接
     */
    generateVmessLink(node: NodeConfig, uuid: string, email: string): string;
    /**
     * 生成 Trojan 分享链接
     */
    generateTrojanLink(node: NodeConfig, password: string, email: string): string;
    /**
     * 生成 Shadowsocks 分享链接
     */
    generateShadowsocksLink(node: NodeConfig, password: string, email: string): string;
    /**
     * 生成节点分享链接
     */
    generateNodeLink(node: NodeConfig, uuid: string, email: string): string;
    /**
     * 生成 Base64 订阅内容
     */
    generateBase64Subscription(config: SubscriptionConfig): string;
    /**
     * 生成 Clash 配置
     */
    generateClashConfig(config: SubscriptionConfig): string;
    /**
     * 转换节点为 Clash 代理配置
     */
    private nodeToClashProxy;
    /**
     * 生成 Surge 配置
     */
    generateSurgeConfig(config: SubscriptionConfig): string;
    /**
     * 转换节点为 Surge 代理配置
     */
    private nodeToSurgeProxy;
    /**
     * 生成二维码
     */
    generateQRCode(data: string): Promise<string>;
    /**
     * 生成订阅二维码
     */
    generateSubscriptionQR(config: SubscriptionConfig): Promise<string>;
    /**
     * 生成节点二维码
     */
    generateNodeQR(node: NodeConfig, uuid: string, email: string): Promise<string>;
    /**
     * 生成订阅信息头
     */
    generateSubscriptionHeader(config: SubscriptionConfig): Record<string, string>;
}
export declare const subscriptionService: SubscriptionService;
//# sourceMappingURL=subscription.d.ts.map