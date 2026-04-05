import { UserInfo, UpdateUserData } from '@/types/user';
/**
 * Get user by ID
 */
export declare const getUserById: (userId: string) => Promise<UserInfo>;
/**
 * Update user information
 */
export declare const updateUser: (userId: string, data: UpdateUserData) => Promise<UserInfo>;
/**
 * Change user password
 */
export declare const changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<void>;
/**
 * Upload user avatar
 */
export declare const uploadAvatar: (userId: string, file: Buffer) => Promise<{
    avatarUrl: string;
}>;
//# sourceMappingURL=userService.d.ts.map