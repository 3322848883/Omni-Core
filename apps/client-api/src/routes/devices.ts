import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { successResponse } from '@/utils/response';
import db from '@/config/database';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const devices = await db('user_devices')
      .where({ user_id: userId })
      .where('last_active_at', '>', db.raw('datetime("now", "-30 days")'))
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

    successResponse(res, {
      devices: formattedDevices,
      total: formattedDevices.length
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:deviceId', async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const { deviceId } = req.params;

    const deleted = await db('user_devices')
      .where({ user_id: userId, device_id: deviceId })
      .delete();

    if (deleted) {
      successResponse(res, null, 'Device removed successfully');
    } else {
      successResponse(res, null, 'Device not found');
    }
  } catch (error) {
    next(error);
  }
});

router.put('/:deviceId/active', async (req, res, next) => {
  try {
    const userId = req.user!.user_id;
    const { deviceId } = req.params;
    const { isActive } = req.body;

    await db('user_devices')
      .where({ user_id: userId, device_id: deviceId })
      .update({ is_active: isActive });

    successResponse(res, null, 'Device status updated');
  } catch (error) {
    next(error);
  }
});

export default router;
