import type { Request, Response } from 'express';
import { successResponse } from '../../middleware/error-handler.js';
import { getPlatformHealth } from './platform-health.service.js';

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  successResponse(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
}

export async function readyHandler(_req: Request, res: Response): Promise<void> {
  const result = await getPlatformHealth();
  const allHealthy = result.status === 'healthy';
  res.status(allHealthy ? 200 : 503).json({ success: true, data: result, message: 'Readiness check' });
}
