// User API
import request from '@/utils/request';
import type { User, UpdateUserData, ChangePasswordData } from '@/types/user';

/**
 * Get current user info
 * @returns User info
 */
export async function getCurrentUser(): Promise<User> {
  // request.get already unwraps the response, returns data directly
  return await request.get<User>('/users/me');
}

/**
 * Update user info
 * @param data Update data
 * @returns Updated user info
 */
export function updateUser(data: UpdateUserData): Promise<User> {
  return request.patch('/users/me', data);
}

/**
 * Change password
 * @param data Password data
 */
export async function changePassword(data: ChangePasswordData): Promise<void> {
  await request.post('/users/me/change-password', data);
}

/**
 * Upload avatar
 * @param file Avatar file
 * @returns Avatar URL
 */
export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      request.post('/users/me/avatar', { avatar: base64 })
        .then(resolve)
        .catch(reject);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Verify two-factor authentication code
 * @param code 6-digit verification code
 */
export async function verifyTwoFactor(code: string): Promise<void> {
  await request.post('/users/me/2fa/verify', { code });
}

/**
 * Disable two-factor authentication
 */
export function disableTwoFactor(): Promise<void> {
  return request.post('/users/me/2fa/disable');
}

/**
 * Delete user account
 * @param confirmation Confirmation string
 */
export async function deleteAccount(confirmation: string): Promise<void> {
  await request.post('/users/me/delete', { confirmation });
}
