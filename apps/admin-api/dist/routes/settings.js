"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middlewares/auth");
const constants_1 = require("@shared/constants");
const router = (0, express_1.Router)();
exports.settingsRoutes = router;
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
router.get('/', auth_1.authMiddleware, (req, res) => {
    try {
        (0, response_1.sendSuccess)(res, currentSettings, '获取设置成功');
    }
    catch (error) {
        (0, response_1.sendError)(res, '获取设置失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
/**
 * PUT /admin/settings - Update settings
 */
router.put('/', auth_1.authMiddleware, (req, res) => {
    try {
        const updates = req.body;
        currentSettings = { ...currentSettings, ...updates };
        (0, response_1.sendSuccess)(res, currentSettings, '设置更新成功');
    }
    catch (error) {
        (0, response_1.sendError)(res, '更新设置失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
/**
 * POST /admin/settings/reset - Reset settings to defaults
 */
router.post('/reset', auth_1.authMiddleware, (req, res) => {
    try {
        currentSettings = { ...defaultSettings };
        (0, response_1.sendSuccess)(res, currentSettings, '设置已重置为默认值');
    }
    catch (error) {
        (0, response_1.sendError)(res, '重置设置失败', constants_1.ErrorCode.INTERNAL_ERROR, constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
//# sourceMappingURL=settings.js.map