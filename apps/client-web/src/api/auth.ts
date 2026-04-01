// Axios Request Configuration
import request from '@/utils/request';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  inviteCode?: string;
  agreeTerms: boolean;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UserInfo {
  id: string;
  userId: string;
  email: string;
  username: string;
  vpnUuid: string;
  status: number;
  trafficLimit: number;
  trafficUsed: number;
  expireDate: string | null;
  createdAt: string;
  balance?: number;
  inviteCount?: number;
  planName?: string;
  avatar?: string;
}

export interface AuthResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: UserInfo;
}

// Login
export function login(data: LoginRequest) {
  return request.post<AuthResponse>('/auth/login', data);
}

// Register
export function register(data: RegisterRequest) {
  return request.post<AuthResponse>('/auth/register', data);
}

// Logout
export function logout() {
  return request.post('/auth/logout');
}

// Get current user info
export function getCurrentUser() {
  return request.get<UserInfo>('/auth/me');
}

// Forgot password (alias for resetPassword)
export function forgotPassword(email: string) {
  return request.post('/auth/forgot-password', { email });
}

// Reset password
export function resetPassword(data: ResetPasswordRequest) {
  return request.post('/auth/reset-password', data);
}

// Update password
export function updatePassword(data: UpdatePasswordRequest) {
  return request.put('/auth/password', data);
}

// Refresh token
export function refreshToken() {
  return request.post<{ token: string }>('/auth/refresh');
}
