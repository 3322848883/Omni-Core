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
export declare class XrayConfigGenerator {
    private config;
    constructor();
    private getBaseConfig;
    addVLESSRealityInbound(port?: number, users?: Array<{
        id: string;
        email: string;
    }>, realitySettings?: Partial<RealitySettings>): this;
    addVLESSWSInbound(port?: number, users?: Array<{
        id: string;
        email: string;
    }>, path?: string, tlsCert?: string, tlsKey?: string): this;
    addVMessWSInbound(port?: number, users?: Array<{
        id: string;
        email: string;
    }>, path?: string, tlsCert?: string, tlsKey?: string): this;
    addTrojanInbound(port?: number, users?: Array<{
        password: string;
        email: string;
    }>, tlsCert?: string, tlsKey?: string): this;
    addShadowsocksInbound(port?: number, users?: Array<{
        password: string;
        email: string;
        method?: string;
    }>): this;
    addAPIInbound(port?: number): this;
    addRoutingRules(): this;
    build(): XrayConfig;
    toJSON(): string;
}
export declare function generateX25519Keys(): {
    privateKey: string;
    publicKey: string;
};
export declare function generateUUID(): string;
export declare function generatePassword(length?: number): string;
export declare function generateShortId(length?: number): string;
export default XrayConfigGenerator;
//# sourceMappingURL=config.d.ts.map