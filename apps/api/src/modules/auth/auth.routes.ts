import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  meHandler,
  verifyEmailHandler,
} from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' },
  },
});

export const authRouter = Router();

authRouter.post('/register', authRateLimit, registerHandler);
authRouter.post('/login', authRateLimit, loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', authenticate, logoutHandler);
authRouter.post('/forgot-password', authRateLimit, forgotPasswordHandler);
authRouter.post('/reset-password', authRateLimit, resetPasswordHandler);
authRouter.post('/verify-email', verifyEmailHandler);
authRouter.get('/me', authenticate, meHandler);
