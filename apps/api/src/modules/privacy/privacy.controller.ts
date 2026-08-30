import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { guestSessionTokenParamSchema } from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { createAuditLog } from '../../common/audit.js';
import { privacyCleanupService } from './privacy-cleanup.service.js';
import { privacySettingsService } from './privacy-settings.service.js';

export async function deleteGuestDataHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const result = await privacyCleanupService.deleteGuestSessionData(sessionToken);

  await createAuditLog({
    action: 'FACE_DATA_DELETE',
    metadata: { sessionToken, ...result },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  successResponse(res, {
    deleted: result.sessionsRemoved > 0,
    sessionsRemoved: result.sessionsRemoved,
    selfiesRemoved: result.selfiesRemoved,
  });
}

export async function getPrivacySettingsHandler(_req: Request, res: Response): Promise<void> {
  const settings = await privacySettingsService.getSettings();
  successResponse(res, settings);
}

export async function updatePrivacySettingsHandler(req: Request, res: Response): Promise<void> {
  const settings = await privacySettingsService.updateSettings(req.body, req.auth!.userId);

  await createAuditLog({
    userId: req.auth!.userId,
    action: 'SETTINGS_UPDATE',
    entityType: 'privacy',
    metadata: settings as unknown as Prisma.InputJsonValue,
  });

  successResponse(res, settings, 'Privacy settings updated');
}

export async function runCleanupHandler(req: Request, res: Response): Promise<void> {
  const result = await privacyCleanupService.runCleanup();

  await createAuditLog({
    userId: req.auth!.userId,
    action: 'ADMIN_ACCESS',
    metadata: { action: 'run-cleanup', ...result },
  });

  successResponse(res, result, 'Cleanup completed');
}
