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
export async function login(data: LoginRequest): Promise<AuthResponse> {
  // request.post already unwraps the response, returns data directly
  return await request.post<AuthResponse>('/auth/login', data);
}

// Register
export function register(data: RegisterRequest) {
  return request.post<AuthResponse>('/auth/register', data);
}

// Logout
export async function logout(): Promise<void> {
  await request.post('/auth/logout');
}

// Get current user info
export async function getCurrentUser(): Promise<UserInfo> {
  return await request.get<UserInfo>('/auth/me');
}

// Forgot password (alias for resetPassword)
export function forgotPassword(email: string) {
  return request.post('/auth/forgot-password', { email });
}

// Reset password
export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  await request.post('/auth/reset-password', data);
}

// Update password
export function updatePassword(data: UpdatePasswordRequest) {
  return request.put('/auth/password', data);
}

// Refresh token
export async function refreshToken(): Promise<{ token: string }> {
  return await request.post<{ token: string }>('/auth/refresh');
}
