import { Router } from 'express';
import { healthHandler, readyHandler } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/health', healthHandler);
healthRouter.get('/ready', readyHandler);
