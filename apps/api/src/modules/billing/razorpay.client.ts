import crypto from 'crypto';
import { loadEnv } from '@photo-platform/config';
import { AppError } from '../../common/errors.js';

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

function getCredentials() {
  const env = loadEnv();
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  return { keyId, keySecret, webhookSecret: env.RAZORPAY_WEBHOOK_SECRET };
}

export function buildPaymentSignature(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

export function buildWebhookSignature(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function isRazorpayConfigured(): boolean {
  return getCredentials() !== null;
}

export function getRazorpayKeyId(): string | null {
  return getCredentials()?.keyId ?? null;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const credentials = getCredentials();
  if (!credentials) return false;

  const expected = buildPaymentSignature(orderId, paymentId, credentials.keySecret);

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const credentials = getCredentials();
  if (!credentials?.webhookSecret) return false;

  const expected = buildWebhookSignature(body, credentials.webhookSecret);

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  const credentials = getCredentials();
  if (!credentials) {
    throw new AppError('BILLING_NOT_CONFIGURED', 'Razorpay is not configured', 503);
  }

  const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      'RAZORPAY_ORDER_FAILED',
      `Failed to create Razorpay order: ${errorBody}`,
      502,
    );
  }

  return response.json() as Promise<RazorpayOrderResponse>;
}
