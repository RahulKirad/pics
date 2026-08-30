import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTenant, requireMinimumRole } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import {
  createEventHandler,
  listEventsHandler,
  getEventHandler,
  updateEventHandler,
  archiveEventHandler,
  restoreEventHandler,
  deleteEventHandler,
  eventStatsHandler,
} from './event.controller.js';
import { eventAnalyticsHandler } from '../analytics/analytics.controller.js';
import { folderRouter } from '../folders/folder.routes.js';
import { listEventPhotosHandler } from '../uploads/upload.controller.js';
import { searchEventFacesHandler } from '../faces/face-search.controller.js';
import { eventQrRouter } from '../qr/qr.routes.js';

export const eventRouter = Router();

eventRouter.use(authenticate, requireTenant);

eventRouter.get('/stats', requireMinimumRole(UserRole.VIEWER), eventStatsHandler);
eventRouter.get('/', requireMinimumRole(UserRole.VIEWER), listEventsHandler);
eventRouter.post('/', requireMinimumRole(UserRole.EDITOR), createEventHandler);
eventRouter.get('/:id/photos', requireMinimumRole(UserRole.VIEWER), listEventPhotosHandler);
eventRouter.get('/:id/analytics', requireMinimumRole(UserRole.VIEWER), eventAnalyticsHandler);
eventRouter.post('/:id/faces/search', requireMinimumRole(UserRole.VIEWER), searchEventFacesHandler);
eventRouter.use('/:id/qr', eventQrRouter);
eventRouter.get('/:id', requireMinimumRole(UserRole.VIEWER), getEventHandler);
eventRouter.patch('/:id', requireMinimumRole(UserRole.EDITOR), updateEventHandler);
eventRouter.post('/:id/archive', requireMinimumRole(UserRole.ADMIN), archiveEventHandler);
eventRouter.post('/:id/restore', requireMinimumRole(UserRole.ADMIN), restoreEventHandler);
eventRouter.delete('/:id', requireMinimumRole(UserRole.ADMIN), deleteEventHandler);

eventRouter.use('/:eventId/folders', folderRouter);
