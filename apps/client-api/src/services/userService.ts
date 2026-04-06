import db from '@/config/database';
import { hashPassword, verifyPassword } from '@/utils/crypto';
import { NotFoundError, UnauthorizedError, ConflictError } from '@/errors/AppError';
import { User, UserInfo, UpdateUserData } from '@/types/user';
import {
  saveBase64Image,
  deleteFile,
  generateSecureFilename,
  isValidBase64Image,
  getImageExtension,
} from '@/utils/file';

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
  avatarData: string
): Promise<{ avatarUrl: string }> => {
  const user = await db('users').where({ user_id: userId }).first();

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  // Validate base64 image data
  if (!avatarData || typeof avatarData !== 'string') {
    throw new Error('Invalid avatar data: must be a base64 encoded image string');
  }

  if (!isValidBase64Image(avatarData)) {
    throw new Error('Invalid avatar image: must be a valid base64 encoded image (JPEG, PNG, GIF, WebP) under 5MB');
  }

  // Delete old avatar if exists
  if (user.avatar_url) {
    deleteFile(user.avatar_url);
  }

  // Generate secure filename
  const extension = getImageExtension(avatarData.match(/data:image\/(\w+);base64,/)?.[1] || 'png');
  const filename = generateSecureFilename(userId, extension);

  // Save the image file
  const avatarUrl = await saveBase64Image(avatarData, filename, 'avatars');

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
const formatUserInfo = (user: User): UserInfo => {
  return {
    id: user.id.toString(),
    userId: user.user_id,
    email: user.email,
    username: user.username || null,
    role: 'user',
    status: user.status,
    emailVerified: true,
    twoFactorEnabled: false,
    lastLoginAt: user.last_login_at || undefined,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  };
};
