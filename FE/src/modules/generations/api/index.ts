import { apiClient } from '../../../core/api/client';
import type {
  JobsResponse,
  FinancialSummary,
  ProviderStatus,
  GenerateImagePayload,
  GenerateImageResult,
  JobLogItem,
} from '../types';

export const generationsApi = {
  getJobs: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await apiClient.get<JobsResponse>(`/generations/jobs${query}`);
  },

  getFinancialSummary: async () => {
    return await apiClient.get<FinancialSummary>('/generations/financials');
  },

  getProviderStatus: async () => {
    return await apiClient.get<ProviderStatus>('/generations/provider-status');
  },

  syncProvider: async () => {
    return await apiClient.post<ProviderStatus>('/generations/provider-sync', {}, {
      successToast: 'Đã đồng bộ số dư từ Nhà Cung Cấp thành công!',
    });
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.upload<{
      url: string;
      relative_url: string;
      base64: string;
      filename: string;
      size: number;
      content_type: string;
    }>('/generations/upload', formData, {
      showErrorAlert: true,
      successToast: 'Tải ảnh từ máy tính lên thành công!',
    });
  },

  generateImage: async (payload: GenerateImagePayload) => {
    return await apiClient.post<GenerateImageResult>('/images/generations', payload, {
      showErrorAlert: true,
      successToast: 'Đã tạo ảnh thành công!',
    });
  },

  deleteJob: async (jobId: string) => {
    return await apiClient.delete<{ id: string }>(`/generations/jobs/${jobId}`, {
      successToast: 'Đã xóa bản ghi job thành công!',
    });
  },

  updateJob: async (jobId: string, payload: { prompt: string }) => {
    return await apiClient.patch<JobLogItem>(`/generations/jobs/${jobId}`, payload, {
      successToast: 'Đã cập nhật prompt thành công!',
    });
  },

  batchDeleteJobs: async (jobIds: string[]) => {
    return await apiClient.post<{ deleted_count: number }>('/generations/jobs/batch-delete', {
      job_ids: jobIds,
    }, {
      successToast: `Đã xóa thành công ${jobIds.length} jobs!`,
    });
  },

  batchCancelJobs: async (jobIds: string[]) => {
    return await apiClient.post<{ cancelled_count: number }>('/generations/jobs/batch-cancel', {
      job_ids: jobIds,
    }, {
      successToast: `Đã hủy thành công ${jobIds.length} jobs!`,
    });
  },

  retryJob: async (jobId: string) => {
    return await apiClient.post<JobLogItem>(`/generations/jobs/${jobId}/retry`, {}, {
      successToast: 'Đã gửi yêu cầu thử lại job thành công!',
    });
  },

  batchRetryJobs: async (jobIds: string[]) => {
    return await apiClient.post<{ retried_count: number }>('/generations/jobs/batch-retry', {
      job_ids: jobIds,
    }, {
      successToast: `Đã gửi yêu cầu thử lại ${jobIds.length} jobs thành công!`,
    });
  },
};
