import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { authMiddleware } from '../middlewares/auth';
import { validate, UserValidation } from '../middlewares/validation';

const router = Router();

// GET /api/v1/users - Get all users with pagination and filters
router.get('/', authMiddleware, validate(UserValidation.list), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let query = db('users').where('status', '!=', 3);

    if (status) {
      query = query.where('status', status);
    }

    if (search) {
      query = query.where(function() {
        this.where('email', 'like', `%${search}%`)
          .orWhere('username', 'like', `%${search}%`)
          .orWhere('user_id', 'like', `%${search}%`);
      });
    }

    const [countResult] = await query.clone().count('* as count');
    const total = parseInt(countResult.count as string);

    const users = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        list: users.map(user => ({
          id: user.id,
          userId: user.user_id,
          email: user.email,
          username: user.username,
          vpnUuid: user.vpn_uuid,
          status: user.status,
          trafficLimit: user.traffic_limit,
          trafficUsed: user.traffic_used,
          expireDate: user.expire_date,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        })),
        total,
        page,
        pageSize: limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', authMiddleware, validate(UserValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Try to find user by id (numeric) or user_id (string)
    let user = await db('users')
      .where('id', id)
      .where('status', '!=', 3)
      .first();

    // If not found by id, try user_id
    if (!user) {
      user = await db('users')
        .where('user_id', id)
        .where('status', '!=', 3)
        .first();
    }

    if (!user) {
      throw new NotFoundError('User', id);
    }

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        username: user.username,
        vpnUuid: user.vpn_uuid,
        status: user.status,
        trafficLimit: user.traffic_limit,
        trafficUsed: user.traffic_used,
        expireDate: user.expire_date,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        version: user.version
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/users - Create new user
router.post('/', authMiddleware, validate(UserValidation.create), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password, trafficLimit = 10737418240, expireDate } = req.body;

    const existingUser = await db('users')
      .where('email', email)
      .orWhere('username', username)
      .first();

    if (existingUser) {
      throw new ValidationError([
        { field: 'email', message: 'Email or username already exists' }
      ]);
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const vpnUuid = uuidv4();

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await db('users').insert({
      user_id: userId,
      email,
      username,
      password_hash: passwordHash,
      vpn_uuid: vpnUuid,
      status: 1,
      traffic_limit: trafficLimit,
      traffic_used: 0,
      expire_date: expireDate || null,
      version: 1
    });

    // Fetch the created user (MySQL compatible)
    const user = await db('users').where('user_id', userId).first();

    await db('user_history').insert({
      user_id: userId,
      field_name: 'created',
      old_value: null,
      new_value: JSON.stringify({ email, username }),
      changed_by: req.user?.username || 'system',
      ip_address: req.ip
    });

    logger.info(`User created: ${userId} by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'User created successfully',
      data: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        username: user.username,
        vpnUuid: user.vpn_uuid,
        status: user.status,
        trafficLimit: user.traffic_limit,
        trafficUsed: user.traffic_used,
        expireDate: user.expire_date,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/users/:id - Update user
router.put('/:id', authMiddleware, validate(UserValidation.update), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { username, trafficLimit, expireDate, status } = req.body;

    // Try to find user by id (numeric) or user_id (string)
    let user = await db('users')
      .where('id', id)
      .where('status', '!=', 3)
      .first();

    // If not found by id, try user_id
    if (!user) {
      user = await db('users')
        .where('user_id', id)
        .where('status', '!=', 3)
        .first();
    }

    if (!user) {
      throw new NotFoundError('User', id);
    }

    const updateData: any = {
      updated_at: new Date(),
      version: user.version + 1
    };

    if (username !== undefined) {updateData.username = username;}
    if (trafficLimit !== undefined) {updateData.traffic_limit = trafficLimit;}
    if (expireDate !== undefined) {updateData.expire_date = expireDate;}
    if (status !== undefined) {updateData.status = status;}

    // MySQL compatible update (no returning)
    await db('users')
      .where('user_id', user.user_id)
      .update(updateData);

    // Fetch updated user
    const updatedUser = await db('users')
      .where('user_id', user.user_id)
      .first();

    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'updated_at' && key !== 'version') {
        await db('user_history').insert({
          user_id: user.user_id,
          field_name: key,
          old_value: user[key],
          new_value: value,
          changed_by: req.user?.username || 'system',
          ip_address: req.ip
        });
      }
    }

    logger.info(`User updated: ${user.user_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        userId: updatedUser.user_id,
        email: updatedUser.email,
        username: updatedUser.username,
        vpnUuid: updatedUser.vpn_uuid,
        status: updatedUser.status,
        trafficLimit: updatedUser.traffic_limit,
        trafficUsed: updatedUser.traffic_used,
        expireDate: updatedUser.expire_date,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
        version: updatedUser.version
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/users/:id - Delete user (soft delete)
router.delete('/:id', authMiddleware, validate(UserValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Try to find user by id (numeric) or user_id (string)
    let user = await db('users')
      .where('id', id)
      .where('status', '!=', 3)
      .first();

    // If not found by id, try user_id
    if (!user) {
      user = await db('users')
        .where('user_id', id)
        .where('status', '!=', 3)
        .first();
    }

    if (!user) {
      throw new NotFoundError('User', id);
    }

    await db('users')
      .where('user_id', user.user_id)
      .update({
        status: 3,
        updated_at: new Date(),
        version: user.version + 1
      });

    await db('user_history').insert({
      user_id: user.user_id,
      field_name: 'deleted',
      old_value: user.status,
      new_value: 3,
      changed_by: req.user?.username || 'system',
      ip_address: req.ip
    });

    logger.info(`User deleted: ${user.user_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/users/:id/ban - Ban user
router.post('/:id/ban', authMiddleware, validate(UserValidation.ban), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Try to find user by id (numeric) or user_id (string)
    let user = await db('users')
      .where('id', id)
      .where('status', '!=', 3)
      .first();

    // If not found by id, try user_id
    if (!user) {
      user = await db('users')
        .where('user_id', id)
        .where('status', '!=', 3)
        .first();
    }

    if (!user) {
      throw new NotFoundError('User', id);
    }

    await db('users')
      .where('user_id', user.user_id)
      .update({
        status: 2,
        updated_at: new Date(),
        version: user.version + 1
      });

    await db('user_history').insert({
      user_id: user.user_id,
      field_name: 'banned',
      old_value: String(user.status),
      new_value: '2',
      changed_by: req.user?.username || 'system',
      ip_address: req.ip
    });

    logger.info(`User banned: ${user.user_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'User banned successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/users/:id/unban - Unban user
router.post('/:id/unban', authMiddleware, validate(UserValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Try to find user by id (numeric) or user_id (string)
    let user = await db('users')
      .where('id', id)
      .where('status', '!=', 3)
      .first();

    // If not found by id, try user_id
    if (!user) {
      user = await db('users')
        .where('user_id', id)
        .where('status', '!=', 3)
        .first();
    }

    if (!user) {
      throw new NotFoundError('User', id);
    }

    await db('users')
      .where('user_id', user.user_id)
      .update({
        status: 1,
        updated_at: new Date(),
        version: user.version + 1
      });

    await db('user_history').insert({
      user_id: user.user_id,
      field_name: 'unbanned',
      old_value: user.status,
      new_value: 1,
      changed_by: req.user?.username || 'system',
      ip_address: req.ip
    });

    logger.info(`User unbanned: ${user.user_id} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/:id/traffic - Get user traffic stats
router.get('/:id/traffic', authMiddleware, validate(UserValidation.traffic), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    // Try to find user by id (numeric) or user_id (string)
    let user = await db('users')
      .where('id', id)
      .where('status', '!=', 3)
      .first();

    // If not found by id, try user_id
    if (!user) {
      user = await db('users')
        .where('user_id', id)
        .where('status', '!=', 3)
        .first();
    }

    if (!user) {
      throw new NotFoundError('User', id);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trafficStats = await db('traffic_stats_daily')
      .where('user_id', user.user_id)
      .where('stat_date', '>=', startDate.toISOString().split('T')[0])
      .orderBy('stat_date', 'asc')
      .select('*');

    const totalUpload = trafficStats.reduce((sum, stat) => sum + (stat.upload_bytes || 0), 0);
    const totalDownload = trafficStats.reduce((sum, stat) => sum + (stat.download_bytes || 0), 0);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        userId: id,
        trafficLimit: user.traffic_limit,
        trafficUsed: user.traffic_used,
        trafficRemaining: Math.max(0, user.traffic_limit - user.traffic_used),
        usagePercent: Math.round((user.traffic_used / user.traffic_limit) * 100),
        totalUpload,
        totalDownload,
        dailyStats: trafficStats.map(stat => ({
          date: stat.stat_date,
          upload: stat.upload_bytes,
          download: stat.download_bytes,
          total: stat.total_bytes
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/:id/orders - Get user orders
router.get('/:id/orders', authMiddleware, validate(UserValidation.byId), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Try to find user by id (numeric) or user_id (string)
    let user = await db('users')
      .where('id', id)
      .where('status', '!=', 3)
      .first();

    // If not found by id, try user_id
    if (!user) {
      user = await db('users')
        .where('user_id', id)
        .where('status', '!=', 3)
        .first();
    }

    if (!user) {
      throw new NotFoundError('User', id);
    }

    const [countResult] = await db('orders')
      .where('user_id', user.user_id)
      .count('* as count');
    const total = parseInt(countResult.count as string);

    const orders = await db('orders')
      .where('user_id', user.user_id)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select('*');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        items: orders.map(order => ({
          id: order.id,
          orderNo: order.order_no,
          userId: order.user_id,
          orderType: order.order_type,
          status: order.status,
          amount: order.amount,
          trafficLimit: order.traffic_limit,
          durationDays: order.duration_days,
          startDate: order.start_date,
          endDate: order.end_date,
          paymentMethod: order.payment_method,
          paymentTime: order.payment_time,
          createdAt: order.created_at,
          updatedAt: order.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };
