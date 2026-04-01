import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Generate invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/v1/invites - Get all invite codes with pagination
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const createdBy = req.query.createdBy as string;

    let query = db('invite_codes');

    if (status) {
      query = query.where('status', status);
    }

    if (createdBy) {
      query = query.where('created_by', createdBy);
    }

    const [countResult] = await query.clone().count('* as count');
    const total = parseInt(countResult.count as string);

    const invites = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        items: invites.map(invite => ({
          id: invite.id,
          code: invite.code,
          status: invite.status,
          createdBy: invite.created_by,
          usedBy: invite.used_by,
          usedAt: invite.used_at,
          maxUses: invite.max_uses,
          usedCount: invite.used_count,
          trafficReward: invite.traffic_reward,
          daysReward: invite.days_reward,
          expireAt: invite.expire_at,
          createdAt: invite.created_at
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

// GET /api/v1/invites/:id - Get invite code by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const invite = await db('invite_codes')
      .where('id', id)
      .first();

    if (!invite) {
      throw new NotFoundError('Invite code', id);
    }

    // Get usage history
    const usageHistory = await db('invite_usage_history')
      .where('invite_code_id', invite.id)
      .orderBy('created_at', 'desc')
      .select('*');

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        id: invite.id,
        code: invite.code,
        status: invite.status,
        createdBy: invite.created_by,
        usedBy: invite.used_by,
        usedAt: invite.used_at,
        maxUses: invite.max_uses,
        usedCount: invite.used_count,
        trafficReward: invite.traffic_reward,
        daysReward: invite.days_reward,
        expireAt: invite.expire_at,
        createdAt: invite.created_at,
        usageHistory: usageHistory.map(usage => ({
          usedBy: usage.used_by,
          usedAt: usage.created_at,
          rewardGiven: usage.reward_given
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/invites - Create new invite code
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      count = 1,
      maxUses = 1,
      trafficReward = 0,
      daysReward = 0,
      expireDays = 30
    } = req.body;

    const codes = [];
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + expireDays);

    for (let i = 0; i < count; i++) {
      let code = generateInviteCode();

      // Ensure code is unique
      let existing = await db('invite_codes').where('code', code).first();
      while (existing) {
        code = generateInviteCode();
        existing = await db('invite_codes').where('code', code).first();
      }

      const [invite] = await db('invite_codes').insert({
        code,
        status: 'active',
        created_by: req.user?.username || 'system',
        used_by: null,
        used_at: null,
        max_uses: maxUses,
        used_count: 0,
        traffic_reward: trafficReward,
        days_reward: daysReward,
        expire_at: expireAt
      }).returning('*');

      codes.push({
        id: invite.id,
        code: invite.code,
        status: invite.status,
        maxUses: invite.max_uses,
        trafficReward: invite.traffic_reward,
        daysReward: invite.days_reward,
        expireAt: invite.expire_at
      });
    }

    logger.info(`${codes.length} invite codes created by ${req.user?.username || 'system'}`);

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Invite codes created successfully',
      data: count === 1 ? codes[0] : codes
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/invites/:id - Delete invite code
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const invite = await db('invite_codes')
      .where('id', id)
      .first();

    if (!invite) {
      throw new NotFoundError('Invite code', id);
    }

    await db('invite_codes')
      .where('id', id)
      .delete();

    logger.info(`Invite code deleted: ${invite.code} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Invite code deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/invites/:id/disable - Disable invite code
router.post('/:id/disable', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const invite = await db('invite_codes')
      .where('id', id)
      .first();

    if (!invite) {
      throw new NotFoundError('Invite code', id);
    }

    await db('invite_codes')
      .where('id', id)
      .update({
        status: 'disabled',
        updated_at: new Date()
      });

    logger.info(`Invite code disabled: ${invite.code} by ${req.user?.username || 'system'}`);

    res.json({
      success: true,
      code: 200,
      message: 'Invite code disabled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/invites/stats/overview - Get invite statistics
router.get('/stats/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalCodes = await db('invite_codes').count('* as count').first();
    const activeCodes = await db('invite_codes').where('status', 'active').count('* as count').first();
    const usedCodes = await db('invite_codes').where('status', 'used').count('* as count').first();
    const disabledCodes = await db('invite_codes').where('status', 'disabled').count('* as count').first();
    const expiredCodes = await db('invite_codes').where('status', 'expired').count('* as count').first();

    const totalUses = await db('invite_usage_history').count('* as count').first();

    // Recent usage
    const recentUsage = await db('invite_usage_history')
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('*');

    // Top inviters
    const topInviters = await db('invite_codes')
      .whereNotNull('used_by')
      .select('created_by')
      .count('* as count')
      .groupBy('created_by')
      .orderBy('count', 'desc')
      .limit(10);

    res.json({
      success: true,
      code: 200,
      message: 'success',
      data: {
        total: parseInt(totalCodes?.count as string) || 0,
        active: parseInt(activeCodes?.count as string) || 0,
        used: parseInt(usedCodes?.count as string) || 0,
        disabled: parseInt(disabledCodes?.count as string) || 0,
        expired: parseInt(expiredCodes?.count as string) || 0,
        totalUses: parseInt(totalUses?.count as string) || 0,
        recentUsage: recentUsage.map(u => ({
          inviteCodeId: u.invite_code_id,
          usedBy: u.used_by,
          usedAt: u.created_at,
          rewardGiven: u.reward_given
        })),
        topInviters: topInviters.map(i => ({
          username: i.created_by,
          inviteCount: parseInt(i.count as string)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/invites/validate - Validate and use invite code
router.post('/validate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      throw new ValidationError([
        { field: 'code', message: 'Invite code is required' },
        { field: 'userId', message: 'User ID is required' }
      ]);
    }

    const invite = await db('invite_codes')
      .where('code', code)
      .first();

    if (!invite) {
      throw new NotFoundError('Invite code', code);
    }

    // Check if code is active
    if (invite.status === 'used' && invite.used_count >= invite.max_uses) {
      throw new ValidationError([
        { field: 'code', message: 'Invite code has been fully used' }
      ]);
    }

    if (invite.status === 'disabled') {
      throw new ValidationError([
        { field: 'code', message: 'Invite code has been disabled' }
      ]);
    }

    if (invite.status === 'expired' || (invite.expire_at && new Date(invite.expire_at) < new Date())) {
      throw new ValidationError([
        { field: 'code', message: 'Invite code has expired' }
      ]);
    }

    // Check if user has already used this code
    const existingUsage = await db('invite_usage_history')
      .where({
        invite_code_id: invite.id,
        used_by: userId
      })
      .first();

    if (existingUsage) {
      throw new ValidationError([
        { field: 'code', message: 'You have already used this invite code' }
      ]);
    }

    // Record usage
    await db('invite_usage_history').insert({
      invite_code_id: invite.id,
      used_by: userId,
      reward_given: true
    });

    // Update invite code
    const newUsedCount = (invite.used_count || 0) + 1;
    const newStatus = newUsedCount >= invite.max_uses ? 'used' : 'active';

    await db('invite_codes')
      .where('id', invite.id)
      .update({
        used_count: newUsedCount,
        used_by: newStatus === 'used' ? userId : invite.used_by,
        used_at: new Date(),
        status: newStatus,
        updated_at: new Date()
      });

    // Apply rewards to user
    const user = await db('users').where('user_id', userId).first();
    if (user) {
      const updateData: any = {
        updated_at: new Date()
      };

      if (invite.traffic_reward > 0) {
        updateData.traffic_limit = (user.traffic_limit || 0) + invite.traffic_reward;
      }

      if (invite.days_reward > 0) {
        const currentExpire = user.expire_date ? new Date(user.expire_date) : new Date();
        if (currentExpire < new Date()) {
          currentExpire.setTime(new Date().getTime());
        }
        currentExpire.setDate(currentExpire.getDate() + invite.days_reward);
        updateData.expire_date = currentExpire;
      }

      await db('users')
        .where('user_id', userId)
        .update(updateData);
    }

    // Reward the inviter
    if (invite.created_by) {
      const inviter = await db('users')
        .where('username', invite.created_by)
        .orWhere('user_id', invite.created_by)
        .first();

      if (inviter) {
        await db('users')
          .where('user_id', inviter.user_id)
          .update({
            traffic_limit: (inviter.traffic_limit || 0) + 1073741824, // 1GB reward
            updated_at: new Date()
          });
      }
    }

    logger.info(`Invite code ${code} used by ${userId}`);

    res.json({
      success: true,
      code: 200,
      message: 'Invite code applied successfully',
      data: {
        trafficReward: invite.traffic_reward,
        daysReward: invite.days_reward,
        remainingUses: invite.max_uses - newUsedCount
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as inviteRoutes };
