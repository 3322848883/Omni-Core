// User API
import request from '@/utils/request';
import type { User, UpdateUserData, ChangePasswordData } from '@/types/user';

/**
 * Get current user info
 * @returns User info
 */
export const getCurrentUser = (): Promise<User> => {
  return request.get('/users/me');
};

/**
 * Update user info
 * @param data Update data
 * @returns Updated user info
 */
export const updateUser = (data: UpdateUserData): Promise<User> => {
  return request.patch('/users/me', data);
};

/**
 * Change password
 * @param data Password data
 */
export const changePassword = (data: ChangePasswordData): Promise<void> => {
  return request.post('/users/me/change-password', data);
};

/**
 * Upload avatar
 * @param file Avatar file
 * @returns Avatar URL
 */
export const uploadAvatar = (
  file: File
): Promise<{ avatar_url: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);

  return request.post('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Verify two-factor authentication code
 * @param code 6-digit verification code
 */
export const verifyTwoFactor = (code: string): Promise<void> => {
  return request.post('/users/me/2fa/verify', { code });
};

/**
 * Disable two-factor authentication
 */
export const disableTwoFactor = (): Promise<void> => {
  return request.post('/users/me/2fa/disable');
};

/**
 * Delete user account
 * @param confirmation Confirmation string
 */
export const deleteAccount = (confirmation: string): Promise<void> => {
  return request.post('/users/me/delete', { confirmation });
};
