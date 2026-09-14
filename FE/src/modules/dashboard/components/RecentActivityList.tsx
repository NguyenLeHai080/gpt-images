import React from 'react';
import { Activity, Clock, ArrowRight, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ActivityItem } from '../types';

interface RecentActivityListProps {
  activities: ActivityItem[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Hoạt Động Gần Đây
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Sự kiện gọi API mới nhất</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Trực tiếp
        </span>
      </div>

      {/* Activities List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-72 custom-scrollbar-light pr-1">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Chưa có hoạt động API nào được ghi nhận cho tài khoản này
          </div>
        ) : (
          activities.slice(0, 5).map((act) => {
            const isCache = act.model_name.includes('Cache');
            const isSuccess = act.status === 'success';

            return (
              <div
                key={act.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/60 hover:bg-brand-50/50 border border-slate-100 hover:border-brand-200/70 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white shadow-2xs border border-slate-200/70">
                    {isCache ? (
                      <Zap size={14} className="text-amber-500" />
                    ) : isSuccess ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <XCircle size={14} className="text-rose-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 truncate">
                        {act.user_name}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-mono text-slate-500 truncate">
                        {act.model_name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      <span>{act.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold font-mono text-slate-800 block">
                    {act.cost}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      isSuccess ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isSuccess ? 'Thành công' : 'Thất bại'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-slate-100">
        <Link
          to="/app/jobs"
          className="flex items-center justify-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 py-1"
        >
          <span>Xem tất cả nhật ký Jobs</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};
