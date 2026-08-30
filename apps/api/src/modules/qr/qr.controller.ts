import type { Request, Response } from 'express';
import { z } from 'zod';
import { generateQrCodeSchema, idParamSchema } from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { qrService } from './qr.service.js';

const qrParamSchema = z.object({
  id: z.string().uuid(),
  qrId: z.string().uuid(),
});

const downloadQuerySchema = z.object({
  format: z.enum(['png', 'svg']).default('png'),
});

export async function listEventQrCodesHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const result = await qrService.listForEvent(id, req.auth!.businessId);
  successResponse(res, result);
}

export async function generateEventQrCodeHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const input = generateQrCodeSchema.parse(req.body ?? {});
  const qr = await qrService.generate(id, req.auth!.businessId, input);
  successResponse(res, qr, 'QR code generated', 201);
}

export async function previewEventQrCodeHandler(req: Request, res: Response): Promise<void> {
  const { id, qrId } = qrParamSchema.parse({ id: req.params.id, qrId: req.params.qrId });
  const { format } = downloadQuerySchema.parse(req.query);
  const preview = await qrService.getPreview(id, req.auth!.businessId, qrId, format);
  res.setHeader('Content-Type', preview.contentType);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(preview.body);
}

export async function downloadEventQrCodeHandler(req: Request, res: Response): Promise<void> {
  const { id, qrId } = qrParamSchema.parse({ id: req.params.id, qrId: req.params.qrId });
  const { format } = downloadQuerySchema.parse(req.query);
  const file = await qrService.getDownload(id, req.auth!.businessId, qrId, format);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.send(file.body);
}
