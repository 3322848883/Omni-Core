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
export declare function generateTokens(userId: string, email: string): AuthTokens;
/**
 * Generate access token only
 */
export declare function generateAccessToken(payload: TokenPayload): string;
/**
 * Generate refresh token only
 */
export declare function generateRefreshToken(payload: TokenPayload): string;
/**
 * Verify access token (handles prefix)
 */
export declare function verifyAccessToken(token: string): TokenPayload;
/**
 * Verify refresh token (handles prefix)
 */
export declare function verifyRefreshToken(token: string): {
    userId: string;
};
/**
 * Refresh access token using refresh token
 */
export declare function refreshAccessToken(refreshToken: string): string;
export declare function verifyToken(token: string): TokenPayload;
export declare function decodeToken(token: string): TokenPayload | null;
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
export declare function isValidAccessTokenFormat(token: string | undefined): boolean;
export declare function isValidRefreshTokenFormat(token: string | undefined): boolean;
export interface DecodedToken extends TokenPayload {
    iat: number;
    exp: number;
}
//# sourceMappingURL=jwt.d.ts.map