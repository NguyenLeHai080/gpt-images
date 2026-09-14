import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type { SystemGatewayConfig, UpdateGatewayConfigRequest } from '../types';

export const toolsApi = {
  getConfig: async (): Promise<ApiResponse<SystemGatewayConfig>> => {
    return apiClient.get<SystemGatewayConfig>('/tools/config');
  },

  updateConfig: async (data: UpdateGatewayConfigRequest): Promise<ApiResponse<SystemGatewayConfig>> => {
    return apiClient.put<SystemGatewayConfig>('/tools/config', data, {
      successToast: 'Cập nhật cấu hình hệ thống thành công',
    });
  },

  flushCache: async (): Promise<ApiResponse<{ flushed_entries: number; freed_memory_mb: number; status: string }>> => {
    return apiClient.post('/tools/cache/flush', {}, {
      successToast: 'Đã dọn dẹp bộ nhớ đệm Smart Cache thành công',
    });
  },
};
