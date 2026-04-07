// User Types
import { ServiceType } from '@/constants/service-type';

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

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
  deviceName?: string;
  deviceId?: string;
}

export interface CreateOrderData {
  planId: string;
  paymentMethod: string;
  durationDays: number;
  couponCode?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  avatar?: string;
  phone?: string;
  country?: string;
  language?: string;
  telegram?: string;
  discord?: string;
  bio?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserInfo {
  id: string;
  userId: string;
  email: string;
  username: string;
  vpnUuid: string;
  status: any;
  trafficLimit: number;
  trafficUsed: number;
  trafficRemaining: number;
  usagePercent: number;
  expireDate: string | null;
  daysRemaining: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface InviteCode {
  id: string | number;
  code: string;
  status: number | string;
  usedBy?: string | null;
  usedAt?: Date | null;
  expireAt: Date | null;
  trafficReward: number;
  daysReward: number;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  maxUses?: number;
  usedCount?: number;
}

export interface InviteStats {
  total: number;
  used: number;
  remaining: number;
  totalInvites?: number;
  successfulInvites?: number;
  earnedTraffic?: number;
  earnedDays?: number;
  rewards: {
    traffic: number;
    days: number;
  };
}

export interface ValidateInviteResponse {
  valid: boolean;
  message?: string;
  rewards?: {
    traffic: number;
    days: number;
  };
  trafficReward?: number;
  daysReward?: number;
}

export interface Node {
  id: string;
  name: string;
  server: string;
  host?: string;
  port: number;
  protocol: string;
  cipher: string;
  serviceType: string;
  ipType: string;
  lineType: string;
  status: string;
  security?: string;
  network?: string;
  path?: string;
  serviceName?: string;
  flow?: string;
  encryption?: string;
  alterId?: number;
  ipScore?: number;
  ispName?: string;
  healthScore?: number;
  code?: string;
  region?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  loadPercent?: number;
  activeConnections?: number;
  maxConnections?: number;
  priority?: number;
  isBackup?: boolean;
  ipTypeLabel?: string;
  lineTypeLabel?: string;
  supportsIPv6?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeConnectionConfig {
  id: string;
  name: string;
  protocol: string;
  host: string;
  port: number;
  config: Record<string, unknown>;
  url: string;
  userId?: string;
  nodeId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConnectionTestResult {
  success: boolean;
  latency: number;
  error?: string;
  message?: string;
  timestamp: Date;
  nodeId?: string;
}

export type IpType = 'datacenter' | 'residential_dynamic' | 'residential_static';

export type LineType = 'standard' | 'cn2' | 'iepl' | 'iplc' | 'bgp' | 'premium';

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  planId: string | null;
  orderType: string;
  status: string;
  amount: number;
  trafficLimit: number | null;
  durationDays: number | null;
  startDate: Date | null;
  endDate: Date | null;
  paymentMethod: string | null;
  paymentTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInfo {
  orderId: string;
  orderNo: string;
  amount: number;
  paymentMethod: string;
  paymentUrl?: string;
  qrCode?: string;
  expiresAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  trafficLimit: number;
  features: string[];
  isPopular?: boolean;
  sortOrder?: number;
  status: string;
  serviceTypes?: ServiceType[];
  serviceTypeDetails?: Array<{
    type: ServiceType;
    label: string;
    color: string;
    icon: string;
  }>;
  groupId?: string;
  groupName?: string;
}

export interface SubscriptionInfo {
  userId: string;
  status: string;
  trafficLimit: number;
  trafficUsed: number;
  trafficRemaining: number;
  usagePercent: number;
  expireDate: string | null;
  daysRemaining: number;
  planName?: string | null;
  serviceTypes?: ServiceType[];
  effectiveServiceTypes?: ServiceType[];
  accessibleNodes?: {
    total: number;
    byType: Record<ServiceType, number>;
  };
}

export interface SubscriptionUrl {
  url: string;
  qrCode: string;
  id?: string;
  userId?: string;
  expiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TrafficStats {
  date: string;
  upload: number;
  download: number;
  total: number;
}

export interface TrafficOverview {
  today: {
    upload: number;
    download: number;
    total: number;
  };
  thisMonth: {
    upload: number;
    download: number;
    total: number;
  };
  total: {
    upload: number;
    download: number;
    total: number;
  };
}

export interface UserTrafficInfo {
  userId: string;
  trafficLimit: number;
  trafficUsed: number;
  trafficRemaining: number;
  usagePercent: number;
  dailyStats: TrafficStats[];
  period: {
    upload: number;
    download: number;
    total: number;
    days: number;
  };
}
