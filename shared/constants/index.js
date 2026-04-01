"use strict";
// Shared constants for Omni Core project
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_STATUS = exports.INVITE_CODE_STATUS = exports.USER_STATUS = exports.TIME = exports.PATHS = exports.SUBSCRIPTION_FORMATS = exports.XRAY_CONFIG = exports.CACHE_KEYS = exports.DEFAULTS = exports.API_ENDPOINTS = void 0;
// Service Types
__exportStar(require("./service-type"), exports);
// IP Types and Line Types
__exportStar(require("./ip-type"), exports);
// Error Codes - 统一从 errors.ts 导出
__exportStar(require("./errors"), exports);
// API Endpoints
exports.API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
    },
    USERS: {
        BASE: '/users',
        SYNC: '/users/sync',
        TRAFFIC: '/users/:id/traffic',
        ORDERS: '/users/:id/orders',
    },
    ORDERS: {
        BASE: '/orders',
        STATS: '/orders/stats',
    },
    TRAFFIC: {
        STATS: '/traffic/stats',
        REALTIME: '/traffic/realtime',
        ALERTS: '/traffic/alerts',
    },
    NODES: {
        BASE: '/nodes',
        HEALTH: '/nodes/:id/health',
    },
    INVITES: {
        STATS: '/invites/admin/stats',
        RULES: '/invites/admin/rules',
        FRAUD: '/invites/admin/fraud-detection',
        RELATIONS: '/invites/admin/relations',
        REWARDS: '/invites/admin/rewards',
    },
    CONFIG: {
        BASE: '/config',
        HISTORY: '/config/:key/history',
    },
    DASHBOARD: {
        STATS: '/dashboard/stats',
        CHARTS: '/dashboard/charts',
    },
};
// Default Values
exports.DEFAULTS = {
    PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    BCRYPT_ROUNDS: 12,
    TRAFFIC_ALERT_THRESHOLDS: {
        LEVEL_1: 70,
        LEVEL_2: 85,
        LEVEL_3: 95,
    },
};
// Cache Keys
exports.CACHE_KEYS = {
    USER: (id) => `user:${id}`,
    USER_SESSION: (token) => `session:${token}`,
    NODE_LIST: 'nodes:list',
    NODE: (id) => `node:${id}`,
    TRAFFIC_STATS: (userId) => `traffic:${userId}`,
    RATE_LIMIT: (ip) => `ratelimit:${ip}`,
};
// Xray Configuration
exports.XRAY_CONFIG = {
    DEFAULT_PORTS: {
        VLESS_REALITY: 443,
        VLESS_WS: 8443,
        TROJAN: 2083,
        SHADOWSOCKS: 8388,
        SOCKS5: 1080,
        HTTP: 8080,
        API: 10085,
    },
    REALITY: {
        DEST: 'www.microsoft.com:443',
        SERVER_NAMES: ['www.microsoft.com', 'microsoft.com'],
        SHORT_IDS: ['', '0123456789abcdef'],
    },
};
// Subscription Formats
exports.SUBSCRIPTION_FORMATS = {
    V2RAY: 'v2ray',
    CLASH: 'clash',
    SURGE: 'surge',
    QUANTUMULT: 'quantumult',
};
// File Paths
exports.PATHS = {
    LOGS: './logs',
    BACKUP: '/backup/mysql',
    CONFIG: '/etc/xray',
    CERTS: '/etc/xray/certs',
};
// Time Constants (in milliseconds)
exports.TIME = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
};
// User Status
exports.USER_STATUS = {
    ACTIVE: 1,
    INACTIVE: 0,
    BANNED: 2,
};
// Invite Code Status
exports.INVITE_CODE_STATUS = {
    ACTIVE: 1,
    USED: 2,
    EXPIRED: 3,
};
// Subscription Status
exports.SUBSCRIPTION_STATUS = {
    ACTIVE: 1,
    INACTIVE: 0,
    EXPIRED: 2,
    CANCELLED: 3,
};
//# sourceMappingURL=index.js.map