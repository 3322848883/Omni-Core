import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import subscriptionRoutes from './subscription';
import nodeRoutes from './nodes';
import trafficRoutes from './traffic';
import orderRoutes from './orders';
import inviteRoutes from './invites';
import { xrayRoutes } from './xray';
import devicesRoutes from './devices';
import siteConfigRoutes from './site-config';

const router = Router();

// Public routes (no auth required)
router.use('/site-config', siteConfigRoutes);

// Auth routes (public)
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', userRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/nodes', nodeRoutes);
router.use('/traffic', trafficRoutes);
router.use('/orders', orderRoutes);
router.use('/invites', inviteRoutes);

// Xray routes
router.use('/xray', xrayRoutes);

// Device routes
router.use('/devices', devicesRoutes);

export default router;
