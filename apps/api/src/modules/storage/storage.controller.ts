import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTenant, requireSuperAdmin, requireMinimumRole } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import { successResponse } from '../../middleware/error-handler.js';
import { storageUsageService } from './storage-usage.service.js';
import { storageSettingsService } from './storage-settings.service.js';
import { storageSettingsSchema } from '@photo-platform/validation';
import { getStorageProvider } from '../../storage/storage.factory.js';
import { validateStorageKey, isTenantStorageKey } from '../../storage/path-security.js';
import { pipeline } from 'stream/promises';

export async function getBusinessStorageUsageHandler(req: Request, res: Response): Promise<void> {
  const usage = await storageUsageService.getBusinessUsage(req.auth!.businessId);
  successResponse(res, usage);
}

export async function getFileHandler(req: Request, res: Response): Promise<void> {
  const storageKey = req.query.key as string;
  if (!storageKey) {
    res.status(400).json({ success: false, error: { code: 'INVALID_KEY', message: 'Storage key required' } });
    return;
  }

  validateStorageKey(storageKey);

  if (!isTenantStorageKey(storageKey, req.auth!.businessId)) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    return;
  }

  const storage = getStorageProvider();
  const meta = await storage.getMetadata(storageKey);
  if (!meta) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not found' } });
    return;
  }

  const stream = await storage.download(storageKey);
  if (meta.mimeType) res.setHeader('Content-Type', meta.mimeType);
  res.setHeader('Content-Length', meta.size);
  await pipeline(stream, res);
}

export async function adminGetStorageSettingsHandler(_req: Request, res: Response): Promise<void> {
  const settings = await storageSettingsService.getSettings();
  successResponse(res, settings);
}

export async function adminUpdateStorageSettingsHandler(req: Request, res: Response): Promise<void> {
  const input = storageSettingsSchema.parse(req.body);
  const settings = await storageSettingsService.updateSettings(input, req.auth!.userId);
  successResponse(res, settings, 'Storage settings updated');
}

export async function adminListStorageUsageHandler(_req: Request, res: Response): Promise<void> {
  const usage = await storageUsageService.listAllForAdmin();
  successResponse(res, usage);
}

export const storageRouter = Router();

storageRouter.use(authenticate, requireTenant);
storageRouter.get('/usage', requireMinimumRole(UserRole.VIEWER), getBusinessStorageUsageHandler);
storageRouter.get('/file', requireMinimumRole(UserRole.VIEWER), getFileHandler);

export const adminStorageRouter = Router();

adminStorageRouter.get('/settings', authenticate, requireSuperAdmin, adminGetStorageSettingsHandler);
adminStorageRouter.patch('/settings', authenticate, requireSuperAdmin, adminUpdateStorageSettingsHandler);
adminStorageRouter.get('/usage', authenticate, requireSuperAdmin, adminListStorageUsageHandler);
