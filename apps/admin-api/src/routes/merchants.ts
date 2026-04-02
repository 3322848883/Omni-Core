import { Router, Request, Response, NextFunction } from 'express';
import { MerchantService } from '../services/merchant/merchant.service';
import { authMiddleware } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = Router();

// GET /api/v1/merchants - List all merchants
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = await MerchantService.listMerchants(page, limit, status, search);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/merchants/:id - Get merchant by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const merchant = await MerchantService.getMerchantById(parseInt(id));

    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: merchant
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/merchants - Create new merchant
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, businessLicense, taxId, contactPerson, address, website, notes } = req.body;

    if (!name || !email) {
      throw new ValidationError([
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email is required' }
      ]);
    }

    const merchant = await MerchantService.createMerchant({
      name,
      email,
      phone,
      businessLicense,
      taxId,
      contactPerson,
      address,
      website,
      notes
    });

    logger.info(`Merchant created: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Merchant created successfully',
      data: merchant
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/merchants/:id - Update merchant
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, phone, businessLicense, taxId, contactPerson, address, website, status, notes } = req.body;

    const merchant = await MerchantService.updateMerchant(parseInt(id), {
      name,
      email,
      phone,
      businessLicense,
      taxId,
      contactPerson,
      address,
      website,
      status,
      notes
    });

    logger.info(`Merchant updated: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Merchant updated successfully',
      data: merchant
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/merchants/:id/api-keys - List merchant API keys
router.get('/:id/api-keys', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const merchant = await MerchantService.getMerchantById(parseInt(id));

    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    const apiKeys = await MerchantService.listApiKeys(parseInt(id));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: apiKeys
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/merchants/:id/api-keys - Create API key
router.post('/:id/api-keys', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { keyName, scopes, ipWhitelist, expiresAt } = req.body;

    if (!keyName) {
      throw new ValidationError([
        { field: 'keyName', message: 'Key name is required' }
      ]);
    }

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    const apiKey = await MerchantService.createApiKey(parseInt(id), {
      keyName,
      scopes,
      ipWhitelist,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    logger.info(`API key created for merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'API key created successfully',
      data: apiKey
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/merchants/:id/api-keys/:keyId/revoke - Revoke API key
router.post('/:id/api-keys/:keyId/revoke', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, keyId } = req.params;

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    await MerchantService.revokeApiKey(parseInt(keyId), parseInt(id));

    logger.info(`API key revoked for merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/merchants/:id/rates - List merchant rates
router.get('/:id/rates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.query;

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    const rates = await MerchantService.listRates(parseInt(id), paymentMethod as string);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: rates
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/merchants/:id/rates - Create merchant rate
router.post('/:id/rates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { paymentMethod, currency, transactionRate, fixedFee, minFee, maxFee, effectiveFrom, effectiveTo } = req.body;

    if (!paymentMethod || transactionRate === undefined || !effectiveFrom) {
      throw new ValidationError([
        { field: 'paymentMethod', message: 'Payment method is required' },
        { field: 'transactionRate', message: 'Transaction rate is required' },
        { field: 'effectiveFrom', message: 'Effective from date is required' }
      ]);
    }

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    const rate = await MerchantService.createRate(parseInt(id), {
      paymentMethod,
      currency,
      transactionRate,
      fixedFee,
      minFee,
      maxFee,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
    });

    logger.info(`Rate created for merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Rate created successfully',
      data: rate
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/merchants/:id/rates/:rateId - Update merchant rate
router.put('/:id/rates/:rateId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, rateId } = req.params;
    const { paymentMethod, currency, transactionRate, fixedFee, minFee, maxFee, effectiveFrom, effectiveTo } = req.body;

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    const rate = await MerchantService.updateRate(parseInt(rateId), parseInt(id), {
      paymentMethod,
      currency,
      transactionRate,
      fixedFee,
      minFee,
      maxFee,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
    });

    logger.info(`Rate updated for merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Rate updated successfully',
      data: rate
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/merchants/:id/stats - Get merchant statistics
router.get('/:id/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    const stats = await MerchantService.getMerchantStats(
      parseInt(id),
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/merchants/:id/permissions - List merchant permissions
router.get('/:id/permissions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    const permissions = await MerchantService.listPermissions(parseInt(id));

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: permissions
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/merchants/:id/permissions - Assign permission
router.post('/:id/permissions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permissionCode, permissionName, description } = req.body;

    if (!permissionCode || !permissionName) {
      throw new ValidationError([
        { field: 'permissionCode', message: 'Permission code is required' },
        { field: 'permissionName', message: 'Permission name is required' }
      ]);
    }

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    const permission = await MerchantService.assignPermission(
      parseInt(id),
      permissionCode,
      permissionName,
      description
    );

    logger.info(`Permission assigned to merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Permission assigned successfully',
      data: permission
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/merchants/:id/permissions/:permissionCode - Remove permission
router.delete('/:id/permissions/:permissionCode', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, permissionCode } = req.params;

    const merchant = await MerchantService.getMerchantById(parseInt(id));
    if (!merchant) {
      throw new NotFoundError('Merchant', id);
    }

    await MerchantService.removePermission(parseInt(id), permissionCode);

    logger.info(`Permission removed from merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Permission removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as merchantRoutes };
