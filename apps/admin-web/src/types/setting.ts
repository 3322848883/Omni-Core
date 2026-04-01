export interface SystemSettings {
  // General Settings
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  siteFavicon: string;
  contactEmail: string;
  supportUrl: string;

  // Registration Settings
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  defaultTrafficLimit: number;
  defaultExpireDays: number;

  // Payment Settings
  currency: string;
  paymentMethods: string[];

  // Security Settings
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  passwordMinLength: number;
  requireStrongPassword: boolean;

  // Traffic Settings
  trafficResetDay: number; // day of month
  trafficAlertThreshold: number; // percentage

  // Email Settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  emailFrom: string;

  // Other Settings
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowInvite: boolean;
  inviteRewardDays: number;
  inviteRewardTraffic: number;
}

export interface SettingsGroup {
  key: string;
  label: string;
  icon: string;
  settings: SettingItem[];
}

export interface SettingItem {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'array';
  value: unknown;
  options?: { label: string; value: unknown }[];
  description?: string;
  placeholder?: string;
}
