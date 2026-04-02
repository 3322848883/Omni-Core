import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { createRequestId } from './utils/response';
import { requestLogger } from './middlewares/requestLogger';
import { initializeXrayService, shutdownXrayService } from './services/xray';
import { initializePaymentProviders } from './services/payment';
import { ErrorCode } from '@shared/constants';

// Routes
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { orderRoutes } from './routes/orders';
import { trafficRoutes } from './routes/traffic';
import { nodeRoutes } from './routes/nodes';
import { inviteRoutes } from './routes/invites';
import { configRoutes } from './routes/config';
import { dashboardRoutes } from './routes/dashboard';
import { webhookRoutes } from './routes/webhooks';
import { connectionRoutes } from './routes/connections';
import { settingsRoutes } from './routes/settings';
import siteConfigRoutes from './routes/site-config';
import { subscriptionPlanRoutes } from './routes/subscription-plans';
import { serviceTypeRoutes } from './routes/service-types';
import { ipPoolRoutes } from './routes/ip-pools';
import { ispRoutes } from './routes/isps';
import { metaRoutes } from './routes/meta';
import paymentChannelsRoutes from './routes/payment-channels';
import reconciliationRoutes from './routes/reconciliation';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (config.cors.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (config.nodeEnv === 'development') {
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
    logger.warn(`CORS blocked request from unauthorized origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
}));

app.use(compression() as unknown as express.RequestHandler);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    code: 429,
    message: 'Too many requests, please try again later.',
    error: {
      code: ErrorCode.RATE_LIMITED,
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Webhook routes need raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

// Body parsing for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

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
      environment: config.nodeEnv,
    },
    timestamp: Date.now(),
    requestId: createRequestId(),
  });
});

// API routes
const apiPrefix = config.apiPrefix;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/traffic`, trafficRoutes);
app.use(`${apiPrefix}/nodes`, nodeRoutes);
app.use(`${apiPrefix}/invites`, inviteRoutes);
app.use(`${apiPrefix}/config`, configRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/connections`, connectionRoutes);
app.use(`${apiPrefix}/settings`, settingsRoutes);
app.use(`${apiPrefix}/site-config`, siteConfigRoutes);
app.use(`${apiPrefix}/plans`, subscriptionPlanRoutes);
app.use(`${apiPrefix}/service-types`, serviceTypeRoutes);
app.use(`${apiPrefix}/ip-pools`, ipPoolRoutes);
app.use(`${apiPrefix}/isps`, ispRoutes);
app.use(`${apiPrefix}/meta`, metaRoutes);
app.use(`${apiPrefix}/payment-channels`, paymentChannelsRoutes);
app.use(`${apiPrefix}/reconciliation`, reconciliationRoutes);

// Webhook routes (no API prefix, separate path)
app.use('/webhooks', webhookRoutes);

// 404 handler
app.use((req, res) => {
  const requestId = createRequestId();
  res.status(404).json({
    success: false,
    code: 404,
    message: `Route ${req.method} ${req.path} not found.`,
    timestamp: Date.now(),
    requestId,
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
const HOST = config.host;

// Initialize services
initializeXrayService();
initializePaymentProviders();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  shutdownXrayService();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  shutdownXrayService();
  process.exit(0);
});

app.listen(PORT, HOST, () => {
  logger.info(`Admin API server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`API Prefix: ${apiPrefix}`);
});

export default app;
