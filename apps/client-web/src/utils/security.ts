/**
 * 敏感数据处理工具
 * 实现敏感信息脱敏、本地存储加密/解密、安全日志记录
 *
 * 遵循 api-security-specification.md 和 project-standards.md 规范:
 * - 敏感信息脱敏
 * - 本地存储加密
 * - 安全日志记录（不记录敏感信息）
 */

import { storage } from './storage';

// 安全配置常量
const SECURITY_CONFIG = {
  // 加密密钥存储键名
  ENCRYPTION_KEY_NAME: '__app_key__',
  // 敏感数据前缀
  SENSITIVE_PREFIX: '__enc__',
  // 密钥长度
  KEY_LENGTH: 32,
  // 初始化向量长度
  IV_LENGTH: 16,
  // 日志最大条数
  MAX_LOG_ENTRIES: 100,
  // 日志存储键名
  LOG_STORAGE_KEY: '__security_logs__',
} as const;

// 敏感字段列表
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'creditCard',
  'cvv',
  'ssn',
  'phone',
  'email',
  'address',
  'apiKey',
  'privateKey',
  'auth',
  'authorization',
  'cookie',
  'session',
] as const;

/**
 * 敏感数据类型
 */
export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 安全日志条目
 */
export interface SecurityLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  category: string;
  metadata?: Record<string, any>;
}

/**
 * 生成随机密钥
 * @returns 随机密钥字符串
 */
export function generateEncryptionKey(): string {
  const array = new Uint8Array(SECURITY_CONFIG.KEY_LENGTH);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    throw new Error('Cryptographically secure random number generation is not available');
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 获取或生成加密密钥
 * @returns 加密密钥
 */
export function getEncryptionKey(): string {
  let key = storage.get<string>(SECURITY_CONFIG.ENCRYPTION_KEY_NAME);
  if (!key) {
    key = generateEncryptionKey();
    storage.set(SECURITY_CONFIG.ENCRYPTION_KEY_NAME, key);
  }
  return key;
}

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 将 Base64 字符串转换为 ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 使用 AES-256-GCM 加密数据
 * @param data 要加密的数据
 * @param key 密钥（32字节十六进制字符串）
 * @returns 加密后的字符串（格式：IV + ciphertext + authTag，Base64编码）
 */
export async function encryptData(data: string, key?: string): Promise<string> {
  if (!data) return '';

  const encryptionKey = key || getEncryptionKey();
  const keyBytes = Uint8Array.from(hexToBytes(encryptionKey));

  const iv = crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.IV_LENGTH));

  const encodedData = new TextEncoder().encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encodedData
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  const base64 = arrayBufferToBase64(combined.buffer);
  return `${SECURITY_CONFIG.SENSITIVE_PREFIX}${base64}`;
}

/**
 * 解密数据
 * @param encryptedData 加密的数据
 * @param key 密钥（32字节十六进制字符串）
 * @returns 解密后的字符串
 */
