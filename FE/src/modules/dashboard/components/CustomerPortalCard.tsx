import React, { useState } from 'react';
import { KeyRound, Copy, Check, ExternalLink, Wallet, ArrowDownToLine, ShieldCheck, Building2, User, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../core/components/Button/Button';
import { alert } from '../../../core/alert';
import type { DashboardOverviewData } from '../types';

interface CustomerPortalCardProps {
  data: DashboardOverviewData;
}

export const CustomerPortalCard: React.FC<CustomerPortalCardProps> = ({ data }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const baseUrl = 'https://api-gpt-images.nexoratech.com.vn/api/v1';

  const handleCopyBaseUrl = async () => {
    try {
      await navigator.clipboard.writeText(baseUrl);
      setCopiedUrl(true);
      alert.toast('Đã sao chép Base URL Cổng API!', 'success');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      alert.toast('Không thể sao chép URL', 'error');
    }
  };

  const balance = data.user_balance ?? 0;
  const balanceFormatted = `${Math.round(balance).toLocaleString('vi-VN')} đ`;
  const availableImgs = data.available_images ?? Math.floor(balance / 150);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound size={17} className="text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Cổng Kết Nối & API Khách Hàng
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Thông tin cổng API Gateway và tích hợp tài khoản
          </p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <ShieldCheck size={12} /> 150 đ / ảnh
        </span>
      </div>

      {/* Account Info Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <User size={13} className="text-brand-600 shrink-0" />
            <span className="truncate">{data.scope_user_name || 'Khách Hàng'}</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded-full">
            {data.scope_user_role || 'MEMBER'}
          </span>
        </div>

        {data.scope_user_company && (
          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
            <Building2 size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">{data.scope_user_company}</span>
          </div>
        )}

        {data.scope_user_email && (
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Mail size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">{data.scope_user_email}</span>
          </div>
        )}
      </div>

      {/* Base URL Input with Copy */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 block">
          Base URL Cổng API (OpenAI Compatible)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={baseUrl}
            className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl text-slate-800 select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyBaseUrl}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shrink-0 shadow-2xs"
            title="Sao chép Base URL"
          >
            {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Wallet Balance Status & Action */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Wallet size={16} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 block">
              Ví Khả Dụng: {balanceFormatted}
            </span>
            <span className="text-[10px] text-emerald-700 block">
              Tương đương ~{availableImgs.toLocaleString()} ảnh AI
            </span>
          </div>
        </div>
        <Link to="/app/billing">
          <Button
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs shrink-0"
            leftIcon={<ArrowDownToLine size={13} />}
          >
            Nạp Tiền
          </Button>
        </Link>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link to="/app/api-keys" className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            leftIcon={<KeyRound size={13} />}
          >
            Quản Lý API Key
          </Button>
        </Link>
        <Link to="/app/api-docs" className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            rightIcon={<ExternalLink size={13} />}
          >
            Tài Liệu API
          </Button>
        </Link>
      </div>
    </div>
  );
};
