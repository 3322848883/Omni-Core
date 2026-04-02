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
  cryptoCurrency?: string;
}

export interface PaymentInfo {
  orderId: string;
  orderNo: string;
  amount: number;
  paymentMethod: string;
  paymentUrl?: string;
  qrCode?: string;
  expiresAt: string;
  cryptoPayment?: CryptoPaymentInfo;
}

// Crypto Types
export interface CryptoWallet {
  id: string;
  walletId: string;
  userId: string;
  orderId: string | null;
  currency: string;
  address: string;
  privateKey?: string;
  expectedAmount: number;
  receivedAmount: number;
  status: string;
  expiresAt: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CryptoPayment {
  id: string;
  cryptoPaymentId: string;
  walletId: string;
  orderId: string;
  userId: string;
  transactionId?: string;
  currency: string;
  amount: number;
  fiatAmount: number;
  fiatCurrency: string;
  exchangeRate: number;
  confirmations: number;
  requiredConfirmations: number;
  status: string;
  transactionAt?: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CryptoExchangeRate {
  id: string;
  currency: string;
  fiatCurrency: string;
  rate: number;
  source: string;
  createdAt: Date;
}

export interface CryptoPaymentInfo {
  walletId: string;
  currency: string;
  address: string;
  expectedAmount: number;
  fiatAmount: number;
  fiatCurrency: string;
  exchangeRate: number;
  qrCode?: string;
  expiresAt: string;
  status: string;
}

export interface CreateCryptoPaymentRequest {
  orderId: string;
  currency: string;
}

export interface VerifyCryptoPaymentRequest {
  walletId: string;
}

