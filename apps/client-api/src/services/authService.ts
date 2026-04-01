import db from '@/config/database';
import { hashPassword, verifyPassword, generateVpnUuid, generateUserId } from '@/utils/crypto';
import { generateTokens, refreshAccessToken as refreshTokenUtil } from '@/utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from '@/errors/AppError';
import { ERROR_CODES, USER_STATUS } from '@/constants';
import { RegisterData, LoginData, User, UserInfo, AuthTokens } from '@/types/user';
import { emailService } from './emailService';
import { blacklistToken, isBlacklisted, blacklistUserTokens } from './tokenBlacklist';
import jwt from 'jsonwebtoken';
import config from '@/config';
import logger from '@/utils/logger';

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<{ user: UserInfo; tokens: AuthTokens }> => {
  const { email, password, username, inviteCode } = data;

  // Check if email already exists
  const existingUser = await db('users').where({ email }).first();
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Check if username already exists
  const existingUsername = await db('users').where({ username }).first();
  if (existingUsername) {
    throw new ConflictError('Username already taken');
  }

  // Validate invite code if provided
  if (inviteCode) {
    const validInvite = await db('invite_codes')
      .where({ code: inviteCode, status: 1 }) // USER_STATUS.ACTIVE = 1
      .whereNull('used_by')
      .where('expire_at', '>', new Date())
      .first();

    if (!validInvite) {
      throw new ValidationError([{ field: 'inviteCode', message: 'Invalid or expired invite code' }]);
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate user ID and VPN UUID
  const userId = generateUserId();
  const vpnUuid = generateVpnUuid();

  // Create user (MySQL compatible - no returning)
  await db('users').insert({
    user_id: userId,
    email,
    username,
    password_hash: passwordHash,
    vpn_uuid: vpnUuid,
    status: USER_STATUS.ACTIVE,
    traffic_limit: 0,
    traffic_used: 0,
    expire_date: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Fetch the created user
  const user = await db('users').where({ user_id: userId }).first();

  // Update invite code if used
  if (inviteCode) {
    await db('invite_codes')
      .where({ code: inviteCode })
      .update({
        used_by: userId,
        used_at: new Date(),
        status: 2, // Used status
      });

    // Get invite rewards
    const inviteCodeRecord = await db('invite_codes').where({ code: inviteCode }).first();
    if (inviteCodeRecord) {
      // Add traffic reward
      if (inviteCodeRecord.traffic_reward > 0) {
        await db('users')
          .where({ user_id: userId })
          .increment('traffic_limit', inviteCodeRecord.traffic_reward);
      }

      // Add days reward
      if (inviteCodeRecord.days_reward > 0) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + inviteCodeRecord.days_reward);
        await db('users')
          .where({ user_id: userId })
          .update({ expire_date: expireDate });
      }
    }
  }

  // Generate tokens
  const tokens = generateTokens(user.user_id, user.email);

  return {
    user: formatUserInfo(user),
    tokens,
  };
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<{ user: UserInfo; tokens: AuthTokens }> => {
  const { email, password } = data;

  // Find user by email
  const user = await db('users').where({ email }).first();
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if user is active (兼容 Admin API 的整数状态值)
  const isActive = user.status === 1 || String(user.status) === '1';
  if (!isActive) {
    throw new UnauthorizedError('Account is not active');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Update last login
  await db('users')
    .where({ user_id: user.user_id })
    .update({
      last_login_at: new Date(),
      updated_at: new Date(),
    });

  // Generate tokens
  const tokens = generateTokens(user.user_id, user.email);

  return {
    user: formatUserInfo(user),
    tokens,
  };
};

/**
 * Logout user (add token to blacklist)
 * @param token - The access token to blacklist
 */
export const logout = async (token: string): Promise<void> => {
  try {
    // 将 Token 加入黑名单
    await blacklistToken(token);
    logger.info('User logged out, token blacklisted');
  } catch (error) {
    logger.error('Failed to blacklist token during logout:', error);
    // 即使黑名单操作失败，也允许登出
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  const accessToken = refreshTokenUtil(refreshToken);
  return { accessToken };
};

/**
 * Get current user info
 */
export const getCurrentUser = async (userId: string): Promise<UserInfo> => {
  const user = await db('users').where({ user_id: userId }).first();
  if (!user) {
    throw new NotFoundError('User', userId);
  }

  return formatUserInfo(user);
};

// 存储已使用的重置令牌（生产环境应使用 Redis）
const usedResetTokens = new Set<string>();

/**
 * 生成密码重置令牌
 * @param userId - 用户ID
 * @param email - 用户邮箱
 * @returns 重置令牌
 */
const generatePasswordResetToken = (userId: string, email: string): string => {
  const token = jwt.sign(
    { userId, email, type: 'password_reset' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
  return token;
};

/**
 * 验证密码重置令牌
 * @param token - 重置令牌
 * @returns 解码后的令牌数据
 */
const verifyPasswordResetToken = (token: string): { userId: string; email: string } => {
  try {
    // 检查令牌是否已被使用
    if (usedResetTokens.has(token)) {
      throw new UnauthorizedError('Reset token has already been used');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      type: string;
    };

    if (decoded.type !== 'password_reset') {
      throw new UnauthorizedError('Invalid token type');
    }

    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Reset token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid reset token');
    }
    throw error;
  }
};

/**
 * 验证密码强度
 * @param password - 密码
 * @returns 验证结果
 */
const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
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
export const forgotPassword = async (email: string): Promise<void> => {
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    // 不暴露邮箱格式错误，统一返回成功响应
    logger.warn(`Invalid email format in forgot password request: ${email}`);
    return;
  }

  const user = await db('users').where({ email }).first();

  if (!user) {
    // Don't reveal if email exists - 记录日志但不暴露给用户
    logger.info(`Password reset requested for non-existent email: ${email}`);
    return;
  }

  // 生成重置令牌
  const resetToken = generatePasswordResetToken(user.user_id, user.email);

  // 获取重置密码页面URL
  const resetUrl = process.env.CLIENT_WEB_URL
    ? `${process.env.CLIENT_WEB_URL}/reset-password`
    : 'http://localhost:5173/reset-password';

  // 发送重置邮件
  const emailSent = await emailService.sendPasswordResetEmail(
    user.email,
    resetToken,
    resetUrl
  );

  if (emailSent) {
    logger.info(`Password reset email sent to: ${email}`);
  } else {
    logger.error(`Failed to send password reset email to: ${email}`);
    // 不暴露邮件发送失败，防止枚举攻击
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  // 验证新密码强度
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new ValidationError([
      { field: 'newPassword', message: passwordValidation.message || 'Invalid password' },
    ]);
  }

  // 验证令牌
  const { userId } = verifyPasswordResetToken(token);

  // 检查用户是否存在
  const user = await db('users').where({ user_id: userId }).first();
  if (!user) {
    throw new NotFoundError('User', userId);
  }

  // 哈希新密码
  const newPasswordHash = await hashPassword(newPassword);

  // 更新密码
  await db('users').where({ user_id: userId }).update({
    password_hash: newPasswordHash,
    updated_at: new Date(),
  });

  // 使重置令牌失效
  usedResetTokens.add(token);

  // 将用户的所有现有 Token 加入黑名单（密码重置后需要重新登录）
  await blacklistUserTokens(userId);

  logger.info(`Password reset successful for user: ${userId}, all existing tokens blacklisted`);
};

/**
 * Update password
 */
export const updatePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await db('users').where({ user_id: userId }).first();
  if (!user) {
    throw new NotFoundError('User', userId);
  }

  // Verify old password
  const isValidPassword = await verifyPassword(oldPassword, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid old password');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await db('users')
    .where({ user_id: userId })
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date(),
    });
};

/**
 * Format user to UserInfo
 */
const formatUserInfo = (user: User): UserInfo => {
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
