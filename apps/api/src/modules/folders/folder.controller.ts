import type { Request, Response } from 'express';
import { createFolderSchema, updateFolderSchema, idParamSchema } from '@photo-platform/validation';
import { z } from 'zod';
import { successResponse } from '../../middleware/error-handler.js';
import { folderService } from './folder.service.js';

const eventIdParamSchema = z.object({ eventId: z.string().uuid() });
const folderIdParamSchema = z.object({ eventId: z.string().uuid(), folderId: z.string().uuid() });

export async function listFoldersHandler(req: Request, res: Response): Promise<void> {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const folders = await folderService.list(eventId, req.auth!.businessId);
  successResponse(res, folders);
}

export async function createFolderHandler(req: Request, res: Response): Promise<void> {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const input = createFolderSchema.parse(req.body);
  const folder = await folderService.create(eventId, req.auth!.businessId, input);
  successResponse(res, folder, 'Folder created', 201);
}

export async function updateFolderHandler(req: Request, res: Response): Promise<void> {
  const { eventId, folderId } = folderIdParamSchema.parse(req.params);
  const input = updateFolderSchema.parse(req.body);
  const folder = await folderService.update(eventId, req.auth!.businessId, folderId, input);
  successResponse(res, folder, 'Folder updated');
}

export async function deleteFolderHandler(req: Request, res: Response): Promise<void> {
  const { eventId, folderId } = folderIdParamSchema.parse(req.params);
  await folderService.delete(eventId, req.auth!.businessId, folderId);
  successResponse(res, null, 'Folder deleted');
}
