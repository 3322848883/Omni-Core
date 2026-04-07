"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jwt_1 = require("@/utils/jwt");
const AppError_1 = require("@/errors/AppError");
const tokenBlacklist_1 = require("@/services/tokenBlacklist");
const database_1 = __importDefault(require("@/config/database"));
/**
 * Format database user to User type
 */
const formatUser = (dbUser) => {
    return {
        id: String(dbUser.user_id),
        email: dbUser.email,
        username: dbUser.username,
        role: 'user',
        status: (dbUser.status === 1 || String(dbUser.status) === '1') ? 'active' : 'inactive',
        emailVerified: true,
        twoFactorEnabled: false,
        lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : undefined,
        lastLoginIp: dbUser.last_login_ip,
        createdAt: new Date(dbUser.created_at),
        updatedAt: new Date(dbUser.updated_at)
    };
};
/**
 * Authentication middleware - requires valid access token
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            throw new AppError_1.UnauthorizedError('Access token required');
        }
        // Check if token is blacklisted
        const blacklisted = await (0, tokenBlacklist_1.isBlacklisted)(token);
        if (blacklisted) {
            throw new AppError_1.UnauthorizedError('Token has been revoked');
        }
        // Verify token
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // Get user from database
        const dbUser = await (0, database_1.default)('users')
            .where({ user_id: decoded.userId })
            .first();
        if (!dbUser) {
            throw new AppError_1.UnauthorizedError('User not found');
        }
        // Check user status - support both numeric (1) and string ('active') formats
        const isActive = dbUser.status === 1 || String(dbUser.status) === '1';
        if (!isActive) {
            throw new AppError_1.UnauthorizedError('Account is not active');
        }
        // Attach formatted user to request
        req.user = formatUser(dbUser);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication middleware - doesn't require token but attaches user if present
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (token) {
            try {
                const decoded = (0, jwt_1.verifyAccessToken)(token);
                const dbUser = await (0, database_1.default)('users')
                    .where({ user_id: decoded.userId })
                    .first();
                if (dbUser) {
                    // Check user status - support both numeric (1) and string ('active') formats
                    const isActive = dbUser.status === 1 || String(dbUser.status) === '1';
                    if (isActive) {
                        req.user = formatUser(dbUser);
                    }
                }
            }
            catch {
                // Ignore token errors for optional auth
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map