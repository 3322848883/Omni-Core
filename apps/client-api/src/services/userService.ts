import db from '@/config/database';
import { hashPassword, verifyPassword } from '@/utils/crypto';
import { NotFoundError, UnauthorizedError, ConflictError } from '@/errors/AppError';
import { User, UserInfo, UpdateUserData } from '@/types/user';

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<UserInfo> => {
  const user = await db('users').where({ user_id: userId }).first();

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  return formatUserInfo(user);
};

/**
 * Update user information
 */
export const updateUser = async (
  userId: string,
  data: UpdateUserData
): Promise<UserInfo> => {
  const user = await db('users').where({ user_id: userId }).first();

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  // Check if email is being updated and is already taken
  if (data.email && data.email !== user.email) {
    const existingEmail = await db('users')
      .where({ email: data.email })
      .whereNot({ user_id: userId })
      .first();

    if (existingEmail) {
      throw new ConflictError('Email already in use');
    }
  }

  // Check if username is being updated and is already taken
  if (data.username && data.username !== user.username) {
    const existingUsername = await db('users')
      .where({ username: data.username })
      .whereNot({ user_id: userId })
      .first();

    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (data.email !== undefined) {
    updateData.email = data.email;
  }

  if (data.username !== undefined) {
    updateData.username = data.username;
  }

  // Update user
  const [updatedUser] = await db('users')
    .where({ user_id: userId })
    .update(updateData)
    .returning('*');

  return formatUserInfo(updatedUser);
};

/**
 * Change user password
 */
export const changePassword = async (
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
 * Upload user avatar
 */
export const uploadAvatar = async (
  userId: string,
  file: Buffer
): Promise<{ avatarUrl: string }> => {
  const user = await db('users').where({ user_id: userId }).first();

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  // In a production environment, you would:
  // 1. Upload the file to a storage service (S3, MinIO, etc.)
  // 2. Get the URL of the uploaded file
  // 3. Update the user's avatar_url in the database

  // For now, we'll simulate this by generating a placeholder URL
  // In production, replace this with actual file upload logic
  const avatarUrl = `/uploads/avatars/${userId}_${Date.now()}.png`;

  // Update user's avatar URL in database
  await db('users')
    .where({ user_id: userId })
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date(),
    });

  return { avatarUrl };
};

/**
 * Format user to UserInfo
 */
const formatUserInfo = (user: any): UserInfo => {
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
