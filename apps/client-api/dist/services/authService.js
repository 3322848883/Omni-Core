"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.resetPassword = exports.forgotPassword = exports.getCurrentUser = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const database_1 = __importDefault(require("@/config/database"));
const crypto_1 = require("@/utils/crypto");
const jwt_1 = require("@/utils/jwt");
const AppError_1 = require("@/errors/AppError");
const constants_1 = require("@/constants");
const emailService_1 = require("./emailService");
const tokenBlacklist_1 = require("./tokenBlacklist");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("@/config"));
const logger_1 = __importDefault(require("@/utils/logger"));
/**
 * Register a new user
 */
const register = async (data) => {
    const { email, password, username, inviteCode } = data;
    // Check if email already exists
    const existingUser = await (0, database_1.default)('users').where({ email }).first();
    if (existingUser) {
        throw new AppError_1.ConflictError('Email already registered');
    }
    // Check if username already exists
    const existingUsername = await (0, database_1.default)('users').where({ username }).first();
    if (existingUsername) {
        throw new AppError_1.ConflictError('Username already taken');
    }
    // Validate invite code if provided
    if (inviteCode) {
        const validInvite = await (0, database_1.default)('invite_codes')
            .where({ code: inviteCode, status: 1 }) // USER_STATUS.ACTIVE = 1
            .whereNull('used_by')
            .where('expire_at', '>', new Date())
            .first();
        if (!validInvite) {
            throw new AppError_1.ValidationError([{ field: 'inviteCode', message: 'Invalid or expired invite code' }]);
        }
    }
    // Hash password
    const passwordHash = await (0, crypto_1.hashPassword)(password);
    // Generate user ID and VPN UUID
    const userId = (0, crypto_1.generateUserId)();
    const vpnUuid = (0, crypto_1.generateVpnUuid)();
    // Create user (MySQL compatible - no returning)
    await (0, database_1.default)('users').insert({
        user_id: userId,
        email,
        username,
        password_hash: passwordHash,
        vpn_uuid: vpnUuid,
        status: constants_1.USER_STATUS.ACTIVE,
        traffic_limit: 0,
        traffic_used: 0,
        expire_date: null,
        created_at: new Date(),
        updated_at: new Date(),
    });
    // Fetch the created user
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    // Update invite code if used
    if (inviteCode) {
        await (0, database_1.default)('invite_codes')
            .where({ code: inviteCode })
            .update({
            used_by: userId,
            used_at: new Date(),
            status: 2, // Used status
        });
        // Get invite rewards
        const inviteCodeRecord = await (0, database_1.default)('invite_codes').where({ code: inviteCode }).first();
        if (inviteCodeRecord) {
            // Add traffic reward
            if (inviteCodeRecord.traffic_reward > 0) {
                await (0, database_1.default)('users')
                    .where({ user_id: userId })
                    .increment('traffic_limit', inviteCodeRecord.traffic_reward);
            }
            // Add days reward
            if (inviteCodeRecord.days_reward > 0) {
                const expireDate = new Date();
                expireDate.setDate(expireDate.getDate() + inviteCodeRecord.days_reward);
                await (0, database_1.default)('users')
                    .where({ user_id: userId })
                    .update({ expire_date: expireDate });
            }
        }
    }
    // Generate tokens
    const tokens = (0, jwt_1.generateTokens)(user.user_id, user.email);
    return {
        user: formatUserInfo(user),
        tokens,
    };
};
exports.register = register;
/**
 * Login user
 */
const login = async (data) => {
    const { email, password } = data;
    // Find user by email or username
    let user = await (0, database_1.default)('users').where({ email }).first();
    // If not found by email, try username
    if (!user) {
        user = await (0, database_1.default)('users').where({ username: email }).first();
    }
    if (!user) {
        throw new AppError_1.UnauthorizedError('Invalid credentials');
    }
    // Check if user is active (兼容 Admin API 的整数状态值)
    const isActive = user.status === 1 || String(user.status) === '1';
    if (!isActive) {
        throw new AppError_1.UnauthorizedError('Account is not active');
    }
    // Verify password
    const isValidPassword = await (0, crypto_1.verifyPassword)(password, user.password_hash);
    if (!isValidPassword) {
        throw new AppError_1.UnauthorizedError('Invalid credentials');
    }
    // Update last login
    await (0, database_1.default)('users')
        .where({ user_id: user.user_id })
        .update({
        last_login_at: new Date(),
        updated_at: new Date(),
    });
    // Generate tokens
    const tokens = (0, jwt_1.generateTokens)(user.user_id, user.email);
    return {
        user: formatUserInfo(user),
        tokens,
    };
};
exports.login = login;
/**
 * Logout user (add token to blacklist)
 * @param token - The access token to blacklist
 */
const logout = async (token) => {
    try {
        // 将 Token 加入黑名单
        await (0, tokenBlacklist_1.blacklistToken)(token);
        logger_1.default.info('User logged out, token blacklisted');
    }
    catch (error) {
        logger_1.default.error('Failed to blacklist token during logout:', error);
        // 即使黑名单操作失败，也允许登出
    }
};
exports.logout = logout;
/**
 * Refresh access token
 */
const refreshToken = async (refreshToken) => {
    const accessToken = (0, jwt_1.refreshAccessToken)(refreshToken);
    return { accessToken };
};
exports.refreshToken = refreshToken;
/**
 * Get current user info
 */
