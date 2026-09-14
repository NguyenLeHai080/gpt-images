import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type { PackageItem, CreatePackageData } from '../types';

export const packagesApi = {
  getPackages: async (activeOnly: boolean = false): Promise<ApiResponse<PackageItem[]>> => {
    return apiClient.get<PackageItem[]>(`/packages?active_only=${activeOnly}`);
  },

  createPackage: async (data: CreatePackageData): Promise<ApiResponse<PackageItem>> => {
    return apiClient.post<PackageItem>('/packages', data, {
      successToast: 'Tạo gói dịch vụ thành công',
    });
  },

  updatePackage: async (id: string, data: Partial<CreatePackageData>): Promise<ApiResponse<PackageItem>> => {
    return apiClient.put<PackageItem>(`/packages/${id}`, data, {
      successToast: 'Cập nhật gói dịch vụ thành công',
    });
  },

  deletePackage: async (id: string): Promise<ApiResponse<{ deleted_id: string }>> => {
    return apiClient.delete<{ deleted_id: string }>(`/packages/${id}`, {
      successToast: 'Đã xóa gói dịch vụ',
    });
  },
};
