"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middlewares/auth");
const response_1 = require("@/utils/response");
const database_1 = __importDefault(require("@/config/database"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const devices = await (0, database_1.default)('user_devices')
            .where({ user_id: userId })
            .where('last_active_at', '>', database_1.default.raw('datetime("now", "-30 days")'))
            .select(['id', 'device_id', 'ip_address', 'user_agent', 'last_active_at', 'is_active', 'created_at'])
            .orderBy('last_active_at', 'desc');
        const formattedDevices = devices.map(d => ({
            id: d.id,
            deviceId: d.device_id,
            ipAddress: d.ip_address,
            userAgent: d.user_agent,
            lastActiveAt: d.last_active_at,
            isActive: d.is_active,
            createdAt: d.created_at
        }));
        (0, response_1.successResponse)(res, {
            devices: formattedDevices,
            total: formattedDevices.length
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:deviceId', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { deviceId } = req.params;
        const deleted = await (0, database_1.default)('user_devices')
            .where({ user_id: userId, device_id: deviceId })
            .delete();
        if (deleted) {
            (0, response_1.successResponse)(res, null, 'Device removed successfully');
        }
        else {
            (0, response_1.successResponse)(res, null, 'Device not found');
        }
    }
    catch (error) {
        next(error);
    }
});
router.put('/:deviceId/active', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { deviceId } = req.params;
        const { isActive } = req.body;
        await (0, database_1.default)('user_devices')
            .where({ user_id: userId, device_id: deviceId })
            .update({ is_active: isActive });
        (0, response_1.successResponse)(res, null, 'Device status updated');
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=devices.js.map