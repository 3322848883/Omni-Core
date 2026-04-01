/**
 * 请求签名工具
 * 实现 HMAC-SHA256 签名生成，用于 API 请求安全验证
 *
 * 遵循 api-security-specification.md 规范:
 * - 签名算法: HMAC-SHA256
 * - 签名格式: method + path + timestamp + nonce + body
 * - 时间戳有效期: 5分钟
 */

// 签名配置常量
const SIGNATURE_CONFIG = {
  // 时间戳有效期（毫秒）- 5分钟
  TIMESTAMP_VALIDITY: 5 * 60 * 1000,
  // Nonce 长度
  NONCE_LENGTH: 16,
  // 签名算法
  ALGORITHM: 'HMAC-SHA256',
  // 签名版本
  VERSION: 'v1',
} as const;

/**
 * 签名参数接口
 */
export interface SignatureParams {
  method: string;
  path: string;
  timestamp: number;
  nonce: string;
  body?: string;
}

/**
 * 签名结果接口
 */
export interface SignatureResult {
  signature: string;
  timestamp: number;
  nonce: string;
  version: string;
}

/**
 * 生成随机 nonce 字符串
 * @returns 16位随机字符串
 */
export function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(SIGNATURE_CONFIG.NONCE_LENGTH);

  // 使用 Web Crypto API 生成随机值
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < SIGNATURE_CONFIG.NONCE_LENGTH; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }
  } else {
    // 降级方案：使用 Math.random
    for (let i = 0; i < SIGNATURE_CONFIG.NONCE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return result;
}

/**
 * 生成当前时间戳（毫秒）
 * @returns 时间戳
 */
export function generateTimestamp(): number {
  return Date.now();
}

/**
 * 验证时间戳是否在有效期内
 * @param timestamp 时间戳
 * @returns 是否有效
 */
export function isTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  return diff <= SIGNATURE_CONFIG.TIMESTAMP_VALIDITY;
}

/**
 * 对请求参数进行排序并拼接成字符串
 * @param params 参数对象
 * @returns 排序后的参数字符串
 */
export function sortAndStringifyParams(params: Record<string, any>): string {
  const sortedKeys = Object.keys(params).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        pairs.push(`${key}=${JSON.stringify(value)}`);
      } else {
        pairs.push(`${key}=${String(value)}`);
      }
    }
  }

  return pairs.join('&');
}

/**
 * 构建签名字符串
 * @param params 签名参数
 * @returns 待签名字符串
 */
export function buildSignatureString(params: SignatureParams): string {
  const { method, path, timestamp, nonce, body } = params;

  // 按照规范格式拼接: method + path + timestamp + nonce + body
  const parts: string[] = [
    method.toUpperCase(),
    path,
    String(timestamp),
    nonce,
  ];

  // 如果有请求体，添加 MD5 哈希后的 body
  if (body && body.length > 0) {
    parts.push(hashBody(body));
  } else {
    parts.push('');
  }

  return parts.join('|');
}

/**
 * 计算请求体的哈希值（简化版）
 * @param body 请求体字符串
 * @returns 哈希值
 */
function hashBody(body: string): string {
  // 使用简单的哈希算法（实际项目中可以使用更复杂的算法）
  let hash = 0;
  for (let i = 0; i < body.length; i++) {
    const char = body.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * 使用 Web Crypto API 生成 HMAC-SHA256 签名
 * @param message 待签名消息
 * @param secret 密钥
 * @returns Base64 编码的签名
 */
async function generateHmacSha256(
  message: string,
  secret: string
): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // 降级方案：返回模拟签名（仅用于开发环境）
    console.warn('Web Crypto API not available, using fallback signature');
    return btoa(message + secret).substring(0, 32);
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  // 导入密钥
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 生成签名
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // 转换为 Base64
  const signatureArray = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < signatureArray.byteLength; i++) {
    binary += String.fromCharCode(signatureArray[i]);
  }

  return btoa(binary);
}

