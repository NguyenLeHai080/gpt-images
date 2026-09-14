import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Button } from '../../../core/components/Button/Button';
import { ProviderWalletCard } from '../components/ProviderWalletCard';
import { TrendingUp, DollarSign, Zap, Wallet, RefreshCw, Building2 } from 'lucide-react';
import { generationsApi } from '../api';
import type { FinancialSummary, ProviderStatus } from '../types';
import { alert } from '../../../core/alert';

export const PnLManagementPage: React.FC = () => {
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [finRes, provRes] = await Promise.all([
        generationsApi.getFinancialSummary(),
        generationsApi.getProviderStatus(),
      ]);
      if (finRes.success && finRes.data) setFinancials(finRes.data);
      if (provRes.success && provRes.data) setProviderStatus(provRes.data);
    } catch (err: any) {
      console.warn('Lỗi tải dữ liệu tài chính:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncProvider = async () => {
    setIsSyncing(true);
    try {
      const res = await generationsApi.syncProvider();
      if (res.success && res.data) {
        setProviderStatus(res.data);
        alert.toast('Đồng bộ số dư ví nhà cung cấp thành công!', 'success');
      }
    } catch (err: any) {
      alert.error('Lỗi đồng bộ ví NCC', err?.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản Trị Dòng Tiền & Lời Lỗ (PnL)</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
              Biên Lãi 20%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bán 150 đ / ảnh (Khách hàng) — Vốn 120 đ / ảnh (Nhà cung cấp) — Lợi nhuận gộp{' '}
            <strong className="text-emerald-600">+30 đ / ảnh thành công</strong>.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          leftIcon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
          onClick={loadData}
        >
          Làm mới
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh Thu Bán Ra</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatVND(financials?.total_api_revenue ?? 0)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                150 đ × {financials?.successful_jobs ?? 0} jobs thành công
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi Phí Vốn NCC</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
                {formatVND(financials?.total_provider_cost ?? 0)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {financials?.saved_provider_cost && financials.saved_provider_cost > 0
                  ? `⚡ Tiết kiệm: ${formatVND(financials.saved_provider_cost)} (Cache)`
                  : `120 đ / ảnh chi phí máy chủ AI Engine`}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lợi Nhuận Gộp</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">
                {formatVND(financials?.gross_profit ?? 0)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {financials?.total_cached_jobs && financials.total_cached_jobs > 0
                  ? `Gồm ${financials.total_cached_jobs} ảnh Cache lời 100% (+150đ)`
                  : '+30 đ / ảnh (Biên lợi nhuận: 20%)'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>

        <Card padding="md" className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số Dư Ví NCC</p>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">
                {formatVND(providerStatus?.wallet_balance ?? 24462)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Cụm máy chủ AI Cluster Engine
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Smart Cache Savings Alert Banner */}
      {financials?.total_cached_jobs !== undefined && financials.total_cached_jobs > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              ⚡
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Hiệu Quả Smart Cache Gateway</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Đã phục vụ <strong>{financials.total_cached_jobs} jobs</strong> tức thì từ bộ nhớ đệm (0đ chi phí vốn), giúp bạn giữ lại trọn vẹn <strong>+{formatVND(financials.saved_provider_cost || 0)}</strong> tiền vốn không phải nạp thêm cho nhà cung cấp!
              </p>
            </div>
          </div>
          <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold shrink-0">
            Biên lợi nhuận 100%
          </span>
        </div>
      )}

      {/* Two Columns: Provider Wallet Card & Cash Flow Logic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProviderWalletCard
          status={providerStatus}
          isSyncing={isSyncing}
          onSync={handleSyncProvider}
        />

        <Card padding="md" className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            <Building2 size={18} className="text-brand-500" />
            <span>Quy Trình Dòng Tiền & Tái Đầu Tư</span>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-900 block mb-0.5">1. Khách hàng nạp tiền vào ví:</strong>
              Khách nạp tiền qua cổng SePay/VietQR. Tiền vào tài khoản doanh nghiệp.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-900 block mb-0.5">2. Khách thực hiện tạo ảnh:</strong>
              Hệ thống trừ 150 đ / ảnh thành công. Nếu lỗi không trừ tiền.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-900 block mb-0.5">3. Chi phí tính toán máy chủ:</strong>
              Hệ thống tự động tính 120 đ / ảnh cho chi phí hạ tầng máy chủ AI Engine. Lợi nhuận ròng thu về 30 đ.
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
              <strong className="text-emerald-900 block mb-0.5">4. Tái cấp quota máy chủ:</strong>
              Admin định kỳ dùng dòng tiền nạp của khách để nạp lại quota duy trì cụm máy chủ AI Gateway.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
