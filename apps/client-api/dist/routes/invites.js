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
const rateLimiter_1 = require("@/middlewares/rateLimiter");
const inviteService = __importStar(require("@/services/inviteService"));
const response_1 = require("@/utils/response");
const constants_1 = require("@/constants");
const router = (0, express_1.Router)();
/**
 * GET /my - Get my invite codes
 */
router.get('/my', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const inviteCodes = await inviteService.getMyInviteCodes(userId);
        (0, response_1.successResponse)(res, inviteCodes, 'Invite codes retrieved successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST / - Create a new invite code
 */
router.post('/', auth_1.authenticate, rateLimiter_1.authLimiter, async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const inviteCode = await inviteService.createInviteCode(userId);
        (0, response_1.createdResponse)(res, inviteCode, 'Invite code created successfully');
    }
    catch (error) {
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
            return (0, response_1.errorResponse)(res, 'Invite code is required', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'code', message: 'Invite code is required' }]);
        }
        const result = await inviteService.validateInviteCode(code);
        if (result.valid) {
            (0, response_1.successResponse)(res, result, 'Invite code is valid');
        }
        else {
            (0, response_1.errorResponse)(res, result.message || 'Invalid invite code', constants_1.ERROR_CODES.INVALID_INVITE_CODE, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'code', message: result.message || 'Invalid invite code' }]);
        }
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /stats - Get invite statistics
 */
router.get('/stats', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const stats = await inviteService.getInviteStats(userId);
        (0, response_1.successResponse)(res, stats, 'Invite statistics retrieved successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=invites.js.map