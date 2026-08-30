import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTenant, requireMinimumRole } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import {
  listPlansHandler,
  billingOverviewHandler,
  createCheckoutHandler,
  verifyPaymentHandler,
  listInvoicesHandler,
} from './billing.controller.js';

export const billingRouter = Router();

billingRouter.get('/plans', listPlansHandler);
billingRouter.use(authenticate, requireTenant);
billingRouter.get('/overview', requireMinimumRole(UserRole.VIEWER), billingOverviewHandler);
billingRouter.get('/invoices', requireMinimumRole(UserRole.VIEWER), listInvoicesHandler);
billingRouter.post('/checkout', requireMinimumRole(UserRole.OWNER), createCheckoutHandler);
billingRouter.post('/verify', requireMinimumRole(UserRole.OWNER), verifyPaymentHandler);
