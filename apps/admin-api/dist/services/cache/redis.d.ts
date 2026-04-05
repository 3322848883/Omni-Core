import Redis from 'ioredis';
export declare class RedisClient {
    private client;
    private isConnected;
    constructor();
    private connect;
    isReady(): boolean;
    getClient(): Redis | null;
    set(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<boolean>;
    delPattern(pattern: string): Promise<boolean>;
    setJSON(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    getJSON<T>(key: string): Promise<T | null>;
    hset(key: string, field: string, value: string): Promise<boolean>;
    hmset(key: string, data: Record<string, string>): Promise<boolean>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string> | null>;
    hdel(key: string, field: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    close(): Promise<void>;
}
export declare function getRedisClient(): RedisClient;
export default RedisClient;
//# sourceMappingURL=redis.d.ts.map