import type { ApiResponse, QrCodeListResult, QrCodeSummary } from '@photo-platform/shared-types';
import type { GenerateQrCodeInput } from '@photo-platform/validation';
import { api } from './api';

export const qrService = {
  async list(eventId: string) {
    const { data } = await api.get<ApiResponse<QrCodeListResult>>(`/events/${eventId}/qr`);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async generate(eventId: string, input: GenerateQrCodeInput = { format: 'both', branded: false }) {
    const { data } = await api.post<ApiResponse<QrCodeSummary>>(
      `/events/${eventId}/qr/generate`,
      input,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async fetchPreviewBlob(previewPath: string): Promise<Blob> {
    const { data } = await api.get(previewPath.replace('/api/v1', ''), {
      responseType: 'blob',
    });
    return data;
  },

  async download(downloadPath: string, filename: string) {
    const { data } = await api.get(downloadPath.replace('/api/v1', ''), { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
};
