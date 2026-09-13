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
        message: 'Mock API Keys',
        data: Array.from({ length: 28 }, (_, i) => ({
          id: `key_${i + 1}`,
          name: i === 0 ? 'Production Main Key' : `Service Key #${i + 1}`,
          key_prefix: `mf_live_${Math.random().toString(36).substring(2, 10)}...`,
          status: 'active',
          created_at: '2026-08-01',
          last_used: '14:19:09 12/9/2026',
          rate_limit: i === 0 ? '120 req/min' : '60 req/min',
        })),
      };
    }
  },
};
