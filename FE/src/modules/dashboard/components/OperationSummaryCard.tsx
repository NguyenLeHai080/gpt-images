import React from 'react';
import { Server, CheckCircle, ShieldCheck, Zap } from 'lucide-react';
import type { OperationSummary } from '../types';

interface OperationSummaryCardProps {
  summary: OperationSummary;
}

export const OperationSummaryCard: React.FC<OperationSummaryCardProps> = ({ summary }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Server size={17} className="text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Tóm Tắt Vận Hành
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Trạng thái hạ tầng và dịch vụ</p>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Ổn định 99.9%
        </span>
      </div>

      {/* Metric Blocks */}
      <div className="space-y-3 flex-1">
        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
            <Server size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {summary.active_keys} Khóa API Hoạt Động
              </span>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                REST v1
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Đã đồng bộ {summary.synced_keys} khóa trên cụm Gateway phân tán.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {summary.successful_requests.toLocaleString()} Requests Thành Công
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                {summary.uptime}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Không phát hiện hiện tượng nghẽn mạng hay từ chối dịch vụ.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
            <Zap size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Smart Cache Siêu Tốc (25ms)
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                Tức thì
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Thuật toán băm SHA-256 bảo vệ số dư tài khoản của bạn.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Kiểm tra lần cuối: vừa xong</span>
        <span className="text-emerald-600 font-bold flex items-center gap-1">
          <ShieldCheck size={13} /> Sẵn sàng 100%
        </span>
      </div>
    </div>
  );
};
