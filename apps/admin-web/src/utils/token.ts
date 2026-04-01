/**
 * Token 工具函数
 * 管理端使用 aat_ (access) 和 art_ (refresh) 前缀
 */

export const TOKEN_PREFIX = {
  ACCESS: 'aat_',
  REFRESH: 'art_',
} as const;

/**
 * 验证 Access Token 是否有效（检查前缀）
 * @param token - 要验证的 token
 * @returns 是否有效
 */
export function validateAccessToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.startsWith(TOKEN_PREFIX.ACCESS);
}

/**
 * 验证 Refresh Token 是否有效（检查前缀）
 * @param token - 要验证的 token
 * @returns 是否有效
 */
export function validateRefreshToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.startsWith(TOKEN_PREFIX.REFRESH);
}

/**
 * 验证 Token 类型
 * @param token - 要验证的 token
 * @returns token 类型或 null
 */
export function getTokenType(token: string | null | undefined): 'access' | 'refresh' | null {
  if (!token) return null;
  if (token.startsWith(TOKEN_PREFIX.ACCESS)) return 'access';
  if (token.startsWith(TOKEN_PREFIX.REFRESH)) return 'refresh';
  return null;
}

/**
 * 检查 token 是否为管理端 token（防止用户端 token 被误用）
 * @param token - 要检查的 token
 * @returns 是否为管理端 token
 */
export function isAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.startsWith(TOKEN_PREFIX.ACCESS) || token.startsWith(TOKEN_PREFIX.REFRESH);
}

/**
 * 检查 token 是否为用户端 token（用于错误提示）
 * @param token - 要检查的 token
 * @returns 是否为用户端 token
 */
export function isClientToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.startsWith('uat_') || token.startsWith('urt_');
}
