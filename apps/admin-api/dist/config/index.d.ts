export declare const config: {
    nodeEnv: any;
    port: number;
    host: any;
    apiPrefix: any;
    domain: {
        root: any;
        admin: any;
        api: any;
        client: any;
        env: any;
    };
    apiUrl: string;
    database: {
        client: string;
        connection: {
            host: any;
            port: number;
            database: any;
            user: any;
            password: any;
        };
    };
    db: {
        host: any;
        port: number;
        name: any;
        user: any;
        password: any;
        pool: {
            min: number;
            max: number;
        };
    };
    redis: {
        host: any;
        port: number;
        password: any;
        db: number;
    };
    jwt: {
        secret: any;
        refreshSecret: any;
        expiresIn: any;
        refreshExpiresIn: any;
        accessTokenPrefix: string;
        refreshTokenPrefix: string;
    };
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    xray: {
        host: any;
        port: number;
    };
    logLevel: any;
    logDir: any;
    smtp: {
        host: any;
        port: number;
        user: any;
        password: any;
        from: any;
        adminEmail: any;
    };
    adminWebUrl: any;
    cors: {
        allowedOrigins: any;
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
    };
    payment: {
        stripe: {
            secretKey: any;
            webhookSecret: any;
            publishableKey: any;
        };
        paypal: {
            clientId: any;
            clientSecret: any;
            webhookSecret: any;
            sandbox: boolean;
        };
        alipay: {
            qrCodeUrl: any;
            receiverName: any;
        };
        wechat: {
            qrCodeUrl: any;
            receiverName: any;
        };
        alipayMerchant: {
            appId: any;
            privateKey: any;
            alipayPublicKey: any;
            sandbox: boolean;
        };
        wechatMerchant: {
            mchId: any;
            appId: any;
            apiKey: any;
            sandbox: boolean;
        };
        defaultCurrency: any;
    };
};
//# sourceMappingURL=index.d.ts.map