import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

// Token prefixes for client API
const ACCESS_TOKEN_PREFIX = 'uat_';
const REFRESH_TOKEN_PREFIX = 'urt_';

interface TokenPayload {
  userId: string;
  email?: string;
}

/**
 * Remove token prefix
 */
function removePrefix(token: string, prefix: string): string {
  if (token.startsWith(prefix)) {
    return token.slice(prefix.length);
  }
  return token;
}

/**
 * Generate access and refresh tokens with prefixes
 */
export function generateTokens(userId: string, email: string): { accessToken: string; refreshToken: string } {
  const payload = { userId, email };
  const accessToken = ACCESS_TOKEN_PREFIX + jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = REFRESH_TOKEN_PREFIX + jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

/**
 * Generate access token only
 */
export function generateAccessToken(payload: TokenPayload): string {
  return ACCESS_TOKEN_PREFIX + jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
}

/**
 * Generate refresh token only
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return REFRESH_TOKEN_PREFIX + jwt.sign({ userId: payload.userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Verify access token (handles prefix)
 */
export function verifyAccessToken(token: string): TokenPayload {
  const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
  return jwt.verify(cleanToken, JWT_SECRET) as TokenPayload;
}

/**
 * Verify refresh token (handles prefix)
 */
export function verifyRefreshToken(token: string): { userId: string } {
  const cleanToken = removePrefix(token, REFRESH_TOKEN_PREFIX);
  return jwt.verify(cleanToken, JWT_REFRESH_SECRET) as { userId: string };
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): string {
  const payload = verifyRefreshToken(refreshToken);
  return generateAccessToken({ userId: payload.userId, email: '' });
}

/**
 * Verify token
 */
export function verifyToken(token: string): TokenPayload {
  const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
  return jwt.verify(cleanToken, JWT_SECRET) as TokenPayload;
}

/**
 * Decode token
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
    return jwt.decode(cleanToken) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Check if access token format is valid
 */
export function isValidAccessTokenFormat(token: string): boolean {
  if (!token) return false;
  try {
    const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
    const decoded = jwt.decode(cleanToken);
    return !!decoded;
  } catch {
    return false;
  }
}

/**
 * Check if refresh token format is valid
 */
export function isValidRefreshTokenFormat(token: string): boolean {
  if (!token) return false;
  try {
    const cleanToken = removePrefix(token, REFRESH_TOKEN_PREFIX);
    const decoded = jwt.decode(cleanToken);
    return !!decoded;
  } catch {
    return false;
  }
}

export default {
  generateTokens,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
  isValidAccessTokenFormat,
  isValidRefreshTokenFormat,
};
