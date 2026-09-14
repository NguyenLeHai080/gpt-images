import React from 'react';
import { Wallet, TrendingUp, Receipt, Activity } from 'lucide-react';
import type { MetricItem } from '../types';

interface MetricCardProps {
  metric: MetricItem;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const getTheme = () => {
    switch (metric.icon) {
      case 'wallet':
        return {
          iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/20',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
          accent: 'from-amber-500/10 to-transparent',
          topLine: 'bg-amber-500',
        };
      case 'trending-up':
        return {
          iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/20',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          accent: 'from-emerald-500/10 to-transparent',
          topLine: 'bg-emerald-500',
        };
      case 'receipt':
        return {
          iconBg: 'bg-gradient-to-tr from-blue-500 to-sky-500 text-white shadow-blue-500/20',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
          accent: 'from-blue-500/10 to-transparent',
          topLine: 'bg-blue-500',
        };
      case 'activity':
      default:
        return {
          iconBg: 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-purple-500/20',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
          accent: 'from-purple-500/10 to-transparent',
          topLine: 'bg-purple-500',
        };
    }
  };

  const theme = getTheme();

  const renderIcon = () => {
    switch (metric.icon) {
      case 'wallet':
        return <Wallet size={19} />;
      case 'trending-up':
        return <TrendingUp size={19} />;
      case 'receipt':
        return <Receipt size={19} />;
      case 'activity':
      default:
        return <Activity size={19} />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group flex flex-col justify-between gap-4">
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${theme.topLine}`} />

      {/* Decorative Glow */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${theme.accent} blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-300`} />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
          {metric.title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${theme.iconBg} shrink-0`}>
          {renderIcon()}
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <div className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 leading-tight">
          {metric.value}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${theme.badgeClass}`}>
          {metric.badge_text}
        </span>
      </div>
    </div>
  );
};
