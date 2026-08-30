import { z } from 'zod';
import { ensureDotenvLoaded } from './load-dotenv.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  QDRANT_URL: z.string().default('http://localhost:6333'),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  STORAGE_DRIVER: z.enum(['vps', 's3']).default('vps'),
  STORAGE_ROOT: z.string().default('/data/photo-platform'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('photo-platform'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  CDN_URL: z.string().optional(),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  MAX_UPLOAD_BATCH: z.coerce.number().default(100),
  QDRANT_COLLECTION: z.string().default('photo_platform_faces'),
  PUBLIC_WEB_URL: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;
  ensureDotenvLoaded();
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  cachedEnv = result.data;
  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}

export { ensureDotenvLoaded, resetDotenvLoaded } from './load-dotenv.js';
