import type { Request, Response } from 'express';
import { faceSearchSchema, idParamSchema } from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { faceSearchService } from './face-search.service.js';

export async function searchEventFacesHandler(req: Request, res: Response): Promise<void> {
  const { id: eventId } = idParamSchema.parse(req.params);
  const input = faceSearchSchema.parse(req.body);

  const result = await faceSearchService.searchByEmbedding(
    eventId,
    req.auth!.businessId,
    input.embedding,
    input.threshold,
    input.limit,
  );

  successResponse(res, result);
}
