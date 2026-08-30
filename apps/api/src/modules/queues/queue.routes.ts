import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireSuperAdmin } from '../../middleware/authorize.js';
import {
  getQueuesOverviewHandler,
  listQueueJobsHandler,
  retryQueueJobHandler,
  removeQueueJobHandler,
} from './queue.controller.js';

export const adminQueueRouter = Router();

adminQueueRouter.use(authenticate, requireSuperAdmin);
adminQueueRouter.get('/', getQueuesOverviewHandler);
adminQueueRouter.get('/:name/jobs', listQueueJobsHandler);
adminQueueRouter.post('/:name/jobs/:jobId/retry', retryQueueJobHandler);
adminQueueRouter.delete('/:name/jobs/:jobId', removeQueueJobHandler);
