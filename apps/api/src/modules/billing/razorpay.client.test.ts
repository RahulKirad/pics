import { describe, it, expect } from 'vitest';
import { buildPaymentSignature, buildWebhookSignature } from './razorpay.client.js';

describe('razorpay signature helpers', () => {
  it('builds payment signatures', () => {
    const signature = buildPaymentSignature('order_123', 'pay_456', 'test_secret');
    expect(signature).toHaveLength(64);
    expect(buildPaymentSignature('order_123', 'pay_456', 'test_secret')).toBe(signature);
  });

  it('builds webhook signatures', () => {
    const body = '{"event":"payment.captured"}';
    const signature = buildWebhookSignature(body, 'webhook_secret');
    expect(signature).toHaveLength(64);
  });
});
