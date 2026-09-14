import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Layers, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import type { UserJobStats } from '../types';

interface JobStatsCardsProps {
  userStats: UserJobStats;
  total?: number;
}

export const JobStatsCards: React.FC<JobStatsCardsProps> = ({
  userStats,
  total,
}) => {
  const totalJobs = total !== undefined && total > 0 ? total : userStats.total_jobs;
  const successJobs = userStats.successful_jobs;
  const failedJobs = userStats.failed_jobs;
  const successRate = totalJobs > 0 ? Math.round((successJobs / totalJobs) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng số Jobs */}
      <Card padding="md" className="border-l-4 border-l-brand-500 shadow-2xs hover-lift transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Số Jobs Đã Tạo</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalJobs}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Toàn bộ tác vụ tạo ảnh hệ thống</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers size={20} />
          </div>
        </div>
      </Card>

      {/* 2. Tạo thành công */}
      <Card padding="md" className="border-l-4 border-l-emerald-500 shadow-2xs hover-lift transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tạo Thành Công</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{successJobs}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Đạt tỷ lệ {successRate}% hoàn tất
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </Card>

      {/* 3. Thất bại / Lỗi */}
      <Card padding="md" className="border-l-4 border-l-rose-500 shadow-2xs hover-lift transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thất Bại / Lỗi</p>
            <h3 className={`text-2xl font-black mt-1 ${failedJobs > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {failedJobs}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {failedJobs === 0 ? 'Hệ thống hoạt động ổn định 100%' : 'Lỗi từ upstream (Không trừ tiền)'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertCircle size={20} />
          </div>
        </div>
      </Card>

      {/* 4. Tốc độ & Trạng thái Gateway */}
      <Card padding="md" className="border-l-4 border-l-purple-500 shadow-2xs hover-lift transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tốc Độ Xử Lý</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">25ms - 2.8s</h3>
            <p className="text-[11px] text-purple-600 font-semibold mt-1">
              ⚡ Smart Cache & Model gpt-image-2
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Zap size={20} />
          </div>
        </div>
      </Card>
    </div>
  );
};

