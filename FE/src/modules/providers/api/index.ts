import { apiClient } from '../../../core/api/client';
import type {
  AIProvider,
  ProviderStats,
  CreateProviderInput,
  UpdateProviderInput,
  TestConnectionResult
} from '../types';

export const providersApi = {
  getAll: () => {
    return apiClient.get<AIProvider[]>('/providers');
  },

  getStats: () => {
    return apiClient.get<ProviderStats>('/providers/stats');
  },

  getDetail: (id: string) => {
    return apiClient.get<AIProvider>(`/providers/${id}`);
  },

  create: (data: CreateProviderInput) => {
    return apiClient.post<AIProvider>('/providers', data, {
      successToast: `Đã thêm nhà cung cấp '${data.name}' thành công!`,
      showErrorAlert: true
    });
  },

  update: (id: string, data: UpdateProviderInput) => {
    return apiClient.put<AIProvider>(`/providers/${id}`, data, {
      successToast: 'Đã cập nhật cấu hình nhà cung cấp thành công!',
      showErrorAlert: true
    });
  },

  delete: (id: string) => {
    return apiClient.delete<{ deleted: boolean }>(`/providers/${id}`, {
      successToast: 'Đã xóa nhà cung cấp thành công!',
      showErrorAlert: true
    });
  },

  setPrimary: (id: string) => {
    return apiClient.post<AIProvider>(`/providers/${id}/set-primary`, {}, {
      successToast: 'Đã thiết lập làm Nhà Cung Cấp chính thành công!',
      showErrorAlert: true
    });
  },

  testConnection: (id: string) => {
    return apiClient.post<TestConnectionResult>(`/providers/${id}/test-connection`, {}, {
      showErrorAlert: false
    });
  }
};
