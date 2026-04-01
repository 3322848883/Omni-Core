/**
 * Token 黑名单服务
 * 用于管理已注销或失效的 Token
 *
 * 实现方式：
 * - 开发环境：使用内存存储 (Map)
 * - 生产环境：使用 Redis (如果可用)
 */
/**
 * 将 Token 添加到黑名单
 * @param token - 要加入黑名单的 Token
 * @param expiresIn - Token 过期时间（秒）
 */
export declare function addToBlacklist(token: string, expiresIn: number): Promise<void>;
/**
 * 检查 Token 是否在黑名单中
 * @param token - 要检查的 Token
 * @returns 是否在黑名单中
 */
export declare function isBlacklisted(token: string): Promise<boolean>;
/**
 * 将 Token 加入黑名单（登出时使用）
 * 自动解析 Token 获取过期时间
 * @param token - 要加入黑名单的 Token
 */
export declare function blacklistToken(token: string): Promise<void>;
/**
 * 清理过期的内存黑名单条目
 * 建议定期调用（如每小时）
 */
export declare function cleanupExpiredTokens(): void;
/**
 * 获取黑名单统计信息（用于监控）
 */
export declare function getBlacklistStats(): {
    memorySize: number;
    redisEnabled: boolean;
};
/**
 * 在密码重置后将用户的所有 Token 加入黑名单
 * @param userId - 用户 ID
 * @param currentToken - 当前有效的 Token（可选，用于排除当前会话）
 */
export declare function blacklistUserTokens(userId: string, currentToken?: string): Promise<void>;
/**
 * 检查用户的 Token 是否因密码重置而失效
 * @param userId - 用户 ID
 * @param tokenIssuedAt - Token 签发时间（秒级时间戳）
 */
export declare function isUserTokenBlacklisted(userId: string, tokenIssuedAt: number): Promise<boolean>;
//# sourceMappingURL=tokenBlacklist.d.ts.map