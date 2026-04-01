export declare const config: {
    nodeEnv: any;
    port: number;
    database: {
        client: string;
        connection: {
            host: any;
            port: number;
            database: any;
            user: any;
            password: any;
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
        secret: any;
        refreshSecret: any;
        accessExpiresIn: any;
        refreshExpiresIn: any;
        accessTokenPrefix: string;
        refreshTokenPrefix: string;
    };
    redis: {
        host: any;
        port: number;
        password: any;
        enabled: boolean;
    };
    cors: {
        origin: any;
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        authMaxRequests: number;
    };
    logging: {
        level: any;
        dir: any;
    };
    payment: {
        stripe: {
            secretKey: any;
            webhookSecret: any;
        };
        paypal: {
            clientId: any;
            clientSecret: any;
            mode: any;
        };
    };
    subscription: {
        baseUrl: any;
    };
    security: {
        bcryptRounds: number;
        maxDevices: number;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map