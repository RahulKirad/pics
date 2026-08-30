import type { Request, Response } from 'express';
import { adminListQuerySchema } from '@photo-platform/validation';
import { createAuditLog } from '../../common/audit.js';
import { successResponse } from '../../middleware/error-handler.js';
import { adminService } from './admin.service.js';
import { securityAuditService } from '../security/security-audit.service.js';
import {
  getPrivacySettingsHandler,
  updatePrivacySettingsHandler,
  runCleanupHandler,
} from '../privacy/privacy.controller.js';

export async function adminPlatformOverviewHandler(req: Request, res: Response): Promise<void> {
  await createAuditLog({
    userId: req.auth!.userId,
    action: 'ADMIN_ACCESS',
    metadata: { route: '/admin/overview' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const overview = await adminService.getPlatformOverview();
  successResponse(res, overview);
}

export async function adminListEventsHandler(req: Request, res: Response): Promise<void> {
  const query = adminListQuerySchema.parse(req.query);
  const result = await adminService.listEvents(query);
  successResponse(res, result);
}

export async function adminListPhotosHandler(req: Request, res: Response): Promise<void> {
  const query = adminListQuerySchema.parse(req.query);
  const result = await adminService.listPhotos(query);
  successResponse(res, result);
}

export async function adminListSubscriptionsHandler(req: Request, res: Response): Promise<void> {
  const query = adminListQuerySchema.parse(req.query);
  const result = await adminService.listSubscriptions(query);
  successResponse(res, result);
}

export async function adminListPaymentsHandler(req: Request, res: Response): Promise<void> {
  const query = adminListQuerySchema.parse(req.query);
  const result = await adminService.listPayments(query);
  successResponse(res, result);
}

export async function adminListAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const query = adminListQuerySchema.parse(req.query);
  const result = await adminService.listAuditLogs(query);
  successResponse(res, result);
}

export async function adminSecurityAuditHandler(_req: Request, res: Response): Promise<void> {
  const report = await securityAuditService.runAudit();
  successResponse(res, report);
}

export async function adminRunCleanupHandler(req: Request, res: Response): Promise<void> {
  await runCleanupHandler(req, res);
}

export { getPrivacySettingsHandler as adminGetPrivacySettingsHandler, updatePrivacySettingsHandler as adminUpdatePrivacySettingsHandler };
