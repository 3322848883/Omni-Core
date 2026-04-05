export * from './service-type';
export * from './ip-type';
export * from './errors';
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly LOGOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
        readonly ME: "/auth/me";
    };
    readonly USERS: {
        readonly BASE: "/users";
        readonly SYNC: "/users/sync";
        readonly TRAFFIC: "/users/:id/traffic";
        readonly ORDERS: "/users/:id/orders";
    };
    readonly ORDERS: {
        readonly BASE: "/orders";
        readonly STATS: "/orders/stats";
    };
    readonly TRAFFIC: {
        readonly STATS: "/traffic/stats";
        readonly REALTIME: "/traffic/realtime";
        readonly ALERTS: "/traffic/alerts";
    };
    readonly NODES: {
        readonly BASE: "/nodes";
        readonly HEALTH: "/nodes/:id/health";
    };
    readonly INVITES: {
        readonly STATS: "/invites/admin/stats";
        readonly RULES: "/invites/admin/rules";
        readonly FRAUD: "/invites/admin/fraud-detection";
        readonly RELATIONS: "/invites/admin/relations";
        readonly REWARDS: "/invites/admin/rewards";
    };
    readonly CONFIG: {
        readonly BASE: "/config";
        readonly HISTORY: "/config/:key/history";
    };
    readonly DASHBOARD: {
        readonly STATS: "/dashboard/stats";
        readonly CHARTS: "/dashboard/charts";
    };
};
export declare const DEFAULTS: {
    readonly PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
    readonly JWT_EXPIRES_IN: "15m";
    readonly JWT_REFRESH_EXPIRES_IN: "7d";
    readonly RATE_LIMIT_WINDOW_MS: 60000;
    readonly RATE_LIMIT_MAX_REQUESTS: 100;
    readonly BCRYPT_ROUNDS: 12;
    readonly TRAFFIC_ALERT_THRESHOLDS: {
        readonly LEVEL_1: 70;
        readonly LEVEL_2: 85;
        readonly LEVEL_3: 95;
    };
};
export declare const CACHE_KEYS: {
    readonly USER: (id: string) => string;
    readonly USER_SESSION: (token: string) => string;
    readonly NODE_LIST: "nodes:list";
    readonly NODE: (id: string) => string;
    readonly TRAFFIC_STATS: (userId: string) => string;
    readonly RATE_LIMIT: (ip: string) => string;
};
export declare const XRAY_CONFIG: {
    readonly DEFAULT_PORTS: {
        readonly VLESS_REALITY: 443;
        readonly VLESS_WS: 8443;
        readonly TROJAN: 2083;
        readonly SHADOWSOCKS: 8388;
        readonly SOCKS5: 1080;
        readonly HTTP: 8080;
        readonly API: 10085;
    };
    readonly REALITY: {
        readonly DEST: "www.microsoft.com:443";
        readonly SERVER_NAMES: readonly ["www.microsoft.com", "microsoft.com"];
        readonly SHORT_IDS: readonly ["", "0123456789abcdef"];
    };
};
export declare const SUBSCRIPTION_FORMATS: {
    readonly V2RAY: "v2ray";
    readonly CLASH: "clash";
    readonly SURGE: "surge";
    readonly QUANTUMULT: "quantumult";
};
export declare const PATHS: {
    readonly LOGS: "./logs";
    readonly BACKUP: "/backup/mysql";
    readonly CONFIG: "/etc/xray";
    readonly CERTS: "/etc/xray/certs";
};
export declare const TIME: {
    readonly SECOND: 1000;
    readonly MINUTE: number;
    readonly HOUR: number;
    readonly DAY: number;
    readonly WEEK: number;
};
export declare const USER_STATUS: {
    readonly ACTIVE: 1;
    readonly INACTIVE: 0;
    readonly BANNED: 2;
};
export declare const INVITE_CODE_STATUS: {
    readonly ACTIVE: 1;
    readonly USED: 2;
    readonly EXPIRED: 3;
};
export declare const SUBSCRIPTION_STATUS: {
    readonly ACTIVE: 1;
    readonly INACTIVE: 0;
    readonly EXPIRED: 2;
    readonly CANCELLED: 3;
};
//# sourceMappingURL=index.d.ts.map