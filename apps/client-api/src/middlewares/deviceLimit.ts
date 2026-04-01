import { Request, Response, NextFunction } from 'express';
import db from '@/config/database';
import { UnauthorizedError, ForbiddenError } from '@/errors/AppError';
import config from '@/config';
import logger from '@/utils/logger';

// 内存中存储活跃设备（生产环境应使用 Redis）
const activeDevices = new Map<string, Map<string, { ip: string; lastActive: Date }>>();

/**
 * 获取用户的活跃设备数
 * @param userId - 用户ID
 * @returns 活跃设备数
 */
async function getUserDeviceCount(userId: string): Promise<number> {
  // 从数据库获取活跃设备数
  const devices = await db('user_devices')
    .where({ user_id: userId, is_active: true })
    .where('last_active_at', '>', db.raw('datetime("now", "-7 days")'))
    .count('id as count')
    .first();

  return parseInt(devices?.count as string, 10) || 0;
}

/**
 * 记录用户设备
 * @param userId - 用户ID
 * @param deviceId - 设备ID（从请求头或生成）
 * @param ip - IP地址
 */
async function recordDevice(userId: string, deviceId: string, ip: string): Promise<void> {
  const now = new Date();

  // 检查设备是否已存在
  const existingDevice = await db('user_devices')
    .where({ user_id: userId, device_id: deviceId })
    .first();

  if (existingDevice) {
    // 更新最后活跃时间
    await db('user_devices')
      .where({ id: existingDevice.id })
      .update({
        last_active_at: now,
        ip_address: ip,
        is_active: true,
      });
  } else {
    // 创建新设备记录
    await db('user_devices').insert({
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
export const deviceLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userId = user.user_id;
    const maxDevices = config.security.maxDevices;

    // 从请求头获取设备ID，如果没有则使用IP作为临时标识
    const deviceId = req.headers['x-device-id'] as string || req.ip || 'unknown';
    const ip = req.ip || 'unknown';

    // 获取当前活跃设备数
    const deviceCount = await getUserDeviceCount(userId);

    // 检查当前设备是否已经在活跃列表中
    const existingDevice = await db('user_devices')
      .where({ user_id: userId, device_id: deviceId, is_active: true })
      .first();

    if (!existingDevice && deviceCount >= maxDevices) {
      throw new ForbiddenError(
        `Device limit exceeded. Maximum ${maxDevices} devices allowed. Please log out from another device.`
      );
    }

    // 记录设备活跃
    await recordDevice(userId, deviceId, ip);

    // 将设备ID附加到请求对象
    (req as any).deviceId = deviceId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 清理不活跃设备
 * 删除超过7天未活跃的设备记录
 */
export async function cleanupInactiveDevices(): Promise<void> {
  try {
    const result = await db('user_devices')
      .where('last_active_at', '<', db.raw('datetime("now", "-7 days")'))
      .where('is_active', true)
      .update({ is_active: false });

    logger.info(`Cleaned up ${result} inactive devices`);
  } catch (error) {
    logger.error('Failed to cleanup inactive devices:', error);
  }
}

/**
 * 获取用户设备列表
 * @param userId - 用户ID
 * @returns 设备列表
 */
export async function getUserDevices(userId: string) {
  return db('user_devices')
    .where({ user_id: userId })
    .orderBy('last_active_at', 'desc')
    .select('id', 'device_id', 'ip_address', 'last_active_at', 'is_active');
}

/**
 * 注销指定设备
 * @param userId - 用户ID
 * @param deviceId - 设备ID
 */
export async function logoutDevice(userId: string, deviceId: string): Promise<void> {
  await db('user_devices')
    .where({ user_id: userId, device_id: deviceId })
    .update({ is_active: false });
}

/**
 * 注销所有其他设备
 * @param userId - 用户ID
 * @param currentDeviceId - 当前设备ID（保留）
 */
export async function logoutOtherDevices(userId: string, currentDeviceId: string): Promise<void> {
  await db('user_devices')
    .where({ user_id: userId })
    .whereNot('device_id', currentDeviceId)
    .update({ is_active: false });
}
