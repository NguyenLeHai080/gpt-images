import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dashboardApi, FALLBACK_DASHBOARD_DATA } from '../api';
import type { DashboardOverviewData } from '../types';

export const useDashboardData = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlUserId = searchParams.get('user_id') || 'all';

  const [data, setData] = useState<DashboardOverviewData>(FALLBACK_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(urlUserId);

  // Sync if URL search params change externally (e.g. navigation)
  useEffect(() => {
    const currentUrlId = searchParams.get('user_id') || 'all';
    if (currentUrlId !== selectedUserId) {
      setSelectedUserId(currentUrlId);
    }
  }, [searchParams]);

  const fetchData = useCallback(async (showRefreshingState = false, userId = selectedUserId) => {
    if (showRefreshingState) setIsRefreshing(true);
    setError(null);
    try {
      const res = await dashboardApi.getOverview(userId);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu mới nhất');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchData(false, selectedUserId);
  }, [fetchData, selectedUserId]);

  const changeAccount = (userId: string) => {
    setSelectedUserId(userId);
    const newParams = new URLSearchParams(searchParams);
    if (userId && userId !== 'all') {
      newParams.set('user_id', userId);
    } else {
      newParams.delete('user_id');
    }
    setSearchParams(newParams, { replace: true });
  };

  const refresh = () => {
    fetchData(true, selectedUserId);
  };

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    selectedUserId,
    changeAccount,
    refresh,
  };
};
