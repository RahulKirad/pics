import { Router } from 'express';
import {
  guestApiRateLimit,
  guestSelfieRateLimit,
  guestSessionRateLimit,
} from '../../middleware/rate-limits.js';
import {
  createGuestSessionHandler,
  getGuestEventHandler,
  getGuestSessionHandler,
  recordGuestConsentHandler,
  getGuestSearchStatusHandler,
  submitGuestSelfieHandler,
  validateGuestSelfieHandler,
  getGuestPhotoFileHandler,
  toggleGuestFavoriteHandler,
  downloadGuestPhotoHandler,
} from './guest.controller.js';
import { deleteGuestDataHandler } from '../privacy/privacy.controller.js';

export const guestRouter = Router();

guestRouter.use(guestApiRateLimit);

guestRouter.get('/events/:eventToken', getGuestEventHandler);
guestRouter.post('/events/:eventToken/sessions', guestSessionRateLimit, createGuestSessionHandler);
guestRouter.get('/sessions/:sessionToken', getGuestSessionHandler);
guestRouter.post('/sessions/:sessionToken/consent', recordGuestConsentHandler);
guestRouter.post('/sessions/:sessionToken/selfie/validate', guestSelfieRateLimit, validateGuestSelfieHandler);
guestRouter.post('/sessions/:sessionToken/selfie', guestSelfieRateLimit, submitGuestSelfieHandler);
guestRouter.delete('/sessions/:sessionToken/data', deleteGuestDataHandler);
guestRouter.get('/sessions/:sessionToken/searches/:searchId', getGuestSearchStatusHandler);
guestRouter.get('/sessions/:sessionToken/photos/:photoId/file', getGuestPhotoFileHandler);
guestRouter.get('/sessions/:sessionToken/photos/:photoId/download', downloadGuestPhotoHandler);
guestRouter.post('/sessions/:sessionToken/photos/:photoId/favorite', toggleGuestFavoriteHandler);
