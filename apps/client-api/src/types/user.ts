// User Types

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'inactive' | 'banned';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  language?: string;
  telegram?: string;
  discord?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  telegramNotifications: boolean;
  marketingEmails: boolean;
  autoRenewal: boolean;
  defaultPaymentMethod?: string;
  theme: 'light' | 'dark' | 'auto';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  trafficLimit: number;
  trafficUsed: number;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTraffic {
  id: string;
  userId: string;
  date: Date;
  upload: number;
  download: number;
  total: number;
  nodeId?: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  location?: string;
  success: boolean;
  failureReason?: string;
  createdAt: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  password?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'inactive' | 'banned';
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface UserWithProfile extends User {
  profile?: UserProfile;
  settings?: UserSettings;
  subscription?: UserSubscription;
}
