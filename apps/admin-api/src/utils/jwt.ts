import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  sub: string;
  username: string;
  role?: string;
  type?: string;
  userId?: string;
  email?: string;
}

export interface DecodedToken {
  sub: string;
  username: string;
  role: string;
  type: string;
  iat: number;
  exp: number;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any || '15m',
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn as any || '7d',
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}

export function verifyAccessToken(token: string): DecodedToken {
  // Remove token prefix if present
  let jwtToken = token;
  if (token.startsWith('aat_') || token.startsWith('art_') || 
      token.startsWith('cat_') || token.startsWith('crt_')) {
    jwtToken = token.substring(4);
  }
  return jwt.verify(jwtToken, config.jwt.secret) as DecodedToken;
}

export function verifyRefreshToken(token: string): DecodedToken {
  // Remove token prefix if present (art_ for admin refresh token)
  let jwtToken = token;
  if (token.startsWith('art_') || token.startsWith('crt_')) {
    jwtToken = token.substring(4);
  }
  return jwt.verify(jwtToken, config.jwt.secret) as DecodedToken;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) return null;
  return parts[1];
}

export function isValidAccessTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // Remove token prefix if present (aat_ for admin access token, art_ for admin refresh token)
  let jwtToken = token;
  if (token.startsWith('aat_') || token.startsWith('art_') || 
      token.startsWith('cat_') || token.startsWith('crt_')) {
    jwtToken = token.substring(4);
  }
  
  // Check if token has 3 parts (header.payload.signature)
  const parts = jwtToken.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode the header
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    if (header.typ !== 'JWT') return false;
    
    // Try to decode the payload - just check it's valid JSON
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    // Check for required fields (sub is used instead of userId in this implementation)
    if (!payload.sub || !payload.username || !payload.role || !payload.type) return false;
    
    return true;
  } catch {
    return false;
  }
}

export function isValidRefreshTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // Must start with 'art_' for admin refresh token or 'crt_' for client refresh token
  if (!token.startsWith('art_') && !token.startsWith('crt_')) return false;
  
  // Remove token prefix
  const jwtToken = token.substring(4);
  
  // Check if token has 3 parts (header.payload.signature)
  const parts = jwtToken.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode the header
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    if (header.typ !== 'JWT') return false;
    
    // Try to decode the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    // Check for required fields and ensure type is 'refresh'
    if (!payload.sub || !payload.username || !payload.role || payload.type !== 'refresh') return false;
    
    return true;
  } catch {
    return false;
  }
}
