import type { ApiResponse, EventSummary, FolderSummary, PaginatedResponse } from '@photo-platform/shared-types';
import type { CreateEventInput, UpdateEventInput, CreateFolderInput } from '@photo-platform/validation';
import { api } from './api';

export const eventsService = {
  async list(params?: { status?: string; search?: string; cursor?: string; limit?: number }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<EventSummary>>>('/events', { params });
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getStats() {
    const { data } = await api.get<ApiResponse<{ total: number; byStatus: Record<string, number> }>>('/events/stats');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<EventSummary>>(`/events/${id}`);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async create(input: CreateEventInput) {
    const { data } = await api.post<ApiResponse<EventSummary>>('/events', input);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async update(id: string, input: UpdateEventInput) {
    const { data } = await api.patch<ApiResponse<EventSummary>>(`/events/${id}`, input);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async archive(id: string) {
    const { data } = await api.post<ApiResponse<EventSummary>>(`/events/${id}/archive`);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async restore(id: string) {
    const { data } = await api.post<ApiResponse<EventSummary>>(`/events/${id}/restore`);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async delete(id: string) {
    const { data } = await api.delete<ApiResponse<null>>(`/events/${id}`);
    if (!data.success) throw new Error(data.error.message);
  },

  async listFolders(eventId: string) {
    const { data } = await api.get<ApiResponse<FolderSummary[]>>(`/events/${eventId}/folders`);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async createFolder(eventId: string, input: CreateFolderInput) {
    const { data } = await api.post<ApiResponse<FolderSummary>>(`/events/${eventId}/folders`, input);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async deleteFolder(eventId: string, folderId: string) {
    const { data } = await api.delete<ApiResponse<null>>(`/events/${eventId}/folders/${folderId}`);
    if (!data.success) throw new Error(data.error.message);
  },
};
