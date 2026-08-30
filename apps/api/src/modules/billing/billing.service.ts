import type {
  BillingOverview,
  CheckoutOrderResult,
  InvoiceSummary,
  PaymentVerifyResult,
  PlanSummary,
  PlanTier,
  SubscriptionStatus,
  SubscriptionSummary,
} from '@photo-platform/shared-types';
import type { BillingCheckoutInput } from '@photo-platform/validation';
import type { Plan, Subscription } from '@prisma/client';
import { ValidationError } from '../../common/errors.js';
import { createAuditLog } from '../../common/audit.js';
import { billingRepository } from './billing.repository.js';
import { quotaService } from './quota.service.js';
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from './razorpay.client.js';

function serializePlan(plan: Plan): PlanSummary {
  return {
    id: plan.id,
    tier: plan.tier as PlanTier,
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.priceMonthly,
    priceYearly: plan.priceYearly,
    maxEvents: plan.maxEvents,
    maxStorageGb: plan.maxStorageGb,
    maxPhotos: plan.maxPhotos,
    maxAiProcessing: plan.maxAiProcessing,
    maxFaceSearches: plan.maxFaceSearches,
    maxBandwidthGb: plan.maxBandwidthGb,
    maxDownloads: plan.maxDownloads,
    maxTeamMembers: plan.maxTeamMembers,
    brandingEnabled: plan.brandingEnabled,
  };
}

function serializeSubscription(
  subscription: Subscription & { plan: Plan },
): SubscriptionSummary {
  return {
    id: subscription.id,
    status: subscription.status as SubscriptionStatus,
    plan: serializePlan(subscription.plan),
    currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
  };
}

