import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTenant, requireMinimumRole } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import { businessAnalyticsHandler } from './analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate, requireTenant);
analyticsRouter.get('/overview', requireMinimumRole(UserRole.VIEWER), businessAnalyticsHandler);
