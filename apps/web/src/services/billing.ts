import type {
  ApiResponse,
  BillingOverview,
  CheckoutOrderResult,
  InvoiceSummary,
  PaymentVerifyResult,
  PlanSummary,
} from '@photo-platform/shared-types';
import type { BillingCheckoutInput, BillingVerifyInput } from '@photo-platform/validation';
import { api } from './api';

export const billingService = {
  async listPlans() {
    const { data } = await api.get<ApiResponse<PlanSummary[]>>('/billing/plans');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getOverview() {
    const { data } = await api.get<ApiResponse<BillingOverview>>('/billing/overview');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listInvoices() {
    const { data } = await api.get<ApiResponse<InvoiceSummary[]>>('/billing/invoices');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async createCheckout(input: BillingCheckoutInput) {
    const { data } = await api.post<ApiResponse<CheckoutOrderResult>>('/billing/checkout', input);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async verifyPayment(input: BillingVerifyInput) {
    const { data } = await api.post<ApiResponse<PaymentVerifyResult>>('/billing/verify', input);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },
};