function addPeriod(start: Date, billingCycle: 'monthly' | 'yearly') {
  const end = new Date(start);
  if (billingCycle === 'yearly') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

async function nextInvoiceNumber() {
  const count = await billingRepository.countInvoices();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
}

export const billingService = {
  async listPlans(): Promise<PlanSummary[]> {
    const plans = await billingRepository.listActivePlans();
    return plans.map(serializePlan);
  },

  async getOverview(businessId: string): Promise<BillingOverview> {
    const { subscription } = await quotaService.getPlanForBusiness(businessId);
    const usage = await quotaService.getUsage(businessId);

    return {
      subscription: subscription ? serializeSubscription(subscription) : null,
      usage,
      razorpayConfigured: isRazorpayConfigured(),
      razorpayKeyId: getRazorpayKeyId(),
    };
  },

  async createCheckout(
    businessId: string,
    userId: string,
    input: BillingCheckoutInput,
  ): Promise<CheckoutOrderResult> {
    const plan = await billingRepository.findPlanByTier(input.planTier);
    if (!plan || !plan.isActive) {
      throw new ValidationError('Selected plan is not available');
    }

    const amount =
      input.billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

    if (amount <= 0) {
      throw new ValidationError('This plan does not require payment');
    }

    const subscription = await billingRepository.getSubscriptionForBusiness(businessId);
    const order = await createRazorpayOrder({
      amount,
      currency: 'INR',
      receipt: `biz_${businessId.slice(0, 8)}_${Date.now()}`,
      notes: {
        businessId,
        planTier: input.planTier,
        billingCycle: input.billingCycle,
      },
    });

    const payment = await billingRepository.createPayment({
      businessId,
      subscriptionId: subscription?.id,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      metadata: {
        planTier: input.planTier,
        billingCycle: input.billingCycle,
        planId: plan.id,
        userId,
      },
    });

    const keyId = getRazorpayKeyId();
    if (!keyId) {
      throw new ValidationError('Razorpay is not configured');
    }

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: keyId,
      planTier: input.planTier as PlanTier,
      billingCycle: input.billingCycle,
      paymentId: payment.id,
    };
  },

  async verifyPayment(
    businessId: string,
    userId: string,
    input: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ): Promise<PaymentVerifyResult> {
    const payment = await billingRepository.findPaymentByOrderId(input.razorpayOrderId);
    if (!payment || payment.businessId !== businessId) {
      throw new ValidationError('Payment not found');
    }

    if (payment.status === 'COMPLETED') {
      const subscription = await billingRepository.getSubscriptionForBusiness(businessId);
      if (!subscription) {
        throw new ValidationError('Subscription not found after payment');
      }
      const invoices = await billingRepository.listInvoicesForBusiness(businessId, 1);
      return {
        subscription: serializeSubscription(subscription),
        invoiceNumber: invoices[0]?.invoiceNumber ?? '',
      };
    }

    if (
      !verifyPaymentSignature(
        input.razorpayOrderId,
        input.razorpayPaymentId,
        input.razorpaySignature,
      )
    ) {
      await billingRepository.updatePaymentStatus(payment.id, 'FAILED');
      throw new ValidationError('Invalid payment signature');
    }

    const metadata = (payment.metadata ?? {}) as Record<string, string>;
    const planId = metadata.planId;
    const billingCycle = (metadata.billingCycle as 'monthly' | 'yearly') ?? 'monthly';
    if (!planId) {
      throw new ValidationError('Payment metadata missing plan');
    }

    const now = new Date();
    const periodEnd = addPeriod(now, billingCycle);

    await billingRepository.completePayment(payment.id, {
      razorpayPayId: input.razorpayPaymentId,
    });

    const subscription = await billingRepository.upsertSubscription({
      businessId,
      planId,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    const invoiceNumber = await nextInvoiceNumber();
    await billingRepository.createInvoice({
      subscriptionId: subscription.id,
      invoiceNumber,
      amount: payment.amount,
      currency: payment.currency,
      paidAt: now,
    });

    await createAuditLog({
      userId,
      businessId,
      action: 'SUBSCRIPTION_CHANGE',
      entityType: 'subscription',
      entityId: subscription.id,
      metadata: {
        planTier: subscription.plan.tier,
        billingCycle,
        razorpayPaymentId: input.razorpayPaymentId,
      },
    });

    return {
      subscription: serializeSubscription(subscription),
      invoiceNumber,
    };
  },

  async listInvoices(businessId: string): Promise<InvoiceSummary[]> {
    const invoices = await billingRepository.listInvoicesForBusiness(businessId);
    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      issuedAt: invoice.issuedAt.toISOString(),
      paidAt: invoice.paidAt?.toISOString() ?? null,
      planName: invoice.subscription.plan.name,
    }));
  },

  async handleWebhookEvent(
    event: string,
    payload: Record<string, { entity: Record<string, unknown> } | undefined>,
  ) {
    if (event === 'payment.captured') {
      const paymentEntity = payload.payment?.entity as Record<string, string> | undefined;
      if (!paymentEntity?.order_id || !paymentEntity.id) return;

      const existing = await billingRepository.findPaymentByRazorpayId(paymentEntity.id);
      if (existing?.status === 'COMPLETED') return;

      const payment = await billingRepository.findPaymentByOrderId(paymentEntity.order_id);
      if (!payment || payment.status === 'COMPLETED') return;

      const metadata = (payment.metadata ?? {}) as Record<string, string>;
      const planId = metadata.planId;
      const billingCycle = (metadata.billingCycle as 'monthly' | 'yearly') ?? 'monthly';
      if (!planId) return;

      const now = new Date();
      await billingRepository.completePayment(payment.id, {
        razorpayPayId: paymentEntity.id,
        method: paymentEntity.method,
      });

      const subscription = await billingRepository.upsertSubscription({
        businessId: payment.businessId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: addPeriod(now, billingCycle),
      });

      const invoiceNumber = await nextInvoiceNumber();
      await billingRepository.createInvoice({
        subscriptionId: subscription.id,
        invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: now,
      });
    }
  },
};
