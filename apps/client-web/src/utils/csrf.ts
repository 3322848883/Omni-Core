/**
 * CSRF 防护工具
 * 实现 CSRF Token 管理和防护机制
 *
 * 遵循 api-security-specification.md 规范:
 * - CSRF Token 存储在 Cookie 中 (SameSite=Strict)
 * - 在请求头中添加 X-CSRF-Token
 * - 实现 CSRF Token 刷新机制
 */

import { storage } from './storage';

// CSRF 配置常量
const CSRF_CONFIG = {
  // CSRF Token 存储键名
  TOKEN_KEY: 'csrf_token',
  // CSRF Token Cookie 名称
  COOKIE_NAME: 'XSRF-TOKEN',
  // Token 刷新间隔（毫秒）- 30分钟
  REFRESH_INTERVAL: 30 * 60 * 1000,
  // Token 过期时间（毫秒）- 2小时
  TOKEN_EXPIRY: 2 * 60 * 60 * 1000,
} as const;

/**
 * CSRF Token 信息接口
 */
export interface CsrfTokenInfo {
  token: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * 从 Cookie 中读取 CSRF Token
 * @returns CSRF Token 或 null
 */
export function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_CONFIG.COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * 设置 CSRF Token 到 Cookie
 * @param token CSRF Token
 * @param options Cookie 选项
 */
export function setCsrfTokenCookie(
  token: string,
  options: {
    expires?: Date;
    path?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  } = {}
): void {
  const {
    expires = new Date(Date.now() + CSRF_CONFIG.TOKEN_EXPIRY),
    path = '/',
    secure = window.location.protocol === 'https:',
    sameSite = 'Strict',
  } = options;

  let cookieString = `${CSRF_CONFIG.COOKIE_NAME}=${encodeURIComponent(token)}`;
  cookieString += `; Expires=${expires.toUTCString()}`;
  cookieString += `; Path=${path}`;
  cookieString += `; SameSite=${sameSite}`;

  if (secure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

/**
 * 清除 CSRF Token Cookie
 */
export function clearCsrfTokenCookie(): void {
  document.cookie = `${CSRF_CONFIG.COOKIE_NAME}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Strict`;
}

/**
 * 从本地存储获取 CSRF Token
 * @returns CSRF Token 或 null
 */
export function getCsrfTokenFromStorage(): string | null {
  const tokenInfo = storage.get<CsrfTokenInfo>(CSRF_CONFIG.TOKEN_KEY);
  if (!tokenInfo) return null;

  // 检查是否过期
  if (Date.now() > tokenInfo.expiresAt) {
    storage.remove(CSRF_CONFIG.TOKEN_KEY);
    return null;
  }

  return tokenInfo.token;
}

/**
 * 保存 CSRF Token 到本地存储
 * @param token CSRF Token
 */
export function saveCsrfTokenToStorage(token: string): void {
  const tokenInfo: CsrfTokenInfo = {
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + CSRF_CONFIG.TOKEN_EXPIRY,
  };
  storage.set(CSRF_CONFIG.TOKEN_KEY, tokenInfo);
}

/**
 * 获取 CSRF Token（优先从 Cookie，其次从本地存储）
 * @returns CSRF Token 或 null
 */
export function getCsrfToken(): string | null {
  // 优先从 Cookie 获取
  const cookieToken = getCsrfTokenFromCookie();
  if (cookieToken) {
    return cookieToken;
  }

  // 其次从本地存储获取
  return getCsrfTokenFromStorage();
}

/**
 * 设置 CSRF Token（同时设置 Cookie 和本地存储）
 * @param token CSRF Token
 */
export function setCsrfToken(token: string): void {
  // 设置 Cookie
  setCsrfTokenCookie(token);
  // 保存到本地存储
  saveCsrfTokenToStorage(token);
}

/**
 * 清除 CSRF Token
 */
export function clearCsrfToken(): void {
  clearCsrfTokenCookie();
  storage.remove(CSRF_CONFIG.TOKEN_KEY);
}

/**
 * 生成 CSRF Token（用于前端临时生成，实际应从后端获取）
 * @returns 生成的 Token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // 降级方案
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 刷新 CSRF Token
 * @param newToken 新的 Token（可选，如果不提供则尝试从 API 获取）
 * @returns 新的 Token
 */
export async function refreshCsrfToken(newToken?: string): Promise<string> {
  if (newToken) {
    setCsrfToken(newToken);
    return newToken;
  }

  // 尝试从后端获取新的 Token
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/csrf-token`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.data?.token) {
        setCsrfToken(data.data.token);
        return data.data.token;
      }
    }
  } catch (error) {
    console.warn('Failed to refresh CSRF token from API:', error);
  }

  // 如果 API 调用失败，生成一个临时 Token
  const tempToken = generateCsrfToken();
  saveCsrfTokenToStorage(tempToken);
  return tempToken;
}

/**
 * 检查 CSRF Token 是否需要刷新
 * @returns 是否需要刷新
 */
export function shouldRefreshCsrfToken(): boolean {
  const tokenInfo = storage.get<CsrfTokenInfo>(CSRF_CONFIG.TOKEN_KEY);
  if (!tokenInfo) return true;

  const timeSinceCreation = Date.now() - tokenInfo.createdAt;
  return timeSinceCreation >= CSRF_CONFIG.REFRESH_INTERVAL;
}

/**
 * 验证 CSRF Token 是否有效
 * @param token 要验证的 Token
 * @returns 是否有效
 */
export function isCsrfTokenValid(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  // 基本格式验证
  if (token.length < 16) return false;

  // 检查是否为有效的十六进制字符串
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(token)) return false;

  return true;
}

/**
 * 初始化 CSRF Token
 * 在应用启动时调用，确保有有效的 CSRF Token
 */
export async function initCsrfToken(): Promise<void> {
  const existingToken = getCsrfToken();

  if (!existingToken || shouldRefreshCsrfToken()) {
    await refreshCsrfToken();
  }
}

/**
 * 创建 CSRF 防护的请求头
 * @returns 请求头对象
 */
export function createCsrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['X-CSRF-Token'] = token;
  }

  return headers;
}

/**
 * 检查请求是否需要 CSRF 保护
 * @param method HTTP 方法
 * @returns 是否需要 CSRF 保护
 */
export function requiresCsrfProtection(method: string): boolean {
  // 只有修改操作需要 CSRF 保护
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return unsafeMethods.includes(method.toUpperCase());
}

/**
 * 处理 CSRF 错误
 * @param error 错误对象
 * @returns 是否已处理
 */
export async function handleCsrfError(error: any): Promise<boolean> {
  const errorCode = error?.response?.data?.code;

  if (
    errorCode === 'CSRF_TOKEN_INVALID' ||
    errorCode === 'CSRF_TOKEN_EXPIRED' ||
    errorCode === 'CSRF_TOKEN_MISSING'
  ) {
    // 清除旧的 Token
    clearCsrfToken();
    // 获取新的 Token
    await refreshCsrfToken();
    return true;
  }

  return false;
}

/**
 * 获取 CSRF 配置
 * @returns CSRF 配置
 */
export function getCsrfConfig(): typeof CSRF_CONFIG {
  return { ...CSRF_CONFIG };
}

// 自动刷新 CSRF Token 的定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 启动自动刷新 CSRF Token
 * @param interval 刷新间隔（毫秒）
 */
export function startAutoRefresh(interval: number = CSRF_CONFIG.REFRESH_INTERVAL): void {
  stopAutoRefresh();
  refreshTimer = setInterval(() => {
    if (shouldRefreshCsrfToken()) {
      refreshCsrfToken().catch(console.error);
    }
  }, interval);
}

/**
 * 停止自动刷新 CSRF Token
 */
export function stopAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

export default {
  getCsrfToken,
  setCsrfToken,
  clearCsrfToken,
  refreshCsrfToken,
  generateCsrfToken,
  shouldRefreshCsrfToken,
  isCsrfTokenValid,
  initCsrfToken,
  createCsrfHeaders,
  requiresCsrfProtection,
  handleCsrfError,
  getCsrfConfig,
  startAutoRefresh,
  stopAutoRefresh,
  getCsrfTokenFromCookie,
  setCsrfTokenCookie,
  clearCsrfTokenCookie,
};
