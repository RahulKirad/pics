import type { Request, Response } from 'express';
import { successResponse } from '../../middleware/error-handler.js';
import { userService } from './user.service.js';

export async function updateProfileHandler(req: Request, res: Response): Promise<void> {
  const user = await userService.updateProfile(req.auth!.userId, req.body);
  successResponse(res, user, 'Profile updated');
}

export async function adminListUsersHandler(_req: Request, res: Response): Promise<void> {
  const users = await userService.listAllForAdmin();
  successResponse(res, users);
}
