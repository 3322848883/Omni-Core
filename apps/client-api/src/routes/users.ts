import { Router, Request } from 'express';
import { authenticate } from '@/middlewares/auth';
import * as userService from '@/services/userService';
import { successResponse, errorResponse } from '@/utils/response';
import { HttpStatus, ErrorCode } from '@/constants';
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
    const userId = req.user!.id;
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
    const userId = req.user!.id;
    const data: UpdateUserData = req.body;

    // Validate input
    if (!data || Object.keys(data).length === 0) {
      return errorResponse(
        res,
        'No data provided for update',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
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
    const userId = req.user!.id;
    const data: ChangePasswordData = req.body;

    // Check if new password is different from current password
    if (data.currentPassword === data.newPassword) {
      return errorResponse(
        res,
        'New password must be different from current password',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        [{ field: 'newPassword', message: 'New password must be different from current password' }]
      );
    }

    await userService.changePassword(userId, data.currentPassword, data.newPassword);
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
    const userId = req.user!.id;

    // Check if file is provided
    // Note: In a real implementation, you would use a middleware like multer
    // to handle file uploads. This is a simplified version.
    if (!req.body.file && !req.file) {
      return errorResponse(
        res,
        'Avatar file is required',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
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
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        [{ field: 'file', message: 'Invalid avatar file' }]
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > maxSize) {
      return errorResponse(
        res,
        'Avatar file size must be less than 5MB',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
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
