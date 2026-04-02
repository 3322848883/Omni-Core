"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const response_1 = require("./utils/response");
const requestLogger_1 = require("./middlewares/requestLogger");
const xray_1 = require("./services/xray");
const payment_1 = require("./services/payment");
const constants_1 = require("@shared/constants");
// Routes
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const orders_1 = require("./routes/orders");
const traffic_1 = require("./routes/traffic");
const nodes_1 = require("./routes/nodes");
const invites_1 = require("./routes/invites");
const config_2 = require("./routes/config");
const dashboard_1 = require("./routes/dashboard");
const webhooks_1 = require("./routes/webhooks");
const connections_1 = require("./routes/connections");
const settings_1 = require("./routes/settings");
const site_config_1 = __importDefault(require("./routes/site-config"));
const subscription_plans_1 = require("./routes/subscription-plans");
const service_types_1 = require("./routes/service-types");
const ip_pools_1 = require("./routes/ip-pools");
const isps_1 = require("./routes/isps");
const meta_1 = require("./routes/meta");
const payment_channels_1 = __importDefault(require("./routes/payment-channels"));
const reconciliation_1 = __importDefault(require("./routes/reconciliation"));
const merchants_1 = require("./routes/merchants");
const projects_1 = require("./routes/projects");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
// CORS middleware with multi-environment support
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (config_1.config.cors.allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // In development, allow all origins
        if (config_1.config.nodeEnv === 'development') {
            return callback(null, true);
        }
        // Allow local development ports
        if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
            return callback(null, true);
        }
        // Allow server IP access for remote development
        if (origin && origin.startsWith('http://69.12.85.185:')) {
            return callback(null, true);
        }
        // Reject unauthorized origins
        logger_1.logger.warn(`CORS blocked request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: config_1.config.cors.credentials,
    methods: config_1.config.cors.methods,
    allowedHeaders: config_1.config.cors.allowedHeaders,
}));
app.use((0, compression_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimitWindowMs,
    max: config_1.config.rateLimitMaxRequests,
    message: {
        success: false,
        code: 429,
        message: 'Too many requests, please try again later.',
        error: {
            code: constants_1.ErrorCode.RATE_LIMITED,
            message: 'Too many requests, please try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Webhook routes need raw body for signature verification
app.use('/webhooks', express_1.default.raw({ type: 'application/json' }));
// Body parsing for other routes
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(requestLogger_1.requestLogger);
// Health check endpoint
app.get('/health', (req, res) => {
    const startTime = Date.now();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    res.json({
        success: true,
        code: 200,
        message: 'success',
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            uptime: Math.floor(uptime),
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
            },
            environment: config_1.config.nodeEnv,
        },
        timestamp: Date.now(),
        requestId: (0, response_1.createRequestId)(),
    });
});
// API routes
const apiPrefix = config_1.config.apiPrefix;
app.use(`${apiPrefix}/auth`, auth_1.authRoutes);
app.use(`${apiPrefix}/users`, users_1.userRoutes);
app.use(`${apiPrefix}/orders`, orders_1.orderRoutes);
app.use(`${apiPrefix}/traffic`, traffic_1.trafficRoutes);
app.use(`${apiPrefix}/nodes`, nodes_1.nodeRoutes);
app.use(`${apiPrefix}/invites`, invites_1.inviteRoutes);
app.use(`${apiPrefix}/config`, config_2.configRoutes);
app.use(`${apiPrefix}/dashboard`, dashboard_1.dashboardRoutes);
app.use(`${apiPrefix}/connections`, connections_1.connectionRoutes);
app.use(`${apiPrefix}/settings`, settings_1.settingsRoutes);
app.use(`${apiPrefix}/site-config`, site_config_1.default);
app.use(`${apiPrefix}/plans`, subscription_plans_1.subscriptionPlanRoutes);
app.use(`${apiPrefix}/service-types`, service_types_1.serviceTypeRoutes);
app.use(`${apiPrefix}/ip-pools`, ip_pools_1.ipPoolRoutes);
app.use(`${apiPrefix}/isps`, isps_1.ispRoutes);
app.use(`${apiPrefix}/meta`, meta_1.metaRoutes);
app.use(`${apiPrefix}/payment-channels`, payment_channels_1.default);
app.use(`${apiPrefix}/reconciliation`, reconciliation_1.default);
app.use(`${apiPrefix}/merchants`, merchants_1.merchantRoutes);
app.use(`${apiPrefix}/projects`, projects_1.projectRoutes);
// Webhook routes (no API prefix, separate path)
app.use('/webhooks', webhooks_1.webhookRoutes);
// 404 handler
app.use((req, res) => {
    const requestId = (0, response_1.createRequestId)();
    res.status(404).json({
        success: false,
        code: 404,
        message: `Route ${req.method} ${req.path} not found.`,
        timestamp: Date.now(),
        requestId,
    });
});
// Error handler
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = config_1.config.port;
const HOST = config_1.config.host;
// Initialize services
(0, xray_1.initializeXrayService)();
(0, payment_1.initializePaymentProviders)();
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    (0, xray_1.shutdownXrayService)();
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    (0, xray_1.shutdownXrayService)();
    process.exit(0);
});
app.listen(PORT, HOST, () => {
    logger_1.logger.info(`Admin API server running on http://${HOST}:${PORT}`);
    logger_1.logger.info(`Environment: ${config_1.config.nodeEnv}`);
    logger_1.logger.info(`API Prefix: ${apiPrefix}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map