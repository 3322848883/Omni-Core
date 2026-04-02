import { Router, Request, Response } from 'express';
import { paymentChannelService } from '../services/payment/payment-channel.service';
import { authMiddleware, requireAdmin } from '../middlewares/auth';
import { validate, ValidationSchema } from '../middlewares/validation';
import { PaymentProvider } from '../services/payment/types';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(requireAdmin);

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
  } as ValidationSchema,
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
  } as ValidationSchema,
  byId: {
    params: {
      id: {
        required: true,
        type: 'string',
      },
    },
  } as ValidationSchema,
  byProvider: {
    params: {
      provider: {
        required: true,
        type: 'string',
        values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'],
        message: 'Invalid payment provider',
      },
    },
  } as ValidationSchema,
};

/**
 * @route POST /api/payment-channels
 * @desc Create a new payment channel
 * @access Admin
 */
router.post('/', validate(PaymentChannelValidation.create), async (req: Request, res: Response) => {
  try {
    const { name, provider, config, description } = req.body;

    const channel = await paymentChannelService.createChannel({
      name,
      provider,
      config,
      description,
    });

    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment channel' });
  }
});

/**
 * @route GET /api/payment-channels
 * @desc Get all payment channels
 * @access Admin
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const channels = await paymentChannelService.getAllChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment channels' });
  }
});

/**
 * @route GET /api/payment-channels/:id
 * @desc Get payment channel by ID
 * @access Admin
 */
router.get('/:id', validate(PaymentChannelValidation.byId), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const channel = await paymentChannelService.getChannelById(parseInt(id));

    if (!channel) {
      return res.status(404).json({ error: 'Payment channel not found' });
    }

    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment channel' });
  }
});

/**
 * @route PUT /api/payment-channels/:id
 * @desc Update payment channel
 * @access Admin
 */
router.put('/:id', validate(PaymentChannelValidation.update), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, config, description, status } = req.body;

    const channel = await paymentChannelService.updateChannel(parseInt(id), {
      name,
      config,
      description,
      status,
    });

    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment channel' });
  }
});

/**
 * @route DELETE /api/payment-channels/:id
 * @desc Delete payment channel
 * @access Admin
 */
router.delete('/:id', validate(PaymentChannelValidation.byId), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await paymentChannelService.deleteChannel(parseInt(id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete payment channel' });
  }
});

/**
 * @route POST /api/payment-channels/:id/enable
 * @desc Enable payment channel
 * @access Admin
 */
router.post('/:id/enable', validate(PaymentChannelValidation.byId), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const channel = await paymentChannelService.enableChannel(parseInt(id));
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable payment channel' });
  }
});

/**
 * @route POST /api/payment-channels/:id/disable
 * @desc Disable payment channel
 * @access Admin
 */
router.post('/:id/disable', validate(PaymentChannelValidation.byId), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const channel = await paymentChannelService.disableChannel(parseInt(id));
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable payment channel' });
  }
});

/**
 * @route POST /api/payment-channels/:id/check-status
 * @desc Check payment channel status
 * @access Admin
 */
router.post('/:id/check-status', validate(PaymentChannelValidation.byId), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const channel = await paymentChannelService.checkChannelStatus(parseInt(id));
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check payment channel status' });
  }
});

/**
 * @route GET /api/payment-channels/active
 * @desc Get active payment channels
 * @access Admin
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const channels = await paymentChannelService.getActiveChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get active payment channels' });
  }
});

/**
 * @route GET /api/payment-channels/provider/:provider
 * @desc Get payment channels by provider
 * @access Admin
 */
router.get('/provider/:provider', validate(PaymentChannelValidation.byProvider), async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const channels = await paymentChannelService.getChannelsByProvider(provider as PaymentProvider);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment channels by provider' });
  }
});

export default router;
