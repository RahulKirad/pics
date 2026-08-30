import { prisma } from '../../database/client.js';
import type { PlanTier, PaymentStatus, Prisma } from '@prisma/client';

export const billingRepository = {
  async listActivePlans() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  },

  async findPlanByTier(tier: PlanTier) {
    return prisma.plan.findUnique({ where: { tier } });
  },

  async findPlanById(planId: string) {
    return prisma.plan.findUnique({ where: { id: planId } });
  },

  async getSubscriptionForBusiness(businessId: string) {
    return prisma.subscription.findFirst({
      where: { businessId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createPayment(data: {
    businessId: string;
    subscriptionId?: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.payment.create({
      data: {
        businessId: data.businessId,
        subscriptionId: data.subscriptionId,
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency,
        status: 'PENDING',
        metadata: data.metadata,
      },
    });
  },

  async findPaymentByOrderId(razorpayOrderId: string) {
    return prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: { subscription: { include: { plan: true } } },
    });
  },

  async findPaymentByRazorpayId(razorpayPayId: string) {
    return prisma.payment.findUnique({
      where: { razorpayPayId },
    });
  },

  async completePayment(
    paymentId: string,
    data: {
      razorpayPayId: string;
      method?: string;
    },
  ) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        razorpayPayId: data.razorpayPayId,
        method: data.method,
        status: 'COMPLETED',
      },
    });
  },

  async upsertSubscription(data: {
    businessId: string;
    planId: string;
    status: 'ACTIVE' | 'TRIALING';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    razorpaySubId?: string;
  }) {
    const existing = await prisma.subscription.findFirst({
      where: { businessId: data.businessId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId: data.planId,
          status: data.status,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          trialEndsAt: null,
          razorpaySubId: data.razorpaySubId ?? existing.razorpaySubId,
        },
        include: { plan: true },
      });
    }

    return prisma.subscription.create({
      data: {
        businessId: data.businessId,
        planId: data.planId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        razorpaySubId: data.razorpaySubId,
      },
      include: { plan: true },
    });
  },

  async createInvoice(data: {
    subscriptionId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    paidAt: Date;
  }) {
    return prisma.invoice.create({
      data: {
        subscriptionId: data.subscriptionId,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        currency: data.currency,
        paidAt: data.paidAt,
      },
    });
  },

  async listInvoicesForBusiness(businessId: string, limit = 20) {
    return prisma.invoice.findMany({
      where: { subscription: { businessId } },
      include: { subscription: { include: { plan: true } } },
      orderBy: { issuedAt: 'desc' },
      take: limit,
    });
  },

  async countInvoices() {
    return prisma.invoice.count();
  },

  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });
  },
};
