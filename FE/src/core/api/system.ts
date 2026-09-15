import { apiClient } from './client';
import type { ApiResponse } from '../types';

export interface MaintenanceStatus {
  is_maintenance: boolean;
  message: string;
  updated_by?: string;
  updated_at?: string;
}

export const systemApi = {
  getMaintenance: async (): Promise<ApiResponse<MaintenanceStatus>> => {
    return apiClient.get<MaintenanceStatus>('/system/maintenance');
  },

  setMaintenance: async (
    is_maintenance: boolean,
    message?: string
  ): Promise<ApiResponse<MaintenanceStatus>> => {
    return apiClient.post<MaintenanceStatus>(
      '/system/maintenance',
      {
        is_maintenance,
        message,
      },
      {
        successToast: is_maintenance
          ? 'Đã BẬT chế độ bảo trì API toàn hệ thống!'
          : 'Đã TẮT chế độ bảo trì. Cổng API đã mở lại bình thường!',
      }
    );
  },
};
