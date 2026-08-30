import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTenant, requireMinimumRole } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import {
  listEventQrCodesHandler,
  generateEventQrCodeHandler,
  previewEventQrCodeHandler,
  downloadEventQrCodeHandler,
} from './qr.controller.js';

export const eventQrRouter = Router({ mergeParams: true });

eventQrRouter.use(authenticate, requireTenant);

eventQrRouter.get('/', requireMinimumRole(UserRole.VIEWER), listEventQrCodesHandler);
eventQrRouter.post('/generate', requireMinimumRole(UserRole.EDITOR), generateEventQrCodeHandler);
eventQrRouter.get('/:qrId/preview', requireMinimumRole(UserRole.VIEWER), previewEventQrCodeHandler);
eventQrRouter.get('/:qrId/download', requireMinimumRole(UserRole.VIEWER), downloadEventQrCodeHandler);
