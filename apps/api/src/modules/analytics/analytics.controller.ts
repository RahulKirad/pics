import type { Request, Response } from 'express';
import { analyticsQuerySchema, idParamSchema } from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { analyticsService } from './analytics.service.js';

export async function businessAnalyticsHandler(req: Request, res: Response): Promise<void> {
  const query = analyticsQuerySchema.parse(req.query);
  const overview = await analyticsService.getBusinessOverview(req.auth!.businessId, query.days);
  successResponse(res, overview);
}

export async function eventAnalyticsHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const query = analyticsQuerySchema.parse(req.query);
  const analytics = await analyticsService.getEventAnalytics(
    id,
    req.auth!.businessId,
    query.days,
  );
  successResponse(res, analytics);
}
