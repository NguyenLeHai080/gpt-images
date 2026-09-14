import { useState, useEffect, useCallback } from 'react';
import { generationsApi } from '../api';
import type { JobLogItem, UserJobStats } from '../types';

export const useJobs = (_isAdmin: boolean = false) => {
  const [jobs, setJobs] = useState<JobLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [userStats, setUserStats] = useState<UserJobStats>({
    total_jobs: 0,
    successful_jobs: 0,
    failed_jobs: 0,
    total_spent: 0,
  });

  // 1. Debounce ô tìm kiếm 300ms để loại bỏ hoàn toàn lag khi người dùng gõ phím
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Tải danh sách Jobs cực nhanh (payload siêu nhẹ ~6KB, ~25ms)
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await generationsApi.getJobs({
        status: statusFilter,
        search: debouncedSearch,
        page,
        page_size: 20,
      });

      if (res.success && res.data) {
        setJobs(res.data.items || []);
        setTotal(res.data.total || 0);
        if (res.data.stats) {
          setUserStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('[useJobs] Lỗi tải danh sách jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, debouncedSearch, page]);

  // Khi status hoặc search hoặc page thay đổi, chỉ load lại bảng jobs
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Làm mới danh sách jobs
  const refetch = useCallback(async () => {
    await fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    total,
    isLoading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    userStats,
    refetch,
  };
};