export async function decryptData(encryptedData: string, key?: string): Promise<string> {
  if (!encryptedData) return '';

  if (!encryptedData.startsWith(SECURITY_CONFIG.SENSITIVE_PREFIX)) {
    return encryptedData;
  }

  const encryptionKey = key || getEncryptionKey();
  const keyBytes = Uint8Array.from(hexToBytes(encryptionKey));
  const base64 = encryptedData.slice(SECURITY_CONFIG.SENSITIVE_PREFIX.length);

  try {
    const combined = new Uint8Array(base64ToArrayBuffer(base64));
    const iv = combined.slice(0, SECURITY_CONFIG.IV_LENGTH);
    const ciphertext = combined.slice(SECURITY_CONFIG.IV_LENGTH);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

/**
 * 将十六进制字符串转换为字节数组
 */
function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

/**
 * 安全地存储敏感数据
 * @param key 存储键名
 * @param data 敏感数据
 */
export async function setSecureItem(key: string, data: string): Promise<void> {
  const encrypted = await encryptData(data);
  storage.set(key, encrypted);
}

/**
 * 安全地获取敏感数据
 * @param key 存储键名
 * @returns 解密后的数据
 */
export async function getSecureItem(key: string): Promise<string | null> {
  const encrypted = storage.get<string>(key);
  if (!encrypted) return null;
  return decryptData(encrypted);
}

/**
 * 安全地移除敏感数据
 * @param key 存储键名
 */
export function removeSecureItem(key: string): void {
  storage.remove(key);
}

/**
 * 邮箱脱敏
 * @param email 邮箱地址
 * @returns 脱敏后的邮箱
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex);

  if (localPart.length <= 2) {
    return '*'.repeat(localPart.length) + domain;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const masked = firstChar + '*'.repeat(localPart.length - 2) + lastChar;

  return masked + domain;
}

/**
 * 手机号脱敏
 * @param phone 手机号
 * @returns 脱敏后的手机号
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';

  // 移除非数字字符
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 7) return phone;

  const start = digits.slice(0, 3);
  const end = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 7);

  return `${start}${masked}${end}`;
}

/**
 * 身份证号脱敏
 * @param idCard 身份证号
 * @returns 脱敏后的身份证号
 */
export function maskIdCard(idCard: string): string {
  if (!idCard || typeof idCard !== 'string') return '';

  if (idCard.length < 8) return idCard;

  const start = idCard.slice(0, 4);
  const end = idCard.slice(-4);
  const masked = '*'.repeat(idCard.length - 8);

  return `${start}${masked}${end}`;
}

/**
 * 银行卡号脱敏
 * @param cardNo 银行卡号
 * @returns 脱敏后的银行卡号
 */
export function maskBankCard(cardNo: string): string {
  if (!cardNo || typeof cardNo !== 'string') return '';

  const digits = cardNo.replace(/\D/g, '');

  if (digits.length < 8) return cardNo;

  const start = digits.slice(0, 4);
  const end = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 8);

  return `${start}${masked}${end}`;
}

/**
 * 姓名脱敏
 * @param name 姓名
 * @returns 脱敏后的姓名
 */
export function maskName(name: string): string {
  if (!name || typeof name !== 'string') return '';

  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';

  const firstChar = name[0];
  const lastChar = name[name.length - 1];
  const masked = '*'.repeat(name.length - 2);

  return firstChar + masked + lastChar;
}

/**
 * IP 地址脱敏
 * @param ip IP 地址
 * @returns 脱敏后的 IP
 */
export function maskIpAddress(ip: string): string {
  if (!ip || typeof ip !== 'string') return '';

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.*.*.${parts[3]}`;
    }
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts[0]}:${parts[1]}:****:${parts[parts.length - 1]}`;
    }
  }

  return ip;
}

/**
 * Token 脱敏
 * @param token Token 字符串
 * @returns 脱敏后的 Token
 */
export function maskToken(token: string): string {
  if (!token || typeof token !== 'string') return '';

  if (token.length <= 8) return '*'.repeat(token.length);

  const start = token.slice(0, 4);
  const end = token.slice(-4);
  const masked = '*'.repeat(Math.min(token.length - 8, 8));

  return `${start}${masked}${end}`;
}

/**
 * 通用字符串脱敏
 * @param str 字符串
 * @param visibleStart 开头保留字符数
 * @param visibleEnd 结尾保留字符数
 * @returns 脱敏后的字符串
 */
export function maskString(str: string, visibleStart = 2, visibleEnd = 2): string {
  if (!str || typeof str !== 'string') return '';

  const totalVisible = visibleStart + visibleEnd;
  if (str.length <= totalVisible) return str;

  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const masked = '*'.repeat(Math.min(str.length - totalVisible, 8));

  return `${start}${masked}${end}`;
}

/**
 * 检查字段名是否匹配敏感字段列表
 * @param key - 字段名
 * @param fields - 敏感字段列表
 * @returns 是否匹配
 */
function matchesSensitiveField(key: string, fields: string[]): boolean {
  const lowerKey = key.toLowerCase();
  return fields.some(
    (field) =>
      lowerKey.includes(field.toLowerCase()) ||
      lowerKey === field.toLowerCase()
  );
}

/**
 * 脱敏单个值
 * @param value - 要脱敏的值
 * @param isSensitive - 是否为敏感字段
 * @returns 脱敏后的值
 */
