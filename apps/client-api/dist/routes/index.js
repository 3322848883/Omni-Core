"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const users_1 = __importDefault(require("./users"));
const subscription_1 = __importDefault(require("./subscription"));
const nodes_1 = __importDefault(require("./nodes"));
const traffic_1 = __importDefault(require("./traffic"));
const orders_1 = __importDefault(require("./orders"));
const invites_1 = __importDefault(require("./invites"));
const xray_1 = require("./xray");
const devices_1 = __importDefault(require("./devices"));
const site_config_1 = __importDefault(require("./site-config"));
const router = (0, express_1.Router)();
// Public routes (no auth required)
router.use('/site-config', site_config_1.default);
// Auth routes (public)
router.use('/auth', auth_1.default);
// Protected routes
router.use('/users', users_1.default);
router.use('/subscription', subscription_1.default);
router.use('/nodes', nodes_1.default);
router.use('/traffic', traffic_1.default);
router.use('/orders', orders_1.default);
router.use('/invites', invites_1.default);
// Xray routes
router.use('/xray', xray_1.xrayRoutes);
// Device routes
router.use('/devices', devices_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map