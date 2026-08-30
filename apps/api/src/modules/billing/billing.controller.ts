import type { Request, Response } from 'express';
import { billingCheckoutSchema, billingVerifySchema } from '@photo-platform/validation';
import { successResponse } from '../../middleware/error-handler.js';
import { billingService } from './billing.service.js';
import { verifyWebhookSignature } from './razorpay.client.js';

export async function listPlansHandler(_req: Request, res: Response): Promise<void> {
  const plans = await billingService.listPlans();
  successResponse(res, plans);
}

export async function billingOverviewHandler(req: Request, res: Response): Promise<void> {
  const overview = await billingService.getOverview(req.auth!.businessId);
  successResponse(res, overview);
}

export async function createCheckoutHandler(req: Request, res: Response): Promise<void> {
  const input = billingCheckoutSchema.parse(req.body);
  const checkout = await billingService.createCheckout(
    req.auth!.businessId,
    req.auth!.userId,
    input,
  );
  successResponse(res, checkout, 'Checkout order created', 201);
}

export async function verifyPaymentHandler(req: Request, res: Response): Promise<void> {
  const input = billingVerifySchema.parse(req.body);
  const result = await billingService.verifyPayment(
    req.auth!.businessId,
    req.auth!.userId,
    input,
  );
  successResponse(res, result, 'Payment verified');
}

export async function listInvoicesHandler(req: Request, res: Response): Promise<void> {
  const invoices = await billingService.listInvoices(req.auth!.businessId);
  successResponse(res, invoices);
}

export async function razorpayWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.headers['x-razorpay-signature'];
  if (typeof signature !== 'string') {
    res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Missing signature' } });
    return;
  }

  const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
    return;
  }

  const payload = JSON.parse(rawBody) as {
    event: string;
    payload: Record<string, { entity: Record<string, unknown> }>;
  };

  await billingService.handleWebhookEvent(payload.event, payload.payload);
  res.status(200).json({ success: true });
}
