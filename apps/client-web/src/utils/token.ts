/**
 * Token utility functions
 * Provides token validation and extraction utilities
 */

/**
 * Token prefix constants
 */
export const TOKEN_PREFIX = {
  ACCESS: 'uat_',
  REFRESH: 'urt_',
} as const;

/**
 * Validate token prefix
 * @param token - The token to validate
 * @param expectedPrefix - The expected prefix (e.g., 'uat_', 'urt_')
 * @returns boolean indicating if token has valid prefix
 */
export function validateTokenPrefix(token: string, expectedPrefix: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  return token.startsWith(expectedPrefix);
}

/**
 * Validate access token prefix
 * @param token - The access token to validate
 * @returns boolean indicating if token has valid 'uat_' prefix
 */
export function validateAccessToken(token: string): boolean {
  return validateTokenPrefix(token, TOKEN_PREFIX.ACCESS);
}

/**
 * Validate refresh token prefix
 * @param token - The refresh token to validate
 * @returns boolean indicating if token has valid 'urt_' prefix
 */
export function validateRefreshToken(token: string): boolean {
  return validateTokenPrefix(token, TOKEN_PREFIX.REFRESH);
}

/**
 * Extract payload from JWT token (without verification)
 * @param token - The JWT token
 * @returns The decoded payload object or null if invalid
 */
export function extractTokenPayload(token: string): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    // Split the token and get the payload part (second part)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 * @param token - The JWT token
 * @returns boolean indicating if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = extractTokenPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const exp = payload.exp as number;
  // Add 10 second buffer to account for clock skew
  return Date.now() >= (exp - 10) * 1000;
}

/**
 * Get token expiration time
 * @param token - The JWT token
 * @returns Expiration timestamp in milliseconds or null if invalid
 */
export function getTokenExpiration(token: string): number | null {
  const payload = extractTokenPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return (payload.exp as number) * 1000;
}

/**
 * Format token for display (masks most of the token)
 * @param token - The token to format
 * @returns Formatted token string
 */
export function formatTokenForDisplay(token: string): string {
  if (!token || token.length < 10) {
    return '***';
  }

  const prefix = token.slice(0, 8);
  const suffix = token.slice(-4);
  return `${prefix}...${suffix}`;
}
