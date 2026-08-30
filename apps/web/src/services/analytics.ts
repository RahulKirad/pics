import type { ApiResponse, BusinessAnalyticsOverview, EventAnalytics } from '@photo-platform/shared-types';
import { api } from './api';

export const analyticsService = {
  async getOverview(days = 14) {
    const { data } = await api.get<ApiResponse<BusinessAnalyticsOverview>>('/analytics/overview', {
      params: { days },
    });
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getEventAnalytics(eventId: string, days = 14) {
    const { data } = await api.get<ApiResponse<EventAnalytics>>(`/events/${eventId}/analytics`, {
      params: { days },
    });
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },
};
