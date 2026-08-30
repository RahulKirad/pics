import type { ApiResponse, PaginatedResponse, PhotoSummary } from '@photo-platform/shared-types';
import { api } from './api';

export const photosService = {
  async listByEvent(eventId: string, cursor?: string) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<PhotoSummary>>>(
      `/events/${eventId}/photos`,
      { params: cursor ? { cursor } : undefined },
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async retryProcessing(photoId: string) {
    const { data } = await api.post<ApiResponse<{ photoId: string; status: string }>>(
      `/photos/${photoId}/retry-processing`,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },
};
