import { useState, useEffect, useCallback, useRef } from 'react';
import { generationsApi } from '../api';
import { alert } from '../../../core/alert';
import type { JobLogItem, UserJobStats } from '../types';

export const useJobs = (_isAdmin: boolean = false) => {
  const [jobs, setJobs] = useState<JobLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const prevJobsRef = useRef<JobLogItem[]>([]);

  const [userStats, setUserStats] = useState<UserJobStats>({
    total_jobs: 0,
    successful_jobs: 0,
    failed_jobs: 0,
    total_spent: 0,
  });

  // 1. Debounce ô tìm kiếm 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Tải danh sách Jobs (Hỗ trợ chế độ ngầm silent không nhấp nháy UI)
  const fetchJobs = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await generationsApi.getJobs({
        status: statusFilter,
        search: debouncedSearch,
        page,
        page_size: 20,
      });

      if (res.success && res.data) {
        const newItems: JobLogItem[] = res.data.items || [];

        // Phát hiện các job vừa chuyển trạng thái từ PROCESSING -> SUCCEEDED / FAILED
        if (prevJobsRef.current.length > 0) {
          for (const newItem of newItems) {
            const oldItem = prevJobsRef.current.find((o) => o.id === newItem.id);
            if (oldItem && (oldItem.status === 'PROCESSING' || oldItem.status === 'PENDING')) {
              if (newItem.status === 'SUCCEEDED') {
                const shortPrompt = newItem.prompt.length > 35 ? `${newItem.prompt.slice(0, 35)}...` : newItem.prompt;
                alert.toast(`🎉 Job "${shortPrompt}" đã tạo ảnh thành công!`, 'success');
              } else if (newItem.status === 'FAILED') {
                const shortPrompt = newItem.prompt.length > 35 ? `${newItem.prompt.slice(0, 35)}...` : newItem.prompt;
                alert.toast(`❌ Job "${shortPrompt}" thất bại: ${newItem.error_message || 'Lỗi không xác định'}`, 'error');
              }
            }
          }
        }

        prevJobsRef.current = newItems;
        setJobs(newItems);
        setTotal(res.data.total || 0);
        if (res.data.stats) {
          setUserStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('[useJobs] Lỗi tải danh sách jobs:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [statusFilter, debouncedSearch, page]);

  // Khi status hoặc search hoặc page thay đổi, load lại bảng jobs
  useEffect(() => {
    fetchJobs(false);
  }, [fetchJobs]);

  // 3. Cơ chế Auto-Polling thông minh: Khi có job PROCESSING / PENDING thì tự động thăm dò mỗi 2.5s
  useEffect(() => {
    const hasActiveJob = jobs.some(
      (j) => j.status === 'PROCESSING' || j.status === 'PENDING'
    );

    if (!hasActiveJob) return;

    const interval = setInterval(() => {
      fetchJobs(true); // silent fetch không nháy spinner
    }, 2500);

    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  // Làm mới danh sách jobs
  const refetch = useCallback(async (silent?: boolean | any) => {
    await fetchJobs(silent === true);
  }, [fetchJobs]);

  // Thêm tức thì job tạm thời vào đầu bảng (Optimistic UI)
  const addOptimisticJob = useCallback((job: JobLogItem) => {
    setJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
    setTotal((prev) => prev + 1);
  }, []);

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
    addOptimisticJob,
  };
};
