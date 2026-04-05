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
    alterId?: number;
    flow?: string;
    encryption?: string;
    network?: 'tcp' | 'ws' | 'grpc' | 'kcp' | 'quic';
    security?: 'none' | 'tls' | 'reality';
    path?: string;
    host_header?: string;
    sni?: string;
    allowInsecure?: boolean;
    realityPublicKey?: string;
    realityShortId?: string;
    realitySpiderX?: string;
    method?: string;
}
export declare class SubscriptionGenerator {
    private baseUrl;
    constructor(baseUrl: string);
    generateVLESSLink(config: NodeConfig): string;
    generateVMessLink(config: NodeConfig): string;
    generateTrojanLink(config: NodeConfig): string;
    generateShadowsocksLink(config: NodeConfig): string;
    generateLink(config: NodeConfig): string;
    generateSubscription(nodes: NodeConfig[]): string;
    generateClashConfig(nodes: NodeConfig[], userInfo: {
        upload: number;
        download: number;
        total: number;
        expire: number;
    }): string;
    private convertToClashProxy;
    private objectToYaml;
    private formatBytes;
}
export default SubscriptionGenerator;
//# sourceMappingURL=subscription.d.ts.map