import { logDebug } from '@/lib/bolt/debug-log';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong';
}

export function captureServiceError(scope: string, error: unknown, context?: Record<string, unknown>) {
  logDebug('error', scope, { error, context });
  return getErrorMessage(error);
}
