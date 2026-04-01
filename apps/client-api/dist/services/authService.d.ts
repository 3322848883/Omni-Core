import { RegisterData, LoginData, UserInfo, AuthTokens } from '@/types/user';
/**
 * Register a new user
 */
export declare const register: (data: RegisterData) => Promise<{
    user: UserInfo;
    tokens: AuthTokens;
}>;
/**
 * Login user
 */
export declare const login: (data: LoginData) => Promise<{
    user: UserInfo;
    tokens: AuthTokens;
}>;
/**
 * Logout user (add token to blacklist)
 * @param token - The access token to blacklist
 */
export declare const logout: (token: string) => Promise<void>;
/**
 * Refresh access token
 */
export declare const refreshToken: (refreshToken: string) => Promise<{
    accessToken: string;
}>;
/**
 * Get current user info
 */
export declare const getCurrentUser: (userId: string) => Promise<UserInfo>;
/**
 * Forgot password - send reset email
 */
export declare const forgotPassword: (email: string) => Promise<void>;
/**
 * Reset password with token
 */
export declare const resetPassword: (token: string, newPassword: string) => Promise<void>;
/**
 * Update password
 */
export declare const updatePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<void>;
//# sourceMappingURL=authService.d.ts.map