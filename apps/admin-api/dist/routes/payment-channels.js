"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_channel_service_1 = require("../services/payment/payment-channel.service");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authMiddleware);
router.use(auth_1.requireAdmin);
// Validation schemas
const PaymentChannelValidation = {
    create: {
        body: {
            name: {
                required: true,
                type: 'string',
                min: 1,
                max: 100,
            },
            provider: {
                required: true,
                type: 'string',
                values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'],
                message: 'Invalid payment provider',
            },
            config: {
                required: true,
                type: 'object',
            },
            description: {
                type: 'string',
                max: 500,
            },
        },
    },
    update: {
        body: {
            name: {
                type: 'string',
                min: 1,
                max: 100,
            },
            config: {
                type: 'object',
            },
            description: {
                type: 'string',
                max: 500,
            },
            status: {
                type: 'string',
                values: ['enabled', 'disabled'],
                message: 'Invalid status',
            },
        },
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
    },
    byId: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
    },
    byProvider: {
        params: {
            provider: {
                required: true,
                type: 'string',
                values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'],
                message: 'Invalid payment provider',
            },
        },
    },
};
/**
 * @route POST /api/payment-channels
 * @desc Create a new payment channel
 * @access Admin
 */
router.post('/', (0, validation_1.validate)(PaymentChannelValidation.create), async (req, res) => {
    try {
        const { name, provider, config, description } = req.body;
        const channel = await payment_channel_service_1.paymentChannelService.createChannel({
            name,
            provider,
            config,
            description,
        });
        res.status(201).json(channel);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create payment channel' });
    }
});
/**
 * @route GET /api/payment-channels
 * @desc Get all payment channels
 * @access Admin
 */
router.get('/', async (req, res) => {
    try {
        const channels = await payment_channel_service_1.paymentChannelService.getAllChannels();
        res.json(channels);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get payment channels' });
    }
});
/**
 * @route GET /api/payment-channels/:id
 * @desc Get payment channel by ID
 * @access Admin
 */
router.get('/:id', (0, validation_1.validate)(PaymentChannelValidation.byId), async (req, res) => {
    try {
        const { id } = req.params;
        const channel = await payment_channel_service_1.paymentChannelService.getChannelById(parseInt(id));
        if (!channel) {
            return res.status(404).json({ error: 'Payment channel not found' });
        }
        res.json(channel);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get payment channel' });
    }
});
/**
 * @route PUT /api/payment-channels/:id
 * @desc Update payment channel
 * @access Admin
 */
router.put('/:id', (0, validation_1.validate)(PaymentChannelValidation.update), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, config, description, status } = req.body;
        const channel = await payment_channel_service_1.paymentChannelService.updateChannel(parseInt(id), {
            name,
            config,
            description,
            status,
        });
        res.json(channel);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update payment channel' });
    }
});
/**
 * @route DELETE /api/payment-channels/:id
 * @desc Delete payment channel
 * @access Admin
 */
router.delete('/:id', (0, validation_1.validate)(PaymentChannelValidation.byId), async (req, res) => {
    try {
        const { id } = req.params;
        await payment_channel_service_1.paymentChannelService.deleteChannel(parseInt(id));
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete payment channel' });
    }
});
/**
 * @route POST /api/payment-channels/:id/enable
 * @desc Enable payment channel
 * @access Admin
 */
router.post('/:id/enable', (0, validation_1.validate)(PaymentChannelValidation.byId), async (req, res) => {
    try {
        const { id } = req.params;
        const channel = await payment_channel_service_1.paymentChannelService.enableChannel(parseInt(id));
        res.json(channel);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to enable payment channel' });
    }
});
/**
 * @route POST /api/payment-channels/:id/disable
 * @desc Disable payment channel
 * @access Admin
 */
router.post('/:id/disable', (0, validation_1.validate)(PaymentChannelValidation.byId), async (req, res) => {
    try {
        const { id } = req.params;
        const channel = await payment_channel_service_1.paymentChannelService.disableChannel(parseInt(id));
        res.json(channel);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to disable payment channel' });
    }
});
/**
 * @route POST /api/payment-channels/:id/check-status
 * @desc Check payment channel status
 * @access Admin
 */
router.post('/:id/check-status', (0, validation_1.validate)(PaymentChannelValidation.byId), async (req, res) => {
    try {
        const { id } = req.params;
        const channel = await payment_channel_service_1.paymentChannelService.checkChannelStatus(parseInt(id));
        res.json(channel);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to check payment channel status' });
    }
});
/**
 * @route GET /api/payment-channels/active
 * @desc Get active payment channels
 * @access Admin
 */
router.get('/active', async (req, res) => {
    try {
        const channels = await payment_channel_service_1.paymentChannelService.getActiveChannels();
        res.json(channels);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get active payment channels' });
    }
});
/**
 * @route GET /api/payment-channels/provider/:provider
 * @desc Get payment channels by provider
 * @access Admin
 */
router.get('/provider/:provider', (0, validation_1.validate)(PaymentChannelValidation.byProvider), async (req, res) => {
    try {
        const { provider } = req.params;
        const channels = await payment_channel_service_1.paymentChannelService.getChannelsByProvider(provider);
        res.json(channels);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get payment channels by provider' });
    }
});
exports.default = router;
//# sourceMappingURL=payment-channels.js.map