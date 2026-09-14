import React from 'react';
import { KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ApiKeyStatus } from '../types';

interface ApiKeyGaugeProps {
  status: ApiKeyStatus;
}

export const ApiKeyGauge: React.FC<ApiKeyGaugeProps> = ({ status }) => {
  const total = status.total_managed || 1;
  const active = status.active_keys || 0;
  const other = status.other_keys || 0;
  const percentage = Math.min(Math.max(Math.round((active / total) * 100), 0), 100);

  // Chu vi bán nguyệt (bán kính r = 75): pi * r = 235.6
  const circumference = 235.6;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound size={17} className="text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Trạng Thái API Key
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Khóa bí mật kết nối khách hàng
          </p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <ShieldCheck size={12} /> {percentage}% Khả dụng
        </span>
      </div>

      {/* Semicircular Gauge SVG */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        <div className="relative w-52 h-32 flex items-center justify-center">
          <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
            {/* Background Arc */}
            <path
              d="M 25 105 A 75 75 0 0 1 175 105"
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Dynamic Active Arc */}
            <path
              d="M 25 105 A 75 75 0 0 1 175 105"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />

            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Text */}
          <div className="absolute bottom-2 flex flex-col items-center text-center">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {active}
              <span className="text-sm font-semibold text-slate-400">/{total}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Key Trực Tuyến
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Rows & Quick Action */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-600 font-medium">Hoạt động</span>
            </div>
            <span className="font-extrabold text-emerald-800 font-mono">{active}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span className="text-slate-600 font-medium">Khác / Khóa</span>
            </div>
            <span className="font-extrabold text-slate-700 font-mono">{other}</span>
          </div>
        </div>

        <Link
          to="/app/api-keys"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-xs"
        >
          <span>Quản lý API Keys</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
