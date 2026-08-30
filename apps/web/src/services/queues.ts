import type { ApiResponse, QueueJobSummary, QueueOverview } from '@photo-platform/shared-types';
import type { QueueJobState } from '@photo-platform/shared-types';
import { api } from './api';

export const queuesService = {
  async getOverview() {
    const { data } = await api.get<ApiResponse<QueueOverview>>('/admin/queues');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async listJobs(queueName: string, state: QueueJobState = 'failed', start = 0, end = 19) {
    const { data } = await api.get<ApiResponse<{ items: QueueJobSummary[] }>>(
      `/admin/queues/${queueName}/jobs`,
      { params: { state, start, end } },
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data.items;
  },

  async retryJob(queueName: string, jobId: string) {
    const { data } = await api.post<ApiResponse<{ jobId: string }>>(
      `/admin/queues/${queueName}/jobs/${jobId}/retry`,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },
};
