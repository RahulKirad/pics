import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTenant, requireMinimumRole, requireSuperAdmin } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import {
  getMyBusinessHandler,
  getMembersHandler,
  adminListBusinessesHandler,
} from './business.controller.js';

export const businessRouter = Router();

businessRouter.get('/me', authenticate, requireTenant, getMyBusinessHandler);
businessRouter.get('/me/members', authenticate, requireTenant, requireMinimumRole(UserRole.ADMIN), getMembersHandler);

export const adminBusinessRouter = Router();
adminBusinessRouter.get('/', authenticate, requireSuperAdmin, adminListBusinessesHandler);
