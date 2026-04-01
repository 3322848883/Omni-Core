import { Router, Request } from 'express';
import { authenticate, optionalAuth } from '@/middlewares/auth';
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

// Public routes
router.get('/me', optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      // Return basic success response for unauthenticated requests
      return successResponse(res, { message: 'Authentication required' });
    }
    
    const userId = req.user.user_id;
    const user = await userService.getUserById(userId);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
});

// Protected routes
router.use(authenticate);

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

    // Check if file is provided
    // Note: In a real implementation, you would use a middleware like multer
    // to handle file uploads. This is a simplified version.
    if (!req.body.file && !req.file) {
      return errorResponse(
        res,
        'Avatar file is required',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'file', message: 'Avatar file is required' }]
      );
    }

    // Get file buffer from request
    // If using multer, the file would be in req.file.buffer
    // If using raw body, the file would be in req.body.file
    const fileBuffer = req.file?.buffer || Buffer.from(req.body.file, 'base64');

    if (!fileBuffer || fileBuffer.length === 0) {
      return errorResponse(
        res,
        'Invalid avatar file',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'file', message: 'Invalid avatar file' }]
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > maxSize) {
      return errorResponse(
        res,
        'Avatar file size must be less than 5MB',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'file', message: 'Avatar file size must be less than 5MB' }]
      );
    }

    const result = await userService.uploadAvatar(userId, fileBuffer);
    successResponse(res, result, 'Avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
