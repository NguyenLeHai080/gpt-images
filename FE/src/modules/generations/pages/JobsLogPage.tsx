import React, { useState } from 'react';
import { useAuth } from '../../../core/hooks/useAuth';
import { useJobs } from '../hooks/useJobs';
import { JobStatsCards } from '../components/JobStatsCards';
import { JobDetailModal } from '../components/JobDetailModal';
import { StudioModal } from '../components/StudioModal';
import { Table, type Column } from '../../../core/components/Table';
import { Button } from '../../../core/components/Button/Button';
import { Select } from '../../../core/components/Select';
import { Sparkles, RefreshCw, Search, Trash2, XCircle } from 'lucide-react';
import { alert } from '../../../core/alert';
import { generationsApi } from '../api';
import type { JobLogItem } from '../types';

export const JobsLogPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const {
    jobs,
    isLoading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    userStats,
    refetch,
  } = useJobs(isAdmin);

  const [selectedJob, setSelectedJob] = useState<JobLogItem | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  // Batch Selection State
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isBatchOperating, setIsBatchOperating] = useState(false);

  // Xóa hàng loạt jobs
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    const isConfirmed = await alert.confirm({
      title: 'Xóa Hàng Loạt Jobs',
      text: `Xác nhận xóa vĩnh viễn ${selectedRowKeys.length} jobs đã chọn? Thao tác này không thể hoàn tác.`,
      confirmButtonText: `Xóa ${selectedRowKeys.length} jobs`,
      cancelButtonText: 'Hủy bỏ',
      isDanger: true,
    });
    if (isConfirmed) {
      setIsBatchOperating(true);
      try {
        const res = await generationsApi.batchDeleteJobs(selectedRowKeys);
        if (res.success) {
          setSelectedRowKeys([]);
          refetch();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsBatchOperating(false);
      }
    }
  };

  // Hủy hàng loạt jobs
  const handleBatchCancel = async () => {
    if (selectedRowKeys.length === 0) return;
    const isConfirmed = await alert.confirm({
      title: 'Hủy Hàng Loạt Jobs',
      text: `Xác nhận hủy xử lý cho ${selectedRowKeys.length} jobs đã chọn?`,
      confirmButtonText: `Hủy ${selectedRowKeys.length} jobs`,
      cancelButtonText: 'Đóng',
      isDanger: false,
    });
    if (isConfirmed) {
      setIsBatchOperating(true);
      try {
        const res = await generationsApi.batchCancelJobs(selectedRowKeys);
        if (res.success) {
          setSelectedRowKeys([]);
          refetch();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsBatchOperating(false);
      }
    }
  };

  const columns: Column<JobLogItem>[] = [
    {
      key: 'created_at',
      title: 'THỜI GIAN',
      dataIndex: 'created_at',
      render: (val) => (
        <span className="text-slate-700 text-xs font-normal whitespace-nowrap">
          {new Date(String(val)).toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })}
        </span>
      ),
    },
    {
      key: 'model',
      title: 'MODEL',
      dataIndex: 'model',
      render: (val) => (
        <span className="font-bold text-slate-800 text-xs whitespace-nowrap font-mono">
          {val || 'gpt-image-2'}
        </span>
      ),
    },
    {
      key: 'key',
      title: 'KEY',
      render: (_, record) => (
        <div className="whitespace-nowrap">
          <span className="font-semibold text-slate-800 text-xs block">
            {record.api_key_name || 'MintForge_Gateway_Auto'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono block">
            {record.key_prefix || 'sk-H••••••EUHF'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      render: (val) => {
        const v = String(val);
        if (v === 'SUCCEEDED') {
          return (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/70 whitespace-nowrap">
              Oke
            </span>
          );
        }
        if (v === 'FAILED') {
          return (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/70 whitespace-nowrap">
              Fail
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs whitespace-nowrap animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Đang chạy...
          </span>
        );
      },
    },
    {
      key: 'token_in',
      title: 'TOKEN VÀO',
      dataIndex: 'token_in',
      align: 'right',
      render: (_, record) => (
        <span className="font-mono text-slate-700 text-xs whitespace-nowrap">
          {record.status === 'FAILED' ? 0 : (record.token_in ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'token_out',
      title: 'TOKEN RA',
      dataIndex: 'token_out',
      align: 'right',
      render: (_, record) => (
        <span className="font-mono text-slate-700 text-xs whitespace-nowrap">
          {record.status === 'FAILED' ? 0 : (record.token_out ?? 0).toLocaleString()}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'cost_provider',
            title: 'GIÁ NCC (VỐN)',
            align: 'right' as const,
            render: (_: unknown, record: JobLogItem) => {
              if (record.status === 'FAILED') return <span className="text-slate-400 text-xs">0đ</span>;
              if (record.is_cached) {
                return (
                  <span className="font-mono text-emerald-600 font-bold text-xs whitespace-nowrap bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    0đ (⚡ Cache)
                  </span>
                );
              }
              return (
                <span className="font-mono text-slate-700 text-xs whitespace-nowrap">
                  {record.cost_provider != null ? `${Math.round(record.cost_provider)}đ` : '120đ'}
                </span>
              );
            },
          },
          {
            key: 'charged_customer',
            title: 'GIÁ THU KHÁCH',
            align: 'right' as const,
            render: (_: unknown, record: JobLogItem) => (
              <span className="font-mono font-bold text-brand-600 text-xs whitespace-nowrap">
                {record.status === 'FAILED' ? '0đ' : `${Math.round(record.charged_customer ?? 150)}đ`}
              </span>
            ),
          },
          {
            key: 'profit',
            title: 'LỜI / LỖ',
            align: 'right' as const,
            render: (_: unknown, record: JobLogItem) => {
              if (record.status === 'FAILED') return <span className="text-slate-400 text-xs">0đ</span>;
              const profitVal = record.profit ?? (record.charged_customer - (record.cost_provider ?? 0));
              const isPositive = profitVal > 0;
              return (
                <span
                  className={`font-mono font-black text-xs whitespace-nowrap ${
                    isPositive ? 'text-emerald-600' : profitVal < 0 ? 'text-rose-600' : 'text-slate-600'
                  }`}
                >
                  {isPositive ? `+${Math.round(profitVal)}đ` : `${Math.round(profitVal)}đ`}
                </span>
              );
            },
          },
        ]
      : [
          {
            key: 'charged_customer',
            title: 'CHI PHÍ API',
            align: 'right' as const,
            render: (_: unknown, record: JobLogItem) => (
              <span className="font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                {record.status === 'FAILED' ? '0đ' : `${Math.round(record.charged_customer ?? 150)}đ`}
              </span>
            ),
          },
        ]),
    {
      key: 'latency',
      title: 'ĐỘ TRỄ',
      dataIndex: 'latency_ms',
      align: 'right',
      render: (val) => (
        <span className="font-mono text-slate-600 text-xs whitespace-nowrap">
          {val ? `${val}ms` : '0ms'}
        </span>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nhật Ký & Quản Lý Jobs Tạo Ảnh</h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              gpt-image-2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến trình, kết quả và trạng thái tạo thành công / thất bại của toàn bộ tác vụ tạo ảnh.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
            onClick={refetch}
          >
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Sparkles size={15} />}
            onClick={() => setIsStudioOpen(true)}
          >
            Studio Tạo ảnh
          </Button>
        </div>
      </div>

      {/* Key Metric Cards */}
      <JobStatsCards userStats={userStats} total={jobs.length} />

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo mô tả prompt, mã ID job..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(String(v))}
            size="md"
            options={[
              { label: 'Tất cả trạng thái', value: 'ALL' },
              { label: 'Thành công (SUCCEEDED)', value: 'SUCCEEDED' },
              { label: 'Thất bại (FAILED)', value: 'FAILED' },
              { label: 'Đang xử lý (PROCESSING)', value: 'PROCESSING' },
            ]}
          />
        </div>
      </div>

      {/* Thanh tác vụ hàng loạt khi có chọn dòng */}
      {selectedRowKeys.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 text-white shadow-lg border border-slate-800 animate-fade-in">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
              {selectedRowKeys.length}
            </span>
            <span>
              Đã chọn <strong>{selectedRowKeys.length}</strong> tác vụ tạo ảnh
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchCancel}
              disabled={isBatchOperating}
              leftIcon={<XCircle size={14} className="text-amber-400" />}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
            >
              Hủy xử lý ({selectedRowKeys.length})
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBatchDelete}
              disabled={isBatchOperating}
              leftIcon={<Trash2 size={14} />}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
            >
              Xóa hàng loạt ({selectedRowKeys.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRowKeys([])}
              disabled={isBatchOperating}
              className="text-slate-400 hover:text-white text-xs"
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* Table Header Info Bar like the screenshot */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <div>
          Hiển thị <span className="font-semibold text-slate-700">{jobs.length > 0 ? `1-${Math.min(10, jobs.length)}` : '0'}</span> / <span className="font-semibold text-slate-700">{jobs.length.toLocaleString()}</span> logs
        </div>
      </div>

      {/* Jobs Table */}
      <Table<JobLogItem>
        columns={columns}
        data={jobs}
        rowKey="id"
        onRowClick={(record) => setSelectedJob(record)}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        loading={isLoading}
        emptyText="Chưa có job nào phù hợp với bộ lọc hiện tại"
        pagination={{ pageSize: 10, pageSizeOptions: [10, 20, 50] }}
      />

      {/* Detail & Error Modal */}
      <JobDetailModal
        job={selectedJob}
        isAdmin={isAdmin}
        onClose={() => setSelectedJob(null)}
      />

      {/* Studio Modal */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};
