import type { Request, Response } from 'express';
import { z } from 'zod';
import { successResponse } from '../../middleware/error-handler.js';
import { photoProcessingService } from '../../processing/photo-processing.service.js';

const photoParamSchema = z.object({ photoId: z.string().uuid() });

export async function retryPhotoProcessingHandler(req: Request, res: Response): Promise<void> {
  const { photoId } = photoParamSchema.parse(req.params);
  await photoProcessingService.retryProcessing(photoId, req.auth!.businessId);
  successResponse(res, { photoId, status: 'PROCESSING' }, 'Photo processing restarted');
}
