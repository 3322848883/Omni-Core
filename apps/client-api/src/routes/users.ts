import { Router, Request } from 'express';
import { authenticate } from '@/middlewares/auth';
import * as userService from '@/services/userService';
import { successResponse, errorResponse } from '@/utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@/constants';
import { UpdateUserData, ChangePasswordData } from '@/types/user';
import { validate, UserValidation } from '@/middlewares/validation';

interface UploadRequest extends Request {
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /me - Get current user information
 */
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const user = await userService.getUserById(userId);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /me - Update current user information
 */
router.patch('/me', validate(UserValidation.update), async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const data: UpdateUserData = req.body;

    // Validate input
    if (!data || Object.keys(data).length === 0) {
      return errorResponse(
        res,
        'No data provided for update',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'general', message: 'No data provided for update' }]
      );
    }

    const updatedUser = await userService.updateUser(userId, data);
    successResponse(res, updatedUser, 'User updated successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /me/change-password - Change user password
 */
router.post('/me/change-password', validate(UserValidation.changePassword), async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const data: ChangePasswordData = req.body;

    // Check if new password is different from old password
    if (data.oldPassword === data.newPassword) {
      return errorResponse(
        res,
        'New password must be different from old password',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'newPassword', message: 'New password must be different from old password' }]
      );
    }

    await userService.changePassword(userId, data.oldPassword, data.newPassword);
    successResponse(res, { success: true }, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /me/avatar - Upload user avatar
 */
router.post('/me/avatar', async (req: UploadRequest, res, next) => {
  try {
    const userId = req.user!.user_id;

    // Check if avatar data is provided
    // Support both base64 string and file upload
    const avatarData = req.body.avatar || req.body.file;

    if (!avatarData) {
      return errorResponse(
        res,
        'Avatar image is required',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'avatar', message: 'Avatar image is required' }]
      );
    }

    // If it's a base64 string, pass directly to service
    // Service layer handles validation and saving
    const result = await userService.uploadAvatar(userId, avatarData);
    successResponse(res, result, 'Avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
