import type { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { authService, REFRESH_COOKIE } from './auth.service.js';

function getClientMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  };
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const session = await authService.register(input, res, getClientMeta(req));
  successResponse(res, session, 'Account created successfully', 201);
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const session = await authService.login(input, res, getClientMeta(req));
  successResponse(res, session, 'Signed in successfully');
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token required' },
    });
    return;
  }
  const session = await authService.refresh(token, res);
  successResponse(res, session, 'Token refreshed');
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(token, res, req.auth?.userId);
  successResponse(res, null, 'Signed out successfully');
}

export async function forgotPasswordHandler(req: Request, res: Response): Promise<void> {
  const input = forgotPasswordSchema.parse(req.body);
  const result = await authService.forgotPassword(input.email);
  successResponse(res, result, result.message);
}

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  const input = resetPasswordSchema.parse(req.body);
  const result = await authService.resetPassword(input.token, input.password);
  successResponse(res, result, result.message);
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.auth!.userId);
  successResponse(res, user, 'Success');
}

export async function verifyEmailHandler(_req: Request, res: Response): Promise<void> {
  // Scaffolding — email delivery in a future phase
  successResponse(res, { verified: false }, 'Email verification endpoint ready');
}
