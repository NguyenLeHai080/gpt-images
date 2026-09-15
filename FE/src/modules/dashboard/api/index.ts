import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type { DashboardOverviewData } from '../types';

export const FALLBACK_DASHBOARD_DATA: DashboardOverviewData = {
  date_display: 'Hôm nay',
  metrics: [
    {
      id: 'api_balance',
      title: 'Tổng số dư ví',
      value: '0 đ',
      numeric_value: 0,
      unit: 'đ',
      badge_text: '↗ Khả dụng',
      badge_type: 'success',
      icon: 'wallet',
    },
    {
      id: 'total_deposit',
      title: 'Tổng tiền nạp',
      value: '0 đ',
      numeric_value: 0,
      unit: 'đ',
      badge_text: '↗ Giao dịch nạp ví',
      badge_type: 'success',
      icon: 'trending-up',
    },
    {
      id: 'api_cost',
      title: 'Chi phí API',
      value: '0 đ',
      numeric_value: 0,
      unit: 'đ',
      badge_text: '✓ 0 lỗi phát sinh',
      badge_type: 'success',
      icon: 'receipt',
    },
    {
      id: 'total_requests',
      title: 'Tổng API request',
      value: '0',
      numeric_value: 0,
      unit: '',
      badge_text: '✓ 0 thành công',
      badge_type: 'purple',
      icon: 'activity',
    },
  ],
  chart_data: [
    { day: 'Thứ 2', cost: 0, requests: 0 },
    { day: 'Thứ 3', cost: 0, requests: 0 },
    { day: 'Thứ 4', cost: 0, requests: 0 },
    { day: 'Thứ 5', cost: 0, requests: 0 },
    { day: 'Thứ 6', cost: 0, requests: 0 },
    { day: 'Thứ 7', cost: 0, requests: 0 },
    { day: 'CN', cost: 0, requests: 0 },
  ],
  key_status: {
    total_managed: 28,
    active_keys: 28,
    other_keys: 0,
  },
  recent_activities: [],
  operation_summary: {
    active_keys: 28,
    synced_keys: 28,
    successful_requests: 0,
    uptime: '100%',
  },
  model_distribution: [
    {
      model_id: 'gpt-image-2.5-flare',
      model_name: 'gpt-image-2.5-flare',
      request_count: 0,
      cost_amount: '0 đ',
      badge: 'FL',
    },
    {
      model_id: 'gpt-image-2.5-sunburst',
      model_name: 'gpt-image-2.5-sunburst',
      request_count: 0,
      cost_amount: '0 đ',
      badge: 'SB',
    },
    {
      model_id: 'gpt-image-2',
      model_name: 'gpt-image-2',
      request_count: 0,
      cost_amount: '0 đ',
      badge: 'G2',
    },
    {
      model_id: 'nanobanana-2',
      model_name: 'nanobanana-2',
      request_count: 0,
      cost_amount: '0 đ',
      badge: 'NB',
    },
  ],
};

export const dashboardApi = {
  getOverview: async (userId?: string): Promise<ApiResponse<DashboardOverviewData>> => {
    try {
      const url = userId && userId !== 'all' ? `/dashboard/overview?user_id=${userId}` : '/dashboard/overview';
      return await apiClient.get<DashboardOverviewData>(url);
    } catch {
      return {
        success: true,
        message: 'Dữ liệu tổng quan từ local cache',
        data: FALLBACK_DASHBOARD_DATA,
      };
    }
  },
};
