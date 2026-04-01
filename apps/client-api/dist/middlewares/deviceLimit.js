"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceLimit = void 0;
exports.cleanupInactiveDevices = cleanupInactiveDevices;
exports.getUserDevices = getUserDevices;
exports.logoutDevice = logoutDevice;
exports.logoutOtherDevices = logoutOtherDevices;
const database_1 = __importDefault(require("@/config/database"));
const AppError_1 = require("@/errors/AppError");
const config_1 = __importDefault(require("@/config"));
const logger_1 = __importDefault(require("@/utils/logger"));
// 内存中存储活跃设备（生产环境应使用 Redis）
const activeDevices = new Map();
/**
 * 获取用户的活跃设备数
 * @param userId - 用户ID
 * @returns 活跃设备数
 */
async function getUserDeviceCount(userId) {
    // 从数据库获取活跃设备数
    const devices = await (0, database_1.default)('user_devices')
        .where({ user_id: userId, is_active: true })
        .where('last_active_at', '>', database_1.default.raw('datetime("now", "-7 days")'))
        .count('id as count')
        .first();
    return parseInt(devices?.count, 10) || 0;
}
/**
 * 记录用户设备
 * @param userId - 用户ID
 * @param deviceId - 设备ID（从请求头或生成）
 * @param ip - IP地址
 */
async function recordDevice(userId, deviceId, ip) {
    const now = new Date();
    // 检查设备是否已存在
    const existingDevice = await (0, database_1.default)('user_devices')
        .where({ user_id: userId, device_id: deviceId })
        .first();
    if (existingDevice) {
        // 更新最后活跃时间
        await (0, database_1.default)('user_devices')
            .where({ id: existingDevice.id })
            .update({
            last_active_at: now,
            ip_address: ip,
            is_active: true,
        });
    }
    else {
        // 创建新设备记录
        await (0, database_1.default)('user_devices').insert({
            user_id: userId,
            device_id: deviceId,
            ip_address: ip,
            user_agent: '', // 可以从请求头获取
            last_active_at: now,
            is_active: true,
        });
    }
}
/**
 * 设备并发限制中间件
 * 限制每个用户最多只能同时在 maxDevices 台设备上登录
 */
const deviceLimit = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AppError_1.UnauthorizedError('Authentication required');
        }
        const userId = user.user_id;
        const maxDevices = config_1.default.security.maxDevices;
        // 从请求头获取设备ID，如果没有则使用IP作为临时标识
        const deviceId = req.headers['x-device-id'] || req.ip || 'unknown';
        const ip = req.ip || 'unknown';
        // 获取当前活跃设备数
        const deviceCount = await getUserDeviceCount(userId);
        // 检查当前设备是否已经在活跃列表中
        const existingDevice = await (0, database_1.default)('user_devices')
            .where({ user_id: userId, device_id: deviceId, is_active: true })
            .first();
        if (!existingDevice && deviceCount >= maxDevices) {
            throw new AppError_1.ForbiddenError(`Device limit exceeded. Maximum ${maxDevices} devices allowed. Please log out from another device.`);
        }
        // 记录设备活跃
        await recordDevice(userId, deviceId, ip);
        // 将设备ID附加到请求对象
        req.deviceId = deviceId;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.deviceLimit = deviceLimit;
/**
 * 清理不活跃设备
 * 删除超过7天未活跃的设备记录
 */
async function cleanupInactiveDevices() {
    try {
        const result = await (0, database_1.default)('user_devices')
            .where('last_active_at', '<', database_1.default.raw('datetime("now", "-7 days")'))
            .where('is_active', true)
            .update({ is_active: false });
        logger_1.default.info(`Cleaned up ${result} inactive devices`);
    }
    catch (error) {
        logger_1.default.error('Failed to cleanup inactive devices:', error);
    }
}
/**
 * 获取用户设备列表
 * @param userId - 用户ID
 * @returns 设备列表
 */
async function getUserDevices(userId) {
    return (0, database_1.default)('user_devices')
        .where({ user_id: userId })
        .orderBy('last_active_at', 'desc')
        .select('id', 'device_id', 'ip_address', 'last_active_at', 'is_active');
}
/**
 * 注销指定设备
 * @param userId - 用户ID
 * @param deviceId - 设备ID
 */
async function logoutDevice(userId, deviceId) {
    await (0, database_1.default)('user_devices')
        .where({ user_id: userId, device_id: deviceId })
        .update({ is_active: false });
}
/**
 * 注销所有其他设备
 * @param userId - 用户ID
 * @param currentDeviceId - 当前设备ID（保留）
 */
async function logoutOtherDevices(userId, currentDeviceId) {
    await (0, database_1.default)('user_devices')
        .where({ user_id: userId })
        .whereNot('device_id', currentDeviceId)
        .update({ is_active: false });
}
//# sourceMappingURL=deviceLimit.js.map