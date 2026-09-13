import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, FALLBACK_DASHBOARD_DATA } from '../api';
import type { DashboardOverviewData } from '../types';

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardOverviewData>(FALLBACK_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async (showRefreshingState = false) => {
    if (showRefreshingState) setIsRefreshing(true);
    setError(null);
    try {
      const res = await dashboardApi.getOverview();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu mới nhất');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = () => {
    fetchData(true);
  };

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
};
