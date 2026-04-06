import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );

}

/**
 * Verify access token
 * Token format: aat_<jwt_token>
 */
export function verifyAccessToken(token: string): DecodedToken {
  // Remove 'aat_' prefix if present
  const actualToken = token.startsWith('aat_') ? token.slice(4) : token;
  return jwt.verify(actualToken, config.jwtSecret) as DecodedToken;
}

/**
 * Verify refresh token
 * Token format: art_<jwt_token>
 */
export function verifyRefreshToken(token: string): DecodedToken {
  // Remove 'art_' prefix if present
  const actualToken = token.startsWith('art_') ? token.slice(4) : token;
  return jwt.verify(actualToken, config.jwtSecret) as DecodedToken;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Check if token has valid format (starts with 'aat_' for admin access token)
 */
export function isValidAccessTokenFormat(token: string): boolean {
  return token.startsWith('aat_');
}

/**
 * Decode token without verification
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  isValidAccessTokenFormat,
  decodeToken,
};
