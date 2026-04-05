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
export declare function generateAccessToken(payload: TokenPayload): string;
export declare function generateRefreshToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): TokenPayload;
export declare function verifyAccessToken(token: string): DecodedToken;
export declare function verifyRefreshToken(token: string): DecodedToken;
export declare function decodeToken(token: string): TokenPayload | null;
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
export declare function isValidAccessTokenFormat(token: string): boolean;
export declare function isValidRefreshTokenFormat(token: string): boolean;
//# sourceMappingURL=jwt.d.ts.map