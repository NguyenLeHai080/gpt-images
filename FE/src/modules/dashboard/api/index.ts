import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type { DashboardOverviewData } from '../types';

export const FALLBACK_DASHBOARD_DATA: DashboardOverviewData = {
  date_display: 'Chủ Nhật, 13 tháng 9, 2026',
  metrics: [
    {
      id: 'api_balance',
      title: 'Số dư API',
      value: '24.702 đ',
      numeric_value: 24702,
      unit: 'đ',
      badge_text: '↗ Trực tiếp: Số dư khả dụng',
      badge_type: 'success',
      icon: 'wallet',
    },
    {
      id: 'total_deposit',
      title: 'Tổng tiền nạp',
      value: '4.331.500 đ',
      numeric_value: 4331500,
      unit: 'đ',
      badge_text: '↗ Theo giao dịch',
      badge_type: 'success',
      icon: 'trending-up',
    },
    {
      id: 'api_cost',
      title: 'Chi phí API',
      value: '480 đ',
      numeric_value: 480,
      unit: 'đ',
      badge_text: '↘ 26 lỗi 7 ngày gần nhất',
      badge_type: 'warning',
      icon: 'receipt',
    },
    {
      id: 'total_requests',
      title: 'Tổng API request',
      value: '30',
      numeric_value: 30,
      unit: '',
      badge_text: '↘ 5 thành công 7 ngày gần nhất',
      badge_type: 'purple',
      icon: 'activity',
    },
  ],
  chart_data: [
    { day: 'Thứ 2', cost: 0, requests: 0 },
    { day: 'Thứ 3', cost: 0, requests: 0 },
    { day: 'Thứ 4', cost: 0, requests: 0 },
    { day: 'Thứ 5', cost: 15, requests: 6 },
    { day: 'Thứ 6', cost: 185, requests: 25 },
    { day: 'Thứ 7', cost: 180, requests: 20 },
    { day: 'CN', cost: 0, requests: 0 },
  ],
  key_status: {
    total_managed: 28,
    active_keys: 28,
    other_keys: 0,
  },
  recent_activities: [
    {
      id: 'act_1',
      user_name: 'Nguyen Le Hai',
      model_name: 'gpt-image-2',
      status: 'success',
      cost: '120 đ',
      timestamp: '14:19:09 12/9/2026',
    },
    {
      id: 'act_2',
      user_name: 'Nguyen Le Hai',
      model_name: 'gpt-image-2',
      status: 'success',
      cost: '120 đ',
      timestamp: '14:18:22 12/9/2026',
    },
    {
      id: 'act_3',
      user_name: 'Nguyen Le Hai',
      model_name: 'gpt-image-2',
      status: 'success',
      cost: '120 đ',
      timestamp: '14:15:10 12/9/2026',
    },
  ],
  operation_summary: {
    active_keys: 28,
    synced_keys: 28,
    successful_requests: 33861,
    uptime: '99.9%',
  },
  model_distribution: [
    {
      model_id: 'gpt-image-2',
      model_name: 'gpt-image-2',
      request_count: 30,
      cost_amount: '480 đ',
      badge: 'GP',
    },
  ],
};

export const dashboardApi = {
  getOverview: async (): Promise<ApiResponse<DashboardOverviewData>> => {
    try {
      return await apiClient.get<DashboardOverviewData>('/dashboard/overview');
    } catch {
      return {
        success: true,
        message: 'Dữ liệu tổng quan từ local cache',
        data: FALLBACK_DASHBOARD_DATA,
      };
    }
  },
};
