import { Router, Request, Response } from 'express';
import { authMiddleware, requireAdmin } from '../middlewares/auth';
import { db } from '../database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ErrorCode, HttpStatus } from '@shared/constants';

const router = Router();

// Type definitions
interface SiteConfig {
  id: number;
  config_key: string;
  config_value: string;
  config_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description: string | null;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

// Parse config value based on type
function parseConfigValue(config: SiteConfig): any {
  switch (config.config_type) {
    case 'number':
      return parseFloat(config.config_value);
    case 'boolean':
      return config.config_value === 'true';
    case 'json':
      try {
        return JSON.parse(config.config_value);
      } catch {
        return config.config_value;
      }
    default:
      return config.config_value;
  }
}

// Public API: Get all public configurations (for frontend)
router.get('/public', async (req: Request, res: Response) => {
  try {
    const configs = await db<SiteConfig>('site_config')
      .where('is_public', true)
      .select('*');

    const result: Record<string, any> = {};
    configs.forEach(config => {
      result[config.config_key] = parseConfigValue(config);
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching public config:', error);
    throw new AppError('Failed to fetch configuration', HttpStatus.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR);
  }
});

// Public API: Get pricing configuration (for frontend)
router.get('/pricing', async (req: Request, res: Response) => {
  try {
    const pricingConfigs = await db<SiteConfig>('site_config')
      .where('category', 'pricing')
      .where('is_public', true)
      .select('*');

    const result: Record<string, any> = {};
    pricingConfigs.forEach(config => {
      const key = config.config_key.replace('pricing_', '');
      result[key] = parseConfigValue(config);
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching pricing config:', error);
    throw new AppError('Failed to fetch pricing configuration', HttpStatus.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR);
  }
});

// Admin API: Get all configurations (requires admin)
router.get('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    let query = db<SiteConfig>('site_config').select('*');
    
    if (category) {
      query = query.where('category', category as string);
    }
    
    const configs = await query.orderBy('category').orderBy('config_key');

    res.json({
      success: true,
      data: configs.map(config => ({
        ...config,
        parsed_value: parseConfigValue(config)
      }))
    });
  } catch (error) {
    logger.error('Error fetching config:', error);
    throw new AppError('Failed to fetch configuration', HttpStatus.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR);
  }
});

// Admin API: Get single configuration
router.get('/:key', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const config = await db<SiteConfig>('site_config')
      .where('config_key', key)
      .first();

    if (!config) {
      throw new AppError('Configuration not found', HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
    }

    res.json({
      success: true,
      data: {
        ...config,
        parsed_value: parseConfigValue(config)
      }
    });
  } catch (error: any) {
    if (error?.name === 'AppError') throw error;
    logger.error('Error fetching config:', error);
    throw new AppError('Failed to fetch configuration', HttpStatus.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR);
  }
});

// Admin API: Update configuration
router.put('/:key', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { config_value, config_type, description, is_public } = req.body;

    // Check if config exists
    const existing = await db<SiteConfig>('site_config')
      .where('config_key', key)
      .first();

    if (!existing) {
      throw new AppError('Configuration not found', HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
    }

    // Validate config_type
    const validTypes = ['string', 'number', 'boolean', 'json'];
    if (config_type && !validTypes.includes(config_type)) {
      throw new AppError('Invalid config_type', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }

    // Validate JSON type
    if (config_type === 'json' && config_value) {
      try {
        JSON.parse(config_value);
      } catch {
        throw new AppError('Invalid JSON value', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
      }
    }

    const updateData: Partial<SiteConfig> = {
      updated_at: new Date()
    };

    if (config_value !== undefined) updateData.config_value = config_value;
    if (config_type) updateData.config_type = config_type;
    if (description !== undefined) updateData.description = description;
    if (is_public !== undefined) updateData.is_public = is_public;

    await db<SiteConfig>('site_config')
      .where('config_key', key)
      .update(updateData);

    // Fetch updated config
    const updated = await db<SiteConfig>('site_config')
      .where('config_key', key)
      .first();

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        ...updated,
        parsed_value: parseConfigValue(updated!)
      }
    });
  } catch (error: any) {
    if (error?.name === 'AppError') throw error;
    logger.error('Error updating config:', error);
    throw new AppError('Failed to update configuration', HttpStatus.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR);
  }
});

