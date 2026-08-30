import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireSuperAdmin } from '../../middleware/authorize.js';
import { adminBusinessRouter } from '../businesses/business.routes.js';
import { adminUserRouter } from '../users/user.routes.js';
import { adminStorageRouter } from '../storage/storage.controller.js';
import { adminQueueRouter } from '../queues/queue.routes.js';
import {
  adminPlatformOverviewHandler,
  adminListEventsHandler,
  adminListPhotosHandler,
  adminListSubscriptionsHandler,
  adminListPaymentsHandler,
  adminListAuditLogsHandler,
  adminSecurityAuditHandler,
  adminRunCleanupHandler,
  adminGetPrivacySettingsHandler,
  adminUpdatePrivacySettingsHandler,
} from './admin.controller.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireSuperAdmin);

adminRouter.get('/overview', adminPlatformOverviewHandler);
adminRouter.get('/events', adminListEventsHandler);
adminRouter.get('/photos', adminListPhotosHandler);
adminRouter.get('/subscriptions', adminListSubscriptionsHandler);
adminRouter.get('/payments', adminListPaymentsHandler);
adminRouter.get('/audit-logs', adminListAuditLogsHandler);
adminRouter.get('/security-audit', adminSecurityAuditHandler);
adminRouter.get('/privacy-settings', adminGetPrivacySettingsHandler);
adminRouter.patch('/privacy-settings', adminUpdatePrivacySettingsHandler);
adminRouter.post('/cleanup/run', adminRunCleanupHandler);
adminRouter.use('/businesses', adminBusinessRouter);
adminRouter.use('/users', adminUserRouter);
adminRouter.use('/storage', adminStorageRouter);
adminRouter.use('/queues', adminQueueRouter);
