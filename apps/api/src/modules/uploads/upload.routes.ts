import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTenant, requireMinimumRole } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import { uploadRateLimit } from '../../middleware/rate-limits.js';
import {
  createUploadSessionHandler,
  getUploadSessionHandler,
  uploadChunkHandler,
  completeUploadHandler,
  cancelUploadHandler,
  chunkUploadMiddleware,
} from './upload.controller.js';

export const uploadRouter = Router();

uploadRouter.use(authenticate, requireTenant, uploadRateLimit);

uploadRouter.post('/sessions', requireMinimumRole(UserRole.UPLOADER), createUploadSessionHandler);
uploadRouter.get('/sessions/:id', requireMinimumRole(UserRole.UPLOADER), getUploadSessionHandler);
uploadRouter.put('/sessions/:id/chunks/:chunkIndex', requireMinimumRole(UserRole.UPLOADER), chunkUploadMiddleware, uploadChunkHandler);
uploadRouter.post('/sessions/:id/complete', requireMinimumRole(UserRole.UPLOADER), completeUploadHandler);
uploadRouter.delete('/sessions/:id', requireMinimumRole(UserRole.UPLOADER), cancelUploadHandler);
