import type {
  AdminAuditLogEntry,
  AdminBusinessRow,
  AdminEventRow,
  AdminPaymentRow,
  AdminPhotoRow,
  AdminPlatformOverview,
  AdminStorageUsageRow,
  AdminSubscriptionRow,
  AdminUserRow,
  ApiResponse,
  PaginatedResponse,
} from '@photo-platform/shared-types';
import type { StorageSettingsInput } from '@photo-platform/validation';
import { api } from './api';

export const adminService = {
  async getOverview() {
    const { data } = await api.get<ApiResponse<AdminPlatformOverview>>('/admin/overview');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listBusinesses() {
    const { data } = await api.get<ApiResponse<AdminBusinessRow[]>>('/admin/businesses');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listUsers() {
    const { data } = await api.get<ApiResponse<AdminUserRow[]>>('/admin/users');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listEvents(params?: { search?: string; cursor?: string; limit?: number }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AdminEventRow>>>('/admin/events', { params });
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listPhotos(params?: { search?: string; cursor?: string; limit?: number }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AdminPhotoRow>>>('/admin/photos', { params });
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listSubscriptions(params?: { cursor?: string; limit?: number }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AdminSubscriptionRow>>>('/admin/subscriptions', { params });
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listPayments(params?: { cursor?: string; limit?: number }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AdminPaymentRow>>>('/admin/payments', { params });
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listAuditLogs(params?: { action?: string; cursor?: string; limit?: number }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AdminAuditLogEntry>>>('/admin/audit-logs', { params });
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listStorageUsage() {
    const { data } = await api.get<ApiResponse<AdminStorageUsageRow[]>>('/admin/storage/usage');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getStorageSettings() {
    const { data } = await api.get<ApiResponse<StorageSettingsInput & { storageQuotaGb?: number }>>('/admin/storage/settings');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async updateStorageSettings(input: StorageSettingsInput) {
    const { data } = await api.patch<ApiResponse<StorageSettingsInput>>('/admin/storage/settings', input);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getPrivacySettings() {
    const { data } = await api.get<ApiResponse<import('@photo-platform/shared-types').PrivacySettings>>('/admin/privacy-settings');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async updatePrivacySettings(input: import('@photo-platform/shared-types').PrivacySettings) {
    const { data } = await api.patch<ApiResponse<import('@photo-platform/shared-types').PrivacySettings>>('/admin/privacy-settings', input);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getSecurityAudit() {
    const { data } = await api.get<ApiResponse<import('@photo-platform/shared-types').SecurityAuditReport>>('/admin/security-audit');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async runCleanup() {
    const { data } = await api.post<ApiResponse<import('@photo-platform/shared-types').CleanupRunResult>>('/admin/cleanup/run');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },
};
