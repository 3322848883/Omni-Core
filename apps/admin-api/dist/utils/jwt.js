"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const jwt = __importStar(require("jsonwebtoken"));
const config_1 = require("../config");
function generateAccessToken(payload) {
    return jwt.sign(payload, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.expiresIn || '15m',
    });
}
function generateRefreshToken(payload) {
    return jwt.sign({ ...payload, type: 'refresh' }, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.refreshExpiresIn || '7d',
    });
}
function verifyToken(token) {
    return jwt.verify(token, config_1.config.jwt.secret);
}
function verifyAccessToken(token) {
    // Remove token prefix if present
    let jwtToken = token;
    if (token.startsWith('aat_') || token.startsWith('art_') ||
        token.startsWith('cat_') || token.startsWith('crt_')) {
        jwtToken = token.substring(4);
    }
    return jwt.verify(jwtToken, config_1.config.jwt.secret);
}
function verifyRefreshToken(token) {
    // Remove token prefix if present (art_ for admin refresh token)
    let jwtToken = token;
    if (token.startsWith('art_') || token.startsWith('crt_')) {
        jwtToken = token.substring(4);
    }
    return jwt.verify(jwtToken, config_1.config.jwt.secret);
}
function decodeToken(token) {
    try {
        return jwt.decode(token);
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