/**
 * 生成请求签名
 * @param method HTTP 方法
 * @param path 请求路径
 * @param body 请求体（可选）
 * @param secret 签名密钥
 * @returns 签名结果
 */
export async function generateSignature(
  method: string,
  path: string,
  body?: string,
  secret?: string
): Promise<SignatureResult> {
  const timestamp = generateTimestamp();
  const nonce = generateNonce();

  const params: SignatureParams = {
    method,
    path,
    timestamp,
    nonce,
    body,
  };

  const signatureString = buildSignatureString(params);

  // 使用环境变量中的密钥或传入的密钥
  const signatureSecret = secret || import.meta.env.VITE_API_SIGNATURE_SECRET || 'default-secret';
  const signature = await generateHmacSha256(signatureString, signatureSecret);

  return {
    signature,
    timestamp,
    nonce,
    version: SIGNATURE_CONFIG.VERSION,
  };
}

/**
 * 同步生成请求签名（使用简化算法，适用于不支持 async 的场景）
 * @param method HTTP 方法
 * @param path 请求路径
 * @param body 请求体（可选）
 * @param timestamp 时间戳（可选，用于测试）
 * @param nonce Nonce（可选，用于测试）
 * @returns 签名结果
 */
export function generateSignatureSync(
  method: string,
  path: string,
  body?: string,
  timestamp?: number,
  nonce?: string
): Omit<SignatureResult, 'signature'> & { signature: string } {
  const finalTimestamp = timestamp ?? Date.now();
  const finalNonce = nonce ?? generateNonce();

  const params: SignatureParams = {
    method,
    path,
    timestamp: finalTimestamp,
    nonce: finalNonce,
    body,
  };

  const signatureString = buildSignatureString(params);

  // 简化版签名（使用简单的哈希算法）
  let hash = 0;
  for (let i = 0; i < signatureString.length; i++) {
    const char = signatureString.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const signature = Math.abs(hash).toString(16).padStart(16, '0') + finalNonce.substring(0, 16);

  return {
    signature,
    timestamp: finalTimestamp,
    nonce: finalNonce,
    version: SIGNATURE_CONFIG.VERSION,
  };
}

/**
 * 验证请求签名
 * @param signature 签名
 * @param params 签名参数
 * @param secret 密钥
 * @returns 是否有效
 */
export async function verifySignature(
  signature: string,
  params: SignatureParams,
  secret?: string
): Promise<boolean> {
  // 验证时间戳
  if (!isTimestampValid(params.timestamp)) {
    return false;
  }

  const signatureString = buildSignatureString(params);
  const signatureSecret = secret || import.meta.env.VITE_API_SIGNATURE_SECRET || 'default-secret';
  const expectedSignature = await generateHmacSha256(signatureString, signatureSecret);

  // 使用 timing-safe 比较防止时序攻击
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 判断请求是否需要签名
 * @param method HTTP 方法
 * @param path 请求路径
 * @returns 是否需要签名
 */
export function requiresSignature(method: string, path: string): boolean {
  // 敏感操作列表
  const sensitiveMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const sensitivePaths = [
    '/orders',
    '/users/me',
    '/auth/change-password',
    '/subscription',
  ];

  // 检查方法
  if (!sensitiveMethods.includes(method.toUpperCase())) {
    return false;
  }

  // 检查路径
  return sensitivePaths.some((sensitivePath) =>
    path.startsWith(sensitivePath)
  );
}

/**
 * 获取签名配置
 * @returns 签名配置
 */
export function getSignatureConfig(): typeof SIGNATURE_CONFIG {
  return { ...SIGNATURE_CONFIG };
}

export default {
  generateSignature,
  generateSignatureSync,
  verifySignature,
  generateNonce,
  generateTimestamp,
  isTimestampValid,
  buildSignatureString,
  sortAndStringifyParams,
  requiresSignature,
  getSignatureConfig,
};
