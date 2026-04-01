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
const trafficService = __importStar(require("@/services/trafficService"));
const response_1 = require("@/utils/response");
const constants_1 = require("@/constants");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
/**
 * GET /overview - Get traffic overview
 */
router.get('/overview', async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const overview = await trafficService.getTrafficOverview(userId);
        (0, response_1.successResponse)(res, overview);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /trend?days=30 - Get traffic trend
 */
router.get('/trend', async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const daysParam = req.query.days;
        const days = daysParam ? parseInt(daysParam, 10) : 30;
        // Validate days parameter
        if (isNaN(days) || days < 1 || days > 365) {
            return (0, response_1.errorResponse)(res, 'Days parameter must be between 1 and 365', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'days', message: 'Days parameter must be between 1 and 365' }]);
        }
        const trend = await trafficService.getTrafficTrend(userId, days);
        (0, response_1.successResponse)(res, trend);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /me?days=30 - Get user traffic information
 */
router.get('/me', async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const daysParam = req.query.days;
        const days = daysParam ? parseInt(daysParam, 10) : 30;
        // Validate days parameter
        if (isNaN(days) || days < 1 || days > 365) {
            return (0, response_1.errorResponse)(res, 'Days parameter must be between 1 and 365', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'days', message: 'Days parameter must be between 1 and 365' }]);
        }
        const trafficInfo = await trafficService.getUserTraffic(userId, days);
        (0, response_1.successResponse)(res, trafficInfo);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=traffic.js.map