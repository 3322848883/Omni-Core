import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

// Token prefixes for client API
const ACCESS_TOKEN_PREFIX = 'uat_';
const REFRESH_TOKEN_PREFIX = 'urt_';

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access and refresh tokens with prefixes
 */
export function generateTokens(userId: string, email: string): AuthTokens {
  const payload: TokenPayload = { userId, email };
  
  const accessToken = ACCESS_TOKEN_PREFIX + jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
  
  const refreshToken = REFRESH_TOKEN_PREFIX + jwt.sign(
    { userId }, 
    JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );
  
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
  return REFRESH_TOKEN_PREFIX + jwt.sign(
    { userId: payload.userId }, 
    JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );
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

export function verifyToken(token: string): TokenPayload {
  const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
  return jwt.verify(cleanToken, JWT_SECRET) as TokenPayload;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
    return jwt.decode(cleanToken) as TokenPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function isValidAccessTokenFormat(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
    const decoded = jwt.decode(cleanToken);
    return !!decoded;
  } catch {
    return false;
  }
}

export function isValidRefreshTokenFormat(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const cleanToken = removePrefix(token, REFRESH_TOKEN_PREFIX);
    const decoded = jwt.decode(cleanToken);
    return !!decoded;
  } catch {
    return false;
  }
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}
