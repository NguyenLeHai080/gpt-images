import React from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { Download, AlertTriangle, Eye } from 'lucide-react';
import { formatDateTimeVN } from '../../../core/utils/date';
import type { JobLogItem } from '../types';

interface JobDetailModalProps {
  isOpen?: boolean;
  job: JobLogItem | null;
  isAdmin?: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ isOpen, job, isAdmin = false, onClose }) => {
  if (!job) return null;

  return (
    <Modal
      isOpen={isOpen !== undefined ? isOpen : !!job}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center border border-brand-200 shrink-0">
            <Eye size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900">Chi Tiết Job Tạo Ảnh</span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {job.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Khởi tạo lúc: {formatDateTimeVN(job.created_at)} • Model: {job.model}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 w-full">
          {job.image_url && (
            <a href={job.image_url} download={`job-${job.id}.png`} target="_blank" rel="noreferrer">
              <Button variant="primary" size="sm" leftIcon={<Download size={14} />}>
                Tải ảnh gốc về
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-slate-700">
        {/* Image Preview */}
        {job.image_url && (
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-72">
            <img src={job.image_url} alt="Result" className="max-h-72 w-auto object-contain" />
          </div>
        )}

        {/* Error Detail */}
        {job.status === 'FAILED' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-1.5 text-red-800">
            <div className="font-bold flex items-center gap-1.5 text-red-700">
              <AlertTriangle size={15} /> Thông báo lỗi từ hệ thống:
            </div>
            <div className="font-mono bg-white p-2.5 rounded-lg border border-red-200 text-[11px] text-red-600 break-words">
              {job.error_message || 'Lỗi không xác định từ hệ thống xử lý'}
            </div>
            <p className="text-[11px] text-red-600">
              ℹ️ Số dư của bạn không bị trừ khi yêu cầu tạo ảnh không thành công.
            </p>
          </div>
        )}

        {/* Prompt */}
        <div>
          <span className="font-semibold text-slate-500 block mb-1">Mô tả (Prompt):</span>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 leading-relaxed font-sans">
            {job.prompt}
          </div>
        </div>

        {/* Reference Image if present */}
        {(job.reference || (job.references && job.references.length > 0)) && (
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Ảnh tham chiếu (References):</span>
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <img
                src={job.reference || (job.references ? job.references[0] : '')}
                alt="Reference"
                className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
              />
              <div className="text-xs text-slate-600 truncate flex-1">
                <span className="font-semibold block text-slate-800">Chế độ Image-to-Image</span>
                <a
                  href={job.reference || (job.references ? job.references[0] : '#')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:underline text-[11px] truncate block"
                >
                  {job.reference || (job.references ? job.references[0] : '')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px]">Model & Res:</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-semibold text-slate-800">{job.model}</span>
              <span className="text-[10px] bg-white border border-slate-200 px-1 rounded font-mono font-bold uppercase text-slate-700">
                {job.resolution || '1k'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Chất lượng (Quality):</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-purple-700 uppercase mt-0.5 inline-block">
              {job.quality || 'medium'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Tỷ lệ khung hình:</span>
            <span className="font-medium text-slate-700 mt-0.5 block">{job.aspect_ratio}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Thời gian xử lý:</span>
            <span className="font-medium text-slate-700 mt-0.5 block">
              {job.latency_ms > 0 ? `${(job.latency_ms / 1000).toFixed(1)}s` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Trạng thái:</span>
            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
              <Badge variant={job.status === 'SUCCEEDED' ? 'success' : job.status === 'FAILED' ? 'danger' : 'warning'}>
                {job.status === 'SUCCEEDED' ? 'Thành công' : job.status === 'FAILED' ? 'Thất bại' : 'Đang xử lý'}
              </Badge>
              {job.is_cached && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ⚡ Cache Hit
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Financial Breakdown (Role-based) */}
        {isAdmin ? (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
              Hạch Toán Dòng Tiền & Lợi Nhuận (Chỉ Quản Trị Viên)
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">Vốn trả NCC</span>
                <span className="font-mono font-bold text-slate-700">
                  {job.status === 'FAILED'
                    ? '0đ'
                    : job.is_cached
                    ? '0đ (⚡ Cache)'
                    : `${Math.round(job.cost_provider ?? 75)}đ`}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">Thu từ khách</span>
                <span className="font-mono font-black text-brand-600">
                  {job.status === 'FAILED' ? '0đ' : `${Math.round(job.charged_customer ?? 150)}đ`}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">Lợi nhuận gộp</span>
                <span
                  className={`font-mono font-black ${
                    (job.profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {job.status === 'FAILED'
                    ? '0đ'
                    : job.is_cached
                    ? `+${Math.round(job.profit ?? job.charged_customer ?? 150)}đ (100%)`
                    : `+${Math.round(job.profit ?? 75)}đ`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 text-xs font-semibold">Đơn giá thanh toán API:</span>
            <span className="font-mono font-black text-sm text-brand-600">
              {job.status === 'FAILED' ? '0đ' : `${Math.round(job.charged_customer ?? 150)}đ`}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};
