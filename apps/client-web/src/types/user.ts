// User Types

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: 'user' | 'vip' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  inviteCode?: string;
  agreeTerms: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: User;
}

export interface UserSettings {
  emailNotifications: boolean;
  trafficAlert: boolean;
  alertThreshold: number;
  loginAlert: boolean;
  language: string;
}

export interface UpdateUserData {
  username?: string;
  avatar?: string;
  settings?: Partial<UserSettings>;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
