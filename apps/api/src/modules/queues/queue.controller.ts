import type { Request, Response } from 'express';
import { z } from 'zod';
import { QUEUE_NAMES, type QueueName } from '@photo-platform/queues';
import { NotFoundError, ValidationError } from '../../common/errors.js';
import { successResponse } from '../../middleware/error-handler.js';
import { queueObservabilityService } from './queue-observability.service.js';

const queueNameSchema = z.enum(QUEUE_NAMES as unknown as [QueueName, ...QueueName[]]);

const queueParamSchema = z.object({
  name: queueNameSchema,
});

const jobParamSchema = z.object({
  name: queueNameSchema,
  jobId: z.string().min(1),
});

const listJobsQuerySchema = z.object({
  state: z.enum(['waiting', 'active', 'completed', 'failed', 'delayed', 'paused']).default('failed'),
  start: z.coerce.number().int().min(0).default(0),
  end: z.coerce.number().int().min(0).default(19),
});

export async function getQueuesOverviewHandler(_req: Request, res: Response): Promise<void> {
  const overview = await queueObservabilityService.getOverview();
  successResponse(res, overview);
}

export async function listQueueJobsHandler(req: Request, res: Response): Promise<void> {
  const { name } = queueParamSchema.parse(req.params);
  const query = listJobsQuerySchema.parse(req.query);

  if (query.end < query.start) {
    throw new ValidationError('end must be greater than or equal to start');
  }

  const jobs = await queueObservabilityService.listJobs(name, query.state, query.start, query.end);
  successResponse(res, { items: jobs, meta: { start: query.start, end: query.end, state: query.state } });
}

export async function retryQueueJobHandler(req: Request, res: Response): Promise<void> {
  const { name, jobId } = jobParamSchema.parse(req.params);

  try {
    const result = await queueObservabilityService.retryJob(name, jobId);
    successResponse(res, result, 'Job retry scheduled');
  } catch (error) {
    if (error instanceof Error && error.message === 'Job not found') {
      throw new NotFoundError('Job not found');
    }
    throw error;
  }
}

export async function removeQueueJobHandler(req: Request, res: Response): Promise<void> {
  const { name, jobId } = jobParamSchema.parse(req.params);

  try {
    const result = await queueObservabilityService.removeJob(name, jobId);
    successResponse(res, result, 'Job removed');
  } catch (error) {
    if (error instanceof Error && error.message === 'Job not found') {
      throw new NotFoundError('Job not found');
    }
    throw error;
  }
}
