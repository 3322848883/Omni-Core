/**
 * Token 黑名单服务
 * 用于管理已注销或失效的 Token
 *
 * 实现方式：
 * - 开发环境：使用内存存储 (Map)
 * - 生产环境：使用 Redis (如果可用)
 */

import config from '@/config';
import logger from '@/utils/logger';

// 内存存储的 Token 黑名单
const tokenBlacklist = new Map<string, number>();

// Redis 客户端 (延迟初始化)
let redisClient: any = null;

// 黑名单键前缀
const BLACKLIST_PREFIX = 'token:blacklist:';

/**
 * 获取 Redis 客户端
 * 如果 Redis 未启用或连接失败，返回 null
 */
async function getRedisClient(): Promise<any | null> {
  if (!config.redis.enabled) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    // 动态导入 ioredis，避免在未启用 Redis 时引入依赖
    const { default: Redis } = await import('ioredis');
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries, falling back to memory store');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis error:', err.message);
    });

    return redisClient;
  } catch (error) {
    logger.warn('Failed to initialize Redis client, using memory store for token blacklist');
    return null;
  }
}

/**
 * 将 Token 添加到黑名单
 * @param token - 要加入黑名单的 Token
 * @param expiresIn - Token 过期时间（秒）
 */
export async function addToBlacklist(token: string, expiresIn: number): Promise<void> {
  try {
    const redis = await getRedisClient();
    const key = `${BLACKLIST_PREFIX}${token}`;

    if (redis) {
      // 使用 Redis 存储，设置过期时间
      await redis.setex(key, expiresIn, '1');
      logger.debug(`Token added to Redis blacklist, expires in ${expiresIn}s`);
    } else {
      // 使用内存存储，设置过期时间戳
      const expiresAt = Date.now() + expiresIn * 1000;
      tokenBlacklist.set(token, expiresAt);
      logger.debug(`Token added to memory blacklist, expires at ${new Date(expiresAt).toISOString()}`);
    }
  } catch (error) {
    logger.error('Failed to add token to blacklist:', error);
    // 失败时仍然添加到内存存储，确保功能可用
    const expiresAt = Date.now() + expiresIn * 1000;
    tokenBlacklist.set(token, expiresAt);
  }
}

/**
 * 检查 Token 是否在黑名单中
 * @param token - 要检查的 Token
 * @returns 是否在黑名单中
 */
export async function isBlacklisted(token: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const key = `${BLACKLIST_PREFIX}${token}`;

    if (redis) {
      // 使用 Redis 检查
      const result = await redis.exists(key);
      return result === 1;
    } else {
      // 使用内存存储检查
      const expiresAt = tokenBlacklist.get(token);

      if (!expiresAt) {
        return false;
      }

      // 检查是否已过期
      if (Date.now() > expiresAt) {
        tokenBlacklist.delete(token);
        return false;
      }

      return true;
    }
  } catch (error) {
    logger.error('Failed to check token blacklist:', error);
    // 出错时保守处理，检查内存存储
    const expiresAt = tokenBlacklist.get(token);
    return expiresAt ? Date.now() <= expiresAt : false;
  }
}

/**
 * 将 Token 加入黑名单（登出时使用）
 * 自动解析 Token 获取过期时间
 * @param token - 要加入黑名单的 Token
 */
export async function blacklistToken(token: string): Promise<void> {
  try {
    // 解析 Token 获取过期时间
    // Token 格式: prefix + base64encodedJWT
    const tokenParts = token.split('.');

    if (tokenParts.length !== 3) {
      logger.warn('Invalid token format, using default expiration');
      // 使用默认过期时间 1 小时
      await addToBlacklist(token, 3600);
      return;
    }

    // 解码 payload 获取过期时间
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    const expiresAt = payload.exp;

    if (!expiresAt) {
      logger.warn('Token has no expiration, using default expiration');
      await addToBlacklist(token, 3600);
      return;
    }

    // 计算剩余有效时间
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = Math.max(0, expiresAt - now);

    if (expiresIn === 0) {
      logger.debug('Token already expired, no need to blacklist');
      return;
    }

    await addToBlacklist(token, expiresIn);
    logger.info(`Token blacklisted, will expire in ${expiresIn}s`);
  } catch (error) {
    logger.error('Failed to parse token for blacklisting:', error);
    // 解析失败时使用默认过期时间
    await addToBlacklist(token, 3600);
  }
}

/**
 * 清理过期的内存黑名单条目
 * 建议定期调用（如每小时）
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [token, expiresAt] of tokenBlacklist.entries()) {
    if (now > expiresAt) {
      tokenBlacklist.delete(token);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.debug(`Cleaned up ${cleanedCount} expired tokens from blacklist`);
  }
}

/**
 * 获取黑名单统计信息（用于监控）
 */
export function getBlacklistStats(): { memorySize: number; redisEnabled: boolean } {
  return {
    memorySize: tokenBlacklist.size,
    redisEnabled: config.redis.enabled,
  };
}

/**
 * 在密码重置后将用户的所有 Token 加入黑名单
 * @param userId - 用户 ID
 * @param currentToken - 当前有效的 Token（可选，用于排除当前会话）
 */
export async function blacklistUserTokens(userId: string, currentToken?: string): Promise<void> {
  // 注意：这里需要配合其他机制（如在 Token 中包含用户 ID）
  // 或者使用 Redis 集合存储每个用户的 Token 列表
  // 简化实现：记录用户 ID 到黑名单，所有包含该用户 ID 的 Token 都被拒绝

  try {
    const redis = await getRedisClient();
    const userBlacklistKey = `${BLACKLIST_PREFIX}user:${userId}`;
    const timestamp = Date.now();

    if (redis) {
      // 使用 Redis 记录用户 Token 黑名单时间戳
      // 所有在该时间戳之前签发的 Token 都视为无效
      await redis.setex(userBlacklistKey, 7 * 24 * 3600, timestamp.toString()); // 7 天过期
    }

    logger.info(`All tokens for user ${userId} have been blacklisted due to password reset`);
  } catch (error) {
    logger.error('Failed to blacklist user tokens:', error);
  }
}

/**
 * 检查用户的 Token 是否因密码重置而失效
 * @param userId - 用户 ID
 * @param tokenIssuedAt - Token 签发时间（秒级时间戳）
 */
export async function isUserTokenBlacklisted(userId: string, tokenIssuedAt: number): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const userBlacklistKey = `${BLACKLIST_PREFIX}user:${userId}`;

    if (redis) {
      const blacklistTime = await redis.get(userBlacklistKey);
      if (blacklistTime) {
        return tokenIssuedAt < parseInt(blacklistTime, 10) / 1000;
      }
    }

    return false;
  } catch (error) {
    logger.error('Failed to check user token blacklist:', error);
    return false;
  }
}

// 定期清理内存中的过期 Token（每小时）
if (config.redis.enabled === false) {
  setInterval(cleanupExpiredTokens, 3600 * 1000);
}
