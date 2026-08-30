import type { Request, Response } from 'express';
import { successResponse } from '../../middleware/error-handler.js';
import { businessService } from './business.service.js';

export async function getMyBusinessHandler(req: Request, res: Response): Promise<void> {
  const business = await businessService.getMyBusiness(req.auth!.businessId);
  successResponse(res, business);
}

export async function getMembersHandler(req: Request, res: Response): Promise<void> {
  const members = await businessService.getMembers(req.auth!.businessId, req.auth!.businessId);
  successResponse(res, members);
}

export async function adminListBusinessesHandler(_req: Request, res: Response): Promise<void> {
  const businesses = await businessService.listAllForAdmin();
  successResponse(res, businesses);
}
