export declare const config: {
    nodeEnv: string;
    port: number;
    database: {
        client: string;
        connection: {
            host: string;
            port: number;
            database: string;
            user: string;
            password: string;
        };
        pool: {
            min: number;
            max: number;
        };
        migrations: {
            directory: string;
            tableName: string;
        };
        seeds: {
            directory: string;
        };
    };
    jwt: {
        secret: string;
        refreshSecret: string | undefined;
        accessExpiresIn: string;
        refreshExpiresIn: string;
        accessTokenPrefix: string;
        refreshTokenPrefix: string;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
        enabled: boolean;
    };
    cors: {
        origin: string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        authMaxRequests: number;
    };
    logging: {
        level: string;
        dir: string;
    };
    payment: {
        stripe: {
            secretKey: string;
            webhookSecret: string;
        };
        paypal: {
            clientId: string;
            clientSecret: string;
            mode: string;
        };
    };
    subscription: {
        baseUrl: string;
    };
    security: {
        bcryptRounds: number;
        maxDevices: number;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map