const getCurrentUser = async (userId) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    return formatUserInfo(user);
};
exports.getCurrentUser = getCurrentUser;
// 存储已使用的重置令牌（生产环境应使用 Redis）
const usedResetTokens = new Set();
/**
 * 生成密码重置令牌
 * @param userId - 用户ID
 * @param email - 用户邮箱
 * @returns 重置令牌
 */
const generatePasswordResetToken = (userId, email) => {
    const token = jsonwebtoken_1.default.sign({ userId, email, type: 'password_reset' }, config_1.default.jwt.secret, { expiresIn: '1h' });
    return token;
};
/**
 * 验证密码重置令牌
 * @param token - 重置令牌
 * @returns 解码后的令牌数据
 */
const verifyPasswordResetToken = (token) => {
    try {
        // 检查令牌是否已被使用
        if (usedResetTokens.has(token)) {
            throw new AppError_1.UnauthorizedError('Reset token has already been used');
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        if (decoded.type !== 'password_reset') {
            throw new AppError_1.UnauthorizedError('Invalid token type');
        }
        return { userId: decoded.userId, email: decoded.email };
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new AppError_1.UnauthorizedError('Reset token has expired');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new AppError_1.UnauthorizedError('Invalid reset token');
        }
        throw error;
    }
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
 * Forgot password - send reset email
 */
const forgotPassword = async (email) => {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // 不暴露邮箱格式错误，统一返回成功响应
        logger_1.default.warn(`Invalid email format in forgot password request: ${email}`);
        return;
    }
    const user = await (0, database_1.default)('users').where({ email }).first();
    if (!user) {
        // Don't reveal if email exists - 记录日志但不暴露给用户
        logger_1.default.info(`Password reset requested for non-existent email: ${email}`);
        return;
    }
    // 生成重置令牌
    const resetToken = generatePasswordResetToken(user.user_id, user.email);
    // 获取重置密码页面URL
    const resetUrl = process.env.CLIENT_WEB_URL
        ? `${process.env.CLIENT_WEB_URL}/reset-password`
        : 'http://localhost:5173/reset-password';
    // 发送重置邮件
    const emailSent = await emailService_1.emailService.sendPasswordResetEmail(user.email, resetToken, resetUrl);
    if (emailSent) {
        logger_1.default.info(`Password reset email sent to: ${email}`);
    }
    else {
        logger_1.default.error(`Failed to send password reset email to: ${email}`);
        // 不暴露邮件发送失败，防止枚举攻击
    }
};
exports.forgotPassword = forgotPassword;
/**
 * Reset password with token
 */
const resetPassword = async (token, newPassword) => {
    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
        throw new AppError_1.ValidationError([
            { field: 'newPassword', message: passwordValidation.message || 'Invalid password' },
        ]);
    }
    // 验证令牌
    const { userId } = verifyPasswordResetToken(token);
    // 检查用户是否存在
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    // 哈希新密码
    const newPasswordHash = await (0, crypto_1.hashPassword)(newPassword);
    // 更新密码
    await (0, database_1.default)('users').where({ user_id: userId }).update({
        password_hash: newPasswordHash,
        updated_at: new Date(),
    });
    // 使重置令牌失效
    usedResetTokens.add(token);
    // 将用户的所有现有 Token 加入黑名单（密码重置后需要重新登录）
    await (0, tokenBlacklist_1.blacklistUserTokens)(userId);
    logger_1.default.info(`Password reset successful for user: ${userId}, all existing tokens blacklisted`);
};
exports.resetPassword = resetPassword;
/**
 * Update password
 */
const updatePassword = async (userId, oldPassword, newPassword) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    // Verify old password
    const isValidPassword = await (0, crypto_1.verifyPassword)(oldPassword, user.password_hash);
    if (!isValidPassword) {
        throw new AppError_1.UnauthorizedError('Invalid old password');
    }
    // Hash new password
    const newPasswordHash = await (0, crypto_1.hashPassword)(newPassword);
    // Update password
    await (0, database_1.default)('users')
        .where({ user_id: userId })
        .update({
        password_hash: newPasswordHash,
        updated_at: new Date(),
    });
};
exports.updatePassword = updatePassword;
/**
 * Format user to UserInfo
 */
const formatUserInfo = (user) => {
    const trafficLimit = user.traffic_limit || 0;
    const trafficUsed = user.traffic_used || 0;
    const trafficRemaining = Math.max(0, trafficLimit - trafficUsed);
    const usagePercent = trafficLimit > 0 ? Math.round((trafficUsed / trafficLimit) * 100) : 0;
    let daysRemaining = 0;
    if (user.expire_date) {
        const now = new Date();
        const expireDate = new Date(user.expire_date);
        daysRemaining = Math.max(0, Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return {
        id: user.id?.toString() || user.user_id,
        userId: user.user_id,
        email: user.email,
        username: user.username,
        vpnUuid: user.vpn_uuid,
        status: user.status,
        trafficLimit,
        trafficUsed,
        trafficRemaining,
        usagePercent,
        expireDate: user.expire_date ? new Date(user.expire_date).toISOString() : null,
        daysRemaining,
        createdAt: new Date(user.created_at).toISOString(),
    };
};
//# sourceMappingURL=authService.js.map