"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const config_1 = require("../config");
const router = (0, express_1.Router)();
exports.authRoutes = router;
/**
 * POST /api/v1/auth/login - Admin login
 * Supports username/password authentication with optional MFA
 */
router.post('/login', (0, validation_1.validate)(validation_1.AuthValidation.login), async (req, res, next) => {
    try {
        const { username, password, mfaCode } = req.body;
        // Find admin by username
        const admin = await (0, database_1.db)('admin_users')
            .where({ username })
            .first();
        if (!admin) {
            // Log failed login attempt
            logger_1.logger.warn({
                message: 'Failed login attempt - user not found',
                username,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            throw new errors_1.UnauthorizedError('Invalid username or password');
        }
        // Check if account is active
        if (!admin.is_active) {
            logger_1.logger.warn({
                message: 'Failed login attempt - account inactive',
                username,
                adminId: admin.id,
                ip: req.ip,
            });
            throw new errors_1.ForbiddenError('Account is disabled');
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, admin.password_hash);
        if (!isPasswordValid) {
            // Log failed login attempt
            logger_1.logger.warn({
                message: 'Failed login attempt - invalid password',
                username,
                adminId: admin.id,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            throw new errors_1.UnauthorizedError('Invalid username or password');
        }
        // Check MFA if enabled
        if (admin.mfa_secret) {
            if (!mfaCode) {
                throw new errors_1.ValidationError([
                    { field: 'mfaCode', message: 'MFA code is required' },
                ]);
            }
            const isMfaValid = speakeasy_1.default.totp.verify({
                secret: admin.mfa_secret,
                encoding: 'base32',
                token: mfaCode,
                window: 1,
            });
            if (!isMfaValid) {
                logger_1.logger.warn({
                    message: 'Failed login attempt - invalid MFA code',
                    username,
                    adminId: admin.id,
                    ip: req.ip,
                });
                throw new errors_1.UnauthorizedError('Invalid MFA code');
            }
        }
        // Generate tokens with admin prefix
        const tokenPayload = {
            sub: String(admin.id),
            username: admin.username,
            role: admin.role,
            type: 'access',
        };
        const refreshPayload = {
            sub: String(admin.id),
            username: admin.username,
            role: admin.role,
            type: 'refresh',
        };
        const accessToken = 'aat_' + (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = 'art_' + (0, jwt_1.generateRefreshToken)(refreshPayload);
        // Parse expires in to milliseconds
        const expiresInMatch = config_1.config.jwt.expiresIn.match(/^(\d+)([mhd])$/);
        let expiresIn = 7200; // Default 2 hours in seconds
        if (expiresInMatch) {
            const value = parseInt(expiresInMatch[1], 10);
            const unit = expiresInMatch[2];
            switch (unit) {
                case 'm':
                    expiresIn = value * 60;
                    break;
                case 'h':
                    expiresIn = value * 3600;
                    break;
                case 'd':
                    expiresIn = value * 86400;
                    break;
            }
        }
        // Update last login time
        await (0, database_1.db)('admin_users')
            .where({ id: admin.id })
            .update({ last_login_at: new Date() });
        // Log successful login
        logger_1.logger.info({
            message: 'Admin login successful',
            adminId: admin.id,
            username: admin.username,
            role: admin.role,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        // Record admin log
        await (0, database_1.db)('admin_logs').insert({
            admin_id: admin.id,
            action: 'LOGIN',
            resource: 'auth',
            details: JSON.stringify({
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            }),
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
        });
        // Send response
        (0, response_1.sendSuccess)(res, {
            accessToken,
            refreshToken,
            expiresIn,
            tokenType: 'Bearer',
        }, 'Login successful', 200);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/auth/logout - Admin logout
 * Requires authentication
 */
router.post('/logout', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const adminId = req.adminId;
        if (adminId) {
            // Log logout action
            logger_1.logger.info({
                message: 'Admin logout successful',
                adminId,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            // Record admin log
            await (0, database_1.db)('admin_logs').insert({
                admin_id: adminId,
                action: 'LOGOUT',
                resource: 'auth',
                details: JSON.stringify({
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                }),
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });
        }
        // Note: In a stateless JWT system, actual token invalidation
        // would require a token blacklist (Redis) or short token expiry
        // For now, we just return success and let the client remove the token
        (0, response_1.sendSuccess)(res, null, 'Logout successful', 200);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/auth/refresh - Refresh access token
 * Uses refresh token to generate new access token
 */
router.post('/refresh', (0, validation_1.validate)(validation_1.AuthValidation.refresh), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        // Validate token format (must start with 'art_')
        if (!refreshToken || !(0, jwt_1.isValidRefreshTokenFormat)(refreshToken)) {
            throw new errors_1.UnauthorizedError('Invalid refresh token format');
        }
        // Verify refresh token
        let decoded;
        try {
            decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === 'TokenExpiredError') {
                    throw new errors_1.UnauthorizedError('Refresh token has expired');
                }
                if (error.name === 'JsonWebTokenError') {
                    throw new errors_1.UnauthorizedError('Invalid refresh token');
                }
            }
            throw new errors_1.UnauthorizedError('Token verification failed');
        }
        // Ensure token type is refresh
        if (decoded.type !== 'refresh') {
            throw new errors_1.UnauthorizedError('Invalid token type');
        }
        // Check if admin still exists and is active
        const admin = await (0, database_1.db)('admin_users')
            .where({ id: parseInt(decoded.sub, 10), is_active: true })
            .first();
        if (!admin) {
            throw new errors_1.UnauthorizedError('Admin account not found or inactive');
        }
        // Generate new tokens (token rotation) with admin prefix
        const tokenPayload = {
            sub: String(admin.id),
            username: admin.username,
            role: admin.role,
            type: 'access',
        };
        const refreshPayload = {
            sub: String(admin.id),
            username: admin.username,
            role: admin.role,
            type: 'refresh',
        };
        const newAccessToken = 'aat_' + (0, jwt_1.generateAccessToken)(tokenPayload);
        const newRefreshToken = 'art_' + (0, jwt_1.generateRefreshToken)(refreshPayload);
        // Parse expires in to milliseconds
        const expiresInMatch = config_1.config.jwt.expiresIn.match(/^(\d+)([mhd])$/);
        let expiresIn = 7200; // Default 2 hours in seconds
        if (expiresInMatch) {
            const value = parseInt(expiresInMatch[1], 10);
            const unit = expiresInMatch[2];
            switch (unit) {
                case 'm':
                    expiresIn = value * 60;
                    break;
                case 'h':
                    expiresIn = value * 3600;
                    break;
                case 'd':
                    expiresIn = value * 86400;
                    break;
            }
        }
        // Log token refresh
        logger_1.logger.info({
            message: 'Token refreshed',
            adminId: admin.id,
            username: admin.username,
            ip: req.ip,
        });
        // Send response
        (0, response_1.sendSuccess)(res, {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn,
            tokenType: 'Bearer',
        }, 'Token refreshed successfully', 200);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/auth/me - Get current admin info
 * Requires authentication
 */
router.get('/me', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const adminId = req.adminId;
        if (!adminId) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        // Fetch admin details (exclude sensitive fields)
        const admin = await (0, database_1.db)('admin_users')
            .where({ id: parseInt(adminId, 10) })
            .select('id', 'username', 'email', 'role', 'avatar', 'is_active', 'last_login_at', 'created_at', 'updated_at')
            .first();
        if (!admin) {
            throw new errors_1.UnauthorizedError('Admin not found');
        }
        (0, response_1.sendSuccess)(res, {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            avatar: admin.avatar,
            isActive: admin.is_active,
            lastLoginAt: admin.last_login_at,
            createdAt: admin.created_at,
            updatedAt: admin.updated_at,
        }, 'Success', 200);
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=auth.js.map