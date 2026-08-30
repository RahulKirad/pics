import type { Request, Response } from 'express';
import express from 'express';
import { z } from 'zod';
import { createUploadSessionSchema, completeUploadSchema, idParamSchema } from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { uploadService } from './upload.service.js';

const sessionParamSchema = z.object({ id: z.string().uuid() });
const chunkParamSchema = z.object({
  id: z.string().uuid(),
  chunkIndex: z.coerce.number().int().min(0),
});

export async function createUploadSessionHandler(req: Request, res: Response): Promise<void> {
  const input = createUploadSessionSchema.parse(req.body);
  const result = await uploadService.createSession(req.auth!.businessId, req.auth!.userId, input);
  successResponse(res, result, result.isDuplicate ? 'Already uploaded' : 'Upload session created', result.isDuplicate ? 200 : 201);
}

export async function getUploadSessionHandler(req: Request, res: Response): Promise<void> {
  const { id } = sessionParamSchema.parse(req.params);
  const session = await uploadService.getSession(id, req.auth!.businessId);
  successResponse(res, session);
}

export async function uploadChunkHandler(req: Request, res: Response): Promise<void> {
  const { id, chunkIndex } = chunkParamSchema.parse(req.params);
  const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? []);
  const result = await uploadService.uploadChunk(id, req.auth!.businessId, chunkIndex, buffer);
  successResponse(res, result, 'Chunk uploaded');
}

export async function completeUploadHandler(req: Request, res: Response): Promise<void> {
  const { id } = sessionParamSchema.parse(req.params);
  const input = completeUploadSchema.parse(req.body ?? {});
  const result = await uploadService.completeUpload(id, req.auth!.businessId, req.auth!.userId, input);
  successResponse(res, result, 'Upload completed');
}

export async function cancelUploadHandler(req: Request, res: Response): Promise<void> {
  const { id } = sessionParamSchema.parse(req.params);
  await uploadService.cancelUpload(id, req.auth!.businessId);
  successResponse(res, null, 'Upload cancelled');
}

export async function listEventPhotosHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const cursor = req.query.cursor as string | undefined;
  const result = await uploadService.listPhotos(id, req.auth!.businessId, cursor);
  successResponse(res, result);
}

export const chunkUploadMiddleware = express.raw({
  type: 'application/octet-stream',
  limit: '10mb',
});
