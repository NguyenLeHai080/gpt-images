import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Download,
  Search,
  Image as ImageIcon,
  XCircle,
} from 'lucide-react';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Select } from '../../../core/components/Select/Select';
import { Table } from '../../../core/components/Table/Table';
import type { Column } from '../../../core/components/Table/Table.types';
import { alert } from '../../../core/alert';
import { useAuth } from '../../../core/hooks/useAuth';

import { useJobs } from '../hooks/useJobs';
import { generationsApi } from '../api';
import { JobStatsCards } from '../components/JobStatsCards';
import { StudioModal } from '../components/StudioModal';
import { JobDetailModal } from '../components/JobDetailModal';
import { EditJobModal } from '../components/EditJobModal';
import { formatDateTimeVN } from '../../../core/utils/date';
import type { JobLogItem } from '../types';

export const StudioPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // State
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobLogItem | null>(null);
  const [editingJob, setEditingJob] = useState<JobLogItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Batch Selection State
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isBatchOperating, setIsBatchOperating] = useState(false);

  // Hook quản lý jobs
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

  // Xóa 1 job
  const handleDeleteJob = async (jobId: string) => {
    const isConfirmed = await alert.confirm({
      title: 'Xóa Job Tạo Ảnh',
      text: 'Xác nhận xóa bản ghi Job này khỏi hệ thống? Hành động này không thể hoàn tác.',
      confirmButtonText: 'Xác nhận xóa',
      cancelButtonText: 'Hủy bỏ',
      isDanger: true,
    });
    if (isConfirmed) {
      setDeletingId(jobId);
      try {
        const res = await generationsApi.deleteJob(jobId);
        if (res.success) {
          setSelectedRowKeys((prev) => prev.filter((id) => id !== jobId));
          refetch();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDeletingId(null);
      }
    }
  };

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

  // Cấu hình các cột của Bảng
  const columns: Column<JobLogItem>[] = [
    {
      key: 'image',
      title: 'Ảnh',
      width: 60,
      align: 'center',
      render: (_, record) =>
        record.status === 'PROCESSING' ? (
          <div
            className="w-10 h-10 rounded-lg border border-amber-300 bg-amber-50/80 flex items-center justify-center text-amber-600 mx-auto shrink-0 shadow-2xs animate-pulse"
            title="Đang xử lý render ảnh AI..."
          >
            <RefreshCw size={16} className="animate-spin text-amber-600" />
          </div>
        ) : record.image_url ? (
          <div
            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center cursor-pointer group relative shadow-2xs mx-auto shrink-0"
            onClick={() => setSelectedJobDetail(record)}
            title="Bấm để xem ảnh phóng to"
          >
            <img
              src={record.image_url}
              alt="Thumbnail"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 mx-auto shrink-0">
            <ImageIcon size={16} />
          </div>
        ),
    },
    {
      key: 'prompt',
      title: 'Mô Tả (Prompt)',
      dataIndex: 'prompt',
      render: (val, record) => (
        <div className="max-w-xs md:max-w-sm lg:max-w-md">
          <span
            className="font-medium text-slate-900 text-xs truncate block cursor-pointer hover:text-brand-600 transition-colors"
            onClick={() => setSelectedJobDetail(record)}
            title={String(val)}
          >
            {val}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono truncate">ID: {record.id}</span>
        </div>
      ),
    },
    {
      key: 'model_res',
      title: 'Model • Res • Quality',
      dataIndex: 'model',
      render: (val, record) => (
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="font-mono font-bold text-orange-600 text-xs">{val}</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold border border-slate-200 uppercase">
              {record.resolution || '1k'}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${
                record.quality === 'low'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : record.quality === 'medium'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
              title={`Chất lượng: ${record.quality || 'medium'}`}
            >
              {record.quality ? record.quality.toUpperCase() : 'MEDIUM'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5 whitespace-nowrap">
            {record.aspect_ratio}
            {record.reference && ' • 🖼️ Có ảnh mẫu'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      dataIndex: 'status',
      render: (val, record) => {
        const v = String(val);
        if (v === 'PROCESSING' || v === 'PENDING') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs whitespace-nowrap animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Đang xử lý...
            </span>
          );
        }
        const variant = v === 'SUCCEEDED' ? 'success' : 'danger';
        const label = v === 'SUCCEEDED' ? 'Thành công' : 'Thất bại';
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Badge variant={variant}>{label}</Badge>
            {record.is_cached && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap"
                title="Phục vụ tức thì từ Smart Cache (0đ vốn NCC)"
              >
                ⚡ Cache
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'latency',
      title: 'Độ Trễ',
      dataIndex: 'latency_ms',
      render: (val, record) => (
        <span className={`font-mono text-xs whitespace-nowrap ${record.is_cached ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
          {record.is_cached ? '⚡ 25ms' : Number(val) > 0 ? `${(Number(val) / 1000).toFixed(1)}s` : '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Thời Gian',
      dataIndex: 'created_at',
      render: (val) => (
        <span className="text-slate-600 text-xs whitespace-nowrap font-mono">{formatDateTimeVN(val)}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao Tác',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Icon Xem chi tiết */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedJobDetail(record)}
            title="Xem chi tiết ảnh & thông số"
            className="text-slate-600 hover:text-brand-600 px-2"
          >
            <Eye size={14} />
          </Button>

          {/* Icon Chỉnh sửa prompt */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingJob(record)}
            title="Chỉnh sửa mô tả prompt"
            className="text-slate-600 hover:text-blue-600 px-2"
          >
            <Edit2 size={14} />
          </Button>

          {/* Icon Tải ảnh */}
          {record.image_url && (
            <a href={record.image_url} download={`gpt-image-${record.id}.png`} target="_blank" rel="noreferrer">
              <Button
                variant="ghost"
                size="sm"
                title="Tải ảnh về máy"
                className="text-slate-600 hover:text-orange-600 px-2"
              >
                <Download size={14} />
              </Button>
            </a>
          )}

          {/* Icon Xóa job */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteJob(record.id)}
            disabled={deletingId === record.id}
            title="Xóa job này"
            className="text-slate-400 hover:text-rose-600 px-2"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Studio Sáng Tạo Hình Ảnh AI</h1>
            <span className="text-xs bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full font-bold border border-brand-200">
              GPT Image 2.5 (Flare / Sunburst / 2)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bấm <strong>Tạo ảnh mới</strong> để mở Studio tạo ảnh, hoặc quản lý, xem chi tiết, sửa và xóa các jobs đã tạo dưới bảng.
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
            onClick={() => setIsStudioModalOpen(true)}
          >
            + Tạo ảnh mới
          </Button>
        </div>
      </div>

      {/* Thẻ chỉ số tổng quan tạo ảnh */}
      <JobStatsCards userStats={userStats} total={jobs.length} />

      {/* Toolbar Tìm Kiếm & Bộ Lọc */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo mô tả prompt, mã ID job..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-xs transition-all"
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

      {/* Bảng Table Quản Lý Jobs */}
      <Table<JobLogItem>
        columns={columns}
        data={jobs}
        loading={isLoading}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        emptyText="Chưa có job nào được tạo. Hãy bấm '+ Tạo ảnh mới' phía trên để bắt đầu sáng tạo hình ảnh!"
        pagination={{ pageSize: 8, pageSizeOptions: [8, 16, 25] }}
      />

      {/* Modal Tạo Ảnh Mới (Mở khi bấm nút + Tạo ảnh mới) */}
      <StudioModal
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsStudioModalOpen(false);
        }}
      />

      {/* Modal Xem Chi Tiết Job (Mở khi bấm icon Eye) */}
      <JobDetailModal
        isOpen={!!selectedJobDetail}
        onClose={() => setSelectedJobDetail(null)}
        job={selectedJobDetail}
        isAdmin={isAdmin}
      />

      {/* Modal Chỉnh Sửa Job (Mở khi bấm icon Edit) */}
      <EditJobModal
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        job={editingJob}
        onSuccess={refetch}
      />
    </div>
  );
};
