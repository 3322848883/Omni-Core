"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Initialize module aliases
require("module-alias/register");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const config_1 = __importDefault(require("@/config"));
const errorHandler_1 = require("@/middlewares/errorHandler");
const response_1 = require("@/utils/response");
const requestLogger_1 = require("@/middlewares/requestLogger");
const routes_1 = __importDefault(require("@/routes"));
const logger_1 = __importDefault(require("@/utils/logger"));
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
// CORS
app.use((0, cors_1.default)({
    origin: config_1.default.cors.origin,
    credentials: config_1.default.cors.credentials,
}));
// Compression
app.use((0, compression_1.default)());
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request ID and logging
app.use(requestLogger_1.requestId);
app.use(requestLogger_1.requestLogger);
// Rate limiting - temporarily disabled for debugging
// app.use(generalLimiter);
// Health check endpoint (no rate limit)
app.get('/health', (_req, res) => {
    const requestId = (0, response_1.createRequestId)();
    res.json({
        success: true,
        code: 200,
        message: 'OK',
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        },
        requestId,
        timestamp: Date.now(),
    });
});
// API routes - Client API uses /api/v1/client prefix
app.use('/api/v1/client', routes_1.default);
// 404 handler
app.use((_req, res) => {
    const requestId = (0, response_1.createRequestId)();
    res.status(404).json({
        success: false,
        code: 404,
        message: 'Not Found',
        errors: [{
                field: 'resource',
                message: 'The requested resource was not found',
            }],
        requestId,
        timestamp: Date.now(),
    });
});
// Error handler
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = config_1.default.port;
app.listen(PORT, () => {
    logger_1.default.info(`Client API server running on port ${PORT}`);
    logger_1.default.info(`Environment: ${config_1.default.nodeEnv}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map