import { Router, Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project/project.service';
import { authMiddleware } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = parseInt(req.query.merchantId as string);
    if (!merchantId) {
      throw new ValidationError('Validation failed', [{ field: 'merchantId', message: 'Merchant ID is required' }]);
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = await ProjectService.listProjects(merchantId, page, limit, status, search);

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

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const project = await ProjectService.getProjectById(parseInt(id));

    if (!project) {
      throw new NotFoundError(`Project ${id} not found`);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: project
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantId, name, description, config } = req.body;

    if (!merchantId || !name) {
      throw new ValidationError('Validation failed', [
        { field: 'merchantId', message: 'Merchant ID is required' },
        { field: 'name', message: 'Name is required' }
      ]);
    }

    const project = await ProjectService.createProject({
      merchantId: parseInt(merchantId),
      name,
      description,
      config
    });

    logger.info(`Project created: ${project.project_id} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { merchantId, name, description, status, config } = req.body;

    if (!merchantId) {
      throw new ValidationError('Validation failed', [{ field: 'merchantId', message: 'Merchant ID is required' }]);
    }

    const project = await ProjectService.updateProject(parseInt(id), parseInt(merchantId), {
      name,
      description,
      status,
      config
    });

    logger.info(`Project updated: ${project.project_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { merchantId } = req.body;

    if (!merchantId) {
      throw new ValidationError('Validation failed', [{ field: 'merchantId', message: 'Merchant ID is required' }]);
    }

    await ProjectService.deleteProject(parseInt(id), parseInt(merchantId));

    logger.info(`Project deleted: ${id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/payment-configs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { merchantId, paymentChannel } = req.query;

    if (!merchantId) {
      throw new ValidationError('Validation failed', [{ field: 'merchantId', message: 'Merchant ID is required' }]);
    }

    const paymentConfigs = await ProjectService.listProjectPaymentConfigs(
      parseInt(id),
      parseInt(merchantId as string),
      paymentChannel as string
    );

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: paymentConfigs
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/payment-configs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { merchantId, paymentChannel, config, effectiveFrom, effectiveTo } = req.body;

    if (!merchantId || !paymentChannel || !config || !effectiveFrom) {
      throw new ValidationError('Validation failed', [
        { field: 'merchantId', message: 'Merchant ID is required' },
        { field: 'paymentChannel', message: 'Payment channel is required' },
        { field: 'config', message: 'Config is required' },
        { field: 'effectiveFrom', message: 'Effective from date is required' }
      ]);
    }

    const paymentConfig = await ProjectService.createProjectPaymentConfig(
      parseInt(id),
      parseInt(merchantId),
      {
        paymentChannel,
        config,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
      }
    );

    logger.info(`Payment config created for project: ${id} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Payment config created successfully',
      data: paymentConfig
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/payment-configs/:configId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, configId } = req.params;
    const { merchantId, paymentChannel, config, isActive, effectiveFrom, effectiveTo } = req.body;

    if (!merchantId) {
      throw new ValidationError('Validation failed', [{ field: 'merchantId', message: 'Merchant ID is required' }]);
    }

    const paymentConfig = await ProjectService.updateProjectPaymentConfig(
      parseInt(configId),
      parseInt(id),
      parseInt(merchantId),
      {
        paymentChannel,
        config,
        isActive,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
      }
    );

    logger.info(`Payment config updated for project: ${id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Payment config updated successfully',
      data: paymentConfig
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { merchantId, startDate, endDate } = req.query;

    if (!merchantId) {
      throw new ValidationError('Validation failed', [{ field: 'merchantId', message: 'Merchant ID is required' }]);
    }

    const stats = await ProjectService.getProjectStats(
      parseInt(id),
      parseInt(merchantId as string),
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

export { router as projectRoutes };
