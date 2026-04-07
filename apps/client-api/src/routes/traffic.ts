import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import * as trafficService from '@/services/trafficService';
import { successResponse, errorResponse } from '@/utils/response';
import { HttpStatus, ErrorCode } from '@/constants';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /overview - Get traffic overview
 */
router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const overview = await trafficService.getTrafficOverview(userId);
    successResponse(res, overview);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /trend?days=30 - Get traffic trend
 */
router.get('/trend', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const daysParam = req.query.days as string;
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return errorResponse(
        res,
        'Days parameter must be between 1 and 365',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        [{ field: 'days', message: 'Days parameter must be between 1 and 365' }]
      );
    }

    const trend = await trafficService.getTrafficTrend(userId, days);
    successResponse(res, trend);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /me?days=30 - Get user traffic information
 */
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const daysParam = req.query.days as string;
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return errorResponse(
        res,
        'Days parameter must be between 1 and 365',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        [{ field: 'days', message: 'Days parameter must be between 1 and 365' }]
      );
    }

    const trafficInfo = await trafficService.getUserTraffic(userId, days);
    successResponse(res, trafficInfo);
  } catch (error) {
    next(error);
  }
});

export default router;