function maskValue(value: unknown, isSensitive: boolean): unknown {
  // 如果是敏感字段且是字符串，进行脱敏
  if (isSensitive && typeof value === 'string') {
    return maskString(value);
  }

  // 如果是对象，递归处理
  if (typeof value === 'object' && value !== null) {
    return maskSensitiveFields(value as Record<string, unknown>);
  }

  // 其他类型直接返回
  return value;
}

/**
 * 对象敏感字段脱敏
 * @param obj 对象
 * @param fields 要脱敏的字段
 * @returns 脱敏后的对象
 */
export function maskSensitiveFields<T extends Record<string, any>>(
  obj: T,
  fields: string[] = [...SENSITIVE_FIELDS]
): T {
  // 验证输入
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // 检查字段是否敏感
    const isSensitive = matchesSensitiveField(key, fields);

    // 处理值
    result[key] = maskValue(value, isSensitive);
  }

  return result as T;
}

/**
 * 生成安全日志 ID
 * @returns 日志 ID
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建安全日志条目
 * @param level - 日志级别
 * @param message - 日志消息
 * @param category - 日志类别
 * @param metadata - 元数据（会被脱敏）
 * @returns 日志条目
 */
function createSecurityLogEntry(
  level: LogLevel,
  message: string,
  category: string,
  metadata?: Record<string, any>
): SecurityLogEntry {
  // 脱敏元数据
  const sanitizedMetadata = metadata
    ? maskSensitiveFields(metadata)
    : undefined;

  return {
    id: generateLogId(),
    timestamp: Date.now(),
    level,
    message,
    category,
    metadata: sanitizedMetadata,
  };
}

/**
 * 保存日志到存储
 * @param entry - 要保存的日志条目
 */
function saveSecurityLog(entry: SecurityLogEntry): void {
  // 获取现有日志
  const logs = storage.get<SecurityLogEntry[]>(SECURITY_CONFIG.LOG_STORAGE_KEY) || [];

  // 添加新日志
  logs.push(entry);

  // 限制日志数量
  if (logs.length > SECURITY_CONFIG.MAX_LOG_ENTRIES) {
    logs.shift();
  }

  // 保存日志
  storage.set(SECURITY_CONFIG.LOG_STORAGE_KEY, logs);
}

/**
 * 获取对应日志级别的控制台方法
 * @param level - 日志级别
 * @returns 控制台方法
 */
function getConsoleMethod(level: LogLevel): typeof console.log {
  switch (level) {
    case 'error':
      return console.error;
    case 'warn':
      return console.warn;
    case 'debug':
      return console.debug;
    default:
      return console.log;
  }
}

/**
 * 在开发环境下输出日志到控制台
 * @param entry - 日志条目
 */
function outputLogToConsole(entry: SecurityLogEntry): void {
  if (!import.meta.env.DEV) {
    return;
  }

  const consoleMethod = getConsoleMethod(entry.level);
  consoleMethod(`[Security:${entry.category}] ${entry.message}`, entry.metadata || '');
}

/**
 * 记录安全日志
 * @param level 日志级别
 * @param message 日志消息
 * @param category 日志类别
 * @param metadata 元数据
 */
export function logSecurityEvent(
  level: LogLevel,
  message: string,
  category: string,
  metadata?: Record<string, any>
): void {
  // 创建日志条目
  const entry = createSecurityLogEntry(level, message, category, metadata);

  // 保存到存储
  saveSecurityLog(entry);

  // 输出到控制台（开发环境）
  outputLogToConsole(entry);
}

/**
 * 获取安全日志
 * @param level 日志级别筛选
 * @param limit 返回条数限制
 * @returns 日志列表
 */
export function getSecurityLogs(
  level?: LogLevel,
  limit: number = 50
): SecurityLogEntry[] {
  const logs = storage.get<SecurityLogEntry[]>(SECURITY_CONFIG.LOG_STORAGE_KEY) || [];

  let filtered = logs;
  if (level) {
    filtered = logs.filter((log) => log.level === level);
  }

  return filtered.slice(-limit);
}

/**
 * 清空安全日志
 */
