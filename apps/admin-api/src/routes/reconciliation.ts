import { Router, Request, Response, NextFunction } from 'express';
import { reconciliationService } from '../services/reconciliation/reconciliation.service';
import { settlementService } from '../services/reconciliation/settlement.service';
import { authMiddleware, requireAdmin } from '../middlewares/auth';
import { validate, ValidationSchema } from '../middlewares/validation';
import { PaymentProvider } from '../services/payment/types';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(requireAdmin);

// Validation schemas
const ReconciliationValidation = {
  create: {
    body: {
      provider: {
        required: true,
        type: 'string',
        values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'],
        message: 'Invalid payment provider',
      },
      reconciliation_date: {
        required: true,
        type: 'string',
        message: 'Reconciliation date is required',
      },
    },
  } as ValidationSchema,
  process: {
    params: {
      id: {
        required: true,
        type: 'string',
      },
    },
  } as ValidationSchema,
  list: {
    query: {
      provider: {
        type: 'string',
      },
      startDate: {
        type: 'string',
      },
      endDate: {
        type: 'string',
      },
      status: {
        type: 'string',
      },
      page: {
        type: 'string',
        convert: true,
        positive: true,
      },
      limit: {
        type: 'string',
        convert: true,
        positive: true,
        max: 100,
      },
    },
  } as ValidationSchema,
  details: {
    params: {
      id: {
        required: true,
        type: 'string',
      },
    },
    query: {
      status: {
        type: 'string',
      },
      page: {
        type: 'string',
        convert: true,
        positive: true,
      },
      limit: {
        type: 'string',
        convert: true,
        positive: true,
        max: 100,
      },
    },
  } as ValidationSchema,
};

const SettlementValidation = {
  create: {
    body: {
      provider: {
        required: true,
        type: 'string',
        values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'],
        message: 'Invalid payment provider',
      },
      start_date: {
        required: true,
        type: 'string',
        message: 'Start date is required',
      },
      end_date: {
        required: true,
        type: 'string',
        message: 'End date is required',
      },
    },
  } as ValidationSchema,
  process: {
    params: {
      id: {
        required: true,
        type: 'string',
      },
    },
  } as ValidationSchema,
  list: {
    query: {
      provider: {
        type: 'string',
      },
      startDate: {
        type: 'string',
      },
      endDate: {
        type: 'string',
      },
      status: {
        type: 'string',
      },
      page: {
        type: 'string',
        convert: true,
        positive: true,
      },
      limit: {
        type: 'string',
        convert: true,
        positive: true,
        max: 100,
      },
    },
  } as ValidationSchema,
  details: {
    params: {
      id: {
        required: true,
        type: 'string',
      },
    },
    query: {
      page: {
        type: 'string',
        convert: true,
        positive: true,
      },
      limit: {
        type: 'string',
        convert: true,
        positive: true,
        max: 100,
      },
    },
  } as ValidationSchema,
};

// Reconciliation routes

/**
 * @route POST /api/reconciliations
 * @desc Create a new reconciliation
 * @access Admin
 */
router.post('/reconciliations', validate(ReconciliationValidation.create), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, reconciliation_date } = req.body;

    const reconciliation = await reconciliationService.createReconciliation({
      provider: provider as PaymentProvider,
      reconciliation_date: new Date(reconciliation_date),
    });

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Reconciliation created successfully',
      data: reconciliation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/reconciliations/:id/process
 * @desc Process reconciliation
 * @access Admin
 */
router.post('/reconciliations/:id/process', validate(ReconciliationValidation.process), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const reconciliation = await reconciliationService.processReconciliation(parseInt(id));

    res.json({
      success: true,
      code: 200,
      message: 'Reconciliation processed successfully',
      data: reconciliation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reconciliations
 * @desc Get all reconciliations
 * @access Admin
 */
router.get('/reconciliations', validate(ReconciliationValidation.list), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, startDate, endDate, status, page, limit } = req.query;

    const result = await reconciliationService.getReconciliations({
      provider: provider as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reconciliations/:id
 * @desc Get reconciliation by ID
 * @access Admin
 */
router.get('/reconciliations/:id', validate(ReconciliationValidation.process), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const reconciliation = await reconciliationService.getReconciliationById(parseInt(id));

    if (!reconciliation) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Reconciliation not found',
      });
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: reconciliation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reconciliations/:id/details
 * @desc Get reconciliation details
 * @access Admin
 */
router.get('/reconciliations/:id/details', validate(ReconciliationValidation.details), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, page, limit } = req.query;

    const result = await reconciliationService.getReconciliationDetails(parseInt(id), {
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Settlement routes

/**
 * @route POST /api/settlements
 * @desc Create a new settlement report
 * @access Admin
 */
router.post('/settlements', validate(SettlementValidation.create), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, start_date, end_date } = req.body;

    const settlement = await settlementService.createSettlement({
      provider: provider as PaymentProvider,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    });

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Settlement report created successfully',
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/settlements/:id/process
 * @desc Process settlement report
 * @access Admin
 */
router.post('/settlements/:id/process', validate(SettlementValidation.process), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const settlement = await settlementService.processSettlement(parseInt(id));

    res.json({
      success: true,
      code: 200,
      message: 'Settlement report processed successfully',
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/settlements
 * @desc Get all settlement reports
 * @access Admin
 */
router.get('/settlements', validate(SettlementValidation.list), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, startDate, endDate, status, page, limit } = req.query;

    const result = await settlementService.getSettlementReports({
      provider: provider as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/settlements/:id
 * @desc Get settlement report by ID
 * @access Admin
 */
router.get('/settlements/:id', validate(SettlementValidation.process), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const settlement = await settlementService.getSettlementById(parseInt(id));

    if (!settlement) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Settlement report not found',
      });
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/settlements/:id/details
 * @desc Get settlement details
 * @access Admin
 */
router.get('/settlements/:id/details', validate(SettlementValidation.details), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await settlementService.getSettlementDetails(parseInt(id), {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
