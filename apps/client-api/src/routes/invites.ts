import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { authLimiter } from '@/middlewares/rateLimiter';
import * as inviteService from '@/services/inviteService';
import { successResponse, createdResponse, errorResponse } from '@/utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@/constants';

const router = Router();

/**
 * GET /my - Get my invite codes
 */
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const inviteCodes = await inviteService.getMyInviteCodes(userId);
    successResponse(res, inviteCodes, 'Invite codes retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST / - Create a new invite code
 */
router.post('/', authenticate, authLimiter, async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const inviteCode = await inviteService.createInviteCode(userId);
    createdResponse(res, inviteCode, 'Invite code created successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /validate - Validate an invite code
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return errorResponse(
        res,
        'Invite code is required',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'code', message: 'Invite code is required' }]
      );
    }

    const result = await inviteService.validateInviteCode(code);

    if (result.valid) {
      successResponse(res, result, 'Invite code is valid');
    } else {
      errorResponse(
        res,
        result.message || 'Invalid invite code',
        ERROR_CODES.INVALID_INVITE_CODE,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'code', message: result.message || 'Invalid invite code' }]
      );
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stats - Get invite statistics
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const stats = await inviteService.getInviteStats(userId);
    successResponse(res, stats, 'Invite statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
