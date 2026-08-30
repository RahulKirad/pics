import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTenant, requireMinimumRole } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import { retryPhotoProcessingHandler } from './photo.controller.js';

export const photoRouter = Router();

photoRouter.use(authenticate, requireTenant);
photoRouter.post('/:photoId/retry-processing', requireMinimumRole(UserRole.EDITOR), retryPhotoProcessingHandler);
