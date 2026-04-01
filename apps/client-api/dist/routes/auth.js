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
const express_1 = require("express");
const rateLimiter_1 = require("@/middlewares/rateLimiter");
const auth_1 = require("@/middlewares/auth");
const authService = __importStar(require("@/services/authService"));
const response_1 = require("@/utils/response");
const constants_1 = require("@/constants");
const validation_1 = require("@/middlewares/validation");
const router = (0, express_1.Router)();
/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否有效
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
/**
 * 验证密码强度
 * @param password - 密码
 * @returns 验证结果
 */
const validatePasswordStrength = (password) => {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
};
/**
 * 验证用户名
 * @param username - 用户名
 * @returns 验证结果
 */
const validateUsername = (username) => {
    if (username.length < 3 || username.length > 20) {
        return { valid: false, message: 'Username must be between 3 and 20 characters' };
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    return { valid: true };
};
// Register
router.post('/register', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_1.AuthValidation.register), async (req, res, next) => {
    try {
        const data = req.body;
        // Check password match
        if (data.password !== data.confirmPassword) {
            return (0, response_1.errorResponse)(res, 'Passwords do not match', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'confirmPassword', message: 'Passwords do not match' }]);
        }
        const result = await authService.register(data);
        (0, response_1.createdResponse)(res, result, 'User registered successfully');
    }
    catch (error) {
        next(error);
    }
});
// Login
router.post('/login', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_1.AuthValidation.login), async (req, res, next) => {
    try {
        const data = req.body;
        const result = await authService.login(data);
        (0, response_1.successResponse)(res, result, 'Login successful');
    }
    catch (error) {
        next(error);
    }
});
// Logout
router.post('/logout', auth_1.authenticate, async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.substring(7) || '';
        await authService.logout(token);
        (0, response_1.successResponse)(res, { success: true }, 'Logout successful');
    }
    catch (error) {
        next(error);
    }
});
// Refresh token
router.post('/refresh', (0, validation_1.validate)(validation_1.AuthValidation.refresh), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        (0, response_1.successResponse)(res, result, 'Token refreshed successfully');
    }
    catch (error) {
        next(error);
    }
});
// Get current user
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await authService.getCurrentUser(req.user.user_id);
        (0, response_1.successResponse)(res, user);
    }
    catch (error) {
        next(error);
    }
});
// Forgot password (P1)
router.post('/forgot-password', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_1.AuthValidation.forgotPassword), async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        (0, response_1.successResponse)(res, { success: true }, 'Password reset email sent');
    }
    catch (error) {
        next(error);
    }
});
// Reset password (P1)
router.post('/reset-password', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_1.AuthValidation.resetPassword), async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        (0, response_1.successResponse)(res, { success: true }, 'Password reset successful');
    }
    catch (error) {
        next(error);
    }
});
// Update password (P1)
router.put('/password', auth_1.authenticate, (0, validation_1.validate)(validation_1.AuthValidation.updatePassword), async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        await authService.updatePassword(req.user.user_id, oldPassword, newPassword);
        (0, response_1.successResponse)(res, { success: true }, 'Password updated successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map