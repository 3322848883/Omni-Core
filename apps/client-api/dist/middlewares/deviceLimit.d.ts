import { Request, Response, NextFunction } from 'express';
/**
 * 设备并发限制中间件
 * 限制每个用户最多只能同时在 maxDevices 台设备上登录
 */
export declare const deviceLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 清理不活跃设备
 * 删除超过7天未活跃的设备记录
 */
export declare function cleanupInactiveDevices(): Promise<void>;
/**
 * 获取用户设备列表
 * @param userId - 用户ID
 * @returns 设备列表
 */
export declare function getUserDevices(userId: string): Promise<any>;
/**
 * 注销指定设备
 * @param userId - 用户ID
 * @param deviceId - 设备ID
 */
export declare function logoutDevice(userId: string, deviceId: string): Promise<void>;
/**
 * 注销所有其他设备
 * @param userId - 用户ID
 * @param currentDeviceId - 当前设备ID（保留）
 */
export declare function logoutOtherDevices(userId: string, currentDeviceId: string): Promise<void>;
//# sourceMappingURL=deviceLimit.d.ts.map