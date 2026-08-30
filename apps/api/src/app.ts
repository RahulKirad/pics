import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { loadEnv } from '@photo-platform/config';
import { logger } from './config/logger.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { businessRouter } from './modules/businesses/business.routes.js';
import { userRouter } from './modules/users/user.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { eventRouter } from './modules/events/event.routes.js';
import { uploadRouter } from './modules/uploads/upload.routes.js';
import { photoRouter } from './modules/photos/photo.routes.js';
import { storageRouter } from './modules/storage/storage.controller.js';
import { guestRouter } from './modules/guest/guest.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { billingRouter } from './modules/billing/billing.routes.js';
import { razorpayWebhookHandler } from './modules/billing/billing.controller.js';
import { connectDatabase, disconnectDatabase } from './database/client.js';
import { connectRedis, disconnectRedis } from './database/redis.js';

const env = loadEnv();

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.post(
    '/api/v1/billing/webhooks/razorpay',
    express.raw({ type: 'application/json' }),
    razorpayWebhookHandler,
  );
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: req.requestId }),
    }),
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.NODE_ENV === 'production' ? 100 : 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/api/v1', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/businesses', businessRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/events', eventRouter);
  app.use('/api/v1/uploads', uploadRouter);
  app.use('/api/v1/photos', photoRouter);
  app.use('/api/v1/storage', storageRouter);
  app.use('/api/v1/guest', guestRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/billing', billingRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export async function startServer(): Promise<void> {
  const app = createApp();
  const port = env.PORT;

  await connectDatabase();
  logger.info('Database connected');

  try {
    await connectRedis();
    logger.info('Redis connected');
  } catch (error) {
    logger.warn({ err: error }, 'Redis connection failed — continuing without Redis');
  }

  const server = app.listen(port, () => {
    logger.info({ port }, 'API server started');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await disconnectRedis();
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
