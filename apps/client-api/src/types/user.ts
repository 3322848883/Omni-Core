// User Types

export interface User {
  id: number;
  user_id: string;
  email: string;
  username: string;
  password_hash: string;
  vpn_uuid: string;
  status: string;
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
  id: number;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserTraffic {
  user_id: string;
  traffic_limit: number;
  traffic_used: number;
  reset_date: Date;
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

// Auth Types
export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  inviteCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Order Types
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

export interface CreateOrderData {
  planId: string;
  paymentMethod?: string;
  qrCodeId?: string;
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

// Payment QR Code Types
export interface PaymentQrCode {
  id: string;
  name: string;
  type: 'alipay' | 'wechat';
  accountName: string;
  accountNumber?: string;
  qrCodeImageUrl: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Proof Types
export interface PaymentProof {
  id: string;
  orderId: string;
  userId: string;
  qrCodeId: string;
  amount: number;
  payerName?: string;
  payerAccount?: string;
  transactionId?: string;
  proofImageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  remark?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentProofData {
  orderId: string;
  qrCodeId: string;
  amount: number;
  payerName?: string;
  payerAccount?: string;
  transactionId?: string;
  proofImageUrl: string;
}

// Subscription Types
export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  trafficLimit: number;
  features: string[];
  isPopular: boolean;
  sortOrder: number;
  status: number;
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
  planName: string | null;
}

export interface SubscriptionUrl {
  url: string;
  qrCode: string;
}

// Additional types for users
export interface UserInfo {
  id: string;
  userId: string;
  email: string;
  username: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  language?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Invite Code types
export interface InviteCode {
  id: string;
  code: string;
  userId: string;
  status: number;
  usedBy?: string;
  usedAt?: Date;
  expireAt?: Date;
  createdAt: Date;
}

export interface InviteStats {
  totalCodes: number;
  usedCodes: number;
  activeCodes: number;
  expiredCodes: number;
}

export interface ValidateInviteResponse {
  valid: boolean;
  message?: string;
  inviteCode?: InviteCode;
}

// Traffic types
export interface TrafficStats {
  date: string;
  upload: number;
  download: number;
  total: number;
}

export interface TrafficOverview {
  totalUsed: number;
  totalLimit: number;
  remaining: number;
  usagePercent: number;
}

export interface UserTrafficInfo {
  userId: string;
  trafficLimit: number;
  trafficUsed: number;
  trafficRemaining: number;
  usagePercent: number;
  resetDate?: Date;
}

// Node types
export interface Node {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  status: string;
  region?: string;
  ipType?: string;
  lineType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  security: string;
  network: string;
  settings: Record<string, unknown>;
}

export interface ConnectionTestResult {
  success: boolean;
  latency?: number;
  error?: string;
}

export interface IpType {
  id: string;
  name: string;
  description?: string;
}

export interface LineType {
  id: string;
  name: string;
  description?: string;
}
