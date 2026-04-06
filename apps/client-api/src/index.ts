import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import config from '@/config';
import { errorHandler } from '@/middlewares/errorHandler';
import { createRequestId } from '@/utils/response';
import { generalLimiter } from '@/middlewares/rateLimiter';
import { requestId, requestLogger } from '@/middlewares/requestLogger';
import routes from '@/routes';
import logger from '@/utils/logger';

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

// CORS - allow all origins for development
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Handle preflight requests
app.options('*', cors());

// Compression
app.use(compression() as any);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Request ID and logging
app.use(requestId);
app.use(requestLogger);

// Rate limiting - temporarily disabled for debugging
// app.use(generalLimiter);

// Health check endpoint (no rate limit)
app.get('/health', (_req, res) => {
  const requestId = createRequestId();
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
app.use('/api/v1/client', routes);

// 404 handler
app.use((_req, res) => {
  const requestId = createRequestId();
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
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Client API server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
