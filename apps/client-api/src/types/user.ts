// User Types

export interface User {
  id: number;
  user_id: string;
  email: string;
  username: string;
  password_hash: string;
  vpn_uuid: string;
  status: number | string;
  traffic_limit: number;
  traffic_used: number;
  expire_date: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  created_at: Date;
  updated_at: Date;
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

export interface TrafficStats {
  date: string;
  upload: number;
  download: number;
  total: number;
}

export interface TrafficOverview {
  today: { upload: number; download: number; total: number };
  week: { upload: number; download: number; total: number };
  month: { upload: number; download: number; total: number };
  total: { upload: number; download: number; total: number };
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

export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'inactive' | 'banned';
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
  agreeTerms: boolean;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  traffic_limit: number;
  traffic_used: number;
  expire_date: Date | null;
  vpn_uuid: string;
  created_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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

// Node Types
export interface Node {
  id: string;
  name: string;
  host: string;
  port: number;
  serviceType: string;
  status: string;
  load?: number;
  uptime?: number;
  location?: string;
  country?: string;
  city?: string;
  ipType?: string;
  lineType?: string;
}

export interface NodeConnectionConfig {
  protocol: string;
  host: string;
  port: number;
  uuid?: string;
  alterId?: number;
  security?: string;
  network?: string;
  path?: string;
  host_header?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  latency?: number;
  error?: string;
}

// Order Types
export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paymentId?: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface CreateOrderData {
  planId: string;
  paymentMethod: string;
  couponCode?: string;
}

export interface PaymentInfo {
  paymentUrl?: string;
  qrCode?: string;
  paymentId: string;
}

// Subscription Plan Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  trafficLimit: number;
  serviceTypes: string[];
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionInfo {
  id: string;
  planId: string;
  planName: string;
  status: string;
  startDate: Date;
  endDate: Date;
  trafficLimit: number;
  trafficUsed: number;
  trafficRemaining: number;
  autoRenew: boolean;
}

export interface SubscriptionUrl {
  url: string;
  qrCode?: string;
  expiresAt?: Date;
}

// Invite Types
export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  usedBy?: string;
  status: 'active' | 'used' | 'expired';
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

export interface InviteStats {
  totalCodes: number;
  usedCodes: number;
  activeCodes: number;
  totalRewards: number;
}

export interface ValidateInviteResponse {
  valid: boolean;
  code?: string;
  message?: string;
}
