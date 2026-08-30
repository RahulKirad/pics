import type { Request, Response } from 'express';
import {
  eventTokenParamSchema,
  guestConsentSchema,
  guestPhotoFileQuerySchema,
  guestPhotoIdParamSchema,
  guestSearchIdParamSchema,
  guestSelfieSchema,
  guestSessionTokenParamSchema,
} from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { guestService } from './guest.service.js';
import { guestSelfieService } from './guest-selfie.service.js';
import { guestSearchService } from './guest-search.service.js';
import { guestEngagementService } from './guest-engagement.service.js';
import { getStorageProvider } from '../../storage/storage.factory.js';
import { pipeline } from 'stream/promises';

export async function getGuestEventHandler(req: Request, res: Response): Promise<void> {
  const { eventToken } = eventTokenParamSchema.parse(req.params);
  const event = await guestService.getPublicEvent(eventToken);
  successResponse(res, event);
}

export async function createGuestSessionHandler(req: Request, res: Response): Promise<void> {
  const { eventToken } = eventTokenParamSchema.parse(req.params);
  const session = await guestService.createSession(eventToken, req);
  successResponse(res, session, 'Guest session created', 201);
}

export async function getGuestSessionHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const session = await guestService.getSession(sessionToken);
  successResponse(res, session);
}

export async function recordGuestConsentHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const input = guestConsentSchema.parse(req.body);
  const result = await guestService.recordConsent(sessionToken, input.consentVersion, req);
  successResponse(res, result, 'Consent recorded');
}

export async function validateGuestSelfieHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const input = guestSelfieSchema.parse(req.body);
  const result = await guestSelfieService.validateSelfie(sessionToken, input);
  successResponse(res, result);
}

export async function submitGuestSelfieHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const input = guestSelfieSchema.parse(req.body);
  const result = await guestSelfieService.submitSelfie(sessionToken, input);
  successResponse(res, result, 'Selfie submitted', 201);
}

export async function getGuestSearchStatusHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const { searchId } = guestSearchIdParamSchema.parse(req.params);
  const result = await guestSearchService.getSearchResult(sessionToken, searchId);
  successResponse(res, result);
}

export async function getGuestPhotoFileHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const { photoId } = guestPhotoIdParamSchema.parse(req.params);
  const { variant } = guestPhotoFileQuerySchema.parse(req.query);
  const { key, mimeType } = await guestSearchService.resolveGuestPhotoKey(
    sessionToken,
    photoId,
    variant,
  );
  const storage = getStorageProvider();
  const stream = await storage.download(key);
  res.setHeader('Content-Type', mimeType);
  await pipeline(stream, res);
}

export async function toggleGuestFavoriteHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const { photoId } = guestPhotoIdParamSchema.parse(req.params);
  const result = await guestEngagementService.toggleFavorite(sessionToken, photoId);
  successResponse(res, result);
}

export async function downloadGuestPhotoHandler(req: Request, res: Response): Promise<void> {
  const { sessionToken } = guestSessionTokenParamSchema.parse(req.params);
  const { photoId } = guestPhotoIdParamSchema.parse(req.params);
  const { key, mimeType, filename } = await guestEngagementService.resolveDownload(
    sessionToken,
    photoId,
    req,
  );
  const storage = getStorageProvider();
  const stream = await storage.download(key);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
  await pipeline(stream, res);
}
