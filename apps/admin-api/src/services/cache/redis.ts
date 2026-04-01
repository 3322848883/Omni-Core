import Redis from 'ioredis';
import { config } from '../../config';
import { logger } from '../../utils/logger';

// Redis 客户端类
export class RedisClient {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.connect();
  }

  // 连接 Redis
  private connect(): void {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        retryStrategy: (times) => {
          if (times > 1) {
            return null;
          }
          return Math.min(times * 100, 1000);
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        lazyConnect: true,
      });

      this.client.connect().catch((err) => {
        logger.warn(`Redis initial connection failed: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        logger.warn(`Redis error: ${error.message}`);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });
    } catch (error) {
      logger.warn(`Failed to create Redis client: ${error}`);
      this.isConnected = false;
    }
  }

  // 获取连接状态
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  // 获取原始客户端
  getClient(): Redis | null {
    return this.client;
  }

  // 设置字符串值
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.client) {return false;}

      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  // 获取字符串值
  async get(key: string): Promise<string | null> {
    try {
      if (!this.client) {return null;}
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  // 删除键
  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) {return false;}
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis del error for key ${key}:`, error);
      return false;
    }
  }

  // 批量删除键
  async delPattern(pattern: string): Promise<boolean> {
    try {
      if (!this.client) {return false;}

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis delPattern error for pattern ${pattern}:`, error);
      return false;
    }
  }

  // 设置 JSON 值
  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttlSeconds);
    } catch (error) {
      logger.error(`Redis setJSON error for key ${key}:`, error);
      return false;
    }
  }

  // 获取 JSON 值
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) {return null;}
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Redis getJSON error for key ${key}:`, error);
      return null;
    }
  }

  // 设置哈希值
  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.client) {return false;}
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      logger.error(`Redis hset error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  // 批量设置哈希值
  async hmset(key: string, data: Record<string, string>): Promise<boolean> {
    try {
      if (!this.client) {return false;}
      await this.client.hmset(key, data);
      return true;
    } catch (error) {
      logger.error(`Redis hmset error for key ${key}:`, error);
      return false;
    }
  }

  // 获取哈希值
  async hget(key: string, field: string): Promise<string | null> {
    try {
      if (!this.client) {return null;}
      return await this.client.hget(key, field);
    } catch (error) {
      logger.error(`Redis hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  // 获取所有哈希值
  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      if (!this.client) {return null;}
      return await this.client.hgetall(key);
    } catch (error) {
      logger.error(`Redis hgetall error for key ${key}:`, error);
      return null;
    }
  }

  // 删除哈希字段
  async hdel(key: string, field: string): Promise<boolean> {
    try {
      if (!this.client) {return false;}
      await this.client.hdel(key, field);
      return true;
    } catch (error) {
      logger.error(`Redis hdel error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  // 设置过期时间
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.client) {return false;}
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error(`Redis expire error for key ${key}:`, error);
      return false;
    }
  }

  // 获取过期时间
  async ttl(key: string): Promise<number> {
    try {
      if (!this.client) {return -2;}
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Redis ttl error for key ${key}:`, error);
      return -2;
    }
  }

  // 检查键是否存在
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) {return false;}
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  // 获取匹配的所有键
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.client) {return [];}
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Redis keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  // 关闭连接
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// 单例实例
let redisClientInstance: RedisClient | null = null;

export function getRedisClient(): RedisClient {
  if (!redisClientInstance) {
    redisClientInstance = new RedisClient();
  }
  return redisClientInstance;
}

export default RedisClient;
