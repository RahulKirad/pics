import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireSuperAdmin } from '../../middleware/authorize.js';
import { updateProfileHandler, adminListUsersHandler } from './user.controller.js';

export const userRouter = Router();

userRouter.patch('/me', authenticate, updateProfileHandler);

export const adminUserRouter = Router();
adminUserRouter.get('/', authenticate, requireSuperAdmin, adminListUsersHandler);
