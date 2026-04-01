// App Constants

// App Info
export const APP_NAME = 'Omni Core Client';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  DEVICE_ID: 'deviceId',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// API Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const API_TIMEOUT = 30000;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Node Status
export const NODE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
  MAINTENANCE: 'maintenance',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
} as const;

// Protocol Types
export const PROTOCOL_TYPES = {
  VLESS: 'vless',
  VMESS: 'vmess',
  TROJAN: 'trojan',
  SHADOWSOCKS: 'shadowsocks',
} as const;

// Traffic Constants
export const TRAFFIC_UNIT = {
  B: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DEFAULT: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  MONTH: 'YYYY-MM',
} as const;

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// Language
export const LANGUAGE = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
} as const;

// Error Codes
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

// Retry Config
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;
