import { Router } from 'express';
import { authLimiter } from '@/middlewares/rateLimiter';
import { authenticate } from '@/middlewares/auth';
import * as authService from '@/services/authService';
import { successResponse, createdResponse, errorResponse } from '@/utils/response';
import { HttpStatus, ErrorCode } from '@/constants';
import { RegisterData, LoginData } from '@/types/user';
import { validate, AuthValidation } from '@/middlewares/validation';

const router = Router();

/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否有效
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 * @param password - 密码
 * @returns 验证结果
 */
const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

/**
 * 验证用户名
 * @param username - 用户名
 * @returns 验证结果
 */
const validateUsername = (username: string): { valid: boolean; message?: string } => {
  if (username.length < 3 || username.length > 20) {
    return { valid: false, message: 'Username must be between 3 and 20 characters' };
  }
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
};

// Register
router.post('/register', authLimiter, validate(AuthValidation.register), async (req, res, next) => {
  try {
    const data: RegisterData = req.body;

    // Check password match
    if (data.password !== data.confirmPassword) {
      return errorResponse(
        res,
        'Passwords do not match',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        [{ field: 'confirmPassword', message: 'Passwords do not match' }]
      );
    }

    const result = await authService.register(data);
    createdResponse(res, result, 'User registered successfully');
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', authLimiter, validate(AuthValidation.login), async (req, res, next) => {
  try {
    const data: LoginData = req.body;

    const result = await authService.login(data);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7) || '';

    await authService.logout(token);
    successResponse(res, { success: true }, 'Logout successful');
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', validate(AuthValidation.refresh), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);
    successResponse(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
});

// Forgot password (P1)
router.post('/forgot-password', authLimiter, validate(AuthValidation.forgotPassword), async (req, res, next) => {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);
    successResponse(res, { success: true }, 'Password reset email sent');
  } catch (error) {
    next(error);
  }
});

// Reset password (P1)
router.post('/reset-password', authLimiter, validate(AuthValidation.resetPassword), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);
    successResponse(res, { success: true }, 'Password reset successful');
  } catch (error) {
    next(error);
  }
});

// Update password (P1)
router.put('/password', authenticate, validate(AuthValidation.updatePassword), async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    await authService.updatePassword(req.user!.id, oldPassword, newPassword);
    successResponse(res, { success: true }, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
