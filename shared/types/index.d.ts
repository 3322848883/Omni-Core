export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    requestId?: string;
}
export interface PaginationParams {
    page?: number;
    pageSize?: number;
}
export interface PaginatedResponse<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export declare enum UserStatus {
    NORMAL = 1,
    BANNED = 2,
    DELETED = 3
}
export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    EXPIRED = "expired"
}
export declare enum NodeStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    MAINTENANCE = "maintenance"
}
export declare enum ProtocolType {
    VLESS = "vless",
    VMESS = "vmess",
    TROJAN = "trojan",
    SHADOWSOCKS = "shadowsocks"
}
export declare enum TransportType {
    TCP = "tcp",
    WS = "ws",
    GRPC = "grpc"
}
export declare enum SecurityType {
    NONE = "none",
    TLS = "tls",
    XTLS = "xtls",
    REALITY = "reality"
}
export interface VPNConfig {
    protocol: ProtocolType;
    transport: TransportType;
    security: SecurityType;
    host: string;
    port: number;
    uuid: string;
    path?: string;
    serviceName?: string;
    tlsSettings?: {
        serverName: string;
        allowInsecure: boolean;
    };
    realitySettings?: {
        publicKey: string;
        shortId: string;
        spiderX: string;
    };
}
export interface TrafficStats {
    uploadBytes: number;
    downloadBytes: number;
    totalBytes: number;
}
export interface NodeInfo {
    id: string;
    code: string;
    name: string;
    region: string;
    country: string;
    city: string;
    host: string;
    port: number;
    protocol: ProtocolType;
    status: NodeStatus;
    loadPercent: number;
    activeConnections: number;
    maxConnections: number;
    latency?: number;
}
export interface Subscription {
    id: string;
    name: string;
    url: string;
    nodes: NodeInfo[];
    expireDate: string;
    trafficLimit: number;
    trafficUsed: number;
}
export declare enum PaymentMethod {
    PAYPAL = "paypal",
    STRIPE = "stripe",
    ALIPAY = "alipay",
    WECHAT = "wechat",
    CRYPTO = "crypto"
}
export declare enum PlanType {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly",
    TRAFFIC = "traffic"
}
export * from './service-type';
//# sourceMappingURL=index.d.ts.map