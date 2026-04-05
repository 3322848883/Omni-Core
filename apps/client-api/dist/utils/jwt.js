"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokens = generateTokens;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.refreshAccessToken = refreshAccessToken;
exports.verifyToken = verifyToken;
exports.decodeToken = decodeToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.isValidAccessTokenFormat = isValidAccessTokenFormat;
exports.isValidRefreshTokenFormat = isValidRefreshTokenFormat;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
// Token prefixes for client API
const ACCESS_TOKEN_PREFIX = 'uat_';
const REFRESH_TOKEN_PREFIX = 'urt_';
/**
 * Generate access and refresh tokens with prefixes
 */
function generateTokens(userId, email) {
    const payload = { userId, email };
    const accessToken = ACCESS_TOKEN_PREFIX + jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '15m',
    });
    const refreshToken = REFRESH_TOKEN_PREFIX + jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}
/**
 * Generate access token only
 */
function generateAccessToken(payload) {
    return ACCESS_TOKEN_PREFIX + jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '15m',
    });
}
/**
 * Generate refresh token only
 */
function generateRefreshToken(payload) {
    return REFRESH_TOKEN_PREFIX + jsonwebtoken_1.default.sign({ userId: payload.userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}
/**
 * Remove token prefix
 */
function removePrefix(token, prefix) {
    if (token.startsWith(prefix)) {
        return token.slice(prefix.length);
    }
    return token;
}
/**
 * Verify access token (handles prefix)
 */
function verifyAccessToken(token) {
    const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
    return jsonwebtoken_1.default.verify(cleanToken, JWT_SECRET);
}
/**
 * Verify refresh token (handles prefix)
 */
function verifyRefreshToken(token) {
    const cleanToken = removePrefix(token, REFRESH_TOKEN_PREFIX);
    return jsonwebtoken_1.default.verify(cleanToken, JWT_REFRESH_SECRET);
}
/**
 * Refresh access token using refresh token
 */
function refreshAccessToken(refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    return generateAccessToken({ userId: payload.userId, email: '' });
}
function verifyToken(token) {
    const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
    return jsonwebtoken_1.default.verify(cleanToken, JWT_SECRET);
}
function decodeToken(token) {
    try {
        const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
        return jsonwebtoken_1.default.decode(cleanToken);
    }
    catch {
        return null;
    }
}
function extractTokenFromHeader(authHeader) {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
        return null;
    return parts[1];
}
function isValidAccessTokenFormat(token) {
    if (!token)
        return false;
    try {
        const cleanToken = removePrefix(token, ACCESS_TOKEN_PREFIX);
        const decoded = jsonwebtoken_1.default.decode(cleanToken);
        return !!decoded;
    }
    catch {
        return false;
    }
}
function isValidRefreshTokenFormat(token) {
    if (!token)
        return false;
    try {
        const cleanToken = removePrefix(token, REFRESH_TOKEN_PREFIX);
        const decoded = jsonwebtoken_1.default.decode(cleanToken);
        return !!decoded;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=jwt.js.map