// Admin API: Batch update configurations
router.put('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { configs } = req.body;

    if (!Array.isArray(configs)) {
      throw new AppError('Configs must be an array', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }

    const results = [];

    for (const config of configs) {
      const { config_key, config_value, config_type } = config;

      if (!config_key) {
        continue;
      }

      // Validate JSON type
      if (config_type === 'json' && config_value) {
        try {
          JSON.parse(config_value);
        } catch {
          throw new AppError(`Invalid JSON value for ${config_key}`, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
        }
      }

      const existing = await db<SiteConfig>('site_config')
        .where('config_key', config_key)
        .first();
      
      if (existing) {
        await db<SiteConfig>('site_config')
          .where('config_key', config_key)
          .update({
            config_value,
            config_type: config_type || existing.config_type,
            updated_at: new Date()
          });
        
        results.push({ config_key, status: 'updated' });
      } else {
        // Create new config
        await db<SiteConfig>('site_config').insert({
          config_key,
          config_value,
          config_type: config_type || 'string',
          category: config.category || 'general',
          description: config.description || null,
          is_public: config.is_public !== undefined ? config.is_public : true,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        results.push({ config_key, status: 'created' });
      }
    }

    res.json({
      success: true,
      message: 'Configurations updated successfully',
      data: results
    });
  } catch (error: any) {
    if (error?.name === 'AppError') throw error;
    logger.error('Error batch updating config:', error);
    throw new AppError('Failed to update configurations', HttpStatus.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR);
  }
});

// Admin API: Create new configuration
router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { config_key, config_value, config_type, category, description, is_public } = req.body;

    if (!config_key || config_value === undefined) {
      throw new AppError('config_key and config_value are required', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }

    // Check if key already exists
    const existing = await db<SiteConfig>('site_config')
      .where('config_key', config_key)
      .first();

    if (existing) {
      throw new AppError('Configuration key already exists', HttpStatus.CONFLICT, ErrorCode.CONFLICT);
    }

    // Validate config_type
    const validTypes = ['string', 'number', 'boolean', 'json'];
    if (config_type && !validTypes.includes(config_type)) {
      throw new AppError('Invalid config_type', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }

    // Validate JSON type
    if (config_type === 'json' && config_value) {
      try {
        JSON.parse(config_value);
      } catch {
        throw new AppError('Invalid JSON value', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
      }
    }

    const [id] = await db<SiteConfig>('site_config').insert({
      config_key,
      config_value: config_value.toString(),
      config_type: config_type || 'string',
      category: category || 'general',
      description: description || null,
      is_public: is_public !== undefined ? is_public : true,
      created_at: new Date(),
      updated_at: new Date()
    });

    const newConfig = await db<SiteConfig>('site_config')
      .where('id', id)
      .first();

    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      data: {
        ...newConfig,
        parsed_value: parseConfigValue(newConfig!)
      }
    });
  } catch (error: any) {
    if (error?.name === 'AppError') throw error;
    logger.error('Error creating config:', error);
    throw new AppError('Failed to create configuration', HttpStatus.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR);
  }
});

// Admin API: Delete configuration
router.delete('/:key', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const existing = await db<SiteConfig>('site_config')
      .where('config_key', key)
      .first();

    if (!existing) {
      throw new AppError('Configuration not found', HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
    }

    await db<SiteConfig>('site_config')
      .where('config_key', key)
      .delete();

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error: any) {
    if (error?.name === 'AppError') throw error;
    logger.error('Error deleting config:', error);
    throw new AppError('Failed to delete configuration', HttpStatus.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR);
  }
});

export default router;
