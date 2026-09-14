import React from 'react';
import { Users, ShieldCheck, Code2, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../core/components/Card/Card';
import type { AccountStats } from '../types';

interface AccountStatsCardsProps {
  stats: AccountStats | null;
  totalUsers: number;
}

export const AccountStatsCards: React.FC<AccountStatsCardsProps> = ({ stats, totalUsers }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="md" className="border-l-4 border-l-brand-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số tài khoản</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total_users ?? totalUsers}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Toàn bộ nhân sự & đối tác</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
        </div>
      </Card>

      <Card padding="md" className="border-l-4 border-l-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quản trị viên</p>
            <h3 className="text-2xl font-extrabold text-purple-700 mt-1">
              {(stats?.super_admins ?? 0) + (stats?.admins ?? 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.super_admins ?? 0} Super Admin, {stats?.admins ?? 0} Admin
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
        </div>
      </Card>

      <Card padding="md" className="border-l-4 border-l-sky-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỹ sư AI / Dev</p>
            <h3 className="text-2xl font-extrabold text-sky-700 mt-1">{stats?.developers ?? 0}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Quyền tạo & quản trị API Keys</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Code2 size={20} />
          </div>
        </div>
      </Card>

      <Card padding="md" className="border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{stats?.active_users ?? 0}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.inactive_users ?? 0} tài khoản tạm khóa
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </Card>
    </div>
  );
};
