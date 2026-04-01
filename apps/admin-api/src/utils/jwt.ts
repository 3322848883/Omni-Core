import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId?: string;
  email?: string;
  sub?: string;
  username?: string;
  role?: string;
  type?: string;
}

export interface DecodedToken {
  sub: string;
  userId?: string;
  username: string;
  role: string;
  type: string;
  iat: number;
  exp: number;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}

export function verifyAccessToken(token: string): DecodedToken {
  let jwtToken = token;
  if (token.startsWith('aat_') || token.startsWith('art_') || 
      token.startsWith('cat_') || token.startsWith('crt_')) {
    jwtToken = token.substring(4);
  }
  return jwt.verify(jwtToken, config.jwt.secret) as DecodedToken;
}

export function verifyRefreshToken(token: string): DecodedToken {
  let jwtToken = token;
  if (token.startsWith('art_') || token.startsWith('crt_')) {
    jwtToken = token.substring(4);
  }
  return jwt.verify(jwtToken, config.jwt.refreshSecret) as DecodedToken;
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
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function isValidAccessTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  let jwtToken = token;
  if (token.startsWith('aat_') || token.startsWith('art_') || 
      token.startsWith('cat_') || token.startsWith('crt_')) {
    jwtToken = token.substring(4);
  }
  
  const parts = jwtToken.split('.');
  if (parts.length !== 3) return false;
  
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    if (header.typ !== 'JWT') return false;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (!payload.sub && !payload.userId) return false;
    
    return true;
  } catch {
    return false;
  }
}

export function isValidRefreshTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  if (!token.startsWith('art_') && !token.startsWith('crt_')) return false;
  
  const jwtToken = token.substring(4);
  
  const parts = jwtToken.split('.');
  if (parts.length !== 3) return false;
  
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    if (header.typ !== 'JWT') return false;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (!payload.sub && !payload.userId) return false;
    if (payload.type !== 'refresh') return false;
    
    return true;
  } catch {
    return false;
  }
}
