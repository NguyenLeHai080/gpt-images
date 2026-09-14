import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type { ApiKeyItem } from '../types';

export const apiKeysApi = {
  getKeys: async (): Promise<ApiResponse<ApiKeyItem[]>> => {
    try {
      return await apiClient.get<ApiKeyItem[]>('/api-keys');
    } catch {
      return {
        success: true,
        message: 'API Keys',
        data: [],
      };
    }
  },

  createKey: async (name: string, rateLimit: string = '60 req/min'): Promise<ApiResponse<ApiKeyItem>> => {
    return await apiClient.post<ApiKeyItem>('/api-keys', {
      name,
      rate_limit: rateLimit,
    }, {
      successToast: 'Tạo API Key mới thành công!',
    });
  },

  deleteKey: async (keyId: string): Promise<ApiResponse<{ id: string }>> => {
    return await apiClient.delete<{ id: string }>(`/api-keys/${keyId}`, {
      successToast: 'Đã xóa API Key thành công!',
    });
  },
};

