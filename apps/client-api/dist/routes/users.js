"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middlewares/auth");
const userService = __importStar(require("@/services/userService"));
const response_1 = require("@/utils/response");
const constants_1 = require("@/constants");
const validation_1 = require("@/middlewares/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /me - Get current user information
 */
router.get('/me', async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const user = await userService.getUserById(userId);
        (0, response_1.successResponse)(res, user);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /me - Update current user information
 */
router.patch('/me', (0, validation_1.validate)(validation_1.UserValidation.update), async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const data = req.body;
        // Validate input
        if (!data || Object.keys(data).length === 0) {
            return (0, response_1.errorResponse)(res, 'No data provided for update', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'general', message: 'No data provided for update' }]);
        }
        const updatedUser = await userService.updateUser(userId, data);
        (0, response_1.successResponse)(res, updatedUser, 'User updated successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /me/change-password - Change user password
 */
router.post('/me/change-password', (0, validation_1.validate)(validation_1.UserValidation.changePassword), async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const data = req.body;
        // Check if new password is different from old password
        if (data.oldPassword === data.newPassword) {
            return (0, response_1.errorResponse)(res, 'New password must be different from old password', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'newPassword', message: 'New password must be different from old password' }]);
        }
        await userService.changePassword(userId, data.oldPassword, data.newPassword);
        (0, response_1.successResponse)(res, { success: true }, 'Password changed successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /me/avatar - Upload user avatar
 */
router.post('/me/avatar', async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        // Check if file is provided
        // Note: In a real implementation, you would use a middleware like multer
        // to handle file uploads. This is a simplified version.
        if (!req.body.file && !req.file) {
            return (0, response_1.errorResponse)(res, 'Avatar file is required', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'file', message: 'Avatar file is required' }]);
        }
        // Get file buffer from request
        // If using multer, the file would be in req.file.buffer
        // If using raw body, the file would be in req.body.file
        const fileBuffer = req.file?.buffer || Buffer.from(req.body.file, 'base64');
        if (!fileBuffer || fileBuffer.length === 0) {
            return (0, response_1.errorResponse)(res, 'Invalid avatar file', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'file', message: 'Invalid avatar file' }]);
        }
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (fileBuffer.length > maxSize) {
            return (0, response_1.errorResponse)(res, 'Avatar file size must be less than 5MB', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'file', message: 'Avatar file size must be less than 5MB' }]);
        }
        const result = await userService.uploadAvatar(userId, fileBuffer);
        (0, response_1.successResponse)(res, result, 'Avatar uploaded successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map