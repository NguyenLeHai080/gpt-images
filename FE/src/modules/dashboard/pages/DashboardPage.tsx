import React from 'react';
import {
  RefreshCw,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  ExternalLink,
  Zap,
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useDashboardData } from '../hooks/useDashboardData';
import { MetricCard } from '../components/MetricCard';
import { ApiCostChart } from '../components/ApiCostChart';
import { ApiKeyGauge } from '../components/ApiKeyGauge';
import { RecentActivityList } from '../components/RecentActivityList';
import { OperationSummaryCard } from '../components/OperationSummaryCard';
import { ModelDistributionCard } from '../components/ModelDistributionCard';
import { Button } from '../../../core/components/Button/Button';
import { Select } from '../../../core/components/Select';
import { alert } from '../../../core/alert';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const { data, isRefreshing, selectedUserId, changeAccount, refresh } = useDashboardData();

  const handleRefresh = async () => {
    alert.toast('Đang đồng bộ dữ liệu hệ thống...', 'info', { timer: 1500 });
    await refresh();
    alert.toast('Dữ liệu hệ thống đã được cập nhật mới nhất!', 'success');
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 sm:gap-8 pb-12">
      {/* Top Banner Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Top Badges */}
            <div className="flex items-center gap-2.5 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Thời Gian Thực
              </span>

              <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1">
                <Zap size={12} className="text-amber-400" /> Model gpt-image-2
              </span>

              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <ShieldCheck size={13} /> {selectedUserId === 'all' ? 'Toàn Hệ Thống' : 'Quản Trị Phân Luồng'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                  <UserIcon size={13} /> Tài Khoản Khách Hàng
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              {isAdmin && selectedUserId === 'all'
                ? 'Tổng Quan Hệ Thống & Quản Trị Vận Hành'
                : `Tổng Quan Tài Khoản: ${data.scope_user_name || 'Khách Hàng'}`}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {isAdmin && selectedUserId === 'all'
                ? `Dữ liệu tài chính ví, lưu lượng API và các tác vụ tạo ảnh của toàn bộ hệ thống (${data.date_display}).`
                : `Dữ liệu tiêu thụ, số dư ví và nhật ký tạo ảnh riêng của tài khoản ${data.scope_user_name} (${data.date_display}).`}
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="md"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-xs font-semibold text-xs"
              onClick={handleRefresh}
              leftIcon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
            >
              Làm mới
            </Button>

            <Link to="/app/studio">
              <Button
                variant="primary"
                size="md"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/30 text-xs"
                leftIcon={<Sparkles size={15} />}
              >
                Studio Tạo Ảnh
              </Button>
            </Link>

            <Link to="/app/api-docs">
              <Button
                variant="outline"
                size="md"
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-xs font-semibold text-xs"
                rightIcon={<ExternalLink size={14} />}
              >
                Tài Liệu API
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Account Switcher Toolbar */}
      {isAdmin && data.accounts && data.accounts.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-200">
              <Globe size={16} />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-800 block">
                Phân Luồng Dữ Liệu Theo Tài Khoản:
              </span>
              <span className="text-[11px] text-slate-400 block">
                Lọc số dư, chi phí và logs của từng khách hàng riêng biệt
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-80">
              <Select
                value={selectedUserId}
                onChange={(val) => changeAccount(String(val))}
                size="sm"
                options={[
                  { label: '🌐 Tất cả tài khoản (Toàn hệ thống)', value: 'all' },
                  ...data.accounts.map((acc) => ({
                    label: `👤 ${acc.name} (${acc.email})`,
                    value: acc.id,
                  })),
                ]}
              />
            </div>

            <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hidden md:inline-block">
              {selectedUserId === 'all' ? 'Toàn bộ hệ thống' : data.scope_user_name}
            </span>
          </div>
        </div>
      )}

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Middle Section: Cost Chart (8 cols) + API Key Gauge (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <ApiCostChart data={data.chart_data} />
        </div>
        <div className="lg:col-span-4">
          <ApiKeyGauge status={data.key_status} />
        </div>
      </div>

      {/* Bottom Section: 3 Modern Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <RecentActivityList activities={data.recent_activities} />
        <OperationSummaryCard summary={data.operation_summary} />
        <ModelDistributionCard
          models={data.model_distribution}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
};
