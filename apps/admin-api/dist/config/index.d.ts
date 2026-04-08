export declare const config: {
    nodeEnv: string;
    port: number;
    host: string;
    apiPrefix: string;
    domain: {
        root: string;
        admin: string;
        api: string;
        client: string;
        env: string;
    };
    apiUrl: string;
    database: {
        client: string;
        connection: {
            host: string;
            port: number;
            database: string;
            user: string;
            password: string;
        };
    };
    db: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        pool: {
            min: number;
            max: number;
        };
    };
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
        accessTokenPrefix: string;
        refreshTokenPrefix: string;
    };
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    xray: {
        host: string;
        port: number;
    };
    logLevel: string;
    logDir: string;
    smtp: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
        adminEmail: string;
    };
    adminWebUrl: string;
    cors: {
        allowedOrigins: string[];
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
    };
    payment: {
        stripe: {
            secretKey: string;
            webhookSecret: string;
            publishableKey: string;
        };
        paypal: {
            clientId: string;
            clientSecret: string;
            webhookSecret: string;
            sandbox: boolean;
        };
        alipay: {
            qrCodeUrl: string;
            receiverName: string;
        };
        wechat: {
            qrCodeUrl: string;
            receiverName: string;
        };
        alipayMerchant: {
            appId: string;
            privateKey: string;
            alipayPublicKey: string;
            sandbox: boolean;
        };
        wechatMerchant: {
            mchId: string;
            appId: string;
            apiKey: string;
            sandbox: boolean;
        };
        defaultCurrency: string;
    };
    rabbitmq: {
        host: string;
        port: number;
        user: string;
        password: string;
        vhost: string;
    };
    queues: {
        email: string;
        trafficStats: string;
    };
};
//# sourceMappingURL=index.d.ts.map