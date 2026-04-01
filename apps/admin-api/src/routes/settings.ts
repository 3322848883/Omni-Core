import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { authMiddleware } from '../middlewares/auth';
import { ErrorCode, HttpStatus } from '../shared/constants';

const router = Router();

// Default settings
const defaultSettings = {
  // General
  siteName: 'FGVPN',
  siteDescription: '高速稳定的VPN服务',
  siteLogo: '',
  siteFavicon: '',
  contactEmail: '',
  supportUrl: '',
  // Registration
  registrationEnabled: true,
  emailVerificationRequired: true,
  defaultTrafficLimit: 107374182400, // 100GB in bytes
  defaultExpireDays: 30,
  // Payment
  currency: 'CNY',
  paymentMethods: ['alipay', 'wechat'],
  // Security
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  passwordMinLength: 8,
  requireStrongPassword: true,
  // Traffic
  trafficResetDay: 1,
  trafficAlertThreshold: 85,
  // Email
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: true,
  emailFrom: '',
  // Other
  maintenanceMode: false,
  maintenanceMessage: '系统维护中，请稍后再试',
  allowInvite: true,
  inviteRewardDays: 30,
  inviteRewardTraffic: 107374182400, // 100GB in bytes
};

// In-memory settings storage (replace with database in production)
let currentSettings = { ...defaultSettings };

/**
 * GET /admin/settings - Get all settings
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    sendSuccess(res, currentSettings, '获取设置成功');
  } catch (error) {
    sendError(res, '获取设置失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * PUT /admin/settings - Update settings
 */
router.put('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const updates = req.body;
    currentSettings = { ...currentSettings, ...updates };
    sendSuccess(res, currentSettings, '设置更新成功');
  } catch (error) {
    sendError(res, '更新设置失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

/**
 * POST /admin/settings/reset - Reset settings to defaults
 */
router.post('/reset', authMiddleware, (req: Request, res: Response) => {
  try {
    currentSettings = { ...defaultSettings };
    sendSuccess(res, currentSettings, '设置已重置为默认值');
  } catch (error) {
    sendError(res, '重置设置失败', ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_ERROR);
  }
});

export { router as settingsRoutes };
