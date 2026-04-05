"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.changePassword = exports.updateUser = exports.getUserById = void 0;
const database_1 = __importDefault(require("@/config/database"));
const crypto_1 = require("@/utils/crypto");
const AppError_1 = require("@/errors/AppError");
/**
 * Get user by ID
 */
const getUserById = async (userId) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    return formatUserInfo(user);
};
exports.getUserById = getUserById;
/**
 * Update user information
 */
const updateUser = async (userId, data) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    // Check if email is being updated and is already taken
    if (data.email && data.email !== user.email) {
        const existingEmail = await (0, database_1.default)('users')
            .where({ email: data.email })
            .whereNot({ user_id: userId })
            .first();
        if (existingEmail) {
            throw new AppError_1.ConflictError('Email already in use');
        }
    }
    // Check if username is being updated and is already taken
    if (data.username && data.username !== user.username) {
        const existingUsername = await (0, database_1.default)('users')
            .where({ username: data.username })
            .whereNot({ user_id: userId })
            .first();
        if (existingUsername) {
            throw new AppError_1.ConflictError('Username already taken');
        }
    }
    // Build update object with only provided fields
    const updateData = {
        updated_at: new Date(),
    };
    if (data.email !== undefined) {
        updateData.email = data.email;
    }
    if (data.username !== undefined) {
        updateData.username = data.username;
    }
    // Update user
    const [updatedUser] = await (0, database_1.default)('users')
        .where({ user_id: userId })
        .update(updateData)
        .returning('*');
    return formatUserInfo(updatedUser);
};
exports.updateUser = updateUser;
/**
 * Change user password
 */
const changePassword = async (userId, oldPassword, newPassword) => {
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
exports.changePassword = changePassword;
/**
 * Upload user avatar
 */
const uploadAvatar = async (userId, file) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    // In a production environment, you would:
    // 1. Upload the file to a storage service (S3, MinIO, etc.)
    // 2. Get the URL of the uploaded file
    // 3. Update the user's avatar_url in the database
    // For now, we'll simulate this by generating a placeholder URL
    // In production, replace this with actual file upload logic
    const avatarUrl = `/uploads/avatars/${userId}_${Date.now()}.png`;
    // Update user's avatar URL in database
    await (0, database_1.default)('users')
        .where({ user_id: userId })
        .update({
        avatar_url: avatarUrl,
        updated_at: new Date(),
    });
    return { avatarUrl };
};
exports.uploadAvatar = uploadAvatar;
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
        id: user.id.toString(),
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
//# sourceMappingURL=userService.js.map