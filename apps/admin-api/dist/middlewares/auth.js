"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
exports.requireRoles = requireRoles;
exports.requireSuperAdmin = requireSuperAdmin;
exports.requireAdmin = requireAdmin;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const database_1 = require("../database");
/**
 * JWT Authentication Middleware
 * Validates the Authorization header and attaches user info to request
 */
async function authMiddleware(req, _res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            throw new errors_1.UnauthorizedError('Missing or invalid authorization header');
        }
        // Validate token prefix (must start with 'aat_' for admin access token)
        if (!(0, jwt_1.isValidAccessTokenFormat)(token)) {
            throw new errors_1.UnauthorizedError('Invalid token format');
        }
        // Verify token
        let decoded;
        try {
            decoded = (0, jwt_1.verifyAccessToken)(token);
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === 'TokenExpiredError') {
                    throw new errors_1.TokenExpiredError('Token has expired');
                }
                if (error.name === 'JsonWebTokenError') {
                    throw new errors_1.UnauthorizedError('Invalid token');
                }
            }
            throw new errors_1.UnauthorizedError('Token verification failed');
        }
        // Ensure token type is access
        if (decoded.type !== 'access') {
            throw new errors_1.UnauthorizedError('Invalid token type');
        }
        // Check if admin user still exists and is active
        const admin = await (0, database_1.db)('admin_users')
            .where({ id: decoded.sub, is_active: true })
            .first();
        if (!admin) {
            throw new errors_1.UnauthorizedError('Admin account not found or inactive');
        }
        // Attach user info to request
        req.user = decoded;
        req.adminId = decoded.sub;
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Optional Authentication Middleware
 * Validates token if present, but doesn't require it
 */
async function optionalAuthMiddleware(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token || !(0, jwt_1.isValidAccessTokenFormat)(token)) {
            return next();
        }
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            if (decoded.type === 'access') {
                const admin = await (0, database_1.db)('admin_users')
                    .where({ id: decoded.sub, is_active: true })
                    .first();
                if (admin) {
                    req.user = decoded;
                    req.adminId = decoded.sub;
                }
            }
        }
        catch {
            // Ignore token errors for optional auth
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Role-based Authorization Middleware Factory
 * @param allowedRoles - Array of allowed roles
 * @returns Middleware function
 */
function requireRoles(...allowedRoles) {
    return (req, _res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.UnauthorizedError('Authentication required');
            }
            if (!allowedRoles.includes(req.user.role)) {
                throw new errors_1.ForbiddenError('Insufficient permissions');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Super Admin Only Middleware
 */
function requireSuperAdmin(req, _res, next) {
    requireRoles('super_admin')(req, _res, next);
}
/**
 * Admin or higher Middleware
 */
function requireAdmin(req, _res, next) {
    requireRoles('super_admin', 'admin')(req, _res, next);
}
//# sourceMappingURL=auth.js.map