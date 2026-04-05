"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyToken = verifyToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.decodeToken = decodeToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.isValidAccessTokenFormat = isValidAccessTokenFormat;
exports.isValidRefreshTokenFormat = isValidRefreshTokenFormat;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.expiresIn || '15m',
    });
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.refreshExpiresIn || '7d',
    });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
}
function verifyAccessToken(token) {
    // Remove token prefix if present
    let jwtToken = token;
    if (token.startsWith('aat_') || token.startsWith('art_') ||
        token.startsWith('cat_') || token.startsWith('crt_')) {
        jwtToken = token.substring(4);
    }
    return jsonwebtoken_1.default.verify(jwtToken, config_1.config.jwt.secret);
}
function verifyRefreshToken(token) {
    // Remove token prefix if present (art_ for admin refresh token)
    let jwtToken = token;
    if (token.startsWith('art_') || token.startsWith('crt_')) {
        jwtToken = token.substring(4);
    }
    return jsonwebtoken_1.default.verify(jwtToken, config_1.config.jwt.secret);
}
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
}
function extractTokenFromHeader(authHeader) {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1])
        return null;
    return parts[1];
}
function isValidAccessTokenFormat(token) {
    if (!token || typeof token !== 'string')
        return false;
    // Remove token prefix if present (aat_ for admin access token, art_ for admin refresh token)
    let jwtToken = token;
    if (token.startsWith('aat_') || token.startsWith('art_') ||
        token.startsWith('cat_') || token.startsWith('crt_')) {
        jwtToken = token.substring(4);
    }
    // Check if token has 3 parts (header.payload.signature)
    const parts = jwtToken.split('.');
    if (parts.length !== 3)
        return false;
    try {
        // Try to decode the header
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        if (header.typ !== 'JWT')
            return false;
        // Try to decode the payload - just check it's valid JSON
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        // Check for required fields (sub is used instead of userId in this implementation)
        if (!payload.sub || !payload.username || !payload.role || !payload.type)
            return false;
        return true;
    }
    catch {
        return false;
    }
}
function isValidRefreshTokenFormat(token) {
    if (!token || typeof token !== 'string')
        return false;
    // Must start with 'art_' for admin refresh token or 'crt_' for client refresh token
    if (!token.startsWith('art_') && !token.startsWith('crt_'))
        return false;
    // Remove token prefix
    const jwtToken = token.substring(4);
    // Check if token has 3 parts (header.payload.signature)
    const parts = jwtToken.split('.');
    if (parts.length !== 3)
        return false;
    try {
        // Try to decode the header
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        if (header.typ !== 'JWT')
            return false;
        // Try to decode the payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        // Check for required fields and ensure type is 'refresh'
        if (!payload.sub || !payload.username || !payload.role || payload.type !== 'refresh')
            return false;
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=jwt.js.map