export function clearSecurityLogs(): void {
  storage.remove(SECURITY_CONFIG.LOG_STORAGE_KEY);
}

/**
 * 记录认证事件
 * @param event 事件类型
 * @param userId 用户 ID
 * @param success 是否成功
 * @param metadata 元数据
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'token_refresh' | 'password_change',
  userId: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const level: LogLevel = success ? 'info' : 'warn';
  const message = `Auth ${event} ${success ? 'succeeded' : 'failed'} for user ${maskString(userId)}`;

  logSecurityEvent(level, message, 'authentication', {
    event,
    userId: maskString(userId),
    success,
    ...metadata,
  });
}

/**
 * 记录访问事件
 * @param resource 资源
 * @param action 操作
 * @param userId 用户 ID
 * @param metadata 元数据
 */
export function logAccessEvent(
  resource: string,
  action: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  const message = `Access ${action} on ${resource}${userId ? ` by ${maskString(userId)}` : ''}`;

  logSecurityEvent('info', message, 'access_control', {
    resource,
    action,
    userId: userId ? maskString(userId) : undefined,
    ...metadata,
  });
}

/**
 * 记录异常事件
 * @param error 错误对象
 * @param context 上下文
 * @param userId 用户 ID
 */
export function logException(
  error: Error,
  context: string,
  userId?: string
): void {
  const message = `Exception in ${context}: ${error.message}`;

  logSecurityEvent('error', message, 'exception', {
    context,
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
    userId: userId ? maskString(userId) : undefined,
  });
}

/**
 * 检查是否是敏感字段
 * @param field 字段名
 * @returns 是否敏感
 */
export function isSensitiveField(field: string): boolean {
  const lowerField = field.toLowerCase();
  return SENSITIVE_FIELDS.some(
    (sensitive) =>
      lowerField.includes(sensitive.toLowerCase()) ||
      lowerField === sensitive.toLowerCase()
  );
}

/**
 * 从对象中移除敏感字段
 * @param obj 对象
 * @returns 移除敏感字段后的对象
 */
export function removeSensitiveFields<T extends Record<string, any>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object') return obj;

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!isSensitiveField(key)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = removeSensitiveFields(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result as Partial<T>;
}

/**
 * 安全地序列化对象（移除敏感信息）
 * @param obj 对象
 * @returns JSON 字符串
 */
export function safeStringify(obj: any): string {
  const sanitized = removeSensitiveFields(obj);
  return JSON.stringify(sanitized);
}

/**
 * 获取安全配置
 * @returns 安全配置
 */
export function getSecurityConfig(): typeof SECURITY_CONFIG {
  return { ...SECURITY_CONFIG };
}

/**
 * 获取敏感字段列表
 * @returns 敏感字段列表
 */
export function getSensitiveFields(): readonly string[] {
  return [...SENSITIVE_FIELDS];
}

/**
 * 初始化安全模块
 * 生成加密密钥等
 */
export function initSecurity(): void {
  // 确保加密密钥存在
  getEncryptionKey();

  // 记录初始化事件
  logSecurityEvent('info', 'Security module initialized', 'system');
}

/**
 * 清理所有安全数据
 * 用于用户登出时清理敏感信息
 */
export function clearSecurityData(): void {
  // 清除加密密钥
  storage.remove(SECURITY_CONFIG.ENCRYPTION_KEY_NAME);

  // 清除安全日志
  clearSecurityLogs();

  // 清除所有加密存储的数据
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith(SECURITY_CONFIG.SENSITIVE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

export default {
  // 加密/解密
  encryptData,
  decryptData,
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  generateEncryptionKey,
  getEncryptionKey,

  // 脱敏
  maskEmail,
  maskPhone,
  maskIdCard,
  maskBankCard,
  maskName,
  maskIpAddress,
  maskToken,
  maskString,
  maskSensitiveFields,

  // 日志
  logSecurityEvent,
  getSecurityLogs,
  clearSecurityLogs,
  logAuthEvent,
  logAccessEvent,
  logException,

  // 工具
  isSensitiveField,
  removeSensitiveFields,
  safeStringify,
  getSecurityConfig,
  getSensitiveFields,
  initSecurity,
  clearSecurityData,
};
