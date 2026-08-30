import type { Request, Response } from 'express';
import { createEventSchema, updateEventSchema, listEventsQuerySchema, idParamSchema } from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { eventService } from './event.service.js';

export async function createEventHandler(req: Request, res: Response): Promise<void> {
  const input = createEventSchema.parse(req.body);
  const event = await eventService.create(req.auth!.businessId, req.auth!.userId, input);
  successResponse(res, event, 'Event created', 201);
}

export async function listEventsHandler(req: Request, res: Response): Promise<void> {
  const query = listEventsQuerySchema.parse(req.query);
  const result = await eventService.list(req.auth!.businessId, query);
  successResponse(res, result);
}

export async function getEventHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const event = await eventService.getById(id, req.auth!.businessId);
  successResponse(res, event);
}

export async function updateEventHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const input = updateEventSchema.parse(req.body);
  const event = await eventService.update(id, req.auth!.businessId, req.auth!.userId, input);
  successResponse(res, event, 'Event updated');
}

export async function archiveEventHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const event = await eventService.archive(id, req.auth!.businessId, req.auth!.userId);
  successResponse(res, event, 'Event archived');
}

export async function restoreEventHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const event = await eventService.restore(id, req.auth!.businessId, req.auth!.userId);
  successResponse(res, event, 'Event restored');
}

export async function deleteEventHandler(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  await eventService.delete(id, req.auth!.businessId, req.auth!.userId);
  successResponse(res, null, 'Event deleted');
}

export async function eventStatsHandler(req: Request, res: Response): Promise<void> {
  const stats = await eventService.getStats(req.auth!.businessId);
  successResponse(res, stats);
}
